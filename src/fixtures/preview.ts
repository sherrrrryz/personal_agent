import type { Conversation, FailureReason, MemoryRow, Message, Proposal, Snapshot, TaskKind } from '@/runtime/model'
import { addModule, replayScript } from '@/runtime/reduce'
import { actionsOfKind } from '@/runtime/selectors'
import { isText, tx, type Text } from '@/runtime/text'
import { addDays, datePart } from '@/runtime/time'

import { wf } from './build'
import { accountId, column, moduleId, tableId } from './keys'
import { interviewMessages } from './onboarding'
import { chatScripts } from './scripts'
import { stubWorkflow } from './templates'
import { staff } from './vocabulary'

// What 状态预览 shows (spec part 2 § Fake workflow runtime, "Async facade and
// the preview"): the long and the empty variant of the state, and the reason
// each resource fails with when 出错 is forced. The facade applies these; a
// screen never calls them.
//
// The long variant stretches whatever the scene holds to the sizes part 3's
// Screens table names (`longSizes`); the empty one empties it. Both are
// state → state, so every scene has both.

/** How many of each thing the long variant holds — the numbers of part 3's Screens table. */
export const longSizes = {
  /** `onboarding.modules`, `settings.profession`: 12 modules. */
  professionModules: 12,
  /** The memory view: 40 rows scroll inside the table. Every table without its own number below. */
  rows: 40,
  /** `notifications`: 30 items. */
  notices: 30,
  /** `profession.inventory`: 30 rows. */
  products: 30,
  /** 预约确认: 20 customers. */
  customers: 20,
  /** `profession.appointments`: 14 bookings a day. */
  bookingsPerDay: 14,
  /** `calendar`: six overlapping bookings stack. */
  overlappingBookings: 6,
  /** The pet file: 30 visits (so 服务时长's home has its 30 rows too). */
  visitsPerDog: 30,
  /** The pet file: a 300-character note. */
  noteCharacters: 300,
  /** `messages`: a 200-character message. */
  customerMessageCharacters: 200,
  runs: 30,
  /** `notifications`: a five-part proposal. */
  proposalParts: 5,
  /** `topics.<topic>`: 20 conversations — in every topic she has talked in. */
  conversations: 20,
  /** …and a 60-message record. */
  messages: 60,
  messageCharacters: 2000,
  /** `topics`: 40 topics. */
  topics: 40,
  /** The workflow editor: a 25-node workflow. */
  workflowNodes: 25,
  /** `settings.accounts`: a connector feeding eight modules. */
  accountFeeds: 8,
  /** `settings.ai-modes`: a row capping 12 actions (`cappedTaskKind`). */
  cappedActions: 12,
  /** `onboarding.profession`: a 40-message interview. */
  interviewMessages: 40,
} as const

/** The kind of task whose row in `settings.ai-modes` caps `longSizes.cappedActions` actions. */
export const cappedTaskKind: TaskKind = 'change-rules'

/** The start times of the long day: the second to the seventh all cover 11:00–12:00. */
const longDay = ['09:30', '10:00', '10:00', '10:00', '10:30', '10:30', '11:00', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30', '16:00'] as const

const longPhrase = tx(
  '这是一段特意写得很长的内容，用来检查文字在窄屏幕和大字号下会不会被截断或者溢出',
  'This text is long on purpose, to check that nothing is clipped or spills over on a narrow screen at a large text size',
)

/** A long text of exactly `characters` characters in each locale. */
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

const rowSizes: Record<string, number> = {
  [tableId.notices]: longSizes.notices,
  [tableId.products]: longSizes.products,
  [tableId.confirmations]: longSizes.customers,
}

/** 14 bookings today, six of them at once; nothing else on that day. */
function longDayOf(draft: Snapshot): void {
  const appointments = draft.memory.find((table) => table.id === tableId.appointments)
  if (!appointments) return
  const a = column.appointments
  const today = datePart(draft.storyTime)
  const groomers = Object.keys(staff)
  let placed = 0
  for (const row of appointments.rows) {
    const start = row.cells[a.start]
    if (typeof start !== 'string') continue
    if (placed < longDay.length) {
      row.cells[a.start] = `${today}T${longDay[placed]}`
      row.cells[a.groomer] = groomers[placed % groomers.length]
      placed++
    } else if (start.startsWith(today)) {
      row.cells[a.start] = `${addDays(today, 1)}${start.slice(10)}`
    }
  }
}

/** The first dog's file: long names, a 300-character note, 30 visits. */
function longPetFile(draft: Snapshot): void {
  const dog = draft.memory.find((table) => table.id === tableId.dogs)?.rows[0]
  const visits = draft.memory.find((table) => table.id === tableId.visits)
  if (!dog) return
  const d = column.dogs
  if (isText(dog.cells[d.owner])) dog.cells[d.owner] = longer(dog.cells[d.owner] as Text)
  dog.cells[d.note] = longText(longSizes.noteCharacters)
  if (!visits) return
  const v = column.visits
  const today = datePart(draft.storyTime)
  const own = visits.rows.filter((row) => row.cells[v.dog] === dog.id)
  const seed: MemoryRow[] = own.length > 0 ? own : [{ id: 'visit-long', cells: { [v.dog]: dog.id, [v.date]: today, [v.estimate]: 240, [v.actual]: 200, [v.groomer]: 'lan' } }]
  const thirty = padTo(seed, longSizes.visitsPerDog, (row, n) => ({ id: `${row.id}~v${n}`, cells: { ...row.cells, [v.date]: addDays(today, -7 * n) } }))
  visits.rows = [...thirty.slice(0, longSizes.visitsPerDog), ...visits.rows.filter((row) => row.cells[v.dog] !== dog.id)]
}

/** 20 conversations in every topic she has talked in, 40 topics, each record 60 messages long. */
function longTopics(draft: Snapshot): void {
  if (draft.conversations.length === 0) replayScript(draft, chatScripts[0].id, { moduleId: moduleId.appointments, view: 'page' })
  draft.conversations = draft.topics.flatMap((topic) =>
    padTo(
      draft.conversations.filter((conversation) => conversation.topicId === topic.id),
      longSizes.conversations,
      (conversation, n) => ({ ...conversation, id: `${conversation.id}~${n}`, title: longer(conversation.title) }),
    ),
  )
  for (const conversation of draft.conversations) {
    conversation.messages = padTo(conversation.messages, longSizes.messages, (message, n) => ({ ...message, id: `${message.id}~${n}`, attachments: undefined }))
    const last = conversation.messages.at(-1)
    if (last) last.text = longText(longSizes.messageCharacters)
  }
  // A topic always has a conversation: each added topic gets a copy of the first one's.
  const records = [...draft.conversations]
  draft.topics = padTo(draft.topics, longSizes.topics, (topic, n) => {
    const id = `${topic.id}~${n}`
    const record = records.find((conversation) => conversation.topicId === topic.id)
    if (record) draft.conversations.push({ ...structuredClone(record), id: `${record.id}~t${n}`, topicId: id })
    return { ...topic, id, title: longer(topic.title) }
  })
}

/** 超长内容: every list at the length that strains its screen, with one long text in each. */
export function longVariant<State extends Snapshot>(state: State): State {
  const draft = structuredClone(state)

  const profession = () => draft.modules.filter((module) => module.kind === 'profession').length
  while (profession() < longSizes.professionModules) {
    addModule(draft, { name: longer(tx('自定义功能', 'Custom feature')), description: longText() })
  }

  for (const table of draft.memory) {
    const text = table.columns.find((column) => column.type === 'text')
    table.rows = padTo<MemoryRow>(table.rows, rowSizes[table.id] ?? longSizes.rows, (row, n) => ({ ...row, id: `${row.id}~${n}` }))
    const first = table.rows[0]
    if (text && first && isText(first.cells[text.id])) first.cells[text.id] = longer(first.cells[text.id] as Text)
  }
  longDayOf(draft)
  longPetFile(draft)
  const message = draft.memory.find((table) => table.id === tableId.messages)?.rows[0]
  if (message) message.cells.text = longText(longSizes.customerMessageCharacters)

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

  longTopics(draft)

  let capped = actionsOfKind(draft, cappedTaskKind).length
  for (const workflow of draft.workflows) {
    const version = workflow.versions.find((each) => each.n === workflow.current)
    if (!version) continue
    for (let n = 1; version.nodes.length < longSizes.workflowNodes; n++) {
      const previous = version.nodes[version.nodes.length - 1]
      const live = draft.modules.some((module) => module.id === workflow.moduleId && !module.archived)
      // One of the added steps is an action of the capped kind, until its row in `settings.ai-modes` caps twelve.
      const step =
        n === 1 && live && capped < longSizes.cappedActions
          ? wf.action(`long-${n}`, longer(tx(`补充的规则修改 ${++capped}`, `Extra rule change ${capped}`)), 'autonomous', cappedTaskKind)
          : wf.step(`long-${n}`, longer(tx(`补充步骤 ${n}`, `Extra step ${n}`)), { detail: longText() })
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

/** `onboarding.profession` under 超长内容: the interview stretched to 40 messages, the summary last. */
export function longInterview(): Message[] {
  const all = interviewMessages()
  const exchanges = all.slice(0, -1)
  const padded = padTo(exchanges, longSizes.interviewMessages - 1, (message, n) => ({ ...message, id: `${message.id}~${n}` }))
  return [...padded, all[all.length - 1]]
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
