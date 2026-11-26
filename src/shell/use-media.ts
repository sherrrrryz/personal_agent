import { useSyncExternalStore } from 'react'

import { breakpoints } from '@/tokens/generated/breakpoints'

/**
 * The media query of the expanded size class: the viewport is at least the
 * `lg` breakpoint token wide. Below it and above the `md` token (the compact
 * class, `useIsMobile`) is the medium class. In the token's unit, so the
 * classes move with the user's text size (spec part 1 § Responsive).
 */
export const expandedQuery = `(width >= ${breakpoints.lg})`

/** True while a media query matches; follows the window. */
export function useMediaQuery(query: string): boolean {
  return useSyncExternalStore(
    (onChange) => {
      const list = window.matchMedia(query)
      list.addEventListener('change', onChange)
      return () => list.removeEventListener('change', onChange)
    },
    () => window.matchMedia(query).matches,
    () => false,
  )
}
