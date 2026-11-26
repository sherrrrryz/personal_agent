import { readFileSync } from 'node:fs'
import { join } from 'node:path'

import { act, renderHook } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { setMediaQuery } from '@/test/match-media'
import { breakpoints } from '@/tokens/generated/breakpoints'

import { compactQuery, useIsMobile } from './use-mobile'

// Spec A-04: the hook holds no number and builds its query from the
// breakpoint token, in `rem`, so it agrees with Tailwind's `md:` variant at
// every text size (root 24 px included).

describe('use-mobile', () => {
  it('builds its query from the md breakpoint token, in rem', () => {
    expect(compactQuery).toBe(`(width < ${breakpoints.md})`)
    // Pinned as text too: a change of the token is a change of structure.
    expect(compactQuery).toBe('(width < 48rem)')
    expect(breakpoints.md.endsWith('rem')).toBe(true)
  })

  it('asks the browser that query and no other', () => {
    const matchMedia = vi.spyOn(window, 'matchMedia')
    renderHook(() => useIsMobile())
    const asked = new Set(matchMedia.mock.calls.map(([query]) => query))
    expect([...asked]).toEqual([compactQuery])
    matchMedia.mockRestore()
  })

  it('is false until the query matches, and follows it both ways', () => {
    const { result } = renderHook(() => useIsMobile())
    expect(result.current).toBe(false)
    act(() => setMediaQuery(compactQuery, true))
    expect(result.current).toBe(true)
    act(() => setMediaQuery(compactQuery, false))
    expect(result.current).toBe(false)
  })

  it('starts true when the viewport is already compact', () => {
    setMediaQuery(compactQuery, true)
    const { result } = renderHook(() => useIsMobile())
    expect(result.current).toBe(true)
  })

  it('stops listening when unmounted', () => {
    const remove = vi.fn()
    const matchMedia = vi.spyOn(window, 'matchMedia').mockImplementation(
      (query) =>
        ({
          matches: false,
          media: query,
          addEventListener: vi.fn(),
          removeEventListener: remove,
        }) as unknown as MediaQueryList,
    )
    const { unmount } = renderHook(() => useIsMobile())
    expect(remove).not.toHaveBeenCalled()
    unmount()
    expect(remove).toHaveBeenCalledTimes(1)
    matchMedia.mockRestore()
  })

  it('holds no numeric literal', () => {
    const source = readFileSync(join(import.meta.dirname, 'use-mobile.ts'), 'utf8')
    expect(source).not.toMatch(/\d/)
  })
})
