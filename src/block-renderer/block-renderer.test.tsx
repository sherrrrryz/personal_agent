import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState, type ReactElement } from 'react'
import { MemoryRouter } from 'react-router'
import { afterEach, describe, expect, it, vi } from 'vitest'

import type { BlockActionEvent, ChangeSet, PageBlock, PageDescription } from '@/blocks/types'
import { LocaleProvider, LOCALE_STORAGE_KEY, type Locale } from '@/i18n'
import { createRuntime, RuntimeContext, type Runtime } from '@/runtime'
import { axe } from '@/test/axe'

import BlockRendererDemo from './BlockRenderer.demo'
import { BlockRenderer, useModulePins } from './index'

// R-10 — `BlockRenderer`: refuses an unknown block id, pairs `span: half`,
// holds a pinned block where it is and says so, marks the titles a
// `ChangeSet` names and counts them.

function renderIn(locale: Locale, ui: ReactElement) {
  window.localStorage.setItem(LOCALE_STORAGE_KEY, locale)
  return render(
    <LocaleProvider>
      <MemoryRouter>{ui}</MemoryRouter>
    </LocaleProvider>,
  )
}

const text = (key: string, title: string, span: 'full' | 'half' = 'full'): PageBlock => ({
  key,
  block: 'block.text',
  title,
  span,
  props: { body: `${title}的内容` },
})

const proposal: PageBlock = {
  key: 'shifts',
  block: 'block.proposal',
  title: '排班建议',
  span: 'full',
  props: {
    mode: 'deferred',
    parts: [
      { id: 'p1', text: '把豆豆挪到 9:00', state: 'pending' },
      { id: 'p2', text: '请阿杰加班', state: 'pending' },
    ],
    source: { label: '排班' },
  },
}

const page = (...blocks: PageBlock[]): PageDescription => ({ blocks })
const titles = () => screen.getAllByRole('heading').map((heading) => heading.textContent)

afterEach(() => vi.restoreAllMocks())

describe('BlockRenderer — layout', () => {
  it('draws each block in a section named by its title, in the workflow’s order', async () => {
    const { container } = renderIn('zh-CN', <BlockRenderer page={page(text('a', '说明'), proposal, text('c', '下一步'))} />)
    expect(titles()).toEqual(['说明', '排班建议', '下一步'])
    for (const title of ['说明', '排班建议', '下一步']) {
      expect(within(screen.getByRole('region', { name: title })).getByRole('heading', { level: 2, name: title })).toBeInTheDocument()
    }
    expect(within(screen.getByRole('region', { name: '说明' })).getByText('说明的内容')).toBeInTheDocument()
    // No pin without `onTogglePin`: an attachment in the chat has none.
    expect(screen.queryByRole('button', { name: /固定/ })).not.toBeInTheDocument()
    expect(await axe(container)).toHaveNoViolations()
  })

  it('takes the heading level of its place in the page', () => {
    renderIn('zh-CN', <BlockRenderer level={4} page={page(text('a', '说明'))} />)
    expect(screen.getByRole('heading', { level: 4, name: '说明' })).toBeInTheDocument()
  })

  it('pairs half blocks from the @2xl container step: one column below it, two from it, by its own width', () => {
    const { container } = renderIn(
      'zh-CN',
      <BlockRenderer page={page(text('a', '甲', 'half'), text('b', '乙', 'half'), text('c', '丙'), text('d', '丁', 'half'))} />,
    )
    const root = container.querySelector('[data-slot="block-renderer"]')!
    // The renderer is the container that is asked, never the viewport.
    expect(root).toHaveClass('@container')
    const grid = root.querySelector('[data-block-key]')!.parentElement!
    expect(grid).toHaveClass('grid', 'grid-cols-1', '@2xl:grid-cols-2')
    const cell = (key: string) => root.querySelector(`[data-block-key="${key}"]`)!
    expect(cell('a')).toHaveAttribute('data-span', 'half')
    expect(cell('b')).toHaveAttribute('data-span', 'half')
    expect(cell('a')).not.toHaveClass('@2xl:col-span-2')
    expect(cell('c')).toHaveAttribute('data-span', 'full')
    expect(cell('c')).toHaveClass('@2xl:col-span-2')
    // A half block with no partner takes the row.
    expect(cell('d')).toHaveAttribute('data-span', 'full')
    expect(cell('d')).toHaveClass('@2xl:col-span-2')
  })
})

describe('BlockRenderer — an unknown block id', () => {
  const unknown = { key: 'chart', block: 'block.chart', title: '月度图表', span: 'full', props: {} } as unknown as PageBlock

  it('is refused: an error alert in its place, a line for the developer, the other blocks drawn', async () => {
    const logged = vi.spyOn(console, 'error').mockImplementation(() => {})
    const { container } = renderIn('zh-CN', <BlockRenderer page={page(text('a', '说明'), unknown)} />)
    const region = screen.getByRole('region', { name: '月度图表' })
    const alert = within(region).getByRole('alert')
    expect(alert).toHaveTextContent('无法显示这个区块')
    expect(alert).toHaveTextContent('block.chart')
    expect(logged).toHaveBeenCalledWith(expect.stringContaining('"block.chart"'))
    expect(within(screen.getByRole('region', { name: '说明' })).getByText('说明的内容')).toBeInTheDocument()
    expect(await axe(container)).toHaveNoViolations()
  })

  it('a registered id that the given registry lacks is refused the same way', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    renderIn('en', <BlockRenderer registry={new Map()} page={page(text('a', 'Note'))} />)
    expect(screen.getByRole('alert')).toHaveTextContent('This block cannot be shown')
    expect(screen.getByRole('alert')).toHaveTextContent('block.text')
  })
})

describe('BlockRenderer — pinning', () => {
  it('the pin is a toggle named after the block; using it reports the block and its drawn position, and is announced', async () => {
    const user = userEvent.setup()
    const onTogglePin = vi.fn()
    const { container } = renderIn(
      'zh-CN',
      <BlockRenderer page={page(text('a', '说明'), text('b', '下一步'))} pins={{ a: 0 }} onTogglePin={onTogglePin} />,
    )
    const pinned = screen.getByRole('button', { name: '固定「说明」' })
    const free = screen.getByRole('button', { name: '固定「下一步」' })
    expect(pinned).toHaveAttribute('aria-pressed', 'true')
    expect(free).toHaveAttribute('aria-pressed', 'false')
    // The name contains the visible label.
    expect(free).toHaveTextContent('固定')
    const status = container.querySelector('[data-slot="block-pin-status"]')!
    expect(status).toHaveAttribute('role', 'status')
    expect(status).toBeEmptyDOMElement()

    await user.click(free)
    expect(onTogglePin).toHaveBeenLastCalledWith('b', 1)
    expect(status).toHaveTextContent('已固定「下一步」。以后布局调整时，它留在现在的位置。')
    await user.click(pinned)
    expect(onTogglePin).toHaveBeenLastCalledWith('a', 0)
    expect(status).toHaveTextContent('已取消固定「说明」。它会随布局移动。')
    expect(await axe(container)).toHaveNoViolations()
  })

  function Module({ runtime, blocks }: { runtime: Runtime; blocks: PageBlock[] }) {
    const [order, setOrder] = useState(blocks)
    return (
      <RuntimeContext value={runtime}>
        <button type="button" onClick={() => setOrder((before) => [...before].reverse())}>
          reorder
        </button>
        <Pinned blocks={order} />
      </RuntimeContext>
    )
  }
  function Pinned({ blocks }: { blocks: PageBlock[] }) {
    return <BlockRenderer page={{ blocks }} {...useModulePins('appointments')} />
  }

  it('a pinned block keeps its index after the description is re-ordered; the pin is stored per module', async () => {
    const user = userEvent.setup()
    const runtime = createRuntime({ delay: 0, storage: null, search: '?scene=s1' })
    renderIn('zh-CN', <Module runtime={runtime} blocks={[text('a', '甲'), text('b', '乙'), text('c', '丙'), text('d', '丁')]} />)
    expect(titles()).toEqual(['甲', '乙', '丙', '丁'])

    await user.click(screen.getByRole('button', { name: '固定「乙」' }))
    expect(runtime.getState().pins).toEqual({ appointments: { b: 1 } })
    expect(screen.getByRole('button', { name: '固定「乙」' })).toHaveAttribute('aria-pressed', 'true')

    await user.click(screen.getByRole('button', { name: 'reorder' }))
    // The workflow now emits 丁 丙 乙 甲: 乙 holds the second place, the others flow around it.
    expect(titles()).toEqual(['丁', '乙', '丙', '甲'])
    await user.click(screen.getByRole('button', { name: 'reorder' }))
    expect(titles()).toEqual(['甲', '乙', '丙', '丁'])

    // Pinned where it is drawn, not where the description has it.
    await user.click(screen.getByRole('button', { name: 'reorder' }))
    await user.click(screen.getByRole('button', { name: '固定「丁」' }))
    expect(runtime.getState().pins).toEqual({ appointments: { b: 1, d: 0 } })
    await user.click(screen.getByRole('button', { name: 'reorder' }))
    expect(titles()).toEqual(['丁', '乙', '甲', '丙'])

    // Let go, it follows the workflow again.
    await user.click(screen.getByRole('button', { name: '固定「丁」' }))
    await user.click(screen.getByRole('button', { name: '固定「乙」' }))
    expect(runtime.getState().pins).toEqual({})
    expect(titles()).toEqual(['甲', '乙', '丙', '丁'])
  })

  it('keeps the content of a pinned block up to date', () => {
    const { rerender } = renderIn('zh-CN', <BlockRenderer page={page(text('a', '甲'), text('b', '乙'))} pins={{ b: 0 }} onTogglePin={() => {}} />)
    expect(titles()).toEqual(['乙', '甲'])
    const next = { ...text('b', '乙'), props: { body: '新的内容' } } as PageBlock
    rerender(
      <LocaleProvider>
        <MemoryRouter>
          <BlockRenderer page={page(text('a', '甲'), next)} pins={{ b: 0 }} onTogglePin={() => {}} />
        </MemoryRouter>
      </LocaleProvider>,
    )
    expect(within(screen.getByRole('region', { name: '乙' })).getByText('新的内容')).toBeInTheDocument()
  })
})

describe('BlockRenderer — what changed', () => {
  const blocks = page(text('a', '说明'), proposal, text('c', '下一步'))
  const changes: ChangeSet = { blocks: { a: { body: 'updated' }, shifts: { p1: 'new', p2: 'updated' } } }

  it.each([
    ['zh-CN', '本次运行：3 处更新', '已更新'],
    ['en', 'This run: 3 updates', 'Updated'],
  ] as const)('%s: marks the titles the set names and counts the changes in one line', async (locale, line, word) => {
    const { container } = renderIn(locale, <BlockRenderer page={blocks} changes={changes} />)
    const marked = screen.getAllByRole('heading').filter((heading) => heading.querySelector('[data-change]'))
    expect(marked.map((heading) => heading.textContent)).toEqual([`说明 ${word}`, `排班建议 ${word}`])
    // The marker is part of the heading, so of the section's name; the unmarked block has none.
    expect(screen.getByRole('region', { name: `说明 ${word}` })).toBeInTheDocument()
    expect(screen.getByRole('region', { name: '下一步' })).toBeInTheDocument()
    const count = container.querySelector('[data-slot="block-changes"]')!
    expect(count).toHaveAttribute('role', 'status')
    expect(count).toHaveTextContent(line)
    // The blocks mark their own items.
    expect(within(screen.getByRole('group', { name: '把豆豆挪到 9:00' })).getByText(locale === 'en' ? 'New' : '新')).toBeInTheDocument()
    expect(await axe(container)).toHaveNoViolations()
  })

  it('one update is singular in English; a block named without an item is one change', () => {
    renderIn('en', <BlockRenderer page={blocks} changes={{ blocks: { c: {} } }} />)
    expect(screen.getByText('This run: 1 update')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: '下一步 Updated' })).toBeInTheDocument()
  })

  it('the next run clears them: no mark and no line without changes', () => {
    const { container } = renderIn('zh-CN', <BlockRenderer page={blocks} />)
    expect(container.querySelector('[data-change]')).toBeNull()
    expect(container.querySelector('[data-slot="block-changes"]')).toBeEmptyDOMElement()
  })
})

describe('BlockRenderer — states and actions', () => {
  it('loading: the page is busy and says so; no block is drawn', () => {
    const { container } = renderIn('zh-CN', <BlockRenderer state="loading" page={page(text('a', '说明'))} />)
    expect(container.querySelector('[aria-busy="true"]')).not.toBeNull()
    expect(screen.getByText('加载中…')).toBeInTheDocument()
    expect(screen.queryByRole('region', { name: '说明' })).not.toBeInTheDocument()
  })

  it('empty: a page with no block says so, in the screen’s words when given', () => {
    const { unmount } = renderIn('zh-CN', <BlockRenderer page={page()} />)
    expect(screen.getByText('这个页面还没有内容')).toBeInTheDocument()
    unmount()
    renderIn('zh-CN', <BlockRenderer state="empty" page={page(text('a', '说明'))} empty={<p>还没有预约</p>} />)
    expect(screen.getByText('还没有预约')).toBeInTheDocument()
    expect(screen.queryByRole('region', { name: '说明' })).not.toBeInTheDocument()
  })

  it('error: the reason and a retry', async () => {
    const user = userEvent.setup()
    const onRetry = vi.fn()
    renderIn('en', <BlockRenderer state="error" page={page(text('a', 'Note'))} onRetry={onRetry} />)
    expect(screen.getByText('This page could not be loaded')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Try again' }))
    expect(onRetry).toHaveBeenCalledOnce()
  })

  it('one block can fail while the others answer', () => {
    renderIn('zh-CN', <BlockRenderer page={page(text('a', '说明'), text('c', '下一步'))} blockStates={{ a: 'error' }} />)
    expect(within(screen.getByRole('region', { name: '说明' })).getByText('这段说明没有写出来')).toBeInTheDocument()
    expect(within(screen.getByRole('region', { name: '下一步' })).getByText('下一步的内容')).toBeInTheDocument()
  })

  it('an action of a block reaches the caller with the block’s key', async () => {
    const user = userEvent.setup()
    const events: BlockActionEvent[] = []
    renderIn('zh-CN', <BlockRenderer page={page(proposal)} onAction={(event) => events.push(event)} />)
    await user.click(within(screen.getByRole('group', { name: '请阿杰加班' })).getByRole('button', { name: '拒绝' }))
    expect(events).toEqual([{ blockKey: 'shifts', actionId: 'reject', itemId: 'p2' }])
  })
})

describe('BlockRenderer — the demo', () => {
  it.each(['zh-CN', 'en'] as const)('%s: opens as after a run, shows both containers and the refused block, and has no violation', async (locale) => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    const user = userEvent.setup()
    const { container } = renderIn(locale, <BlockRendererDemo />)
    expect(container.querySelectorAll('[data-slot="block-renderer"]')).toHaveLength(4)
    expect(container.querySelector('[data-demo-container="narrow"]')).toHaveClass('max-w-xl')
    expect(container.querySelector('[data-demo-container="wide"]')).toHaveClass('max-w-3xl')
    expect(container.querySelector('[data-unknown-block="block.chart"]')).not.toBeNull()
    expect(container.querySelector('[data-slot="block-changes"]')).not.toBeEmptyDOMElement()
    expect(container.querySelector('[aria-busy="true"]')).toBeNull()
    expect(await axe(container)).toHaveNoViolations()

    // Pin the second block, re-order: it holds its place.
    const first = container.querySelector('[data-slot="block-renderer"]')!
    const drawn = () => [...first.querySelectorAll('[data-block-key]')].map((cell) => cell.getAttribute('data-block-key'))
    const before = drawn()
    const pin = within(first.querySelector(`[data-block-key="${before[1]}"]`) as HTMLElement).getByRole('button', { pressed: false })
    await user.click(pin)
    await user.click(screen.getByRole('button', { name: locale === 'en' ? 'Re-order the workflow’s output' : '调整工作流的输出顺序' }))
    expect(drawn()[1]).toBe(before[1])
    expect(drawn()).not.toEqual(before)
  })
})
