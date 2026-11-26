import type { Locale } from '@/i18n'
import { toDate } from '@/runtime'

const steps: Array<[unit: Intl.RelativeTimeFormatUnit, minutes: number]> = [
  ['year', 525_600],
  ['month', 43_200],
  ['day', 1_440],
  ['hour', 60],
  ['minute', 1],
]

/**
 * How long before `now` something happened, in words: 19 天前 / 19 days ago.
 * `now` is the story's time, never the wall clock. `null` for less than a
 * minute — the caller has its own word for "just now".
 */
export function relativeTime(locale: Locale, at: string, now: string): string | null {
  const minutes = Math.round((toDate(now).getTime() - toDate(at).getTime()) / 60_000)
  const step = steps.find(([, size]) => Math.abs(minutes) >= size)
  if (!step) return null
  return new Intl.RelativeTimeFormat(locale, { numeric: 'always' }).format(-Math.trunc(minutes / step[1]), step[0])
}
