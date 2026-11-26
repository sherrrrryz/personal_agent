// Messages and locale — no i18n library (spec § Decisions).
//
// Adding a namespace (one writer per namespace; no shared file is edited):
//   src/i18n/messages/<namespace>.en.ts      const messages = { … } satisfies Messages
//                                            export default messages
//                                            declare module '@/i18n/types' {
//                                              interface MessageNamespaces { '<namespace>': typeof messages }
//                                            }
//   src/i18n/messages/<namespace>.zh-CN.ts   const messages: Translation<typeof en> = { … }
//                                            export default messages
// `common.en.ts` and `common.zh-CN.ts` are the pattern to copy. In a
// component: `const t = useT('<namespace>')`, then `t('key')` or
// `t('key', { count, name })`. Outside React: `translate(locale, …)`.
// A test never imports a message file itself (use `translate`): one imported
// namespace would become the only one the test project knows — `types.ts`.
//
// No user-visible string lives outside this folder and `src/fixtures/`:
// `string-scan.test.ts` scans `src/` for JSX text and naming attributes, and
// `messages.test.ts` holds every namespace to the same keys in both locales.

export { formatDate, formatDateTime, formatDuration, formatNumber, formatTime } from './format'
export { pickLocale } from './locale'
export { useFormat, useLocale, useT } from './locale-context'
export type { LocaleContextValue } from './locale-context'
export { LocaleProvider } from './LocaleProvider'
export { translate } from './registry'
export { fallbackLocale, LOCALE_STORAGE_KEY, localeNames, locales } from './types'
export type {
  Locale,
  Message,
  MessageKey,
  MessageNamespaces,
  MessageParams,
  Messages,
  Namespace,
  PluralMessage,
  Translate,
  Translation,
} from './types'
