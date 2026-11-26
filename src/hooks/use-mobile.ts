import * as React from 'react'

import { breakpoints } from '@/tokens/generated/breakpoints'

// Our code, not kit code (the kit-code exemption in `DECISIONS.md` covers
// `src/components/ui/` and is not extended to `src/hooks/`): the CLI wrote
// this file for the kit's `Sidebar`, with a pixel breakpoint of its own. It is
// rewritten to read the `md` breakpoint token, in the unit the token has, so
// the hook and Tailwind's `md:` variant flip at the same width at every text
// size. This file holds no number — the value lives in `tokens/`.

/**
 * The media query of the compact structure: the viewport is narrower than the
 * `md` breakpoint token. The exact complement of Tailwind's `md:` variant.
 */
export const compactQuery = `(width < ${breakpoints.md})`

function subscribe(onChange: () => void): () => void {
  const list = window.matchMedia(compactQuery)
  list.addEventListener('change', onChange)
  return () => list.removeEventListener('change', onChange)
}

function getSnapshot(): boolean {
  return window.matchMedia(compactQuery).matches
}

function getServerSnapshot(): boolean {
  return false
}

/** True while the viewport is in the compact size class. */
export function useIsMobile(): boolean {
  return React.useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
}
