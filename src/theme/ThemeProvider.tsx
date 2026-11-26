import { useCallback, useEffect, useLayoutEffect, useMemo, useState, useSyncExternalStore } from 'react'
import type { ReactNode } from 'react'

import {
  darkQuery,
  isThemeChoice,
  ThemeContext,
  THEME_STORAGE_KEY,
  type ResolvedTheme,
  type ThemeChoice,
  type ThemeContextValue,
} from './theme-context'

function readStoredChoice(): ThemeChoice {
  try {
    const stored = window.localStorage.getItem(THEME_STORAGE_KEY)
    return isThemeChoice(stored) ? stored : 'system'
  } catch {
    // Storage can be blocked; the system preference still works.
    return 'system'
  }
}

function subscribeToSystem(onChange: () => void): () => void {
  const list = window.matchMedia(darkQuery)
  list.addEventListener('change', onChange)
  return () => list.removeEventListener('change', onChange)
}

function systemIsDark(): boolean {
  return window.matchMedia(darkQuery).matches
}

/**
 * The two effects the inline script in `index.html` has before first paint,
 * kept in step after load: the `.dark` class the token modes hang on, and
 * `color-scheme` so native controls and scrollbars match.
 */
function applyTheme(resolved: ResolvedTheme): void {
  const root = document.documentElement
  root.classList.toggle('dark', resolved === 'dark')
  root.style.colorScheme = resolved
}

/**
 * The theme source of the app (D-19). With no stored choice it follows
 * `prefers-color-scheme`, live; `setTheme` overrides that and is remembered
 * under `pa.theme`. Components stay theme-blind: they read semantic tokens
 * and never this context — only the theme control and third-party widgets
 * that need the mode by name (the toast host) read it.
 */
export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setChoice] = useState<ThemeChoice>(readStoredChoice)
  const systemDark = useSyncExternalStore(subscribeToSystem, systemIsDark, () => false)
  const resolvedTheme: ResolvedTheme = theme === 'system' ? (systemDark ? 'dark' : 'light') : theme

  useLayoutEffect(() => {
    applyTheme(resolvedTheme)
  }, [resolvedTheme])

  // A choice made in another tab of the prototype applies here too.
  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key === THEME_STORAGE_KEY || event.key === null) setChoice(readStoredChoice())
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  const setTheme = useCallback((choice: ThemeChoice) => {
    setChoice(choice)
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, choice)
    } catch {
      // Not remembered when storage is blocked; still applied for this visit.
    }
  }, [])

  const value = useMemo<ThemeContextValue>(
    () => ({ theme, resolvedTheme, setTheme }),
    [theme, resolvedTheme, setTheme],
  )

  return <ThemeContext value={value}>{children}</ThemeContext>
}
