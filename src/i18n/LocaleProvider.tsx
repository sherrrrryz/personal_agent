import { useCallback, useEffect, useLayoutEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'

import { initialLocale, readStoredLocale } from './locale'
import { LocaleContext, type LocaleContextValue } from './locale-context'
import { LOCALE_STORAGE_KEY, type Locale } from './types'

/**
 * The locale source of the app (D-24). Starts from the stored choice
 * `pa.locale`, else from the browser's languages; keeps `<html lang>` in
 * step; `setLocale` switches every `useT` consumer in place, with no reload.
 */
export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setCurrent] = useState<Locale>(initialLocale)

  useLayoutEffect(() => {
    document.documentElement.lang = locale
  }, [locale])

  // A choice made in another tab of the prototype applies here too.
  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key !== LOCALE_STORAGE_KEY && event.key !== null) return
      const stored = readStoredLocale()
      if (stored) setCurrent(stored)
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  const setLocale = useCallback((next: Locale) => {
    setCurrent(next)
    try {
      window.localStorage.setItem(LOCALE_STORAGE_KEY, next)
    } catch {
      // Not remembered when storage is blocked; still applied for this visit.
    }
  }, [])

  const value = useMemo<LocaleContextValue>(() => ({ locale, setLocale }), [locale, setLocale])

  return <LocaleContext value={value}>{children}</LocaleContext>
}
