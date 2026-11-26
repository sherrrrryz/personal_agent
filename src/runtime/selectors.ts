import { formatDate, formatDateTime, formatDuration, formatNumber, type Locale } from '@/i18n'
import { capMode, isAboveCeiling, type BehaviourMode } from '@/lib/vocab'

import type {
  Account,
  Conversation,
  FailureReason,
  MemoryRow,
  MemoryTable,
  Module,
  Proposal,
  Run,
  Snapshot,
  TaskKind,
  Topic,
  WfNode,
  Workflow,
  WorkflowVersion,
} from './model'
import { isText } from './text'
import { toDate } from './time'

// Pure reads of the state. A screen never digs through the arrays itself: it
// asks here, so "which modules does this account feed" has one answer.

// ── Modules ─────────────────────────────────────────────────────────────────

export function findModule(state: Snapshot, id: string): Module | undefined {
  return state.modules.find((module) => module.id === id)
}

/**
 * The module an address means: its id, or an alias of it (a promoted
 * sub-module's old id — the route redirects). `null`: nothing lives there.
 */
export function resolveModule(state: Snapshot, id: string): { module: Module; redirected: boolean } | null {
  const exact = findModule(state, id)
  if (exact) return { module: exact, redirected: false }
  const aliased = state.modules.find((module) => module.aliases.includes(id))
  return aliased ? { module: aliased, redirected: true } : null
}

/** A module's sub-modules that are in navigation (not archived). */
export function subModulesOf(state: Snapshot, parentId: string): Module[] {
  return state.modules.filter((module) => module.parentId === parentId && !module.archived)
}

/** The sidebar's module lists: the base modules, then the profession modules with their sub-modules. */
export function navigationOf(state: Snapshot): {
  base: Array<{ module: Module; subs: Module[] }>
  profession: Array<{ module: Module; subs: Module[] }>
} {
  const group = (kind: Module['kind']) =>
    state.modules
      .filter((module) => module.kind === kind)
      .map((module) => ({ module, subs: subModulesOf(state, module.id) }))
  return { base: group('base'), profession: group('profession') }
}

// ── Workflows and modes ─────────────────────────────────────────────────────

export function workflowOf(state: Snapshot, moduleId: string): Workflow | undefined {
  return state.workflows.find((workflow) => workflow.moduleId === moduleId)
}

export function versionOf(workflow: Workflow, n: number = workflow.current): WorkflowVersion {
  return workflow.versions.find((version) => version.n === n) ?? workflow.versions[workflow.versions.length - 1]
}

/** The user's ceiling for a kind of task; `null` when nothing is set. */
export function ceilingFor(state: Snapshot, taskKind: TaskKind): BehaviourMode | null {
  return state.modeSettings.find((setting) => setting.taskKind === taskKind)?.ceiling ?? null
}

/**
 * The mode an action really runs in (D-22): the lower of the node's own mode
 * and the user's ceiling for its kind of task. With no ceiling set the AI's
 * choice stands; an action the AI gave no mode is assisted.
 */
export function effectiveMode(state: Snapshot, node: WfNode): BehaviourMode {
  const mode = node.mode ?? 'assisted'
  const ceiling = node.taskKind ? ceilingFor(state, node.taskKind) : null
  return ceiling ? capMode(mode, ceiling) : mode
}

/** True when the ceiling holds the action below the mode the AI picked (受上限限制). */
export function isCapped(state: Snapshot, node: WfNode): boolean {
  const ceiling = node.taskKind ? ceilingFor(state, node.taskKind) : null
  return ceiling !== null && isAboveCeiling(node.mode ?? 'assisted', ceiling)
}

/** The actions of every current workflow that belong to a kind of task — what a ceiling caps. */
export function actionsOfKind(state: Snapshot, taskKind: TaskKind): Array<{ module: Module; node: WfNode }> {
  return state.modules.flatMap((module) => {
    const workflow = module.archived ? undefined : workflowOf(state, module.id)
    if (!workflow) return []
    return versionOf(workflow)
      .nodes.filter((node) => node.kind === 'action' && node.taskKind === taskKind)
      .map((node) => ({ module, node }))
  })
}

// ── Runs and accounts ───────────────────────────────────────────────────────

/** A module's runs, oldest first. */
export function runsOf(state: Snapshot, moduleId: string): Run[] {
  return state.runs.filter((run) => run.moduleId === moduleId)
}

export function latestRun(state: Snapshot, moduleId: string): Run | undefined {
  return runsOf(state, moduleId).at(-1)
}

export function findAccount(state: Snapshot, id: string): Account | undefined {
  return state.accounts.find((account) => account.id === id)
}

/** The modules whose workflows draw on an account — what stops when it is disconnected. */
export function dependentModules(state: Snapshot, accountId: string): Module[] {
  const feeds = findAccount(state, accountId)?.feeds ?? []
  return state.modules.filter((module) => feeds.includes(module.id))
}

/** Why a module's next run will fail: an account it draws on is gone or expired. `null`: nothing in the way. */
export function blockingAccount(state: Snapshot, moduleId: string): FailureReason | null {
  for (const account of state.accounts) {
    if (!account.feeds.includes(moduleId) || account.status === 'connected') continue
    return { code: account.status === 'expired' ? 'account-expired' : 'account-missing', account: account.id }
  }
  return null
}

/** `account-expired:wechat`, `source-failed:profession.clients`, `platform-unreachable`. */
export function formatReason(reason: FailureReason): string {
  if (reason.code === 'account-expired' || reason.code === 'account-missing') return `${reason.code}:${reason.account}`
  if (reason.code === 'source-failed') return `${reason.code}:${reason.moduleId}`
  return reason.code
}

// ── Proposals ───────────────────────────────────────────────────────────────

export function isResolved(proposal: Proposal): boolean {
  return proposal.parts.every((part) => part.state !== 'pending')
}

/** Proposals with a part still to decide, newest first; of one module when `moduleId` is given. */
export function openProposals(state: Snapshot, moduleId?: string): Proposal[] {
  return state.proposals
    .filter((proposal) => !isResolved(proposal) && (moduleId === undefined || proposal.moduleId === moduleId))
    .reverse()
}

/** How many things wait for her — the count beside 通知 and the frame's 待你确认. */
export function awaitingCount(state: Snapshot, moduleId?: string): number {
  return openProposals(state, moduleId).filter((proposal) => proposal.mode === 'deferred').length
}

// ── Conversations and topics ────────────────────────────────────────────────

export function findConversation(state: Snapshot, id: string): Conversation | undefined {
  return state.conversations.find((conversation) => conversation.id === id)
}

function lastActivity(conversation: Conversation): string {
  return conversation.messages.at(-1)?.at ?? conversation.startedAt
}

/** Conversations, the latest first — `chat.recent` shows the first ten. */
export function recentConversations(state: Snapshot, limit?: number): Conversation[] {
  const sorted = state.conversations
    .map((conversation, index) => ({ conversation, index }))
    .sort((a, b) => lastActivity(b.conversation).localeCompare(lastActivity(a.conversation)) || b.index - a.index)
    .map(({ conversation }) => conversation)
  return limit === undefined ? sorted : sorted.slice(0, limit)
}

export function findTopic(state: Snapshot, id: string): Topic | undefined {
  return state.topics.find((topic) => topic.id === id)
}

export function conversationsOf(state: Snapshot, topicId: string): Conversation[] {
  return state.conversations.filter((conversation) => conversation.topicId === topicId)
}

// ── Memory ──────────────────────────────────────────────────────────────────

export function tableOf(state: Snapshot, id: string): MemoryTable | undefined {
  return state.memory.find((table) => table.id === id)
}

/** The tables a module owns, in the order its memory view shows them. */
export function tablesOf(state: Snapshot, module: Module): MemoryTable[] {
  return module.memoryTableIds.flatMap((id) => tableOf(state, id) ?? [])
}

export function rowOf(table: MemoryTable | undefined, rowId: string): MemoryRow | undefined {
  return table?.rows.find((row) => row.id === rowId)
}

/** A numeric cell, or `null` when it holds no number. */
export function numberCell(row: MemoryRow | undefined, columnId: string): number | null {
  const value = row?.cells[columnId]
  return typeof value === 'number' ? value : null
}

/** A cell that holds an id, a code or an ISO time. */
export function stringCell(row: MemoryRow | undefined, columnId: string): string | null {
  const value = row?.cells[columnId]
  return typeof value === 'string' ? value : null
}

/**
 * A cell as the text a table shows, by the column's type. `null` means the
 * cell has no data; the screen says so in its own words (尚无数据). A `flag`
 * has no words here either: the screen names both of its values.
 */
export function cellText(
  state: Snapshot,
  table: Pick<MemoryTable, 'columns'>,
  row: MemoryRow,
  columnId: string,
  locale: Locale,
): string | null {
  const column = table.columns.find((candidate) => candidate.id === columnId)
  const value = row.cells[columnId]
  if (!column || value === null || value === undefined) return null
  if (isText(value)) return value[locale]
  switch (column.type) {
    case 'duration':
      return typeof value === 'number' ? formatDuration(locale, value) : null
    case 'number':
      return typeof value === 'number' ? formatNumber(locale, value) : null
    case 'date':
      return typeof value === 'string' ? formatDate(locale, toDate(value)) : null
    case 'datetime':
      return typeof value === 'string' ? formatDateTime(locale, toDate(value)) : null
    case 'code':
      return typeof value === 'string' ? (column.options?.[value]?.[locale] ?? value) : null
    case 'module':
      return typeof value === 'string' ? (resolveModule(state, value)?.module.name[locale] ?? null) : null
    case 'ref': {
      const target = column.refTable ? tableOf(state, column.refTable) : undefined
      const referred = typeof value === 'string' ? rowOf(target, value) : undefined
      return target && referred ? cellText(state, target, referred, target.titleColumn, locale) : null
    }
    default:
      return typeof value === 'string' ? value : null
  }
}
