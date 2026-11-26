import type { BlockId, ChangeSet, ProposalPartState } from '@/blocks/types'
import type { BehaviourMode } from '@/lib/vocab'

import type { Text } from './text'

// The data model of the fake workflow runtime (spec part 2 § Fake workflow
// runtime, "Model"). Everything here is plain JSON: a scene is a snapshot of
// it, a runtime action maps one state to the next, and a test can compare two
// states with `toEqual`. Times are story times as local ISO strings
// (`2026-11-05T10:00`), never the wall clock; durations are minutes.

// ── Scenes and the preview ──────────────────────────────────────────────────

/** 热身 `e1` `e2`, then 主线 `s0`…`s5`, in story order. */
export const sceneIds = ['e1', 'e2', 's0', 's1', 's2', 's3', 's4', 's5'] as const
export type SceneId = (typeof sceneIds)[number]

/** The two groups of the 时间推进 menu. */
export const sceneGroups = { warmup: ['e1', 'e2'], main: ['s0', 's1', 's2', 's3', 's4', 's5'] } as const satisfies Record<
  string,
  readonly SceneId[]
>

/** `s3` and `s4` open *pending*; her key action lands on *resolved*. Other scenes have one half. */
export type SceneHalf = 'pending' | 'resolved'
export const scenesWithHalves = ['s3', 's4'] as const satisfies readonly SceneId[]

/** 状态预览: 正常 · 空 · 加载中 · 出错 · 超长内容. The long-content preview is spelled `long`. */
export const previewIds = ['normal', 'empty', 'loading', 'error', 'long'] as const
export type PreviewId = (typeof previewIds)[number]

// ── Failure reasons ─────────────────────────────────────────────────────────

/**
 * Why a read or a run failed. The screen that shows it puts it into its own
 * words. As a string (`formatReason`): `account-expired:<account>`,
 * `account-missing:<account>`, `source-failed:<module>`,
 * `platform-unreachable`, `generation-failed`, and `not-found` for an id
 * nothing answers to.
 */
export type FailureReason =
  | { code: 'account-expired'; account: string }
  | { code: 'account-missing'; account: string }
  | { code: 'source-failed'; moduleId: string }
  | { code: 'platform-unreachable' }
  | { code: 'generation-failed' }
  | { code: 'not-found' }

export type FailureCode = FailureReason['code']

// ── Modules, workflows, runs ────────────────────────────────────────────────

export type ModuleKind = 'base' | 'profession' | 'sub'

/** A lucide icon by its kebab-case name; the shell maps the name to the component. */
export const moduleIcons = [
  'bell',
  'message-square',
  'calendar',
  'list-todo',
  'mail',
  'folder',
  'calendar-clock',
  'paw-print',
  'package',
  'users',
  'timer',
  'send',
  'puzzle',
] as const
export type ModuleIcon = (typeof moduleIcons)[number]

export type Module = {
  /** The IA id: `notifications`, `profession.appointments`, `profession.appointments.sub.duration`. */
  id: string
  kind: ModuleKind
  /** The module a sub-module sits under. */
  parentId?: string
  name: Text
  /** One line on what its workflow does (the module set of onboarding and settings). */
  description: Text
  icon: ModuleIcon
  workflowId: string
  memoryTableIds: string[]
  /** Earlier ids that still resolve here — a promoted sub-module's old address. */
  aliases: string[]
  /** When the workflow runs next, if it is scheduled. */
  nextRunAt?: string
  /** An archived sub-module: gone from navigation, its conversations stay in Topics (D-20). */
  archived?: boolean
  /** Added by the user: no page builder, so it renders the stub pattern. */
  custom?: boolean
}

export type WfNodeKind = 'trigger' | 'source' | 'step' | 'condition' | 'action' | 'output' | 'memory'
export type TriggerKind = 'schedule' | 'event' | 'manual' | 'module'

/** The kinds of task of `settings.ai-modes`; an action node names the one it belongs to. */
export const taskKinds = [
  'message-customers',
  'change-appointments',
  'adjust-shifts',
  'change-rules',
  'order-stock',
  'organise',
] as const
export type TaskKind = (typeof taskKinds)[number]

export type WfParam = string | number | boolean

export type WfNode = {
  /** Stable within the workflow across versions. */
  id: string
  kind: WfNodeKind
  label: Text
  /** One line on what the node does; a step's branches as text. */
  detail?: Text
  /** What the inspector can adjust: a schedule's `weekday` and `time`, a condition's `thresholdMinutes`. */
  params: Record<string, WfParam>
  /** A trigger's type. */
  trigger?: TriggerKind
  /** An action's behaviour mode as the AI picked it; `effectiveMode` caps it (D-22). */
  mode?: BehaviourMode
  taskKind?: TaskKind
  /** An action's target module, or the module or account a source reads. */
  targetModuleId?: string
  account?: string
  /** An output node: the block it emits. */
  emits?: { block: BlockId; key: string; title: Text }
  /** The memory tables a memory or source node holds or reads. */
  tables?: string[]
}

export type WfEdge = { id: string; from: string; to: string; label?: Text }

export type WorkflowVersion = {
  n: number
  at: string
  author: 'ai' | 'user'
  reason: Text
  nodes: WfNode[]
  edges: WfEdge[]
}

/** A change the AI proposes to a workflow and the user has not yet approved (the diff of `s4`). */
export type WorkflowDraft = {
  reason: Text
  nodes: WfNode[]
  edges: WfEdge[]
  /** The proposal that carries the approval, if one does. */
  proposalId?: string
}

export type Workflow = {
  id: string
  moduleId: string
  /** The number of the version in force. */
  current: number
  versions: WorkflowVersion[]
  proposed?: WorkflowDraft
}

export type RunResult = 'ok' | 'failed' | 'running'

export type Run = {
  id: string
  moduleId: string
  at: string
  trigger: TriggerKind
  /** The workflow version the run used. */
  version: number
  result: RunResult
  reason?: FailureReason
  changes: ChangeSet
}

// ── Memory ──────────────────────────────────────────────────────────────────

/**
 * How a column's cells are read:
 * `text` a `Text` · `number` · `duration` minutes · `date` and `datetime`
 * local ISO strings · `ref` a row id of `refTable` · `module` a module id ·
 * `code` a key of `options` · `flag` a boolean. `null` in any column means
 * "no data yet".
 */
export type ColumnType = 'text' | 'number' | 'duration' | 'date' | 'datetime' | 'ref' | 'module' | 'code' | 'flag'

export type MemoryColumn = {
  id: string
  label: Text
  type: ColumnType
  refTable?: string
  options?: Record<string, Text>
}

export type CellValue = Text | string | number | boolean | null

export type MemoryRow = { id: string; cells: Record<string, CellValue> }

export type MemoryTable = {
  id: string
  ownerModuleId: string
  name: Text
  /** The column that names a row — what a `ref` to this table shows. */
  titleColumn: string
  columns: MemoryColumn[]
  rows: MemoryRow[]
  /** The modules that read this table. Memory is shared (D-28): this is a view, not a setting. */
  readers: string[]
  updatedAt?: string
}

/** A change to memory rows; `insert` adds the row when it is not there. */
export type MemoryPatch = {
  tableId: string
  rowId: string
  cells: Record<string, CellValue>
  insert?: boolean
  /** Applies only when this part of the proposal was accepted. */
  partId?: string
}

// ── Proposals ───────────────────────────────────────────────────────────────

export type CreateSubModuleInput = {
  parentId: string
  /** A story template of `src/fixtures/templates.ts` (`duration`, `confirmations`); without one the sub-module is a stub. */
  template?: string
  name?: Text
  conversationId?: string
}

export type SaveNodeParamsInput = {
  workflowId: string
  nodeId: string
  params?: Record<string, WfParam>
  mode?: BehaviourMode
  /** Why, in words: 你把复盘时间改为周一 09:00. */
  reason: Text
  author?: 'ai' | 'user'
}

/** What accepting a proposal does: a runtime action with its input, or a change to memory rows. */
export type ProposalEffect =
  | { action: 'createSubModule'; input: CreateSubModuleInput }
  | { action: 'saveNodeParams'; input: SaveNodeParamsInput }
  | { action: 'approveWorkflowChange'; input: { workflowId: string } }
  | { action: 'promoteSubModule'; input: { moduleId: string } }
  | { action: 'updateMemory'; input: { patches: MemoryPatch[] } }
  | { action: 'none' }

export type ProposalPart = { id: string; text: Text; state: ProposalPartState }

export type Proposal = {
  id: string
  /** The module the proposal comes from. */
  moduleId: string
  /** The workflow action that raised it, when one did: 建议排班调整 raises the suggestion on 排班. */
  nodeId?: string
  mode: BehaviourMode
  title: Text
  summary?: Text
  parts: ProposalPart[]
  /** Runs once, when the last part resolves and at least one was accepted. */
  onAccept: ProposalEffect
  at: string
  /** The conversation that raised it, if one did. */
  conversationId?: string
  /** Set when `onAccept` has run. */
  applied?: boolean
}

// ── Conversations and topics ────────────────────────────────────────────────

export type MessageAttachment =
  | { kind: 'proposal'; proposalId: string }
  | { kind: 'table'; name: Text; titleColumn: string; columns: MemoryColumn[]; rows: MemoryRow[] }

export type Message = {
  id: string
  author: 'user' | 'ai'
  text: Text
  at: string
  /** `streaming`: `text` is the part that has arrived. `failed`: the reply did not come; retry. */
  status: 'done' | 'streaming' | 'failed'
  attachments?: MessageAttachment[]
  /** The script that answers — kept so a failed reply can be retried. `null`: the canned reply. */
  script?: string | null
}

export type Conversation = {
  id: string
  topicId: string
  /** The module whose screen it was asked on. */
  moduleId?: string
  surface: 'in-place' | 'thread'
  persistence: 'one-off' | 'persistent'
  /** The sub-module it became. */
  subModuleId?: string
  /** The story template the sub-module is built from when this conversation is made persistent. */
  template?: string
  title: Text
  startedAt: string
  messages: Message[]
}

export type Topic = {
  id: string
  title: Text
  /** AI-written; `null` while it is being generated. */
  summary: Text | null
  summaryAt?: string
  /** The modules it concerns. */
  moduleIds: string[]
  lastActivityAt: string
}

// ── Accounts and modes ──────────────────────────────────────────────────────

export type AccountStatus = 'connected' | 'disconnected' | 'expired'

export type Account = {
  id: string
  name: Text
  /** `primary`: the shop's own tools, listed first; `more`: Google, Slack, Figma, GitHub. */
  group: 'primary' | 'more'
  status: AccountStatus
  /** The modules whose workflows draw on it. */
  feeds: string[]
}

/** The user's ceiling for a kind of task; `null` = not set, the AI decides (D-22). */
export type ModeSetting = { taskKind: TaskKind; ceiling: BehaviourMode | null }

// ── State ───────────────────────────────────────────────────────────────────

/** The story part of the state: what `scene(id)` returns. */
export type Snapshot = {
  scene: SceneId
  storyTime: string
  modules: Module[]
  workflows: Workflow[]
  runs: Run[]
  memory: MemoryTable[]
  proposals: Proposal[]
  conversations: Conversation[]
  topics: Topic[]
  accounts: Account[]
  modeSettings: ModeSetting[]
  /** Changes made since a module's last run; its next run reports them, then they are gone. */
  pendingChanges: Record<string, ChangeSet>
  /** Modules the user removed, with the place each had, so the removal can be undone. */
  removedModules: Array<{ module: Module; index: number }>
  /** The source of new ids — a counter, so the same actions give the same ids. */
  seq: number
}

/** A scene's snapshot plus the user's actions since the jump, and what belongs to the session. */
export type RuntimeState = Snapshot & {
  /** Goes up at every scene jump: a read made before the jump is not the answer after it. */
  epoch: number
  preview: PreviewId
  onboarded: boolean
  /** Per module, the pinned blocks by `key` and the position each keeps (D-12). */
  pins: Record<string, Record<string, number>>
}

// ── Story templates and scripts (held in `src/fixtures/`, never in the state) ─

/** The view of a module the chat bar is used on. */
export type ModuleView = 'page' | 'workflow' | 'memory' | 'child'

/** Where a message is sent from. */
export type ChatContext = { moduleId?: string; view?: ModuleView }

/** What a sub-module is built from when a scripted conversation becomes persistent. */
export type SubModuleTemplate = {
  /** The last segment of the new id: `<parent>.sub.<slug>`. */
  slug: string
  name: Text
  description: Text
  icon: ModuleIcon
  /** Why version 1 exists, in words. */
  reason: Text
  /** `19:00`: the time of day of its first scheduled run. */
  nextRunTime?: string
  /** Accounts its workflow draws on. */
  accounts: string[]
  /** Tables of other modules it reads. */
  reads: string[]
  build: (context: { moduleId: string; parentId: string; at: string }) => {
    nodes: WfNode[]
    edges: WfEdge[]
    tables: MemoryTable[]
  }
}

export type ProposalSeed = Omit<Proposal, 'id' | 'at' | 'conversationId' | 'applied'>

/** One scripted exchange: what she says, where the answer appears and what it carries. */
export type ChatScript = {
  id: string
  /** The scenes in which the prompt is offered and answered. */
  scenes: readonly SceneId[]
  prompt: Text
  /** `in-place`: the panel above the bar. `thread`: a dedicated chat is opened. */
  surface: 'in-place' | 'thread'
  topic: { id: string; title: Text; summary: Text; moduleIds: string[] }
  /** The conversation's title in lists. */
  title: Text
  /** The sub-module template this conversation becomes when made persistent. */
  template?: string
  /** Narrows where it applies — the workflow editor of one module, say. */
  where?: (state: Snapshot, context: ChatContext) => boolean
  reply: Text
  attachments?: (state: Snapshot) => MessageAttachment[]
  proposal?: (state: Snapshot, context: ChatContext) => ProposalSeed | null
}
