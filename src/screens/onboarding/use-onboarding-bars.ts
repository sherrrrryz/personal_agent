import { useLayoutEffect, useRef, type RefObject } from 'react'

/** The two custom properties the onboarding page reads its block padding and its `scroll-padding` from. */
const headerSize = '--onboarding-header-size'
const barSize = '--onboarding-bar-size'

/**
 * The onboarding top bar and its bottom bar (the interview's composer) float
 * over the page (D-54), so the page keeps their room at its two ends: this
 * writes the block size of each onto the onboarding root as a custom
 * property, and follows them as they change — the composer grows with what is
 * typed, the bottom bar is empty on the steps that have none. Measured sizes
 * of what is on screen, not design values; the shell does the same for its
 * bars (`src/shell/use-bar-sizes.ts`).
 *
 * Without `ResizeObserver` (jsdom) nothing is written and the page has no
 * padding of this kind.
 */
export function useOnboardingBars(): RefObject<HTMLDivElement | null> {
  const root = useRef<HTMLDivElement>(null)
  useLayoutEffect(() => {
    const element = root.current
    if (!element || typeof ResizeObserver === 'undefined') return
    const header = element.querySelector<HTMLElement>(':scope > [data-onboarding-header]')
    const bar = element.querySelector<HTMLElement>(':scope > [data-onboarding-bar]')
    const measure = () => {
      element.style.setProperty(headerSize, `${header?.offsetHeight ?? 0}px`)
      element.style.setProperty(barSize, `${bar?.offsetHeight ?? 0}px`)
    }
    // Before the first paint, so the page never starts under the top bar.
    measure()
    const observer = new ResizeObserver(measure)
    if (header) observer.observe(header)
    if (bar) observer.observe(bar)
    return () => observer.disconnect()
  }, [])
  return root
}
