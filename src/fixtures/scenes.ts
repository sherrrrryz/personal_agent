import type { SceneHalf, SceneId, Snapshot } from '@/runtime/model'
import { createSubModule, finishRun, replayScript, resolveProposalPart, startRun, updateMemory } from '@/runtime/reduce'
import { findModule, tableOf } from '@/runtime/selectors'
import { tx, type Text } from '@/runtime/text'
import { addDays, datePart, nextAt } from '@/runtime/time'

import { row } from './build'
import { appointmentStatus, column, moduleId, tableId } from './keys'
import { scriptId } from './scripts'
import { booking, ownerOf, world } from './world'

// The scenes of the story (spec part 2 § Fake workflow runtime, "Scenes").
// Each is built from the one before by the runtime's own reducers plus what
// time brought, so a scene's key action, done live, lands on the next scene's
// state: accepting the proposal in `s0` yields `s1`.
//
// To add a scene (S6b: `s2`…`s5`): write `(draft: Snapshot) => void` that
// mutates the previous scene's snapshot — call reducers for what she did,
// `updateMemory` or direct edits for what time brought — set `draft.storyTime`,
// and put it in `steps` below. `s3` and `s4` have a second step in `resolved`
// that takes the pending half to the resolved one.

/** What the 时间推进 menu calls each scene. */
export const sceneNames: Record<SceneId, Text> = {
  e1: tx('第一晚', 'First evening'),
  e2: tx('第二晚', 'Second evening'),
  s0: tx('今天', 'Today'),
  s1: tx('变成工作流', 'It becomes a workflow'),
  s2: tx('第 1–2 周', 'Weeks 1–2'),
  s3: tx('第 3 周', 'Week 3'),
  s4: tx('第 2 个月', 'Month 2'),
  s5: tx('回看', 'Looking back'),
}

export const sceneGroupNames = { warmup: tx('热身', 'Warm-up'), main: tx('主线', 'Main story') }

const a = column.appointments

/** Bookings that started before `date` are over. */
function closeBookingsBefore(draft: Snapshot, date: string): void {
  for (const each of tableOf(draft, tableId.appointments)?.rows ?? []) {
    if (String(each.cells[a.start]) < date) each.cells[a.status] = appointmentStatus.done
  }
}

/** A scheduled run that happened at `at`, reporting what is pending for the module. */
function ranAt(draft: Snapshot, module: string, at: string): void {
  const now = draft.storyTime
  draft.storyTime = at
  const run = startRun(draft, { moduleId: module, trigger: 'schedule' })
  if (run) finishRun(draft, run)
  draft.storyTime = now
}

function notice(draft: Snapshot, id: string, text: Text, source: string): void {
  updateMemory(draft, [{ tableId: tableId.notices, rowId: id, cells: { text, source, at: draft.storyTime }, insert: true }])
}

/** `e2` 第二晚 — she made the confirmations persistent; tonight it ran for the first time. */
function secondEvening(draft: Snapshot): void {
  const conversation = replayScript(draft, scriptId.confirmations, { moduleId: moduleId.appointments, view: 'page' })
  // She turned the switch on that conversation: 设为长期.
  createSubModule(draft, { parentId: moduleId.appointments, conversationId: conversation })

  draft.storyTime = '2026-11-03T19:05'
  const today = datePart(draft.storyTime)
  const tomorrow = addDays(today, 1)
  closeBookingsBefore(draft, tomorrow)
  const bookings = [booking('maiya', tomorrow, '10:00', 'chen'), booking('naicha', tomorrow, '13:30', 'jie'), booking('lucky', tomorrow, '15:30', 'lan')]
  tableOf(draft, tableId.appointments)?.rows.push(...bookings)

  const sentAt = `${today}T19:00`
  const statuses = ['replied', 'no-reply', 'no-reply']
  updateMemory(
    draft,
    bookings.map((each, index) => ({
      tableId: tableId.confirmations,
      rowId: `confirm-${each.id}`,
      insert: true,
      cells: { customer: ownerOf(String(each.cells[a.dog])), dog: each.cells[a.dog], appointment: each.id, status: statuses[index], sentAt },
    })),
  )
  draft.pendingChanges[moduleId.confirmations] = {
    blocks: { customers: Object.fromEntries(bookings.map((each) => [`confirm-${each.id}`, 'new' as const])) },
  }
  ranAt(draft, moduleId.confirmations, sentAt)
  const confirmations = findModule(draft, moduleId.confirmations)
  if (confirmations) confirmations.nextRunAt = nextAt(draft.storyTime, '19:00')

  // 无回复则提醒我 is deferred: one item per customer who has not answered.
  for (const each of bookings.slice(1)) {
    const dog = String(each.cells[a.dog])
    const owner = ownerOf(dog)
    const name = tableOf(draft, tableId.dogs)?.rows.find((candidate) => candidate.id === dog)?.cells[column.dogs.name] as Text
    draft.proposals.push({
      id: `proposal-no-reply-${dog}`,
      moduleId: moduleId.confirmations,
      mode: 'deferred',
      title: tx(`${owner['zh-CN']}还没有回复明天的预约确认`, `${owner.en} has not answered tomorrow’s confirmation`),
      parts: [
        {
          id: 'remind',
          text: tx(
            `明早 9 点再提醒${owner['zh-CN']}一次（${name['zh-CN']}，明天 ${String(each.cells[a.start]).slice(11)}）？`,
            `Remind ${owner.en} again at 9 tomorrow morning (${name.en}, tomorrow ${String(each.cells[a.start]).slice(11)})?`,
          ),
          state: 'pending',
        },
      ],
      onAccept: {
        action: 'updateMemory',
        input: { patches: [{ tableId: tableId.confirmations, rowId: `confirm-${each.id}`, cells: { status: 'reminded' } }] },
      },
      at: `${today}T21:00`,
    })
  }
  notice(draft, 'notice-confirmations', tx('预约确认已发出 3 条，2 位顾客还没回复。', 'Three confirmations sent; two customers have not answered.'), moduleId.confirmations)
}

/** `s0` 今天 — Thursday morning; 可乐 is booked for the default two hours. */
function today(draft: Snapshot): void {
  for (const proposal of [...draft.proposals]) {
    for (const part of proposal.parts) resolveProposalPart(draft, { proposalId: proposal.id, partId: part.id, resolution: 'accepted' })
  }
  draft.storyTime = '2026-11-05T10:00'
  const day = datePart(draft.storyTime)
  closeBookingsBefore(draft, day)
  const bookings = [
    booking('doudou', day, '10:00', 'lan'),
    booking('kele', day, '14:00', 'chen'),
    booking('dafu', addDays(day, 1), '10:00', 'jie'),
    booking('xueqiu', addDays(day, 2), '10:00', 'lan'),
    booking('max', addDays(day, 2), '13:00', 'chen'),
  ]
  const appointments = tableOf(draft, tableId.appointments)
  appointments?.rows.push(...bookings)

  // Last night's run confirmed today's two bookings; both customers answered.
  const confirmations = tableOf(draft, tableId.confirmations)
  const sentAt = `${addDays(day, -1)}T19:00`
  if (confirmations) {
    confirmations.rows = bookings.slice(0, 2).map((each) =>
      row(`confirm-${each.id}`, { customer: ownerOf(String(each.cells[a.dog])), dog: each.cells[a.dog], appointment: each.id, status: 'replied', sentAt }),
    )
    confirmations.updatedAt = sentAt
  }
  ranAt(draft, moduleId.confirmations, sentAt)
  ranAt(draft, moduleId.appointments, `${day}T08:00`)
  for (const id of [moduleId.confirmations, moduleId.appointments]) {
    const module = findModule(draft, id)
    if (module?.nextRunAt) module.nextRunAt = nextAt(draft.storyTime, module.nextRunAt.slice(11))
  }
  notice(draft, 'notice-kele', tx('可乐（阿拉斯加）今天 14:00 的预约按默认 2 小时安排。', 'Kele (Alaskan Malamute) is booked today at 14:00 for the default 2 hours.'), moduleId.appointments)
}

/** `s1` 变成工作流 — she accepted: 服务时长 exists and every open booking is on its breed's row. */
function becomesWorkflow(draft: Snapshot): void {
  replayScript(draft, scriptId.hero, { moduleId: moduleId.appointments, view: 'page' })
  const proposal = draft.proposals.at(-1)
  if (proposal) resolveProposalPart(draft, { proposalId: proposal.id, partId: proposal.parts[0].id, resolution: 'accepted' })
  draft.storyTime = '2026-11-05T10:05'
  // 设置预约时长 is autonomous: the bookings have already been rewritten.
  const run = startRun(draft, { moduleId: moduleId.appointments, trigger: 'module' })
  if (run) finishRun(draft, run)
}

/** Until S6b writes it, a later scene is the one before it at a later time. */
const later = (storyTime: string) => (draft: Snapshot) => {
  draft.storyTime = storyTime
}

type Step = (draft: Snapshot) => void

/** What turns each scene's predecessor into it; `e1` starts from `world()`. */
const steps: Record<SceneId, Step> = {
  e1: () => {},
  e2: secondEvening,
  s0: today,
  s1: becomesWorkflow,
  s2: later('2026-11-19T10:00'),
  s3: later('2026-11-23T09:05'),
  s4: later('2027-01-04T09:05'),
  s5: later('2027-01-06T10:00'),
}

/** What her key action does in the scenes that have two halves: pending → resolved. */
const resolved: Partial<Record<SceneId, Step>> = {
  s3: () => {},
  s4: () => {},
}

const order = Object.keys(steps) as SceneId[]
const built = new Map<string, Snapshot>()

function build(id: SceneId, half: SceneHalf): Snapshot {
  const key = `${id}:${half}`
  const cached = built.get(key)
  if (cached) return cached
  let draft: Snapshot
  if (half === 'resolved' && resolved[id]) {
    draft = structuredClone(build(id, 'pending'))
    resolved[id](draft)
  } else {
    const index = order.indexOf(id)
    // A scene follows the resolved half of the one before it.
    draft = index === 0 ? world() : structuredClone(build(order[index - 1], 'resolved'))
    steps[id](draft)
    draft.scene = id
  }
  built.set(key, draft)
  return draft
}

/**
 * The snapshot of a scene — the same on every call, and a copy the caller may
 * change. `half` matters for `s3` and `s4` only.
 */
export function scene(id: SceneId, half: SceneHalf = 'pending'): Snapshot {
  return structuredClone(build(id, half))
}
