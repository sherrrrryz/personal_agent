// Runs before every test file (vitest.config.ts § setupFiles).
import '@testing-library/jest-dom/vitest'

import { cleanup } from '@testing-library/react'
import { afterEach, expect } from 'vitest'
import * as axeMatchers from 'vitest-axe/matchers'

import { installMatchMedia, resetMatchMedia } from './match-media'

expect.extend(axeMatchers)

// Browser APIs the kit's primitives call and jsdom does not implement.
// Token and build tests run in the node environment and skip this.
if (typeof window !== 'undefined') {
  installMatchMedia()

  class NoopObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
    takeRecords() {
      return []
    }
  }
  const globals = globalThis as Record<string, unknown>
  globals.ResizeObserver ??= NoopObserver
  globals.IntersectionObserver ??= NoopObserver

  const element = Element.prototype as unknown as Record<string, unknown>
  element.scrollIntoView ??= () => {}
  element.hasPointerCapture ??= () => false
  element.setPointerCapture ??= () => {}
  element.releasePointerCapture ??= () => {}
}

afterEach(() => {
  cleanup()
  if (typeof window !== 'undefined') {
    resetMatchMedia()
    window.localStorage.clear()
    document.documentElement.removeAttribute('class')
    document.documentElement.removeAttribute('style')
  }
})
