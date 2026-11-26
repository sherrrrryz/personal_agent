import type { Conversation, FailureReason, MemoryRow, Message, Proposal, Snapshot } from '@/runtime/model'
import { addModule } from '@/runtime/reduce'
import { isText, tx, type Text } from '@/runtime/text'

import { wf } from './build'
import { accountId, moduleId } from './keys'
import { stubWorkflow } from './templates'

// What 状态预览 shows (spec part 2 § Fake workflow runtime, "Async facade and
// the preview"): the long and the empty variant of the state, and the reason
// each resource fails with when 出错 is forced. The facade applies these; a
// screen never calls them.
//
// S6b: the variants below are generic — they stretch or empty whatever the
// scene holds. Replace or extend them where part 3's Screens table names a
// number the generic rule misses; keep the two signatures.

/** How many of each thing the long variant holds. */
export const longSizes = {
  professionModules: 12,
  rows: 40,
  runs: 30,
  proposalParts: 5,
  conversations: 20,
  messages: 60,
  messageCharacters: 2000,
  topics: 40,
  workflowNodes: 25,
  accountFeeds: 8,
} as const

const longPhrase = tx(
  '这是一段特意写得很长的内容，用来检查文字在窄屏幕和大字号下会不会被截断或者溢出',
  'This text is long on purpose, to check that nothing is clipped or spills over on a narrow screen at a large text size',
)

/** A long text of about `characters` characters in each locale. */
export function longText(characters: number = longPhrase.en.length): Text {
  const stretch = (phrase: string, joiner: string) =>
    (phrase + joiner).repeat(Math.ceil(characters / (phrase.length + joiner.length))).slice(0, characters)
  return tx(stretch(longPhrase['zh-CN'], '；'), stretch(longPhrase.en, '; '))
}

const longer = (text: Text): Text => tx(`${text['zh-CN']}——${longPhrase['zh-CN']}`, `${text.en} — ${longPhrase.en}`)

/** `items` repeated up to `size`; a copy gets a new id through `clone`. */
function padTo<Item>(items: Item[], size: number, clone: (item: Item, n: number) => Item): Item[] {
  if (items.length === 0) return items
  const padded = [...items]
  for (let n = 1; padded.length < size; n++) padded.push(clone(structuredClone(items[(n - 1) % items.length]), n))
  return padded
}

/** 超长内容: every list at the length that strains its screen, with one long text in each. */
export function longVariant<State extends Snapshot>(state: State): State {
  const draft = structuredClone(state)

  const profession = () => draft.modules.filter((module) => module.kind === 'profession').length
  while (profession() < longSizes.professionModules) {
    addModule(draft, { name: longer(tx('自定义模块', 'Custom module')), description: longText() })
  }

  for (const table of draft.memory) {
    const text = table.columns.find((column) => column.type === 'text')
    table.rows = padTo<MemoryRow>(table.rows, longSizes.rows, (row, n) => ({ ...row, id: `${row.id}~${n}` }))
    const first = table.rows[0]
    if (text && first && isText(first.cells[text.id])) first.cells[text.id] = longer(first.cells[text.id] as Text)
  }

  for (const module of draft.modules) {
    const runs = draft.runs.filter((run) => run.moduleId === module.id)
    const padded = padTo(runs, longSizes.runs, (run, n) => ({ ...run, id: `${run.id}~${n}` }))
    draft.runs.push(...padded.slice(runs.length))
  }

  const fiveParts: Proposal = {
    id: 'proposal-long',
    moduleId: moduleId.shifts,
    mode: 'deferred',
    title: longer(tx('调整下周的排班', 'Change next week’s rota')),
    parts: Array.from({ length: longSizes.proposalParts }, (_, index) => ({
      id: `part-${index + 1}`,
      text: longer(tx(`第 ${index + 1} 项调整`, `Change ${index + 1}`)),
      state: 'pending' as const,
    })),
    onAccept: { action: 'none' },
    at: draft.storyTime,
  }
  draft.proposals.push(fiveParts)

  draft.topics = padTo(draft.topics, longSizes.topics, (topic, n) => ({ ...topic, id: `${topic.id}~${n}`, title: longer(topic.title) }))
  draft.conversations = padTo(draft.conversations, longSizes.conversations, (conversation, n) => ({
    ...conversation,
    id: `${conversation.id}~${n}`,
    title: longer(conversation.title),
  }))
  for (const conversation of draft.conversations) {
    conversation.messages = padTo(conversation.messages, longSizes.messages, (message, n) => ({ ...message, id: `${message.id}~${n}`, attachments: undefined }))
    const last = conversation.messages.at(-1)
    if (last) last.text = longText(longSizes.messageCharacters)
  }

  for (const workflow of draft.workflows) {
    const version = workflow.versions.find((each) => each.n === workflow.current)
    if (!version) continue
    for (let n = 1; version.nodes.length < longSizes.workflowNodes; n++) {
      const previous = version.nodes[version.nodes.length - 1]
      const step = wf.step(`long-${n}`, longer(tx(`补充步骤 ${n}`, `Extra step ${n}`)), { detail: longText() })
      version.nodes.push(step)
      version.edges.push({ id: `${previous.id}>${step.id}`, from: previous.id, to: step.id })
    }
  }

  const wechat = draft.accounts.find((account) => account.id === accountId.wechat)
  for (const module of draft.modules) {
    if (wechat && wechat.feeds.length < longSizes.accountFeeds && !wechat.feeds.includes(module.id)) wechat.feeds.push(module.id)
  }
  return draft
}

/**
 * 空: a workspace with nothing in it yet — no rows, runs, proposals,
 * conversations or topics, no account connected, no ceiling set, every
 * workflow the placeholder. The modules stay, so every address still opens;
 * the facade's `modules` resource is what answers with an empty set.
 */
export function emptyVariant<State extends Snapshot>(state: State): State {
  const draft = structuredClone(state)
  for (const table of draft.memory) table.rows = []
  draft.runs = []
  draft.proposals = []
  draft.conversations = []
  draft.topics = []
  draft.pendingChanges = {}
  for (const account of draft.accounts) account.status = 'disconnected'
  for (const setting of draft.modeSettings) setting.ceiling = null
  for (const module of draft.modules) delete module.nextRunAt
  for (const workflow of draft.workflows) {
    const stub = stubWorkflow()
    workflow.versions = [{ n: 1, at: draft.storyTime, author: 'ai', reason: stub.reason, nodes: stub.nodes, edges: stub.edges }]
    workflow.current = 1
    delete workflow.proposed
  }
  return draft
}

/**
 * 空 for one conversation asked for by id: a thread that has just begun — her
 * opening message and the AI still answering (正在回答). The empty variant of
 * the state has no conversations at all, so this one is shaped on its own.
 */
export function emptyThread(conversation: Conversation): Conversation {
  const opening = conversation.messages.find((message) => message.author === 'user')
  const answering: Message = { id: `${conversation.id}-answering`, author: 'ai', text: tx('', ''), at: conversation.startedAt, status: 'streaming' }
  return { ...conversation, messages: opening ? [opening, answering] : [answering] }
}

/** What is left when one module's output cannot be read: everything that does not come from it. */
export function withoutSource<State extends Snapshot>(state: State, failed: string): State {
  const from = (id: string | undefined) => id === failed || (id?.startsWith(`${failed}.`) ?? false)
  const draft = structuredClone(state)
  draft.proposals = draft.proposals.filter((proposal) => !from(proposal.moduleId))
  draft.memory = draft.memory.filter((table) => !from(table.ownerModuleId))
  for (const table of draft.memory) {
    const source = table.columns.filter((column) => column.type === 'module')
    table.rows = table.rows.filter((row) => !source.some((column) => from(String(row.cells[column.id]))))
  }
  return draft
}

/** What is left when a summary cannot be generated: the records, with no summary. */
export function withoutSummaries<State extends Snapshot>(state: State): State {
  const draft = structuredClone(state)
  for (const topic of draft.topics) {
    topic.summary = null
    delete topic.summaryAt
  }
  return draft
}

/**
 * What an answer keeps when it fails: `nothing`; `stale` — the last good data,
 * marked as such; `partial` — what the other sources still give.
 */
export type PreviewError = { reason: FailureReason; keeps: 'nothing' | 'stale' | 'partial' }

const unreachable: PreviewError = { reason: { code: 'platform-unreachable' }, keeps: 'nothing' }

/** The reason each module's page and run fail with under 出错. */
const moduleErrors: Record<string, PreviewError> = {
  [moduleId.notifications]: { reason: { code: 'source-failed', moduleId: moduleId.shifts }, keeps: 'partial' },
  [moduleId.messages]: { reason: { code: 'account-expired', account: accountId.wechat }, keeps: 'nothing' },
  [moduleId.calendar]: { reason: { code: 'account-expired', account: accountId.calendar }, keeps: 'nothing' },
  [moduleId.todo]: { reason: { code: 'account-missing', account: accountId.slack }, keeps: 'nothing' },
  [moduleId.mail]: { reason: { code: 'account-missing', account: accountId.google }, keeps: 'nothing' },
  [moduleId.files]: { reason: { code: 'account-missing', account: accountId.google }, keeps: 'nothing' },
  [moduleId.appointments]: { reason: { code: 'platform-unreachable' }, keeps: 'stale' },
  [moduleId.clients]: { reason: { code: 'platform-unreachable' }, keeps: 'stale' },
  [moduleId.inventory]: { reason: { code: 'account-missing', account: accountId.payments }, keeps: 'nothing' },
  [moduleId.shifts]: { reason: { code: 'source-failed', moduleId: moduleId.appointments }, keeps: 'partial' },
  [moduleId.confirmations]: { reason: { code: 'account-expired', account: accountId.wechat }, keeps: 'nothing' },
  [moduleId.duration]: { reason: { code: 'source-failed', moduleId: moduleId.clients }, keeps: 'partial' },
}

/** A module with no entry above — one she added, or a promoted one under its new id. */
const otherModule: PreviewError = { reason: { code: 'platform-unreachable' }, keeps: 'stale' }

/**
 * The fixed failure of every resource under 出错, by the facade's resource
 * kinds. `module` and `runs` depend on the module; the rest do not.
 */
export const previewErrors = {
  modules: { reason: { code: 'platform-unreachable' }, keeps: 'stale' },
  module: (id: string) => moduleErrors[id] ?? otherModule,
  workflow: unreachable,
  memory: unreachable,
  runs: (id: string) => ({ reason: (moduleErrors[id] ?? otherModule).reason, keeps: 'nothing' }),
  proposals: { reason: { code: 'source-failed', moduleId: moduleId.shifts }, keeps: 'partial' },
  conversations: unreachable,
  conversation: unreachable,
  topics: unreachable,
  topic: { reason: { code: 'generation-failed' }, keeps: 'partial' },
  accounts: unreachable,
  'mode-settings': unreachable,
} as const satisfies Record<string, PreviewError | ((id: string) => PreviewError)>
