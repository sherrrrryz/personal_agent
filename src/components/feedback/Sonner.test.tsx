import { act, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ReactNode } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { LocaleProvider, LOCALE_STORAGE_KEY, translate, type Locale } from '@/i18n'
import { axe } from '@/test/axe'
import { THEME_STORAGE_KEY, ThemeProvider } from '@/theme'

import { Sonner, toast, toastKinds } from './index'

// Component evidence for `Sonner` (A-15): the toaster and `toast(…)`.

function show(node: ReactNode = <Sonner />, locale: Locale = 'zh-CN') {
  window.localStorage.setItem(LOCALE_STORAGE_KEY, locale)
  return render(
    <ThemeProvider>
      <LocaleProvider>{node}</LocaleProvider>
    </ThemeProvider>,
  )
}

const raise = (...args: Parameters<typeof toast>) => act(() => toast(...args))
const region = () => document.querySelector('section[aria-live]')!
const closeName = translate('zh-CN', 'feedback', 'sonner.close')

afterEach(() => act(() => toast.dismiss()))

describe('Sonner', () => {
  it('is a polite live region named from the messages; only the key chord of its shortcut is not translated', () => {
    show()
    expect(region()).toHaveAttribute('aria-live', 'polite')
    // The library appends the shortcut that moves focus to the toasts: key names, not words.
    expect(region()).toHaveAttribute('aria-label', `${translate('zh-CN', 'feedback', 'sonner.region')} alt+T`)
  })

  it('names the region in English in en', () => {
    show(<Sonner />, 'en')
    expect(region()).toHaveAttribute('aria-label', 'Notifications alt+T')
  })

  it('shows a toast as the library and the kit draw it, with its description, an action and a named close control', async () => {
    const onClick = vi.fn()
    show()
    raise('已移除「商品与库存」', { description: '可以撤销。', action: { label: '撤销', onClick } })
    const item = await screen.findByRole('listitem')
    expect(item).toHaveTextContent('已移除「商品与库存」')
    expect(item).toHaveTextContent('可以撤销。')
    // Stock (D-43): the library's own styling, with the kit's class on the toast.
    expect(item).toHaveAttribute('data-styled', 'true')
    expect(item).toHaveClass('cn-toast')
    const close = within(item).getByRole('button', { name: closeName })
    const action = within(item).getByRole('button', { name: '撤销' })
    // The close control comes first in the page and is not moved on screen: focus order is reading order.
    expect(within(item).getAllByRole('button')).toEqual([close, action])
    await userEvent.click(action)
    expect(onClick).toHaveBeenCalledTimes(1)
    expect(await axe(document.body)).toHaveNoViolations()
  })

  it.each(toastKinds)('kind %s: told by an icon, never by colour', async (kind) => {
    show()
    raise('提醒没有发出', { kind })
    const item = await screen.findByRole('listitem')
    if (kind !== 'plain') expect(item).toHaveAttribute('data-type', kind)
    expect(item.querySelector('[data-icon] svg') !== null).toBe(kind !== 'plain')
  })

  it('follows our ThemeProvider, not a provider the kit expects', async () => {
    window.localStorage.setItem(THEME_STORAGE_KEY, 'dark')
    show()
    raise('已保存')
    await screen.findByRole('listitem')
    expect(document.querySelector('[data-sonner-toaster]')).toHaveAttribute('data-sonner-theme', 'dark')
  })

  it('a toast replaces the one with the same id; a persistent one outlives the others; dismiss removes it', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    const pass = async (ms: number) => {
      // In steps: each removal is a chain of short timers and renders.
      for (let waited = 0; waited < ms; waited += 250) await act(() => vi.advanceTimersByTimeAsync(250))
    }
    try {
      show()
      raise('第一条', { id: 'one', persistent: true })
      raise('第二条', { id: 'one', persistent: true })
      raise('一会儿就消失')
      await pass(500)
      expect(screen.getAllByRole('listitem').map((item) => item.textContent)).toEqual(['一会儿就消失', '第二条'])
      await pass(20_000)
      expect(screen.getAllByRole('listitem').map((item) => item.textContent)).toEqual(['第二条'])
      act(() => toast.dismiss('one'))
      await pass(2_000)
      expect(screen.queryByRole('listitem')).toBeNull()
    } finally {
      vi.useRealTimers()
    }
  })

  it('a second toaster has a name of its own and shows only the toasts raised for it', async () => {
    show(
      <>
        <Sonner />
        <Sonner id="side" label="侧栏里的通知" />
      </>,
    )
    // Two regions with one name could not be told apart (axe `landmark-unique`; the merged gallery, I3).
    const names = [...document.querySelectorAll('section[aria-live]')].map((section) => section.getAttribute('aria-label'))
    expect(names).toEqual([`${translate('zh-CN', 'feedback', 'sonner.region')} alt+T`, '侧栏里的通知 alt+T'])
    raise('只在第二个里', { toasterId: 'side' })
    expect(await screen.findAllByRole('listitem')).toHaveLength(1)
    expect(screen.getByRole('region', { name: /^侧栏里的通知/ })).toContainElement(screen.getByRole('listitem'))
    expect(await axe(document.body)).toHaveNoViolations()
  })

  it('Tab goes into a toast and on past it; pressing a button in it, or Escape, returns focus to where it was', async () => {
    show(
      <>
        <button type="button">之前</button>
        <Sonner />
        <button type="button">之后</button>
      </>,
    )
    raise('已保存', { persistent: true, action: { label: '撤销', onClick: () => {} } })
    const item = await screen.findByRole('listitem')
    const before = screen.getByRole('button', { name: '之前' })
    await userEvent.tab()
    expect(before).toHaveFocus()
    await userEvent.tab()
    expect(item).toHaveFocus()
    await userEvent.tab()
    expect(within(item).getByRole('button', { name: closeName })).toHaveFocus()
    await userEvent.tab()
    expect(within(item).getByRole('button', { name: '撤销' })).toHaveFocus()
    // The library would send focus back to "之前" here, for as long as a toast is open.
    await userEvent.tab()
    expect(screen.getByRole('button', { name: '之后' })).toHaveFocus()

    await userEvent.tab({ shift: true })
    expect(within(item).getByRole('button', { name: '撤销' })).toHaveFocus()
    await userEvent.keyboard('{Escape}')
    expect(screen.getByRole('button', { name: '之后' })).toHaveFocus()

    before.focus()
    await userEvent.tab()
    await userEvent.tab()
    await userEvent.keyboard('{Enter}')
    expect(before).toHaveFocus()
  })
})
