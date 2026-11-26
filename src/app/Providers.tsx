import type { ReactNode } from 'react'

import { LocaleProvider } from '@/i18n'
import { ThemeProvider } from '@/theme'

/** Everything a screen may assume above it: the theme and the locale. */
export function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <LocaleProvider>{children}</LocaleProvider>
    </ThemeProvider>
  )
}
