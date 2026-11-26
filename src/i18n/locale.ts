import { fallbackLocale, isLocale, LOCALE_STORAGE_KEY, type Locale } from './types'

/**
 * The locale for a browser's language list (D-24): the first entry we have
 * decides — any Chinese variant (`zh`, `zh-TW`, `zh-Hans-CN`) is zh-CN, any
 * English one is en — and a list with neither falls back to en.
 */
export function pickLocale(languages: readonly string[]): Locale {
  for (const language of languages) {
    const primary = language.toLowerCase().split('-')[0]
    if (primary === 'zh') return 'zh-CN'
    if (primary === 'en') return 'en'
  }
  return fallbackLocale
}

/** The user's stored choice, if there is a valid one. */
export function readStoredLocale(): Locale | null {
  try {
    const stored = window.localStorage.getItem(LOCALE_STORAGE_KEY)
    return isLocale(stored) ? stored : null
  } catch {
    // Storage can be blocked; the browser language still works.
    return null
  }
}

/** The locale to start with: the stored choice, else the browser's languages. */
export function initialLocale(): Locale {
  const languages = navigator.languages?.length ? navigator.languages : [navigator.language]
  return readStoredLocale() ?? pickLocale(languages)
}
