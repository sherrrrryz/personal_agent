import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ReactNode } from 'react'
import { describe, expect, it, vi } from 'vitest'

import { LocaleProvider, LOCALE_STORAGE_KEY, translate, type Locale } from '@/i18n'
import { axe } from '@/test/axe'

import { DataState, dataStates, Empty, EmptyHeader, EmptyTitle, type DataStateProps } from './index'

// Component evidence for `DataState` (A-15): its four states and what each one announces.

function show(props: DataStateProps, locale: Locale = 'zh-CN') {
  window.localStorage.setItem(LOCALE_STORAGE_KEY, locale)
  const wrap = (node: ReactNode) => <LocaleProvider>{node}</LocaleProvider>
  const view = render(wrap(<DataState {...props} />))
  return { ...view, update: (next: DataStateProps) => view.rerender(wrap(<DataState {...next} />)) }
}

const data = <p>毛毛 — 洗澡加修剪</p>
const content = (container: HTMLElement) => container.querySelector('[data-slot="data-state-content"]')!

describe('DataState', () => {
  it('ready: shows the data, is not busy, and says nothing', () => {
    const { container } = show({ state: 'ready', children: data })
    expect(screen.getByText('毛毛 — 洗澡加修剪')).toBeInTheDocument()
    expect(screen.getByRole('status')).toBeEmptyDOMElement()
    expect(content(container)).not.toHaveAttribute('aria-busy')
    expect(container.querySelector('[aria-busy]')).toBeNull()
  })

  it('loading: the content region is aria-busy, the status text is in the live region, the skeleton is hidden from assistive technology', () => {
    const { container } = show({ state: 'loading', children: data })
    expect(content(container)).toHaveAttribute('aria-busy', 'true')
    expect(screen.getByRole('status')).toHaveTextContent(translate('zh-CN', 'common', 'status.loading'))
    // The live region is outside the busy region, so its text is not held back.
    expect(content(container)).not.toContainElement(screen.getByRole('status'))
    expect(screen.queryByText('毛毛 — 洗澡加修剪')).toBeNull()
    const skeletons = container.querySelectorAll('[data-slot="skeleton"]')
    expect(skeletons.length).toBeGreaterThan(0)
    for (const skeleton of skeletons) expect(skeleton.closest('[aria-hidden="true"]')).not.toBeNull()
    // The spinner is decoration beside the text: no second status role, no name of its own.
    expect(screen.getAllByRole('status')).toHaveLength(1)
    expect(container.querySelector('[data-slot="spinner"]')).toHaveAttribute('aria-hidden', 'true')
  })

  it('loading: takes its own label and a skeleton shaped like the content', () => {
    const { container } = show({ state: 'loading', loadingLabel: '正在载入今天的预约…', loading: <div data-testid="shape" /> })
    expect(screen.getByRole('status')).toHaveTextContent('正在载入今天的预约…')
    expect(within(content(container) as HTMLElement).getByTestId('shape').closest('[aria-hidden="true"]')).not.toBeNull()
  })

  it('empty: the built-in title, or the slot, inside the live region', () => {
    const { update } = show({ state: 'empty', children: data })
    expect(screen.getByRole('status')).toHaveTextContent(translate('zh-CN', 'feedback', 'dataState.empty.title'))
    expect(screen.queryByText('毛毛 — 洗澡加修剪')).toBeNull()
    update({
      state: 'empty',
      empty: (
        <Empty>
          <EmptyHeader>
            <EmptyTitle>今天没有预约</EmptyTitle>
          </EmptyHeader>
        </Empty>
      ),
    })
    expect(screen.getByRole('status')).toHaveTextContent('今天没有预约')
    expect(screen.getByRole('status').querySelector('[data-slot="empty"]')).not.toBeNull()
    expect(screen.getByRole('status')).not.toHaveTextContent(translate('zh-CN', 'feedback', 'dataState.empty.title'))
  })

  it('error: an alert with the reason, announced politely — the kit’s assertive role is not used', () => {
    const { container } = show({ state: 'error', errorTitle: '无法载入今天的预约', error: '网络连接断开了。' })
    const status = screen.getByRole('status')
    expect(status.querySelector('[data-slot="alert"]')).not.toBeNull()
    expect(status).toHaveTextContent('无法载入今天的预约')
    expect(status).toHaveTextContent('网络连接断开了。')
    expect(screen.queryByRole('alert')).toBeNull()
    // Danger is carried by an icon and by words, not by colour.
    expect(status.querySelector('svg[aria-hidden="true"]')).not.toBeNull()
    // No retry handler, no retry button.
    expect(screen.queryByRole('button')).toBeNull()
    expect(content(container)).toBeEmptyDOMElement()
  })

  it('error: built-in title and reason when none is passed', () => {
    show({ state: 'error' })
    expect(screen.getByRole('status')).toHaveTextContent(translate('zh-CN', 'feedback', 'dataState.error.title'))
    expect(screen.getByRole('status')).toHaveTextContent(translate('zh-CN', 'feedback', 'dataState.error.reason'))
  })

  it('error: the retry button is reached by Tab, pressed by Enter, and hands focus to the status region', async () => {
    const onRetry = vi.fn()
    show({ state: 'error', onRetry })
    const retry = screen.getByRole('button', { name: translate('zh-CN', 'common', 'action.retry') })
    expect(retry).toHaveClass('min-h-target', 'min-w-target')
    await userEvent.tab()
    expect(retry).toHaveFocus()
    await userEvent.keyboard('{Enter}')
    expect(onRetry).toHaveBeenCalledTimes(1)
    // The button is about to be replaced by the loading state; focus is not dropped on the page.
    expect(screen.getByRole('status')).toHaveFocus()
    expect(screen.getByRole('status')).toHaveAttribute('tabindex', '-1')
  })

  it('announces every change in one live region that is never replaced', () => {
    const { update } = show({ state: 'loading', children: data })
    const status = screen.getByRole('status')
    const seen = [status.textContent]
    for (const state of ['error', 'loading', 'empty', 'loading', 'ready'] as const) {
      update({ state, children: data })
      // The same element throughout: a live region that is swapped for a new one announces nothing.
      expect(screen.getByRole('status')).toBe(status)
      seen.push(status.textContent)
    }
    const loading = translate('zh-CN', 'common', 'status.loading')
    expect(seen).toEqual([
      loading,
      expect.stringContaining(translate('zh-CN', 'feedback', 'dataState.error.title')),
      loading,
      translate('zh-CN', 'feedback', 'dataState.empty.title'),
      loading,
      translate('zh-CN', 'feedback', 'dataState.loaded'),
    ])
    // "Loaded." is for assistive technology only; the data is what sighted users see.
    expect(status.firstElementChild).toHaveClass('sr-only')
    expect(screen.getByText('毛毛 — 洗澡加修剪')).toBeInTheDocument()
    // Polite, by the role's own default; nothing forces it assertive.
    expect(status).not.toHaveAttribute('aria-live', 'assertive')
  })

  it.each(dataStates)('%s: no axe violation, and English texts in en', async (state) => {
    const { container } = show({ state, children: data, onRetry: () => {} }, 'en')
    expect(await axe(container)).toHaveNoViolations()
    if (state === 'loading') expect(screen.getByRole('status')).toHaveTextContent('Loading…')
    if (state === 'empty') expect(screen.getByRole('status')).toHaveTextContent('Nothing here yet')
    if (state === 'error') expect(screen.getByRole('button', { name: 'Try again' })).toBeInTheDocument()
  })

  it.each(dataStates)('%s in zh-CN: no English text or name', (state) => {
    const { container } = show({ state, onRetry: () => {} })
    expect(container.textContent).not.toMatch(/[A-Za-z]{2,}/)
    for (const named of container.querySelectorAll('[aria-label], [title]')) {
      expect(`${named.getAttribute('aria-label')} ${named.getAttribute('title')}`.replaceAll('null', '')).not.toMatch(/[A-Za-z]{2,}/)
    }
  })
})
