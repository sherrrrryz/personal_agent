import type { Locale } from '@/i18n'

/**
 * A story text in both locales (D-17). Every fact of the story — a module's
 * name, a node's label, a message — is one of these, so no fixture string can
 * exist in one language only. A name the user typed is the same in both.
 */
export type Text = Readonly<Record<Locale, string>>

/** `tx('预约', 'Appointments')`. */
export function tx(zh: string, en: string): Text {
  return { 'zh-CN': zh, en }
}

/** What the user typed: shown as typed in either locale. */
export function typed(text: string): Text {
  return { 'zh-CN': text, en: text }
}

export function isText(value: unknown): value is Text {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as Record<string, unknown>)['zh-CN'] === 'string' &&
    typeof (value as Record<string, unknown>).en === 'string'
  )
}

/** The text in a locale. */
export function textIn(text: Text, locale: Locale): string {
  return text[locale]
}
