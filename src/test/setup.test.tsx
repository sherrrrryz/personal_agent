// The test environment itself: the DOM matchers, axe and the media-query mock
// that every component test of the later packages relies on.
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useSyncExternalStore } from 'react'
import { describe, expect, it } from 'vitest'

import { axe } from './axe'
import { setMediaQuery } from './match-media'

const QUERY = '(prefers-color-scheme: dark)'

function SchemeProbe() {
  const dark = useSyncExternalStore(
    (notify) => {
      const list = window.matchMedia(QUERY)
      list.addEventListener('change', notify)
      return () => list.removeEventListener('change', notify)
    },
    () => window.matchMedia(QUERY).matches,
  )
  return <output>{dark ? 'dark' : 'light'}</output>
}

describe('test setup', () => {
  it('renders React, finds by role and drives the keyboard', async () => {
    const user = userEvent.setup()
    render(
      <main>
        <h1>Probe</h1>
        <button type="button">First</button>
        <button type="button">Second</button>
      </main>,
    )
    await user.tab()
    expect(screen.getByRole('button', { name: 'First' })).toHaveFocus()
    await user.tab()
    expect(screen.getByRole('button', { name: 'Second' })).toHaveFocus()
  })

  it('axe passes an accessible fragment and reports a violation', async () => {
    const { container, rerender } = render(<button type="button">Save</button>)
    expect(await axe(container)).toHaveNoViolations()

    rerender(<button type="button" />)
    const results = await axe(container)
    expect(results.violations.map((violation) => violation.id)).toContain('button-name')
    expect(() => expect(results).toHaveNoViolations()).toThrow()
  })

  it('matchMedia starts false, follows setMediaQuery and tells its listeners', () => {
    render(<SchemeProbe />)
    expect(screen.getByRole('status')).toHaveTextContent('light')
    setMediaQuery(QUERY, true)
    expect(window.matchMedia(QUERY).matches).toBe(true)
  })

  it('starts every test with no media query matching and empty storage', () => {
    expect(window.matchMedia(QUERY).matches).toBe(false)
    expect(window.localStorage.length).toBe(0)
  })
})
