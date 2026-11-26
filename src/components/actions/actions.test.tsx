import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ComponentType } from 'react'
import { describe, expect, it, vi } from 'vitest'

import { LocaleProvider, LOCALE_STORAGE_KEY } from '@/i18n'
import { axe } from '@/test/axe'

import { Button, Toggle, ToggleGroup, ToggleGroupItem, toggleVariants } from './index'

// Component evidence for `Toggle` and `ToggleGroup` (A-13), and the checks
// that hold for the whole actions family. `Button` is in `Button.test.tsx`.

const tokens = (element: Element) => element.className.split(' ')

describe('Toggle', () => {
  it('is a button with aria-pressed that Tab reaches and Enter and Space flip', async () => {
    const onPressedChange = vi.fn()
    render(<Toggle onPressedChange={onPressedChange}>置顶</Toggle>)
    const toggle = screen.getByRole('button', { name: '置顶' })
    expect(toggle).toHaveAttribute('aria-pressed', 'false')
    await userEvent.tab()
    expect(toggle).toHaveFocus()
    await userEvent.keyboard('{Enter}')
    expect(toggle).toHaveAttribute('aria-pressed', 'true')
    await userEvent.keyboard(' ')
    expect(toggle).toHaveAttribute('aria-pressed', 'false')
    await userEvent.click(toggle)
    expect(onPressedChange.mock.calls.map(([pressed]) => pressed)).toEqual([true, false, true])
  })

  it.each(toggleVariants)('variant %s: the kit’s toggle and pressed state; its height is a minimum and a long label wraps', (variant) => {
    render(
      <Toggle variant={variant} defaultPressed>
        置顶
      </Toggle>,
    )
    const toggle = screen.getByRole('button')
    expect(toggle).toHaveAttribute('aria-pressed', 'true')
    expect(toggle).toHaveClass('min-h-8', 'h-auto', 'whitespace-normal')
    expect(toggle.className).not.toMatch(/-target\b/)
    expect(tokens(toggle).filter((token) => /^h-\d/.test(token) || token === 'whitespace-nowrap')).toEqual([])
    // Pressed is the kit's own fill (D-43): nothing of ours on top.
    expect(tokens(toggle)).toContain('aria-pressed:bg-muted')
    expect(tokens(toggle).filter((token) => token.startsWith('aria-pressed:bg-primary') || token.startsWith('after:'))).toEqual([])
  })

  it('disabled: not pressable', async () => {
    const onPressedChange = vi.fn()
    render(
      <Toggle disabled onPressedChange={onPressedChange}>
        置顶
      </Toggle>,
    )
    await userEvent.click(screen.getByRole('button'))
    expect(screen.getByRole('button')).toBeDisabled()
    expect(onPressedChange).not.toHaveBeenCalled()
  })

  it('an icon-only toggle is named by aria-label; no axe violation', async () => {
    const { container } = render(
      <Toggle aria-label="收藏" size="sm" variant="ghost">
        <svg aria-hidden="true" />
      </Toggle>,
    )
    expect(screen.getByRole('button', { name: '收藏' })).toBeInTheDocument()
    expect(await axe(container)).toHaveNoViolations()
  })
})

describe('ToggleGroup', () => {
  const items = (
    <>
      <ToggleGroupItem value="day">日</ToggleGroupItem>
      <ToggleGroupItem value="week">周</ToggleGroupItem>
      <ToggleGroupItem value="month" disabled>
        月
      </ToggleGroupItem>
    </>
  )
  const pressed = () =>
    screen
      .getAllByRole('button')
      .filter((button) => button.getAttribute('aria-pressed') === 'true')
      .map((button) => button.textContent)

  it('is a named group; one choice at a time, and the pressed one can be released', async () => {
    const onValueChange = vi.fn()
    const { container } = render(
      <ToggleGroup aria-label="日历视图" defaultValue="day" onValueChange={onValueChange}>
        {items}
      </ToggleGroup>,
    )
    const group = screen.getByRole('group', { name: '日历视图' })
    expect(group).toHaveClass('flex-wrap', 'max-w-full')
    expect(pressed()).toEqual(['日'])
    await userEvent.click(screen.getByRole('button', { name: '周' }))
    expect(pressed()).toEqual(['周'])
    await userEvent.click(screen.getByRole('button', { name: '周' }))
    expect(pressed()).toEqual([])
    expect(onValueChange.mock.calls.map(([value]) => value)).toEqual(['week', null])
    for (const button of screen.getAllByRole('button')) expect(button).toHaveClass('min-h-7', 'data-[size=default]:min-h-8', 'shrink')
    expect(await axe(container)).toHaveNoViolations()
  })

  it('required: one item always stays pressed', async () => {
    const onValueChange = vi.fn()
    render(
      <ToggleGroup aria-label="日历视图" defaultValue="day" required onValueChange={onValueChange}>
        {items}
      </ToggleGroup>,
    )
    await userEvent.click(screen.getByRole('button', { name: '日' }))
    expect(pressed()).toEqual(['日'])
    expect(onValueChange).not.toHaveBeenCalled()
  })

  it('controlled: shows the value it is given', async () => {
    const onValueChange = vi.fn()
    render(
      <ToggleGroup aria-label="日历视图" value="week" onValueChange={onValueChange}>
        {items}
      </ToggleGroup>,
    )
    await userEvent.click(screen.getByRole('button', { name: '日' }))
    expect(onValueChange).toHaveBeenCalledWith('day')
    expect(pressed()).toEqual(['周'])
  })

  it('multiple: any number pressed', async () => {
    const onValueChange = vi.fn()
    render(
      <ToggleGroup aria-label="营业日" multiple defaultValue={['day']} onValueChange={onValueChange}>
        {items}
      </ToggleGroup>,
    )
    await userEvent.click(screen.getByRole('button', { name: '周' }))
    expect(pressed()).toEqual(['日', '周'])
    expect(onValueChange).toHaveBeenLastCalledWith(['day', 'week'])
  })

  it('is one tab stop: the arrows move inside, Tab leaves; a disabled item is not pressable', async () => {
    render(
      <>
        <ToggleGroup aria-label="日历视图">{items}</ToggleGroup>
        <Button>下一步</Button>
      </>,
    )
    await userEvent.tab()
    expect(screen.getByRole('button', { name: '日' })).toHaveFocus()
    await userEvent.keyboard('{ArrowRight}')
    expect(screen.getByRole('button', { name: '周' })).toHaveFocus()
    await userEvent.keyboard(' ')
    expect(pressed()).toEqual(['周'])
    await userEvent.tab()
    expect(screen.getByRole('button', { name: '下一步' })).toHaveFocus()
    await userEvent.click(screen.getByRole('button', { name: '月' }))
    expect(pressed()).toEqual(['周'])
  })

  it('a disabled group presses nothing', async () => {
    render(
      <ToggleGroup aria-label="日历视图" disabled>
        {items}
      </ToggleGroup>,
    )
    await userEvent.click(screen.getByRole('button', { name: '日' }))
    expect(pressed()).toEqual([])
  })
})

describe('the actions family as a whole', () => {
  const sources = readdirSync(import.meta.dirname)
    .filter((file) => /\.tsx?$/.test(file) && !file.includes('.test.'))
    .map((file) => [file, readFileSync(join(import.meta.dirname, file), 'utf8')] as const)

  it.each(sources)('%s sets no fixed block size, no truncation and no outer margin', (_file, source) => {
    expect(source.match(/(?<![\w-])(?:h|size|max-h)-(?:\d|\[|px|full|screen|dvh|svh|target)[\w./[\]-]*/g) ?? []).toEqual([])
    expect(source.match(/\b(?:truncate|line-clamp-\d+|overflow-hidden|whitespace-nowrap)\b/g) ?? []).toEqual([])
    expect(source.match(/(?<![\w-])-?m[trblxyse]?-[\w./[\]-]+/g) ?? []).toEqual([])
  })

  const demos = Object.entries(import.meta.glob<ComponentType>('./*.demo.tsx', { eager: true, import: 'default' }))

  it('every component of the family has a demo', () => {
    expect(demos.map(([path]) => path).sort()).toEqual(
      expect.arrayContaining(['Button', 'Toggle', 'ToggleGroup'].map((name) => `./${name}.demo.tsx`)),
    )
  })

  it.each(demos)('%s renders in zh-CN with no English text or name and no axe violation', async (_path, Demo) => {
    window.localStorage.setItem(LOCALE_STORAGE_KEY, 'zh-CN')
    const { container } = render(
      <LocaleProvider>
        <Demo />
      </LocaleProvider>,
    )
    const prose = container.cloneNode(true) as HTMLElement
    for (const code of prose.querySelectorAll('code')) code.remove()
    expect(prose.textContent).not.toMatch(/[A-Za-z]{2,}/)
    expect(prose.textContent).toMatch(/\p{Script=Han}/u)
    for (const named of container.querySelectorAll('[aria-label], [title]')) {
      for (const attribute of ['aria-label', 'title']) expect(named.getAttribute(attribute) ?? '').not.toMatch(/[A-Za-z]{2,}/)
    }
    expect(await axe(container)).toHaveNoViolations()
  })
})
