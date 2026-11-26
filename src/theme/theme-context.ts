import { createContext, useContext } from 'react'

/**
 * The stored theme choice (D-19). The same key is read before first paint by
 * the inline script in `index.html` — change one, change the other.
 */
export const THEME_STORAGE_KEY = 'pa.theme'

/** What the user can choose. `system` follows `prefers-color-scheme`. */
export const themeChoices = ['system', 'light', 'dark'] as const
export type ThemeChoice = (typeof themeChoices)[number]

/** The mode that is actually applied. */
export type ResolvedTheme = 'light' | 'dark'

/** The system preference the `system` choice follows. */
export const darkQuery = '(prefers-color-scheme: dark)'

export function isThemeChoice(value: unknown): value is ThemeChoice {
  return themeChoices.includes(value as ThemeChoice)
}

export type ThemeContextValue = {
  /** The user's choice; `system` until they choose. */
  theme: ThemeChoice
  /** The mode on screen: the choice, or the system preference while `system`. */
  resolvedTheme: ResolvedTheme
  /** Stores the choice in `localStorage` and applies it at once. */
  setTheme: (choice: ThemeChoice) => void
}

export const ThemeContext = createContext<ThemeContextValue | null>(null)

export function useTheme(): ThemeContextValue {
  const value = useContext(ThemeContext)
  if (!value) throw new Error('useTheme needs a ThemeProvider above it')
  return value
}
