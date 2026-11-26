import { createContext, useCallback, useContext, useMemo } from 'react'

import { formatDate, formatDateTime, formatDuration, formatNumber, formatTime } from './format'
import { translate } from './registry'
import type { Locale, MessageKey, MessageParams, Namespace, Translate } from './types'

export type LocaleContextValue = {
  locale: Locale
  /** Stores the choice under `pa.locale`, sets `<html lang>`, re-renders in place. */
  setLocale: (locale: Locale) => void
}

export const LocaleContext = createContext<LocaleContextValue | null>(null)

export function useLocale(): LocaleContextValue {
  const value = useContext(LocaleContext)
  if (!value) throw new Error('useLocale needs a LocaleProvider above it')
  return value
}

/**
 * The messages of one namespace in the current locale:
 * `const t = useT('common')` then `t('action.retry')` or
 * `t('items', { count: 3 })`. Keys are checked at build time.
 */
export function useT<N extends Namespace>(namespace: N): Translate<N> {
  const { locale } = useLocale()
  return useCallback(
    (key: MessageKey<N>, params?: MessageParams) => translate(locale, namespace, key, params),
    [locale, namespace],
  )
}

/** Dates, times, durations and numbers in the current locale, through `Intl`. */
export function useFormat() {
  const { locale } = useLocale()
  return useMemo(
    () => ({
      date: (value: Date, options?: Intl.DateTimeFormatOptions) => formatDate(locale, value, options),
      time: (value: Date, options?: Intl.DateTimeFormatOptions) => formatTime(locale, value, options),
      dateTime: (value: Date, options?: Intl.DateTimeFormatOptions) => formatDateTime(locale, value, options),
      duration: (minutes: number) => formatDuration(locale, minutes),
      number: (value: number, options?: Intl.NumberFormatOptions) => formatNumber(locale, value, options),
    }),
    [locale],
  )
}
