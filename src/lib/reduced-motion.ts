/**
 * Whether she asked the system for reduced motion. Read at the moment an
 * animation would start — text that writes itself out is then there at once
 * (hard rule 13). `false` where there is no media query to ask.
 */
export function prefersReducedMotion(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  )
}
