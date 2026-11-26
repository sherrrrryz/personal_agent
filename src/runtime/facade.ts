import { emptyThread, emptyVariant, longVariant, previewErrors, withoutSource, withoutSummaries, type PreviewError } from '@/fixtures/preview'

import type {
  Account,
  Conversation,
  FailureReason,
  MemoryTable,
  ModeSetting,
  Module,
  Proposal,
  Run,
  RuntimeState,
  Topic,
  Workflow,
} from './model'
import {
  conversationsOf,
  findConversation,
  findTopic,
  latestRun,
  recentConversations,
  resolveModule,
  runsOf,
  tablesOf,
  workflowOf,
} from './selectors'

// The async facade (spec part 2 § Fake workflow runtime, "Async facade and the
// preview"). A screen reads a *resource* and gets an *answer*: ready, empty,
// loading, long, or error with a typed reason and whatever data survived.
// 状态预览 (`state.preview`) forces the answer of every resource and the run
// state of every module; without it an answer is ready or empty, by the data.

/** Every resource a screen can read. */
export const resourceKinds = [
  'modules',
  'module',
  'workflow',
  'memory',
  'runs',
  'proposals',
  'conversations',
  'conversation',
  'topics',
  'topic',
  'accounts',
  'mode-settings',
] as const
export type ResourceKind = (typeof resourceKinds)[number]

/** What each resource answers with. */
export type ResourceData = {
  /** The module set, in navigation order. */
  modules: Module[]
  /** One module and the state its page is built from: `page(view, preview)`. */
  module: { module: Module; view: RuntimeState }
  workflow: Workflow
  /** A module's own tables, and every table it reads. */
  memory: { tables: MemoryTable[]; reads: MemoryTable[] }
  /** A module's runs, oldest first. */
  runs: Run[]
  /** Every proposal, or one module's, oldest first — resolved ones included. */
  proposals: Proposal[]
  /** Latest first. */
  conversations: Conversation[]
  conversation: Conversation
  topics: Topic[]
  topic: { topic: Topic; conversations: Conversation[] }
  accounts: Account[]
  'mode-settings': ModeSetting[]
}

/** Which resource: its kind, and the id of the module, conversation or topic where it has one. */
export type ResourceRef<Kind extends ResourceKind = ResourceKind> = {
  [Each in Kind]: Each extends 'module' | 'workflow' | 'memory' | 'runs'
    ? { kind: Each; moduleId: string }
    : Each extends 'proposals'
      ? { kind: Each; moduleId?: string }
      : Each extends 'conversation' | 'topic'
        ? { kind: Each; id: string }
        : { kind: Each }
}[Kind]

/**
 * What a read gives back.
 * `ready` and `long` carry the data (`long`: the long-content variant).
 * `empty` carries the empty-shaped data — an empty list, a placeholder workflow.
 * `error` carries the typed reason and, by the reason: nothing; the last good
 * data with `stale`; or what the other sources still give with `partial`.
 */
export type ResourceAnswer<Data> =
  | { state: 'ready' | 'long' | 'empty'; data: Data }
  | { state: 'loading' }
  | { state: 'error'; reason: FailureReason; data?: Data; stale?: boolean; partial?: boolean }

export type AnswerOf<Kind extends ResourceKind> = ResourceAnswer<ResourceData[Kind]>

/** A resource as a string: a cache key, a React `key`, an effect dependency. */
export function resourceKey(ref: ResourceRef): string {
  if ('id' in ref) return `${ref.kind}:${ref.id}`
  return 'moduleId' in ref && ref.moduleId !== undefined ? `${ref.kind}:${ref.moduleId}` : ref.kind
}

const variants = new WeakMap<RuntimeState, RuntimeState>()

/**
 * The state as the preview shows it: the long or the empty variant under
 * those two previews, the state itself otherwise. The same object for the same
 * state, so it is safe to read during render.
 */
export function viewOf(state: RuntimeState): RuntimeState {
  if (state.preview !== 'long' && state.preview !== 'empty') return state
  let view = variants.get(state)
  if (!view) {
    view = state.preview === 'long' ? longVariant(state) : emptyVariant(state)
    variants.set(state, view)
  }
  return view
}

/** The data of a resource in a state; `undefined`: nothing has that id. */
function select(view: RuntimeState, ref: ResourceRef): ResourceData[ResourceKind] | undefined {
  switch (ref.kind) {
    case 'modules':
      // The empty variant keeps its modules so addresses still open; the set itself is what is empty.
      return view.preview === 'empty' ? view.modules.filter((module) => module.kind === 'base') : view.modules
    case 'module': {
      const module = resolveModule(view, ref.moduleId)?.module
      return module && { module, view }
    }
    case 'workflow': {
      const module = resolveModule(view, ref.moduleId)?.module
      return module && workflowOf(view, module.id)
    }
    case 'memory': {
      const module = resolveModule(view, ref.moduleId)?.module
      return module && {
        tables: tablesOf(view, module),
        reads: view.memory.filter((table) => table.readers.includes(module.id)),
      }
    }
    case 'runs': {
      const module = resolveModule(view, ref.moduleId)?.module
      return module && runsOf(view, module.id)
    }
    case 'proposals': {
      const module = ref.moduleId === undefined ? undefined : resolveModule(view, ref.moduleId)?.module
      if (ref.moduleId !== undefined && !module) return undefined
      return module ? view.proposals.filter((proposal) => proposal.moduleId === module.id) : view.proposals
    }
    case 'conversations':
      return recentConversations(view)
    case 'conversation':
      return findConversation(view, ref.id)
    case 'topics':
      return view.topics
    case 'topic': {
      const topic = findTopic(view, ref.id)
      return topic && { topic, conversations: conversationsOf(view, topic.id) }
    }
    case 'accounts':
      return view.accounts
    case 'mode-settings':
      return view.modeSettings
  }
}

/** Whether ready data is in fact nothing to show. A module's page decides that itself. */
function isEmpty(ref: ResourceRef, data: ResourceData[ResourceKind]): boolean {
  switch (ref.kind) {
    case 'modules':
      return (data as Module[]).every((module) => module.kind === 'base')
    case 'memory':
      return (data as ResourceData['memory']).tables.every((table) => table.rows.length === 0)
    case 'conversation':
      return (data as Conversation).messages.length === 0
    case 'topic':
      return (data as ResourceData['topic']).conversations.length === 0
    case 'module':
    case 'workflow':
    case 'mode-settings':
      return false
    default:
      return (data as unknown[]).length === 0
  }
}

/** The failure a resource is fixed to under 出错. */
export function previewErrorOf(ref: ResourceRef): PreviewError {
  const entry = previewErrors[ref.kind]
  return typeof entry === 'function' ? entry('moduleId' in ref && ref.moduleId ? ref.moduleId : '') : entry
}

function failed(state: RuntimeState, ref: ResourceRef): ResourceAnswer<ResourceData[ResourceKind]> {
  const { reason, keeps } = previewErrorOf(ref)
  if (keeps === 'nothing') return { state: 'error', reason }
  if (keeps === 'stale') return { state: 'error', reason, data: select(state, ref), stale: true }
  const rest = reason.code === 'source-failed' ? withoutSource(state, reason.moduleId) : withoutSummaries(state)
  return { state: 'error', reason, data: select(rest, ref), partial: true }
}

const answers = new WeakMap<RuntimeState, Map<string, ResourceAnswer<unknown>>>()

/**
 * The answer of a resource in a state, at once. The same object for the same
 * state and resource. `read` on the runtime is this after the simulated delay.
 */
export function answerOf<Kind extends ResourceKind>(state: RuntimeState, ref: ResourceRef<Kind>): AnswerOf<Kind> {
  let cache = answers.get(state)
  if (!cache) answers.set(state, (cache = new Map()))
  const key = resourceKey(ref)
  let answer = cache.get(key) as AnswerOf<Kind> | undefined
  if (!answer) {
    answer = compute(state, ref) as AnswerOf<Kind>
    cache.set(key, answer)
  }
  return answer
}

/**
 * 空 for the two resources asked for by id. The empty variant holds no
 * conversation and no topic, yet the address must still open: a thread shows
 * her opening message and 正在回答, a topic its records with the summary
 * still to come (a topic always has a conversation).
 */
function emptyById(state: RuntimeState, ref: ResourceRef): ResourceData[ResourceKind] | undefined {
  if (ref.kind === 'conversation') {
    const conversation = findConversation(state, ref.id)
    return conversation && emptyThread(conversation)
  }
  return select(withoutSummaries(state), ref)
}

function compute(state: RuntimeState, ref: ResourceRef): ResourceAnswer<ResourceData[ResourceKind]> {
  if (state.preview === 'loading') return { state: 'loading' }
  const byId = state.preview === 'empty' && (ref.kind === 'conversation' || ref.kind === 'topic')
  const data = byId ? emptyById(state, ref) : select(viewOf(state), ref)
  // An id nothing answers to is not found whatever is being previewed.
  if (data === undefined) return { state: 'error', reason: { code: 'not-found' } }
  if (state.preview === 'error') return failed(state, ref)
  if (state.preview === 'empty' || state.preview === 'long') return { state: state.preview, data }
  return { state: isEmpty(ref, data) ? 'empty' : 'ready', data }
}

/** The frame's run-state line: never-run · ok · running · failed with its reason. */
export type RunState = {
  status: 'never-run' | 'ok' | 'running' | 'failed'
  /** The latest run, when there is one. */
  last?: Run
  reason?: FailureReason
  nextRunAt?: string
}

/**
 * A module's run state. 状态预览 forces it like every resource: 加载中 is a
 * run in progress, 出错 a failed run with the module's fixed reason, 空 a
 * module that has never run.
 */
export function runStateOf(state: RuntimeState, moduleId: string): RunState {
  const module = resolveModule(state, moduleId)?.module
  if (!module) return { status: 'never-run' }
  const last = latestRun(state, module.id)
  const nextRunAt = module.nextRunAt
  if (state.preview === 'empty') return { status: 'never-run' }
  if (state.preview === 'loading') return { status: 'running', last, nextRunAt }
  if (state.preview === 'error') return { status: 'failed', last, reason: previewErrors.runs(module.id).reason, nextRunAt }
  if (!last) return { status: 'never-run', nextRunAt }
  if (last.result === 'failed') return { status: 'failed', last, reason: last.reason, nextRunAt }
  return { status: last.result, last, nextRunAt }
}
