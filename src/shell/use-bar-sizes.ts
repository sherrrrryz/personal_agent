import { useLayoutEffect, useRef, type RefObject } from 'react'

/** The two custom properties `main` reads its block padding and its `scroll-padding` from. */
const headerSize = '--shell-header-size'
const barSize = '--shell-bar-size'

/**
 * The header and the chat bar lie over `main` (D-47), so `main` must keep
 * their room at its two ends: this writes the block size of each onto the
 * shell as a custom property, and follows them as they change — the header
 * wraps, the bar grows with what is typed and with the in-place panel.
 * Measured sizes of what is on screen, not design values.
 *
 * `hasBar` says whether the bottom row is rendered: the effect runs again
 * when it comes or goes. Without `ResizeObserver` (jsdom) nothing is written
 * and `main` has no padding of this kind.
 */
export function useBarSizes(hasBar: boolean): RefObject<HTMLDivElement | null> {
  const shell = useRef<HTMLDivElement>(null)
  useLayoutEffect(() => {
    const root = shell.current
    if (!root || typeof ResizeObserver === 'undefined') return
    const header = root.querySelector<HTMLElement>(':scope > header')
    const bar = hasBar ? root.querySelector<HTMLElement>(':scope > [data-shell-bar]') : null
    const measure = () => {
      root.style.setProperty(headerSize, `${header?.offsetHeight ?? 0}px`)
      root.style.setProperty(barSize, `${bar?.offsetHeight ?? 0}px`)
    }
    // Before the first paint, so the page never starts under the header.
    measure()
    const observer = new ResizeObserver(measure)
    if (header) observer.observe(header)
    if (bar) observer.observe(bar)
    return () => observer.disconnect()
  }, [hasBar])
  return shell
}
