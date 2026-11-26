import type { Locale } from './types'

// Dates, times, durations and numbers go through `Intl` (spec § Placeholder
// theme and tokens, "Locale"). No format string is written by hand, so both
// locales get their own order, separators and unit words.

/** A calendar date: `2026年11月26日` · `Nov 26, 2026`. */
export function formatDate(locale: Locale, value: Date, options?: Intl.DateTimeFormatOptions): string {
  return new Intl.DateTimeFormat(locale, options ?? { dateStyle: 'medium' }).format(value)
}

/** A time of day: `19:00` · `7:00 PM`. */
export function formatTime(locale: Locale, value: Date, options?: Intl.DateTimeFormatOptions): string {
  return new Intl.DateTimeFormat(locale, options ?? { timeStyle: 'short' }).format(value)
}

/** A date with its time. */
export function formatDateTime(locale: Locale, value: Date, options?: Intl.DateTimeFormatOptions): string {
  return new Intl.DateTimeFormat(locale, options ?? { dateStyle: 'medium', timeStyle: 'short' }).format(value)
}

export function formatNumber(locale: Locale, value: number, options?: Intl.NumberFormatOptions): string {
  return new Intl.NumberFormat(locale, options).format(value)
}

/**
 * A length of time given in minutes, as hours and minutes:
 * `3小时20分钟` · `3 hr 20 min`; whole hours and under an hour drop the
 * empty part. Negative and fractional input is rounded to whole minutes ≥ 0.
 */
export function formatDuration(locale: Locale, minutes: number): string {
  const total = Math.max(0, Math.round(minutes))
  const unit = (value: number, name: 'hour' | 'minute') =>
    new Intl.NumberFormat(locale, { style: 'unit', unit: name, unitDisplay: 'short' }).format(value)
  const hours = Math.floor(total / 60)
  const rest = total % 60
  const parts: string[] = []
  if (hours > 0) parts.push(unit(hours, 'hour'))
  if (rest > 0 || hours === 0) parts.push(unit(rest, 'minute'))
  return new Intl.ListFormat(locale, { type: 'unit', style: 'narrow' }).format(parts)
}
