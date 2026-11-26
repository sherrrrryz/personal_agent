// @vitest-environment node
import { describe, expect, it } from 'vitest'

import { accountId, basis, chatScripts, column, firstVisitParam, memoryBlock, moduleId, nodeId, scene, scriptId, tableId, cannedReply } from '@/fixtures'
import { behaviourModes, type BehaviourMode } from '@/lib/vocab'

import {
  createRuntime,
  effectiveMode,
  findModule,
  formatReason,
  isCapped,
  latestRun,
  numberCell,
  parseSceneRef,
  resolveModule,
  rowOf,
  runtimeActionNames,
  sceneRefs,
  subModulesOf,
  tableOf,
  tx,
  versionOf,
  workflowOf,
  type Runtime,
  type RuntimeActions,
  type WfNode,
} from '.'
import { memoryStorage, runtimeIn } from './test-support'

// R-01: every runtime action of spec part 2 § Fake workflow runtime, by its
// effect on the state. `effects` has one entry per action name — a missing
// one does not compile — and each entry is run as its own test.

const prompt = (id: string) => chatScripts.find((script) => script.id === id)!.prompt['zh-CN']
const onAppointments = { moduleId: moduleId.appointments, view: 'page' } as const

/** Sends a scripted prompt and waits for the whole reply. */
async function ask(runtime: Runtime, script: string, context: { moduleId?: string; view?: 'page' | 'workflow' } = onAppointments) {
  const sent = runtime.actions.sendMessage({ text: prompt(script), context })!
  await sent.done
  return sent
}

const booked = (runtime: Runtime, dog: string) => {
  const rows = tableOf(runtime.getState(), tableId.appointments)!.rows
  return rows.find((row) => row.cells[column.appointments.dog] === dog && row.cells[column.appointments.status] === 'booked')!
}

const effects: Record<keyof RuntimeActions, () => void | Promise<void>> = {
  async sendMessage() {
    const runtime = runtimeIn('s0')
    const sent = runtime.actions.sendMessage({ text: prompt(scriptId.hero), context: onAppointments })!
    expect(sent.surface).toBe('in-place')
    // At once: her message, and the AI answering.
    let conversation = runtime.getState().conversations.find((each) => each.id === sent.conversationId)!
    expect(conversation.messages.map((message) => [message.author, message.status])).toEqual([
      ['user', 'done'],
      ['ai', 'streaming'],
    ])
    expect(conversation.moduleId).toBe(moduleId.appointments)
    await sent.done
    conversation = runtime.getState().conversations.find((each) => each.id === sent.conversationId)!
    const reply = conversation.messages[1]
    expect(reply.status).toBe('done')
    expect(reply.text.en).toContain('4 hours')
    expect(reply.attachments?.map((attachment) => attachment.kind)).toEqual(['table', 'proposal'])
    const proposal = runtime.getState().proposals.at(-1)!
    expect(proposal).toMatchObject({ conversationId: sent.conversationId, onAccept: { action: 'createSubModule' } })
    expect(runtime.getState().topics.find((topic) => topic.id === conversation.topicId)?.summary).not.toBeNull()

    // The second scripted prompt of `s0` opens a dedicated chat.
    expect((await ask(runtime, scriptId.anniversary)).surface).toBe('thread')

    // Anything else: the one canned reply, in place, filed under the catch-all topic.
    const other = runtime.actions.sendMessage({ text: '今天天气怎么样' })!
    await other.done
    const unscripted = runtime.getState().conversations.find((each) => each.id === other.conversationId)!
    expect(other.surface).toBe('in-place')
    expect(unscripted.messages[1].text).toEqual(cannedReply)
    expect(unscripted.topicId).toBe('misc')

    // A reply that failed is asked for again, without her message being repeated.
    runtime.actions.setPreview('error')
    const failing = runtime.actions.sendMessage({ text: prompt(scriptId.hero), context: onAppointments })!
    await failing.done
    const last = () => runtime.getState().conversations.find((each) => each.id === failing.conversationId)!.messages
    expect(last().at(-1)?.status).toBe('failed')
    runtime.actions.setPreview('normal')
    await runtime.actions.sendMessage({ text: '', conversationId: failing.conversationId, retry: true })!.done
    expect(last().map((message) => message.status)).toEqual(['done', 'done'])
    expect(runtime.actions.sendMessage({ text: '', conversationId: failing.conversationId, retry: true })).toBeNull()
  },

  async createSubModule() {
    const runtime = runtimeIn('e1')
    const { conversationId } = await ask(runtime, scriptId.confirmations)
    // 设为长期 on that conversation.
    const id = runtime.actions.createSubModule({ parentId: moduleId.appointments, conversationId })
    const state = runtime.getState()
    expect(id).toBe(moduleId.confirmations)
    expect(findModule(state, id!)).toMatchObject({ kind: 'sub', parentId: moduleId.appointments, nextRunAt: '2026-11-02T19:00' })
    expect(state.modules[state.modules.findIndex((module) => module.id === moduleId.appointments) + 1].id).toBe(id)
    expect(workflowOf(state, id!)?.versions).toHaveLength(1)
    expect(tableOf(state, tableId.confirmations)?.ownerModuleId).toBe(id)
    expect(tableOf(state, tableId.appointments)?.readers).toContain(id)
    expect(state.accounts.find((account) => account.id === accountId.wechat)?.feeds).toContain(id)
    expect(state.conversations.find((each) => each.id === conversationId)).toMatchObject({ persistence: 'persistent', subModuleId: id })

    // A conversation with no story behind it becomes a stub sub-module under the module given.
    const stub = runtime.actions.createSubModule({ parentId: moduleId.messages, name: tx('催款提醒', 'Payment reminders') })!
    expect(stub).toMatch(/^messages\.sub\.custom-\d+$/)
    expect(findModule(runtime.getState(), stub)).toMatchObject({ custom: true, memoryTableIds: [] })
    expect(versionOf(workflowOf(runtime.getState(), stub)!).nodes).toHaveLength(3)
    expect(runtime.actions.createSubModule({ parentId: 'nowhere' })).toBeNull()
  },

  archiveSubModule() {
    const runtime = runtimeIn('s0')
    const conversation = runtime.getState().conversations.find((each) => each.subModuleId === moduleId.confirmations)!
    runtime.actions.archiveSubModule(moduleId.confirmations)
    expect(findModule(runtime.getState(), moduleId.confirmations)?.archived).toBe(true)
    expect(subModulesOf(runtime.getState(), moduleId.appointments)).toEqual([])
    // Its conversation stays in Topics, one-off again (D-20).
    expect(runtime.getState().conversations.find((each) => each.id === conversation.id)).toMatchObject({ persistence: 'one-off', topicId: conversation.topicId })
    // Switched back on, the same sub-module returns.
    expect(runtime.actions.createSubModule({ parentId: moduleId.appointments, conversationId: conversation.id })).toBe(moduleId.confirmations)
    expect(findModule(runtime.getState(), moduleId.confirmations)?.archived).toBe(false)
    expect(runtime.getState().modules.filter((module) => module.id === moduleId.confirmations)).toHaveLength(1)
  },

  promoteSubModule() {
    const runtime = runtimeIn('s1')
    const id = runtime.actions.promoteSubModule(moduleId.duration)
    const state = runtime.getState()
    expect(id).toBe('profession.duration')
    // An alias resolving after `promoteSubModule`: the old address redirects.
    expect(resolveModule(state, moduleId.duration)).toMatchObject({ redirected: true, module: { id, kind: 'profession', aliases: [moduleId.duration] } })
    expect(resolveModule(state, id!)?.redirected).toBe(false)
    expect(findModule(state, id!)?.parentId).toBeUndefined()
    expect(subModulesOf(state, moduleId.appointments).map((module) => module.id)).toEqual([moduleId.confirmations])
    // Everything that pointed at it follows.
    expect(workflowOf(state, id!)).toBeDefined()
    expect(tableOf(state, tableId.breeds)?.ownerModuleId).toBe(id)
    expect(state.conversations.some((conversation) => conversation.subModuleId === id)).toBe(true)
    expect(JSON.stringify(state).split(`"${moduleId.duration}"`)).toHaveLength(2) // the alias only
    // Pins are stored per module id, so they move too — in the state and in storage.
    const storage = memoryStorage()
    const pinned = createRuntime({ delay: 0, storage, search: '?scene=s1' })
    pinned.actions.togglePin({ moduleId: moduleId.duration, blockKey: 'records', index: 1 })
    pinned.actions.promoteSubModule(moduleId.duration)
    expect(pinned.getState().pins).toEqual({ 'profession.duration': { records: 1 } })
    expect(storage.items.get('pa.pins')).toBe('{"profession.duration":{"records":1}}')
    expect(runtime.actions.promoteSubModule(moduleId.appointments)).toBeNull()
  },

  async resolveProposalPart() {
    // The key action of `s0`: accepting the AI's offer yields `s1`.
    const runtime = runtimeIn('s0')
    await ask(runtime, scriptId.hero)
    const proposal = runtime.getState().proposals.at(-1)!
    const created = runtime.actions.resolveProposalPart({ proposalId: proposal.id, partId: 'persist', resolution: 'accepted' })
    expect(created).toBe(moduleId.duration)
    const live = runtime.getState()
    const next = scene('s1')
    expect(live.modules).toEqual(next.modules)
    expect(live.workflows).toEqual(next.workflows)
    expect(live.memory).toEqual(next.memory)
    expect(live.proposals).toEqual(next.proposals)
    expect(booked(runtime, 'kele').cells).toMatchObject({ [column.appointments.estimate]: 240, [column.appointments.basis]: basis.breed })
    // Resolved once: a second answer changes nothing.
    expect(runtime.actions.resolveProposalPart({ proposalId: proposal.id, partId: 'persist', resolution: 'rejected' })).toBeNull()
    expect(runtime.getState().proposals.at(-1)?.parts[0].state).toBe('accepted')

    // Rejected, nothing is created.
    const refusing = runtimeIn('s0')
    await ask(refusing, scriptId.hero)
    const refused = refusing.getState().proposals.at(-1)!
    expect(refusing.actions.resolveProposalPart({ proposalId: refused.id, partId: 'persist', resolution: 'rejected' })).toBeNull()
    expect(findModule(refusing.getState(), moduleId.duration)).toBeUndefined()
    expect(refusing.getState().proposals.at(-1)).toMatchObject({ applied: true, parts: [{ state: 'rejected' }] })

    // `e2`: a deferred no-reply item, accepted, marks the customer as reminded.
    const evening = runtimeIn('e2')
    const [first] = evening.getState().proposals
    const patched = first.onAccept.action === 'updateMemory' ? first.onAccept.input.patches[0].rowId : ''
    evening.actions.resolveProposalPart({ proposalId: first.id, partId: first.parts[0].id, resolution: 'accepted' })
    expect(rowOf(tableOf(evening.getState(), tableId.confirmations), patched)?.cells.status).toBe('reminded')
  },

  approveWorkflowChange() {
    // The shape of `s4`: a draft with one more condition node, carried by a proposal.
    const initial = scene('s1')
    const workflow = workflowOf(initial, moduleId.duration)!
    const current = versionOf(workflow)
    const condition: WfNode = { id: 'first-visit', kind: 'condition', label: tx('第一次来的狗 +30 分钟', 'First visit: +30 minutes'), params: { [firstVisitParam]: 30 } }
    workflow.proposed = {
      reason: tx('第一次来的狗平均多 30 分钟', 'A first visit takes about 30 minutes longer'),
      nodes: [...current.nodes, condition],
      edges: [...current.edges, { id: 'e-new-1', from: nodeId.estimate, to: 'first-visit' }, { id: 'e-new-2', from: 'first-visit', to: nodeId.setDuration }],
      proposalId: 'proposal-first-visit',
    }
    initial.proposals.push({
      id: 'proposal-first-visit',
      moduleId: moduleId.duration,
      mode: 'deferred',
      title: tx('新增条件', 'Add a condition'),
      parts: [{ id: 'add', text: tx('第一次来的狗 +30 分钟？', 'First visit: +30 minutes?'), state: 'pending' }],
      onAccept: { action: 'approveWorkflowChange', input: { workflowId: workflow.id } },
      at: initial.storyTime,
    })
    const runtime = runtimeIn('s1', { initial })
    expect(runtime.actions.approveWorkflowChange({ workflowId: workflow.id })).toBe(true)
    const approved = workflowOf(runtime.getState(), moduleId.duration)!
    expect(approved).toMatchObject({ current: 2, versions: [{ n: 1 }, { n: 2, author: 'ai' }] })
    expect(approved.proposed).toBeUndefined()
    expect(versionOf(approved).nodes).toHaveLength(current.nodes.length + 1)
    expect(versionOf(approved, 1).nodes).toHaveLength(current.nodes.length)
    expect(runtime.getState().proposals.find((each) => each.id === 'proposal-first-visit')).toMatchObject({ applied: true, parts: [{ state: 'accepted' }] })
    // The new condition is in force: no dog has a recorded visit yet, so each booking gets the extra.
    expect(booked(runtime, 'kele').cells[column.appointments.estimate]).toBe(270)
    expect(runtime.actions.approveWorkflowChange({ workflowId: workflow.id })).toBe(false)

    // The same through the proposal: accepting its part approves the draft.
    const viaProposal = runtimeIn('s1', { initial })
    viaProposal.actions.resolveProposalPart({ proposalId: 'proposal-first-visit', partId: 'add', resolution: 'accepted' })
    expect(workflowOf(viaProposal.getState(), moduleId.duration)).toMatchObject({ current: 2 })
    // Rejecting it drops the draft and leaves version 1.
    const rejected = runtimeIn('s1', { initial })
    rejected.actions.resolveProposalPart({ proposalId: 'proposal-first-visit', partId: 'add', resolution: 'rejected' })
    expect(workflowOf(rejected.getState(), moduleId.duration)).toMatchObject({ current: 1, versions: [{ n: 1 }] })
    expect(workflowOf(rejected.getState(), moduleId.duration)?.proposed).toBeUndefined()
  },

  async saveNodeParams() {
    const runtime = runtimeIn('s1')
    const workflow = workflowOf(runtime.getState(), moduleId.duration)!
    const reason = tx('你把复盘时间改为周一 09:00', 'You moved the review to Monday 09:00')
    expect(runtime.actions.saveNodeParams({ workflowId: workflow.id, nodeId: nodeId.review, params: { time: '09:00' }, reason })).toBe(true)
    const saved = workflowOf(runtime.getState(), moduleId.duration)!
    expect(saved).toMatchObject({ current: 2, versions: [{ n: 1 }, { n: 2, author: 'user', reason, at: runtime.getState().storyTime }] })
    const review = (n: number) => versionOf(saved, n).nodes.find((node) => node.id === nodeId.review)?.params
    expect(review(2)).toEqual({ weekday: 1, time: '09:00' })
    expect(review(1)).toEqual({ weekday: 1, time: '18:00' })
    // An action's mode is saved the same way.
    runtime.actions.saveNodeParams({ workflowId: workflow.id, nodeId: nodeId.setDuration, mode: 'assisted', reason })
    const latest = workflowOf(runtime.getState(), moduleId.duration)!
    expect(versionOf(latest).nodes.find((node) => node.id === nodeId.setDuration)?.mode).toBe('assisted')
    expect(latest.current).toBe(3)
    expect(runtime.actions.saveNodeParams({ workflowId: workflow.id, nodeId: 'no-such-node', reason })).toBe(false)
    expect(workflowOf(runtime.getState(), moduleId.duration)?.versions).toHaveLength(3)

    // The scripted proposal in the workflow editor does it through `onAccept`, as the AI.
    const editor = runtimeIn('s1')
    await ask(editor, scriptId.review, { moduleId: moduleId.duration, view: 'workflow' })
    const proposal = editor.getState().proposals.at(-1)!
    editor.actions.resolveProposalPart({ proposalId: proposal.id, partId: proposal.parts[0].id, resolution: 'accepted' })
    expect(workflowOf(editor.getState(), moduleId.duration)).toMatchObject({ current: 2, versions: [{ n: 1 }, { n: 2, author: 'ai' }] })
    // Outside the editor the same sentence is unscripted.
    const elsewhere = runtimeIn('s1')
    const sent = elsewhere.actions.sendMessage({ text: prompt(scriptId.review), context: onAppointments })!
    await sent.done
    expect(elsewhere.getState().conversations.find((each) => each.id === sent.conversationId)?.messages[1].text).toEqual(cannedReply)
  },

  async runModule() {
    const runtime = runtimeIn('s1')
    const first = booked(runtime, 'doudou')
    runtime.actions.recordActualDuration({ appointmentId: first.id, minutes: 200 })
    const running = runtime.actions.runModule(moduleId.duration)
    // 正在运行, at once.
    expect(latestRun(runtime.getState(), moduleId.duration)).toMatchObject({ result: 'running', trigger: 'manual', version: 1 })
    const id = await running
    const run = latestRun(runtime.getState(), moduleId.duration)!
    expect(run).toMatchObject({ id, result: 'ok', at: runtime.getState().storyTime })
    // The run reports what changed since the last one…
    expect(run.changes).toEqual({
      blocks: {
        records: { [first.id]: 'new' },
        // …and which rows of its memory moved (S6b: the memory view's markers).
        [memoryBlock(tableId.dogDurations)]: { doudou: 'new' },
        [memoryBlock(tableId.breeds)]: { golden: 'updated' },
      },
    })
    // …and the next run, with nothing new, clears the markers.
    await runtime.actions.runModule(moduleId.duration)
    expect(latestRun(runtime.getState(), moduleId.duration)?.changes).toEqual({ blocks: {} })
    expect(await runtime.actions.runModule('nowhere')).toBeNull()
  },

  recordActualDuration() {
    const runtime = runtimeIn('s1')
    const doudou = booked(runtime, 'doudou')
    const dafu = booked(runtime, 'dafu')
    runtime.actions.recordActualDuration({ appointmentId: doudou.id, minutes: 200 })
    let state = runtime.getState()
    expect(rowOf(tableOf(state, tableId.appointments), doudou.id)?.cells).toMatchObject({ actual: 200, status: 'done' })
    expect(tableOf(state, tableId.visits)?.rows).toMatchObject([{ cells: { dog: 'doudou', date: '2026-11-05', estimate: 240, actual: 200 } }])
    // Both observed columns move at once…
    expect(rowOf(tableOf(state, tableId.dogDurations), 'doudou')?.cells).toMatchObject({ visits: 1, average: 200, applied: null })
    expect(rowOf(tableOf(state, tableId.breeds), 'golden')?.cells).toMatchObject({ observed: 200, dogs: 1, min: 200, max: 200, applied: 240, basis: 'seed' })

    runtime.actions.recordActualDuration({ appointmentId: dafu.id, minutes: 250 })
    state = runtime.getState()
    // …the breed's 实测平均 is the mean of its dogs' records…
    expect(rowOf(tableOf(state, tableId.breeds), 'golden')?.cells).toMatchObject({ observed: 225, dogs: 2, min: 200, max: 250 })
    // …and no 适用时长 moves: every open booking is still on its breed's seed.
    expect(numberCell(rowOf(tableOf(state, tableId.breeds), 'golden'), column.breeds.applied)).toBe(240)
    for (const row of tableOf(state, tableId.appointments)!.rows.filter((each) => each.cells.status === 'booked')) {
      expect(row.cells[column.appointments.basis]).toBe(basis.breed)
    }
    expect(state.pendingChanges[moduleId.clients].blocks.dogs).toEqual({ doudou: 'updated', dafu: 'updated' })
  },

  setCeiling() {
    const runtime = runtimeIn('s1')
    const node = () => versionOf(workflowOf(runtime.getState(), moduleId.duration)!).nodes.find((each) => each.id === nodeId.setDuration)!
    expect(node().mode).toBe('autonomous')
    const expected: Array<[BehaviourMode | null, BehaviourMode, boolean]> = [
      [null, 'autonomous', false],
      ['autonomous', 'autonomous', false],
      ['assisted', 'assisted', true],
      ['deferred', 'deferred', true],
    ]
    for (const [ceiling, effective, capped] of expected) {
      runtime.actions.setCeiling({ taskKind: 'change-appointments', ceiling })
      expect(effectiveMode(runtime.getState(), node()), String(ceiling)).toBe(effective)
      expect(isCapped(runtime.getState(), node()), String(ceiling)).toBe(capped)
    }
    // Another kind of task is untouched by this ceiling.
    const propose = versionOf(workflowOf(runtime.getState(), moduleId.duration)!).nodes.find((each) => each.id === 'suggest-shifts')!
    expect(effectiveMode(runtime.getState(), propose)).toBe('assisted')
  },

  async connectAccount() {
    const runtime = runtimeIn('s1')
    await runtime.actions.runModule(moduleId.mail)
    expect(latestRun(runtime.getState(), moduleId.mail)).toMatchObject({ result: 'failed', reason: { code: 'account-missing', account: accountId.google } })
    runtime.actions.connectAccount(accountId.google)
    expect(runtime.getState().accounts.find((account) => account.id === accountId.google)?.status).toBe('connected')
    await runtime.actions.runModule(moduleId.mail)
    expect(latestRun(runtime.getState(), moduleId.mail)?.result).toBe('ok')
  },

  async disconnectAccount() {
    const runtime = runtimeIn('s1')
    runtime.actions.disconnectAccount(accountId.wechat)
    expect(runtime.getState().accounts.find((account) => account.id === accountId.wechat)?.status).toBe('disconnected')
    // The dependent modules' next run fails with `account-missing:<account>`…
    for (const dependent of [moduleId.messages, moduleId.confirmations]) {
      expect(latestRun(runtime.getState(), dependent)?.result, dependent).toBe('ok')
      await runtime.actions.runModule(dependent)
      const run = latestRun(runtime.getState(), dependent)!
      expect(run.result, dependent).toBe('failed')
      expect(formatReason(run.reason!), dependent).toBe('account-missing:wechat')
    }
    // …and a module that does not draw on it still runs.
    await runtime.actions.runModule(moduleId.inventory)
    expect(latestRun(runtime.getState(), moduleId.inventory)?.result).toBe('ok')
  },

  confirmModuleSet() {
    const storage = memoryStorage()
    const runtime = createRuntime({ delay: 0, storage, search: '' })
    expect(runtime.getState()).toMatchObject({ scene: 'e1', onboarded: false })
    runtime.actions.removeModule(moduleId.shifts)
    const added = runtime.actions.addModule({ name: '寄养', description: '管理寄养的笼位' })!
    runtime.actions.confirmModuleSet()
    expect(runtime.getState().onboarded).toBe(true)
    expect(storage.items.get('pa.onboarded')).toBe('1')
    // The set is hers: what she removed and added stays.
    expect(findModule(runtime.getState(), moduleId.shifts)).toBeUndefined()
    expect(findModule(runtime.getState(), added)).toBeDefined()
    expect(createRuntime({ delay: 0, storage, search: '' }).getState().onboarded).toBe(true)
    // 重新生成 puts the scene's own set back.
    runtime.actions.confirmModuleSet({ regenerate: true })
    expect(runtime.getState().modules.map((module) => module.id)).toEqual(scene('e1').modules.map((module) => module.id))
  },

  renameModule() {
    const runtime = runtimeIn('s1')
    runtime.actions.renameModule({ moduleId: moduleId.inventory, name: '进销存' })
    expect(findModule(runtime.getState(), moduleId.inventory)?.name).toEqual({ 'zh-CN': '进销存', en: '进销存' })
    runtime.actions.renameModule({ moduleId: moduleId.inventory, name: tx('库存', 'Stock') })
    expect(findModule(runtime.getState(), moduleId.inventory)?.name).toEqual(tx('库存', 'Stock'))
  },

  addModule() {
    const runtime = runtimeIn('s1')
    const before = runtime.getState().modules.length
    const id = runtime.actions.addModule({ name: '寄养', description: '管理寄养的笼位' })!
    const state = runtime.getState()
    expect(state.modules).toHaveLength(before + 1)
    // A module she adds is a stub: placeholder workflow, no memory, never run.
    expect(findModule(state, id)).toMatchObject({ kind: 'profession', custom: true, memoryTableIds: [], name: { en: '寄养' } })
    expect(versionOf(workflowOf(state, id)!).nodes.map((node) => node.kind)).toEqual(['trigger', 'source', 'output'])
    expect(latestRun(state, id)).toBeUndefined()
    expect(runtime.actions.addModule({ name: '洗护套餐' })).not.toBe(id)
    expect(runtime.actions.addModule({ restore: 'never-removed' })).toBeNull()
  },

  removeModule() {
    const runtime = runtimeIn('s1')
    const order = runtime.getState().modules.map((module) => module.id)
    runtime.actions.removeModule(moduleId.appointments)
    // The module goes with its sub-modules.
    expect(runtime.getState().modules.map((module) => module.id)).toEqual(
      order.filter((id) => ![moduleId.appointments, moduleId.confirmations, moduleId.duration].includes(id as never)),
    )
    // Undo puts all three back where they were.
    expect(runtime.actions.addModule({ restore: moduleId.appointments })).toBe(moduleId.appointments)
    expect(runtime.getState().modules.map((module) => module.id)).toEqual(order)
    expect(runtime.getState().removedModules).toEqual([])
    // A base module is not part of the set she edits.
    runtime.actions.removeModule(moduleId.notifications)
    expect(findModule(runtime.getState(), moduleId.notifications)).toBeDefined()
  },

  togglePin() {
    const storage = memoryStorage()
    const runtime = createRuntime({ delay: 0, storage, search: '?scene=s1' })
    runtime.actions.togglePin({ moduleId: moduleId.appointments, blockKey: 'schedule', index: 1 })
    runtime.actions.togglePin({ moduleId: moduleId.appointments, blockKey: 'summary', index: 0 })
    expect(runtime.getState().pins).toEqual({ [moduleId.appointments]: { schedule: 1, summary: 0 } })
    // Stored per module: a reload and a scene jump keep it.
    expect(createRuntime({ delay: 0, storage, search: '' }).getState().pins).toEqual(runtime.getState().pins)
    runtime.actions.jumpToScene('s0')
    expect(runtime.getState().pins[moduleId.appointments]).toEqual({ schedule: 1, summary: 0 })
    runtime.actions.togglePin({ moduleId: moduleId.appointments, blockKey: 'schedule' })
    runtime.actions.togglePin({ moduleId: moduleId.appointments, blockKey: 'summary' })
    expect(runtime.getState().pins).toEqual({})
    expect(storage.items.get('pa.pins')).toBe('{}')
  },

  setPreview() {
    const runtime = runtimeIn('s1')
    expect(runtime.getState().preview).toBe('normal')
    for (const preview of ['empty', 'loading', 'error', 'long', 'normal'] as const) {
      runtime.actions.setPreview(preview)
      expect(runtime.getState().preview).toBe(preview)
    }
    // The story data itself is never touched by a preview.
    runtime.actions.setPreview('empty')
    expect(runtime.getState().memory).toEqual(scene('s1').memory)
  },

  jumpToScene() {
    const storage = memoryStorage()
    const runtime = createRuntime({ delay: 0, storage, search: '' })
    runtime.actions.renameModule({ moduleId: moduleId.inventory, name: '进销存' })
    runtime.actions.setPreview('error')
    const { epoch } = runtime.getState()
    runtime.actions.jumpToScene('s1')
    // The snapshot replaces the state: her actions since the last jump are gone, the preview is reset.
    expect(runtime.getState()).toMatchObject({ ...scene('s1'), preview: 'normal', epoch: epoch + 1 })
    expect(storage.items.get('pa.scene')).toBe('s1')
    // The scene survives a reload; `?scene=` wins over the stored one.
    expect(createRuntime({ delay: 0, storage, search: '' }).getState().scene).toBe('s1')
    expect(createRuntime({ delay: 0, storage, search: '?scene=e2' }).getState().scene).toBe('e2')
    // A resolved half is a jump target of its own.
    runtime.actions.jumpToScene('s3-resolved')
    expect(runtime.getState()).toMatchObject(scene('s3', 'resolved'))
    expect(storage.items.get('pa.scene')).toBe('s3')
    runtime.actions.jumpToScene('s9' as never)
    expect(runtime.getState().scene).toBe('s3')
    expect(sceneRefs).toEqual(['e1', 'e2', 's0', 's1', 's2', 's3', 's3-resolved', 's4', 's4-resolved', 's5'])
    for (const ref of sceneRefs) expect(parseSceneRef(ref), ref).not.toBeNull()
    for (const ref of ['s1-resolved', 's3-pending', 'S3', '', null]) expect(parseSceneRef(ref), String(ref)).toBeNull()
  },
}

describe('runtime actions (R-01)', () => {
  it('are the nineteen of the spec, and every one has its test', () => {
    const runtime = runtimeIn('e1')
    expect(Object.keys(runtime.actions).sort()).toEqual([...runtimeActionNames].sort())
    expect(Object.keys(effects).sort()).toEqual([...runtimeActionNames].sort())
    expect(runtimeActionNames).toHaveLength(19)
  })

  it.each(runtimeActionNames)('%s', async (name) => {
    await effects[name]()
  })

  it('an action tells every subscriber, and leaves the earlier state object as it was', () => {
    const runtime = runtimeIn('s1')
    const before = runtime.getState()
    let calls = 0
    const unsubscribe = runtime.subscribe(() => calls++)
    runtime.actions.renameModule({ moduleId: moduleId.inventory, name: '进销存' })
    expect(calls).toBe(1)
    expect(runtime.getState()).not.toBe(before)
    expect(findModule(before, moduleId.inventory)?.name.en).toBe('Products and stock')
    unsubscribe()
    runtime.actions.setPreview('long')
    expect(calls).toBe(1)
  })

  it('restart goes back to first use', () => {
    const storage = memoryStorage({ 'pa.theme': 'dark' })
    const runtime = createRuntime({ delay: 0, storage, search: '' })
    runtime.actions.confirmModuleSet()
    runtime.actions.jumpToScene('s1')
    runtime.actions.togglePin({ moduleId: moduleId.appointments, blockKey: 'schedule' })
    runtime.restart()
    expect(runtime.getState()).toMatchObject({ scene: 'e1', onboarded: false, pins: {}, preview: 'normal' })
    expect([...storage.items.keys()]).toEqual(['pa.theme'])
  })
})

describe('effectiveMode (D-22)', () => {
  const state = scene('s1')
  const action = (mode?: BehaviourMode): WfNode => ({ id: 'a', kind: 'action', label: tx('动作', 'Action'), params: {}, taskKind: 'adjust-shifts', ...(mode ? { mode } : {}) })
  const autonomy = { autonomous: 2, assisted: 1, deferred: 0 }

  it.each(behaviourModes)('under the ceiling %s is the lower of the node’s mode and the ceiling', (ceiling) => {
    const capped = { ...state, modeSettings: [{ taskKind: 'adjust-shifts' as const, ceiling }] }
    for (const mode of behaviourModes) {
      const effective = effectiveMode(capped, action(mode))
      expect(autonomy[effective], `${mode} under ${ceiling}`).toBe(Math.min(autonomy[mode], autonomy[ceiling]))
      expect(isCapped(capped, action(mode))).toBe(autonomy[mode] > autonomy[ceiling])
    }
  })

  it('with no ceiling set the AI’s choice stands, and an action without a mode is assisted', () => {
    const unset = { ...state, modeSettings: [{ taskKind: 'adjust-shifts' as const, ceiling: null }] }
    for (const mode of behaviourModes) expect(effectiveMode(unset, action(mode))).toBe(mode)
    expect(effectiveMode(unset, action())).toBe('assisted')
    expect(effectiveMode({ ...state, modeSettings: [] }, action('autonomous'))).toBe('autonomous')
    expect(effectiveMode({ ...state, modeSettings: [{ taskKind: 'adjust-shifts', ceiling: 'deferred' }] }, action())).toBe('deferred')
  })
})
