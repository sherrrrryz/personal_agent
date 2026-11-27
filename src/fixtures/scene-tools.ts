import type { CellValue, MemoryRow, Snapshot, TriggerKind } from '@/runtime/model'
import { applyEstimates, finishRun, markChange, recordActualDuration, resolveProposalPart, startRun, updateMemory } from '@/runtime/reduce'
import { latestRun, rowOf, tableOf, versionOf, workflowOf } from '@/runtime/selectors'
import type { Text } from '@/runtime/text'
import { addDays, addMinutes, datePart, lastAt, lastWeekdayAt, mondayOf, nextAt, nextWeekdayAt } from '@/runtime/time'

import { row } from './build'
import { appointmentStatus, blockKey, column, moduleId, tableId } from './keys'
import { staff } from './vocabulary'
import { ownerOf, requested } from './world'

// What the scene builders (`scenes.ts`, `story.ts`) share: the small things
// time brings — a booking is made, a visit is timed, the nightly runs happen.
// Everything here mutates the draft it is given, like the runtime's reducers.

const a = column.appointments

/** Bookings that started before `date` are over (untimed — before 服务时长 existed). */
export function closeBookingsBefore(draft: Snapshot, date: string): void {
  for (const each of tableOf(draft, tableId.appointments)?.rows ?? []) {
    const start = each.cells[a.start]
    if (typeof start === 'string' && start < date && each.cells[a.status] !== appointmentStatus.requested) each.cells[a.status] = appointmentStatus.done
  }
}

/** A run that happened at `at`, reporting what is pending for the module. */
export function ranAt(draft: Snapshot, module: string, at: string, trigger: TriggerKind = 'schedule'): void {
  const now = draft.storyTime
  draft.storyTime = at
  const run = startRun(draft, { moduleId: module, trigger })
  if (run) finishRun(draft, run)
  draft.storyTime = now
}

/** One more important item in 通知. */
export function notice(draft: Snapshot, id: string, text: Text, source: string): void {
  updateMemory(draft, [{ tableId: tableId.notices, rowId: id, cells: { text, source, at: draft.storyTime }, insert: true }])
}

/**
 * The important items as the notifications workflow ranks them now: the old ones give way.
 * An item that only announces a proposal names it (`proposal`): 通知 drops the line once she has decided.
 */
export function setNotices(draft: Snapshot, items: Array<[id: string, text: Text, source: string, at?: string, proposal?: string]>): void {
  const notices = tableOf(draft, tableId.notices)
  if (!notices) return
  notices.rows = items.map(([id, text, source, at, proposal]) => row(id, { text, source, at: at ?? draft.storyTime, ...(proposal ? { proposal } : {}) }))
  notices.updatedAt = draft.storyTime
}

/** A customer wrote; what came before has been read. */
export function customerWrote(draft: Snapshot, id: string, dog: string, text: Text, module: string, at: string): void {
  const messages = tableOf(draft, tableId.messages)
  if (!messages) return
  for (const each of messages.rows) each.cells.unread = false
  messages.rows.unshift(row(id, { from: ownerOf(dog), channel: 'wechat', text, module, at, unread: true }))
  messages.updatedAt = at
}

/** New bookings enter the schedule and are estimated by whatever rule is in force. */
export function book(draft: Snapshot, ...bookings: MemoryRow[]): void {
  const appointments = tableOf(draft, tableId.appointments)
  if (!appointments) return
  appointments.rows.push(...bookings)
  for (const each of bookings) {
    const block = each.cells[a.status] === appointmentStatus.requested ? blockKey.appointments.unplaced : blockKey.appointments.schedule
    markChange(draft, appointments.ownerModuleId, block, each.id, 'new')
  }
  applyEstimates(draft)
}

/** 待安排 holds this dog's request and no other; `null` clears it. */
export function request(draft: Snapshot, dog: string | null): void {
  const appointments = tableOf(draft, tableId.appointments)
  if (!appointments) return
  appointments.rows = appointments.rows.filter((each) => each.cells[a.status] !== appointmentStatus.requested)
  if (dog) book(draft, requested(dog))
}

/**
 * A visit ends: story time moves to its end, the groomer's 完成 records the
 * time taken, and 服务时长 runs and rewrites its page.
 */
export function finish(draft: Snapshot, appointmentId: string, minutes: number): void {
  const appointment = rowOf(tableOf(draft, tableId.appointments), appointmentId)
  if (!appointment) throw new Error(`No booking "${appointmentId}"`)
  const end = addMinutes(String(appointment.cells[a.start]), minutes)
  if (end > draft.storyTime) draft.storyTime = end
  recordActualDuration(draft, { appointmentId, minutes })
  const duration = tableOf(draft, tableId.breeds)?.ownerModuleId
  if (duration) ranAt(draft, duration, draft.storyTime, 'module')
}

/** 每周一复盘 at 18:00 on `monday`; story time moves there. */
export function review(draft: Snapshot, monday: string): void {
  const at = `${monday}T18:00`
  if (at > draft.storyTime) draft.storyTime = at
  ranAt(draft, moduleId.duration, at)
}

/** She said yes to everything still open — or, with `only`, to the proposals it picks. */
export function acceptOpen(draft: Snapshot, only?: (proposal: Snapshot['proposals'][number]) => boolean): void {
  for (const proposal of [...draft.proposals]) {
    if (only && !only(proposal)) continue
    for (const part of proposal.parts) resolveProposalPart(draft, { proposalId: proposal.id, partId: part.id, resolution: 'accepted' })
  }
}

/**
 * 预约确认 as its last 19:00 run left it: one row per customer booked for the
 * day after. `open` names the dogs whose owners have not answered (`sent`
 * within two hours of the run, `no-reply` after).
 */
export function confirmNextDay(draft: Snapshot, open: string[] = []): void {
  const confirmations = tableOf(draft, tableId.confirmations)
  const appointments = tableOf(draft, tableId.appointments)
  if (!confirmations || !appointments) return
  const sentAt = lastAt(draft.storyTime, '19:00')
  const day = addDays(datePart(sentAt), 1)
  const waiting = addMinutes(sentAt, 120) > draft.storyTime ? 'sent' : 'no-reply'
  const rows = appointments.rows
    .filter((each) => String(each.cells[a.start]).startsWith(day) && each.cells[a.status] !== appointmentStatus.requested)
    .map((each) => {
      const dog = String(each.cells[a.dog])
      const cells: Record<string, CellValue> = { customer: ownerOf(dog), dog, appointment: each.id, status: open.includes(dog) ? waiting : 'replied', sentAt }
      return row(`confirm-${each.id}`, cells)
    })
  confirmations.rows = rows
  confirmations.updatedAt = sentAt
  draft.pendingChanges[confirmations.ownerModuleId] = { blocks: { customers: Object.fromEntries(rows.map((each) => [each.id, 'new' as const])) } }
}

/** 本周排班: Monday to Saturday of the scene's week, and this week's swap request. */
export function setRota(draft: Snapshot): void {
  const shifts = tableOf(draft, tableId.shifts)
  const swaps = tableOf(draft, tableId.swaps)
  if (!shifts || !swaps) return
  const monday = mondayOf(draft.storyTime)
  const week = [0, 1, 2, 3, 4, 5].map((offset) => addDays(monday, offset))
  shifts.rows = week.flatMap((day, index) =>
    (Object.keys(staff) as Array<keyof typeof staff>)
      .filter((person) => person === 'lan' || (person === 'chen' ? index !== 2 : index !== 4))
      .map((person) => row(`shift-${day.slice(5).replace('-', '')}-${person}`, { staff: person, start: `${day}T09:30`, end: `${day}T18:30` })),
  )
  shifts.updatedAt = lastWeekdayAt(draft.storyTime, 0, '20:00')
  // Earlier weeks' requests were granted; this week's is open.
  const id = `swap-${monday.slice(5).replace('-', '')}`
  for (const each of swaps.rows) if (each.id !== id) each.cells.status = 'approved'
  if (!rowOf(swaps, id)) swaps.rows.push(row(id, { from: 'chen', with: 'jie', day: week[5], status: 'open' }))
  swaps.updatedAt = draft.storyTime
}

/** Her own calendar this week: the supplier tomorrow morning, the stocktake on Friday evening. */
export function setAgenda(draft: Snapshot, titles: { supplier: Text; stocktake: Text }): void {
  const events = tableOf(draft, tableId.events)
  if (!events) return
  const tomorrow = addDays(datePart(draft.storyTime), 1)
  let friday = addDays(mondayOf(draft.storyTime), 4)
  if (friday < datePart(draft.storyTime)) friday = addDays(friday, 7)
  events.rows = [
    row('event-supplier', { title: titles.supplier, start: `${tomorrow}T09:00`, end: `${tomorrow}T09:30` }),
    row('event-stocktake', { title: titles.stocktake, start: `${friday}T18:30`, end: `${friday}T19:30` }),
  ]
  events.updatedAt = draft.storyTime
}

/**
 * The runs that happened by themselves up to now: every scheduled workflow at
 * its last time (unless it has run since), the event-driven ones just now —
 * and when each scheduled one runs next.
 */
export function routine(draft: Snapshot): void {
  const now = draft.storyTime
  const due: Array<{ module: string; at: string; trigger: TriggerKind }> = []
  for (const module of draft.modules) {
    const workflow = module.archived ? undefined : workflowOf(draft, module.id)
    if (!workflow) continue
    const triggers = versionOf(workflow).nodes.filter((node) => node.kind === 'trigger')
    const scheduled = triggers.find((node) => node.trigger === 'schedule')
    if (scheduled) {
      const time = String(scheduled.params.time)
      const weekday = scheduled.params.weekday
      const last = weekday === undefined ? lastAt(now, time) : lastWeekdayAt(now, Number(weekday), time)
      module.nextRunAt = weekday === undefined ? nextAt(now, time) : nextWeekdayAt(now, Number(weekday), time)
      if ((latestRun(draft, module.id)?.at ?? '') < last) due.push({ module: module.id, at: last, trigger: 'schedule' })
    } else if (triggers[0] && triggers[0].trigger !== 'manual') {
      due.push({ module: module.id, at: now, trigger: triggers[0].trigger ?? 'event' })
    }
  }
  due.sort((one, other) => one.at.localeCompare(other.at))
  for (const each of due) ranAt(draft, each.module, each.at, each.trigger)
}
