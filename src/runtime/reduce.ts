import type { ChangeSet, ProposalPartState } from '@/blocks/types'
import {
  appointmentStatus,
  basis,
  blockKey,
  column,
  defaultEstimate,
  firstVisitParam,
  memoryBlock,
  tableId,
} from '@/fixtures/keys'
import { shiftSuggestion } from '@/fixtures/proposals'
import { cannedReply, chatScripts, miscTopic } from '@/fixtures/scripts'
import { customModule, stubWorkflow, subModuleTemplates } from '@/fixtures/templates'
import type { BehaviourMode, ChangeKind } from '@/lib/vocab'

import type {
  CellValue,
  ChatContext,
  ChatScript,
  CreateSubModuleInput,
  MemoryPatch,
  MemoryRow,
  Module,
  PreviewId,
  Proposal,
  RuntimeState,
  SaveNodeParamsInput,
  Snapshot,
  TaskKind,
  TriggerKind,
  Workflow,
} from './model'
import {
  blockingAccount,
  effectiveMode,
  findAccount,
  findConversation,
  findModule,
  numberCell,
  rowOf,
  stringCell,
  tableOf,
  versionOf,
  workflowOf,
} from './selectors'
import { tx, typed, type Text } from './text'
import { datePart, nextAt } from './time'

// The runtime actions as changes to a draft. Each function here mutates the
// state it is given — the store hands it a copy (`store.ts`), a scene builder
// its own snapshot (`src/fixtures/scenes.ts`). That is what makes "accepting
// in `s0` yields `s1`" true by construction: the scene is built by the same
// code the live action runs.

const newId = (draft: Snapshot, prefix: string) => `${prefix}-${++draft.seq}`

/** Records that an item of a block changed; the module's next run reports it. */
export function markChange(draft: Snapshot, module: string, block: string, item: string, kind: ChangeKind): void {
  const changes: ChangeSet = (draft.pendingChanges[module] ??= { blocks: {} })
  const items = (changes.blocks[block] ??= {})
  // An item that is new stays new however often it is touched before the run.
  if (items[item] !== 'new') items[item] = kind
}

// ── Estimates: the rule the hero flow's workflow applies ────────────────────

/**
 * Sets every open booking's 预计 duration and its basis. A dog whose own
 * record has been put in force is booked on it; otherwise the breed row's
 * 适用时长; with no breed table, the default. Once the workflow holds the
 * first-visit condition (`s4`), a dog with no visit yet gets its extra.
 * 适用 values change only through an accepted proposal, so recording a
 * duration alone never moves a booking.
 *
 * A booking that already stood on a rule keeps what it was booked for in
 * 调整前; when such bookings move, the workflow's 建议排班调整 tells 排班.
 */
export function applyEstimates(draft: Snapshot): void {
  const appointments = tableOf(draft, tableId.appointments)
  if (!appointments) return
  const dogs = tableOf(draft, tableId.dogs)
  const breeds = tableOf(draft, tableId.breeds)
  const records = tableOf(draft, tableId.dogDurations)
  const visits = tableOf(draft, tableId.visits)
  const workflow = breeds ? workflowOf(draft, breeds.ownerModuleId) : undefined
  const firstVisitNode = workflow && versionOf(workflow).nodes.find((node) => firstVisitParam in node.params)
  const firstVisitExtra = Number(firstVisitNode?.params[firstVisitParam] ?? 0)
  const c = column.appointments
  let moved = false

  for (const row of appointments.rows) {
    const status = row.cells[c.status]
    if (status !== appointmentStatus.booked && status !== appointmentStatus.requested) continue
    const dog = stringCell(row, c.dog) ?? ''
    const own = numberCell(rowOf(records, dog), column.dogDurations.applied)
    const breed = numberCell(rowOf(breeds, stringCell(rowOf(dogs, dog), column.dogs.breed) ?? ''), column.breeds.applied)
    const visited = visits?.rows.some((visit) => visit.cells[column.visits.dog] === dog) ?? false
    let estimate = defaultEstimate
    let rests: string = basis.default
    let extra: number | null = null
    if (own !== null) {
      estimate = own
      rests = basis.own
    } else if (breed !== null) {
      if (!visited && firstVisitExtra > 0) extra = firstVisitExtra
      estimate = breed + (extra ?? 0)
      rests = basis.breed
    }
    if (row.cells[c.estimate] === estimate && row.cells[c.basis] === rests && (row.cells[c.extra] ?? null) === extra) continue
    if (row.cells[c.basis] !== basis.default && row.cells[c.estimate] !== estimate) {
      row.cells[c.previous] = row.cells[c.estimate]
      moved = true
    }
    row.cells[c.estimate] = estimate
    row.cells[c.basis] = rests
    row.cells[c.extra] = extra
    const block = status === appointmentStatus.requested ? blockKey.appointments.unplaced : blockKey.appointments.schedule
    markChange(draft, appointments.ownerModuleId, block, row.id, 'updated')
  }
  if (moved) suggestShifts(draft, workflow)
}

/**
 * 建议排班调整: open bookings moved, so the action tells its target module how
 * much time that frees or takes — one proposal in the action's effective mode.
 * A suggestion she has not answered gives way to the new one.
 */
function suggestShifts(draft: Snapshot, workflow: Workflow | undefined): void {
  const node = workflow && versionOf(workflow).nodes.find((each) => each.kind === 'action' && each.taskKind === 'adjust-shifts')
  const target = node?.targetModuleId
  const appointments = tableOf(draft, tableId.appointments)
  if (!node || !target || !appointments) return
  const c = column.appointments
  let freed = 0
  for (const row of appointments.rows) {
    const previous = numberCell(row, c.previous)
    const estimate = numberCell(row, c.estimate)
    if (row.cells[c.status] === appointmentStatus.booked && previous !== null && estimate !== null) freed += previous - estimate
  }
  draft.proposals = draft.proposals.filter(
    (each) => !(each.nodeId === node.id && each.moduleId === target && each.parts.every((part) => part.state === 'pending')),
  )
  if (freed === 0) return
  draft.proposals.push({
    ...shiftSuggestion(freed, target, draft.storyTime),
    id: newId(draft, 'proposal'),
    moduleId: target,
    nodeId: node.id,
    mode: effectiveMode(draft, node),
    at: draft.storyTime,
  })
}

// ── Sub-modules and the module set ──────────────────────────────────────────

function addWorkflow(draft: Snapshot, module: Module, parts: Pick<ReturnType<typeof stubWorkflow>, 'nodes' | 'edges' | 'reason'>) {
  draft.workflows.push({
    id: module.workflowId,
    moduleId: module.id,
    current: 1,
    versions: [{ n: 1, at: draft.storyTime, author: 'ai', reason: parts.reason, nodes: parts.nodes, edges: parts.edges }],
  })
}

/**
 * A conversation becomes a module (D-08): `<parent>.sub.<slug>` with its own
 * workflow and memory. Returns the new module's id, or `null` when the parent
 * does not exist. A sub-module that was archived comes back instead of being
 * built twice.
 */
export function createSubModule(draft: Snapshot, input: CreateSubModuleInput): string | null {
  const parent = findModule(draft, input.parentId)
  if (!parent) return null
  const conversation = input.conversationId ? findConversation(draft, input.conversationId) : undefined
  const template = subModuleTemplates[input.template ?? conversation?.template ?? '']
  const earlier = conversation?.subModuleId ? findModule(draft, conversation.subModuleId) : undefined
  const id = earlier?.id ?? `${parent.id}.sub.${template?.slug ?? `custom-${++draft.seq}`}`

  const existing = findModule(draft, id)
  if (existing) {
    existing.archived = false
  } else {
    const built = template?.build({ moduleId: id, parentId: parent.id, at: draft.storyTime })
    const module: Module = {
      id,
      kind: 'sub',
      parentId: parent.id,
      name: input.name ?? template?.name ?? conversation?.title ?? customModule.subName,
      description: template?.description ?? customModule.description,
      icon: template?.icon ?? 'puzzle',
      workflowId: `wf:${id}`,
      memoryTableIds: built?.tables.map((table) => table.id) ?? [],
      aliases: [],
      ...(template?.nextRunTime ? { nextRunAt: nextAt(draft.storyTime, template.nextRunTime) } : {}),
      ...(template ? {} : { custom: true }),
    }
    // After the parent's last sub-module, so navigation keeps the family together.
    const family = draft.modules.map((each) => each.id === parent.id || each.parentId === parent.id)
    draft.modules.splice(family.lastIndexOf(true) + 1, 0, module)
    addWorkflow(draft, module, built && template ? { ...built, reason: template.reason } : stubWorkflow())
    for (const table of built?.tables ?? []) draft.memory.push(table)
    for (const read of template?.reads ?? []) {
      const readers = tableOf(draft, read)?.readers
      if (readers && !readers.includes(id)) readers.push(id)
    }
    for (const account of template?.accounts ?? []) findAccount(draft, account)?.feeds.push(id)
  }

  if (conversation) {
    conversation.persistence = 'persistent'
    conversation.subModuleId = id
    const topic = draft.topics.find((each) => each.id === conversation.topicId)
    if (topic && !topic.moduleIds.includes(id)) topic.moduleIds.push(id)
  }
  applyEstimates(draft)
  return id
}

/** Persistent → one-off: the sub-module leaves navigation; its conversations stay in Topics (D-20). */
export function archiveSubModule(draft: Snapshot, moduleId: string): void {
  const module = findModule(draft, moduleId)
  if (!module || module.kind !== 'sub') return
  module.archived = true
  for (const conversation of draft.conversations) {
    if (conversation.subModuleId === moduleId) conversation.persistence = 'one-off'
  }
}

/** Every string equal to `from`, as a value or as a key, becomes `to`. */
function renameEverywhere(value: unknown, from: string, to: string): unknown {
  if (value === from) return to
  if (Array.isArray(value)) {
    value.forEach((item, index) => (value[index] = renameEverywhere(item, from, to)))
  } else if (typeof value === 'object' && value !== null) {
    const record = value as Record<string, unknown>
    for (const key of Object.keys(record)) {
      const next = renameEverywhere(record[key], from, to)
      if (key === from) {
        delete record[key]
        record[to] = next
      } else {
        record[key] = next
      }
    }
  }
  return value
}

/**
 * A sub-module becomes a top-level profession module (D-38). Its id changes
 * to `profession.<slug>`; the old id stays as an alias, so its old address
 * still resolves. Returns the new id.
 */
export function promoteSubModule(draft: Snapshot, moduleId: string): string | null {
  const module = findModule(draft, moduleId)
  if (!module || module.kind !== 'sub') return null
  const id = `profession.${moduleId.slice(moduleId.lastIndexOf('.') + 1)}`
  if (findModule(draft, id)) return null
  renameEverywhere(draft, moduleId, id)
  const promoted = draft.modules.splice(draft.modules.indexOf(module), 1)[0]
  promoted.kind = 'profession'
  delete promoted.parentId
  promoted.aliases.push(moduleId)
  draft.modules.push(promoted)
  return id
}

/** Step 2 of onboarding, and 重新生成 in settings: the module set is hers. */
export function confirmModuleSet(draft: RuntimeState, seed?: Snapshot): void {
  draft.onboarded = true
  if (!seed) return
  // Regenerate: the set the scene starts with replaces what she built.
  const kept = draft.modules.filter((module) => module.kind === 'base')
  const generated = seed.modules.filter((module) => module.kind !== 'base')
  draft.modules = [...kept, ...structuredClone(generated)]
  draft.removedModules = []
}

export function renameModule(draft: Snapshot, input: { moduleId: string; name: string | Text }): void {
  const module = findModule(draft, input.moduleId)
  if (module) module.name = typeof input.name === 'string' ? typed(input.name) : input.name
}

/**
 * Adds a profession module she describes — it has no page builder, so it
 * renders the stub pattern — or, with `restore`, puts back one she removed.
 * Returns the module's id.
 */
export function addModule(
  draft: Snapshot,
  input: { name: string | Text; description?: string | Text } | { restore: string },
): string | null {
  if ('restore' in input) {
    const back = draft.removedModules
      .filter(({ module }) => module.id === input.restore || module.parentId === input.restore)
      .sort((a, b) => a.index - b.index)
    if (back.length === 0) return null
    draft.removedModules = draft.removedModules.filter((entry) => !back.includes(entry))
    for (const { module, index } of back) draft.modules.splice(Math.min(index, draft.modules.length), 0, module)
    return input.restore
  }
  const asText = (value: string | Text) => (typeof value === 'string' ? typed(value) : value)
  const id = `profession.custom-${++draft.seq}`
  const module: Module = {
    id,
    kind: 'profession',
    name: asText(input.name),
    description: input.description ? asText(input.description) : customModule.description,
    icon: 'puzzle',
    workflowId: `wf:${id}`,
    memoryTableIds: [],
    aliases: [],
    custom: true,
  }
  draft.modules.push(module)
  addWorkflow(draft, module, stubWorkflow())
  return id
}

/** Removes a profession module and its sub-modules from the set. Base modules stay (D-29). */
export function removeModule(draft: Snapshot, moduleId: string): void {
  const module = findModule(draft, moduleId)
  if (!module || module.kind === 'base') return
  const leaving = draft.modules
    .map((each, index) => ({ module: each, index }))
    .filter((entry) => entry.module.id === moduleId || entry.module.parentId === moduleId)
  draft.removedModules.push(...leaving)
  draft.modules = draft.modules.filter((each) => !leaving.some((entry) => entry.module === each))
}

// ── Workflows ───────────────────────────────────────────────────────────────

/** Saves a node's parameters or mode as a new version of the workflow. `false`: no such node. */
export function saveNodeParams(draft: Snapshot, input: SaveNodeParamsInput): boolean {
  const workflow = draft.workflows.find((each) => each.id === input.workflowId)
  if (!workflow) return false
  const current = structuredClone(versionOf(workflow))
  const node = current.nodes.find((each) => each.id === input.nodeId)
  if (!node) return false
  Object.assign(node.params, input.params ?? {})
  if (input.mode) node.mode = input.mode
  const n = Math.max(...workflow.versions.map((version) => version.n)) + 1
  workflow.versions.push({ ...current, n, at: draft.storyTime, author: input.author ?? 'user', reason: input.reason })
  workflow.current = n
  applyEstimates(draft)
  return true
}

/** Approves the change the AI proposed to a workflow: the draft becomes the next version. */
export function approveWorkflowChange(draft: Snapshot, input: { workflowId: string }): boolean {
  const workflow = draft.workflows.find((each) => each.id === input.workflowId)
  const proposed = workflow?.proposed
  if (!workflow || !proposed) return false
  const n = Math.max(...workflow.versions.map((version) => version.n)) + 1
  workflow.versions.push({ n, at: draft.storyTime, author: 'ai', reason: proposed.reason, nodes: proposed.nodes, edges: proposed.edges })
  workflow.current = n
  delete workflow.proposed
  const proposal = draft.proposals.find((each) => each.id === proposed.proposalId)
  if (proposal) {
    for (const part of proposal.parts) if (part.state === 'pending') part.state = 'accepted'
    proposal.applied = true
    proposal.decidedAt ??= draft.storyTime
  }
  applyEstimates(draft)
  return true
}

// ── Memory and proposals ────────────────────────────────────────────────────

/** Writes cells into memory rows, marking the tables updated at the story time. */
export function updateMemory(draft: Snapshot, patches: MemoryPatch[]): void {
  for (const patch of patches) {
    const table = tableOf(draft, patch.tableId)
    if (!table) continue
    const row = rowOf(table, patch.rowId)
    if (row) Object.assign(row.cells, patch.cells)
    else if (patch.insert) table.rows.push({ id: patch.rowId, cells: { ...patch.cells } })
    table.updatedAt = draft.storyTime
  }
  applyEstimates(draft)
}

function runEffect(draft: Snapshot, proposal: Proposal): string | null {
  const effect = proposal.onAccept
  const accepted = new Set(proposal.parts.filter((part) => part.state === 'accepted').map((part) => part.id))
  switch (effect.action) {
    case 'createSubModule':
      return createSubModule(draft, { ...effect.input, conversationId: effect.input.conversationId ?? proposal.conversationId })
    case 'saveNodeParams':
      saveNodeParams(draft, effect.input)
      return null
    case 'approveWorkflowChange':
      approveWorkflowChange(draft, effect.input)
      return null
    case 'promoteSubModule':
      return promoteSubModule(draft, effect.input.moduleId)
    case 'updateMemory': {
      const patches = effect.input.patches.filter((patch) => !patch.partId || accepted.has(patch.partId))
      // What an accepted proposal changed is marked in the memory view until the owner's next run.
      for (const patch of patches) {
        const table = tableOf(draft, patch.tableId)
        if (table) markChange(draft, table.ownerModuleId, memoryBlock(table.id), patch.rowId, rowOf(table, patch.rowId) ? 'updated' : 'new')
      }
      updateMemory(draft, patches)
      return null
    }
    default:
      return null
  }
}

/**
 * Accepts or rejects one part of a proposal. When the last part resolves and
 * at least one was accepted, the proposal's `onAccept` runs — once. Returns
 * the id of the module that effect created or promoted, if it did.
 */
export function resolveProposalPart(
  draft: Snapshot,
  input: { proposalId: string; partId: string; resolution: Exclude<ProposalPartState, 'pending'> },
): string | null {
  const proposal = draft.proposals.find((each) => each.id === input.proposalId)
  const part = proposal?.parts.find((each) => each.id === input.partId)
  if (!proposal || !part || part.state !== 'pending') return null
  part.state = input.resolution
  if (proposal.applied || proposal.parts.some((each) => each.state === 'pending')) return null
  proposal.applied = true
  proposal.decidedAt = draft.storyTime
  // A workflow change that was refused takes its draft with it.
  if (proposal.onAccept.action === 'approveWorkflowChange' && proposal.parts.every((each) => each.state === 'rejected')) {
    const { workflowId } = proposal.onAccept.input
    const workflow = draft.workflows.find((each) => each.id === workflowId)
    if (workflow?.proposed?.proposalId === proposal.id) delete workflow.proposed
  }
  return proposal.parts.some((each) => each.state === 'accepted') ? runEffect(draft, proposal) : null
}

// ── Runs ────────────────────────────────────────────────────────────────────

/** A run begins: 正在运行. Returns the run's id, or `null` for an unknown module. */
export function startRun(draft: Snapshot, input: { moduleId: string; trigger?: TriggerKind }): string | null {
  const workflow = workflowOf(draft, input.moduleId)
  if (!workflow) return null
  const id = newId(draft, 'run')
  draft.runs.push({
    id,
    moduleId: input.moduleId,
    at: draft.storyTime,
    trigger: input.trigger ?? 'manual',
    version: workflow.current,
    result: 'running',
    changes: { blocks: {} },
  })
  return id
}

/**
 * The run ends. It fails when an account the module draws on is not
 * connected; otherwise it reports what changed since the module's last run —
 * and with that the earlier run's markers are gone.
 */
export function finishRun(draft: Snapshot, runId: string): void {
  const run = draft.runs.find((each) => each.id === runId)
  if (!run || run.result !== 'running') return
  const reason = blockingAccount(draft, run.moduleId)
  if (reason) {
    run.result = 'failed'
    run.reason = reason
    return
  }
  run.result = 'ok'
  run.changes = draft.pendingChanges[run.moduleId] ?? { blocks: {} }
  delete draft.pendingChanges[run.moduleId]
}

const mean = (values: number[]) => Math.round(values.reduce((sum, value) => sum + value, 0) / values.length)

/**
 * 完成 on an appointment: the actual grooming time is recorded. The visit
 * joins the dog's file and both observed columns move at once — the dog's
 * 平均实际耗时 and its breed's 实测平均 (the mean of the breed's dogs).
 * No 适用时长 changes here: that waits for the Monday review's proposal.
 */
export function recordActualDuration(draft: Snapshot, input: { appointmentId: string; minutes: number }): void {
  const appointments = tableOf(draft, tableId.appointments)
  const appointment = rowOf(appointments, input.appointmentId)
  if (!appointments || !appointment) return
  const a = column.appointments
  const minutes = Math.max(0, Math.round(input.minutes))
  const dog = stringCell(appointment, a.dog) ?? ''
  appointment.cells[a.actual] = minutes
  appointment.cells[a.status] = appointmentStatus.done
  markChange(draft, appointments.ownerModuleId, blockKey.appointments.schedule, appointment.id, 'updated')

  const visits = tableOf(draft, tableId.visits)
  if (visits) {
    const visit: MemoryRow = {
      id: newId(draft, 'visit'),
      cells: {
        [column.visits.dog]: dog,
        [column.visits.date]: datePart(stringCell(appointment, a.start) ?? draft.storyTime),
        [column.visits.estimate]: appointment.cells[a.estimate],
        [column.visits.actual]: minutes,
        [column.visits.groomer]: appointment.cells[a.groomer],
      },
    }
    visits.rows.push(visit)
    visits.updatedAt = draft.storyTime
    markChange(draft, visits.ownerModuleId, blockKey.clients.visits, visit.id, 'new')
    markChange(draft, visits.ownerModuleId, blockKey.clients.dogs, dog, 'updated')
  }

  const records = tableOf(draft, tableId.dogDurations)
  const dogRow = rowOf(tableOf(draft, tableId.dogs), dog)
  if (!records || !visits || !dogRow) return
  const d = column.dogDurations
  const breed = stringCell(dogRow, column.dogs.breed)
  let record = rowOf(records, dog)
  if (!record) {
    const cells: Record<string, CellValue> = { [d.dog]: dog, [d.breed]: breed, [d.applied]: null, [d.note]: dogRow.cells[column.dogs.note] ?? null }
    record = { id: dog, cells }
    records.rows.push(record)
    markChange(draft, records.ownerModuleId, memoryBlock(records.id), dog, 'new')
  }
  markChange(draft, records.ownerModuleId, memoryBlock(records.id), dog, 'updated')
  const own = visits.rows.filter((visit) => visit.cells[column.visits.dog] === dog).map((visit) => Number(visit.cells[column.visits.actual]))
  record.cells[d.visits] = own.length
  record.cells[d.average] = mean(own)
  records.updatedAt = draft.storyTime
  markChange(draft, records.ownerModuleId, blockKey.duration.records, appointment.id, 'new')

  const breeds = tableOf(draft, tableId.breeds)
  const breedRow = rowOf(breeds, breed ?? '')
  if (!breeds || !breedRow) return
  const averages = records.rows.filter((row) => row.cells[d.breed] === breed).flatMap((row) => numberCell(row, d.average) ?? [])
  const b = column.breeds
  Object.assign(breedRow.cells, {
    [b.observed]: mean(averages),
    [b.dogs]: averages.length,
    [b.min]: Math.min(...averages),
    [b.max]: Math.max(...averages),
    [b.updatedAt]: draft.storyTime,
  })
  breeds.updatedAt = draft.storyTime
  markChange(draft, breeds.ownerModuleId, memoryBlock(breeds.id), breedRow.id, 'updated')
}

// ── Settings ────────────────────────────────────────────────────────────────

export function setCeiling(draft: Snapshot, input: { taskKind: TaskKind; ceiling: BehaviourMode | null }): void {
  const setting = draft.modeSettings.find((each) => each.taskKind === input.taskKind)
  if (setting) setting.ceiling = input.ceiling
  else draft.modeSettings.push({ ...input })
}

export function connectAccount(draft: Snapshot, accountId: string): void {
  const account = findAccount(draft, accountId)
  if (account) account.status = 'connected'
}

/** From here the modules it feeds fail their next run with `account-missing:<account>`. */
export function disconnectAccount(draft: Snapshot, accountId: string): void {
  const account = findAccount(draft, accountId)
  if (account) account.status = 'disconnected'
}

/** Pins a block where it is, or lets it go. `index` is its position in the page at that moment. */
export function togglePin(draft: RuntimeState, input: { moduleId: string; blockKey: string; index?: number }): void {
  const pins = (draft.pins[input.moduleId] ??= {})
  if (input.blockKey in pins) delete pins[input.blockKey]
  else pins[input.blockKey] = input.index ?? 0
  if (Object.keys(pins).length === 0) delete draft.pins[input.moduleId]
}

export function setPreview(draft: RuntimeState, preview: PreviewId): void {
  draft.preview = preview
}

// ── Chat ────────────────────────────────────────────────────────────────────

const same = (a: string, b: string) => a.trim().replace(/\s+/g, ' ') === b.trim().replace(/\s+/g, ' ')

/** The script that answers `text` here and now; `null`: the canned reply. */
export function findScript(state: Snapshot, text: string, context: ChatContext): ChatScript | null {
  return (
    chatScripts.find(
      (script) =>
        script.scenes.includes(state.scene) &&
        (same(text, script.prompt['zh-CN']) || same(text, script.prompt.en)) &&
        (script.where?.(state, context) ?? true),
    ) ?? null
  )
}

/** The sub-module a script's conversation becomes is already there: asking again would only propose it twice. */
function alreadyBuilt(state: Snapshot, script: ChatScript): boolean {
  const slug = subModuleTemplates[script.template ?? '']?.slug
  return slug !== undefined && state.modules.some((module) => !module.archived && module.id.endsWith(`.sub.${slug}`))
}

/** The scripted prompts the chat bar offers on this screen, at most three. */
export function suggestedPrompts(state: Snapshot, context: ChatContext): ChatScript[] {
  return chatScripts
    .filter((script) => script.scenes.includes(state.scene) && !alreadyBuilt(state, script) && (script.where?.(state, context) ?? true))
    .slice(0, 3)
}

export type SendMessageInput = {
  text: string
  /** Continue this conversation; without it a new one starts. */
  conversationId?: string
  context?: ChatContext
  /** Ask again for the reply that failed; `text` is ignored. */
  retry?: boolean
}

/**
 * Her message arrives and the AI starts answering: the reply is there as a
 * `streaming` message with no text yet, `thinking`. The script decides the
 * surface of a new conversation. Returns `null` for a retry with nothing to
 * retry.
 */
export function beginMessage(
  draft: Snapshot,
  input: SendMessageInput,
): { conversationId: string; surface: 'in-place' | 'thread' } | null {
  const context = input.context ?? {}
  let conversation = input.conversationId ? findConversation(draft, input.conversationId) : undefined
  let script: ChatScript | null

  if (input.retry) {
    const failed = conversation?.messages.at(-1)
    if (!conversation || !failed || failed.author !== 'ai' || failed.status === 'done') return null
    script = chatScripts.find((each) => each.id === failed.script) ?? null
    conversation.messages.pop()
  } else {
    script = findScript(draft, input.text, context)
    if (!conversation) {
      const filed = script?.topic ?? miscTopic
      if (!draft.topics.some((topic) => topic.id === filed.id)) {
        draft.topics.push({ id: filed.id, title: filed.title, summary: null, moduleIds: [...filed.moduleIds], lastActivityAt: draft.storyTime })
      }
      conversation = {
        id: newId(draft, 'conv'),
        topicId: filed.id,
        ...(context.moduleId ? { moduleId: context.moduleId } : {}),
        surface: script?.surface ?? 'in-place',
        persistence: 'one-off',
        ...(script?.template ? { template: script.template } : {}),
        title: script?.title ?? typed(input.text.trim().slice(0, 40)),
        startedAt: draft.storyTime,
        messages: [],
      }
      draft.conversations.push(conversation)
    }
    // A scripted prompt is hers in both languages; anything else stays as she typed it.
    conversation.messages.push({ id: newId(draft, 'msg'), author: 'user', text: script?.prompt ?? typed(input.text.trim()), at: draft.storyTime, status: 'done' })
  }

  conversation.messages.push({
    id: newId(draft, 'msg'),
    author: 'ai',
    text: tx('', ''),
    at: draft.storyTime,
    status: 'streaming',
    phase: 'thinking',
    script: script?.id ?? null,
  })
  const topic = draft.topics.find((each) => each.id === conversation.topicId)
  if (topic) topic.lastActivityAt = draft.storyTime
  return { conversationId: conversation.id, surface: conversation.surface }
}

function pendingReply(draft: Snapshot, conversationId: string) {
  const conversation = findConversation(draft, conversationId)
  const message = conversation?.messages.at(-1)
  if (!conversation || !message || message.author !== 'ai' || message.status !== 'streaming') return null
  const script = chatScripts.find((each) => each.id === message.script) ?? null
  return { conversation, message, script, reply: script?.reply ?? cannedReply }
}

/**
 * The AI takes its next step: the script's next step line joins the message
 * and is the one still running. `false`: there is no further step — the reply
 * goes on to its text.
 */
export function stepReply(draft: Snapshot, conversationId: string): boolean {
  const pending = pendingReply(draft, conversationId)
  const begun = pending?.message.steps?.length ?? 0
  const next = pending?.script?.steps?.[begun]
  if (!pending || !next) return false
  pending.message.steps = [...(pending.message.steps ?? []), next]
  pending.message.phase = 'working'
  return true
}

/** Part of the reply has arrived: the first `fraction` of it is the message's text, and every step is finished. */
export function streamReply(draft: Snapshot, conversationId: string, fraction: number): void {
  const pending = pendingReply(draft, conversationId)
  if (!pending) return
  const part = (text: string) => text.slice(0, Math.ceil(text.length * fraction))
  pending.message.text = tx(part(pending.reply['zh-CN']), part(pending.reply.en))
  pending.message.phase = 'writing'
}

/**
 * The text is whole and what it carries starts to arrive: the tables first.
 * `true`: there is a table and it is now under the text — the proposal, and
 * the end of the reply, come with `finishReply`.
 */
export function attachReply(draft: Snapshot, conversationId: string): boolean {
  const pending = pendingReply(draft, conversationId)
  if (!pending) return false
  const { message, script, reply } = pending
  message.text = reply
  message.phase = 'attaching'
  const tables = script?.attachments?.(draft) ?? []
  if (tables.length === 0) return false
  message.attachments = tables
  return true
}

/** The reply is complete, with what it carries: tables, and a proposal that now waits in the state. */
export function finishReply(draft: Snapshot, conversationId: string, context: ChatContext = {}): void {
  const pending = pendingReply(draft, conversationId)
  if (!pending) return
  const { conversation, message, script, reply } = pending
  message.text = reply
  message.status = 'done'
  delete message.phase
  // The steps stay with the answer: a record shows what was done, folded away.
  if (script?.steps?.length) message.steps = [...script.steps]
  const attachments = [...(script?.attachments?.(draft) ?? [])]
  const seed = script?.proposal?.(draft, { moduleId: conversation.moduleId, ...context })
  if (seed) {
    const proposal: Proposal = { ...structuredClone(seed), id: newId(draft, 'proposal'), at: draft.storyTime, conversationId }
    draft.proposals.push(proposal)
    attachments.push({ kind: 'proposal', proposalId: proposal.id })
  }
  if (attachments.length > 0) message.attachments = attachments
  else delete message.attachments
  const topic = draft.topics.find((each) => each.id === conversation.topicId)
  if (topic && script) {
    topic.summary = script.topic.summary
    topic.summaryAt = draft.storyTime
  }
}

/** The reply did not come (回答失败): the message stays, failed, and can be retried. */
export function failReply(draft: Snapshot, conversationId: string): void {
  const pending = pendingReply(draft, conversationId)
  if (!pending) return
  pending.message.text = tx('', '')
  pending.message.status = 'failed'
  delete pending.message.phase
  delete pending.message.steps
  delete pending.message.attachments
}

/** A whole scripted exchange at once — how a scene is built from the one before. */
export function replayScript(draft: Snapshot, scriptId: string, context: ChatContext = {}): string {
  const script = chatScripts.find((each) => each.id === scriptId)
  if (!script) throw new Error(`No chat script "${scriptId}"`)
  const begun = beginMessage(draft, { text: script.prompt['zh-CN'], context })
  if (!begun) throw new Error(`Script "${scriptId}" did not start`)
  finishReply(draft, begun.conversationId, context)
  return begun.conversationId
}
