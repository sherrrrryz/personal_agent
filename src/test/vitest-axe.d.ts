// vitest-axe 0.1.0 types its matcher for an older Vitest; this is the same
// declaration against the current one.
import 'vitest'

interface AxeMatchers<R = unknown> {
  /** The axe-core results hold no violation. */
  toHaveNoViolations(): R
}

declare module 'vitest' {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface Assertion<R, T> extends AxeMatchers<R> {}
  interface AsymmetricMatchersContaining extends AxeMatchers {}
}
