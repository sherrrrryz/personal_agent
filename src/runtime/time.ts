// Story time is a local ISO string — `2026-11-05T10:00` — with no zone and no
// wall clock behind it. These helpers do the little arithmetic the runtime
// needs on such strings; a screen formats them with `useFormat()`.

const pad = (value: number) => String(value).padStart(2, '0')

/** `2026-11-05T10:00` → `2026-11-05`. */
export function datePart(at: string): string {
  return at.slice(0, 10)
}

/** `2026-11-05T10:00` → `10:00`. */
export function timePart(at: string): string {
  return at.slice(11, 16)
}

function toUtc(at: string): number {
  const [year, month, day] = datePart(at).split('-').map(Number)
  const [hour = 0, minute = 0] = at.length > 10 ? timePart(at).split(':').map(Number) : []
  return Date.UTC(year, month - 1, day, hour, minute)
}

function fromUtc(value: number): string {
  const date = new Date(value)
  return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}T${pad(date.getUTCHours())}:${pad(date.getUTCMinutes())}`
}

export function addMinutes(at: string, minutes: number): string {
  return fromUtc(toUtc(at) + minutes * 60_000)
}

/** A date or a date-time moved by whole days; the shape of the input is kept. */
export function addDays(at: string, days: number): string {
  const moved = fromUtc(toUtc(at) + days * 86_400_000)
  return at.length > 10 ? moved : datePart(moved)
}

/** The next moment the clock shows `time` (`19:00`) after `now`. */
export function nextAt(now: string, time: string): string {
  const today = `${datePart(now)}T${time}`
  return today > now ? today : addDays(today, 1)
}

/** The latest moment the clock showed `time` at or before `now`. */
export function lastAt(now: string, time: string): string {
  const today = `${datePart(now)}T${time}`
  return today <= now ? today : addDays(today, -1)
}

/** 0 Sunday … 6 Saturday. */
export function weekdayOf(at: string): number {
  return new Date(toUtc(datePart(at))).getUTCDay()
}

/** The Monday of the week `at` falls in, as a date. */
export function mondayOf(at: string): string {
  return addDays(datePart(at), -((weekdayOf(at) + 6) % 7))
}

/** The next moment after `now` that is `weekday` at `time` — 每周一 18:00. */
export function nextWeekdayAt(now: string, weekday: number, time: string): string {
  let at = nextAt(now, time)
  while (weekdayOf(at) !== weekday) at = addDays(at, 1)
  return at
}

/** The latest moment at or before `now` that was `weekday` at `time`. */
export function lastWeekdayAt(now: string, weekday: number, time: string): string {
  let at = lastAt(now, time)
  while (weekdayOf(at) !== weekday) at = addDays(at, -1)
  return at
}

/** A story time as a `Date` in the browser's zone — only for `Intl` formatting. */
export function toDate(at: string): Date {
  const [year, month, day] = datePart(at).split('-').map(Number)
  const [hour = 0, minute = 0] = at.length > 10 ? timePart(at).split(':').map(Number) : []
  return new Date(year, month - 1, day, hour, minute)
}
