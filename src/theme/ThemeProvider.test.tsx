import { readFileSync } from 'node:fs'
import { join } from 'node:path'

import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'

import { setMediaQuery } from '@/test/match-media'

import { ThemeProvider, THEME_STORAGE_KEY, themeChoices, useTheme } from './index'

const darkQuery = '(prefers-color-scheme: dark)'
const root = document.documentElement

function Probe() {
  const { theme, resolvedTheme, setTheme } = useTheme()
  return (
    <div>
      <output data-testid="theme">{theme}</output>
      <output data-testid="resolved">{resolvedTheme}</output>
      {themeChoices.map((choice) => (
        <button key={choice} type="button" onClick={() => setTheme(choice)}>
          {choice}
        </button>
      ))}
    </div>
  )
}

function mount() {
  return render(
    <ThemeProvider>
      <Probe />
    </ThemeProvider>,
  )
}

/** Runs the before-paint script of `index.html` against the current document. */
function runInlineScript() {
  const html = readFileSync(join(process.cwd(), 'index.html'), 'utf8')
  const script = /<script>([\s\S]*?)<\/script>/.exec(html)
  if (!script) throw new Error('index.html has no inline theme script')
  new Function(script[1])()
}

describe('ThemeProvider (A-08)', () => {
  it('follows prefers-color-scheme while nothing is stored, live', () => {
    mount()
    expect(screen.getByTestId('theme')).toHaveTextContent('system')
    expect(screen.getByTestId('resolved')).toHaveTextContent('light')
    expect(root).not.toHaveClass('dark')
    expect(root.style.colorScheme).toBe('light')

    act(() => setMediaQuery(darkQuery, true))
    expect(screen.getByTestId('resolved')).toHaveTextContent('dark')
    expect(root).toHaveClass('dark')
    expect(root.style.colorScheme).toBe('dark')

    act(() => setMediaQuery(darkQuery, false))
    expect(root).not.toHaveClass('dark')
    expect(root.style.colorScheme).toBe('light')
  })

  it('starts dark when the system is dark', () => {
    setMediaQuery(darkQuery, true)
    mount()
    expect(screen.getByTestId('resolved')).toHaveTextContent('dark')
    expect(root).toHaveClass('dark')
  })

  it('setTheme overrides the system preference and is stored under pa.theme', async () => {
    const user = userEvent.setup()
    setMediaQuery(darkQuery, true)
    mount()

    await user.click(screen.getByRole('button', { name: 'light' }))
    expect(screen.getByTestId('theme')).toHaveTextContent('light')
    expect(root).not.toHaveClass('dark')
    expect(root.style.colorScheme).toBe('light')
    expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBe('light')

    // The system changing no longer matters.
    act(() => setMediaQuery(darkQuery, false))
    act(() => setMediaQuery(darkQuery, true))
    expect(root).not.toHaveClass('dark')

    await user.click(screen.getByRole('button', { name: 'dark' }))
    expect(root).toHaveClass('dark')
    expect(root.style.colorScheme).toBe('dark')
    expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBe('dark')
  })

  it('the choice survives a reload', async () => {
    const user = userEvent.setup()
    const first = mount()
    await user.click(screen.getByRole('button', { name: 'dark' }))
    first.unmount()
    root.removeAttribute('class')
    root.removeAttribute('style')

    mount()
    expect(screen.getByTestId('theme')).toHaveTextContent('dark')
    expect(root).toHaveClass('dark')
    expect(root.style.colorScheme).toBe('dark')
  })

  it('choosing system again goes back to following the preference', async () => {
    const user = userEvent.setup()
    window.localStorage.setItem(THEME_STORAGE_KEY, 'dark')
    mount()
    expect(root).toHaveClass('dark')

    await user.click(screen.getByRole('button', { name: 'system' }))
    expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBe('system')
    expect(root).not.toHaveClass('dark')
    act(() => setMediaQuery(darkQuery, true))
    expect(root).toHaveClass('dark')
  })

  it('ignores a stored value it does not know', () => {
    window.localStorage.setItem(THEME_STORAGE_KEY, 'sepia')
    mount()
    expect(screen.getByTestId('theme')).toHaveTextContent('system')
  })

  it('applies a choice made in another tab', () => {
    mount()
    window.localStorage.setItem(THEME_STORAGE_KEY, 'dark')
    act(() => {
      window.dispatchEvent(new StorageEvent('storage', { key: THEME_STORAGE_KEY, newValue: 'dark' }))
    })
    expect(root).toHaveClass('dark')
  })

  it('useTheme outside a provider says what is missing', () => {
    expect(() => render(<Probe />)).toThrow(/ThemeProvider/)
  })
})

describe('no light frame on a dark reload (A-08)', () => {
  it('the inline script of index.html applies a stored dark choice before the app mounts', () => {
    window.localStorage.setItem(THEME_STORAGE_KEY, 'dark')
    runInlineScript()
    expect(root).toHaveClass('dark')
    expect(root.style.colorScheme).toBe('dark')
  })

  it('the script and the provider agree in every case, so mounting changes nothing', () => {
    const cases: Array<{ stored: string | null; systemDark: boolean; dark: boolean }> = [
      { stored: null, systemDark: false, dark: false },
      { stored: null, systemDark: true, dark: true },
      { stored: 'system', systemDark: true, dark: true },
      { stored: 'light', systemDark: true, dark: false },
      { stored: 'dark', systemDark: false, dark: true },
    ]
    for (const { stored, systemDark, dark } of cases) {
      window.localStorage.clear()
      if (stored) window.localStorage.setItem(THEME_STORAGE_KEY, stored)
      setMediaQuery(darkQuery, systemDark)

      runInlineScript()
      expect(root.classList.contains('dark')).toBe(dark)
      const scheme = root.style.colorScheme

      const view = mount()
      expect(root.classList.contains('dark')).toBe(dark)
      expect(root.style.colorScheme).toBe(scheme)
      view.unmount()
    }
  })

  it('reads the same storage key as the provider', () => {
    const html = readFileSync(join(process.cwd(), 'index.html'), 'utf8')
    expect(html).toContain(`localStorage.getItem('${THEME_STORAGE_KEY}')`)
  })
})
