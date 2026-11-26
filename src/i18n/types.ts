/** The locales of the product (D-17). The first is the story's language. */
export const locales = ['zh-CN', 'en'] as const
export type Locale = (typeof locales)[number]

/** Used when the browser asks for neither, and for a key a locale lacks (D-24). */
export const fallbackLocale: Locale = 'en'

/** The stored locale choice; overrides the browser language. */
export const LOCALE_STORAGE_KEY = 'pa.locale'

/** Each locale's name in its own language — what a locale switch shows. */
export const localeNames: Record<Locale, string> = { 'zh-CN': '简体中文', en: 'English' }

export function isLocale(value: unknown): value is Locale {
  return locales.includes(value as Locale)
}

/**
 * A message that depends on a count. `t(key, { count })` picks the form with
 * `Intl.PluralRules`; `other` is always there. zh-CN needs only `other`.
 */
export type PluralMessage = { other: string } & Partial<Record<'zero' | 'one' | 'two' | 'few' | 'many', string>>

/** A text, with `{name}` placeholders filled from the params of `t`. */
export type Message = string | PluralMessage

/** One namespace in one locale: flat keys, dotted by convention (`mode.assisted.name`). */
export type Messages = Record<string, Message>

/** The other locale of a namespace: exactly the keys of the `en` file. */
export type Translation<Source extends Messages> = { [Key in keyof Source]: Message }

/** Values for the `{name}` placeholders; `count` also selects the plural form. */
export type MessageParams = Record<string, string | number>

/**
 * Every namespace and its keys. Empty here on purpose: each
 * `messages/<namespace>.en.ts` adds its own entry by declaration merging, so
 * parallel packages never edit a shared list and a wrong key fails the build.
 */
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface MessageNamespaces {}

type DeclaredNamespace = keyof MessageNamespaces & string

/**
 * A namespace name. Checked against the declared ones wherever the message
 * files are part of the TypeScript program — the app build (`tsconfig.app.json`
 * includes all of `src/`). The test project includes only test files and what
 * they import, and message files are reached by glob, not by import; there no
 * namespace is declared and any string is accepted instead of none.
 */
export type Namespace = [DeclaredNamespace] extends [never] ? string : DeclaredNamespace

export type MessageKey<N extends Namespace> = N extends keyof MessageNamespaces
  ? keyof MessageNamespaces[N] & string
  : string

/** The function `useT(namespace)` returns. */
export type Translate<N extends Namespace> = (key: MessageKey<N>, params?: MessageParams) => string
