import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState, type ComponentType, type ReactElement } from 'react'
import { MemoryRouter } from 'react-router'
import { describe, expect, it, vi } from 'vitest'

import { definition as emptyBlock } from '@/blocks/empty'
import EmptyBlockDemo from '@/blocks/empty/block.empty.demo'
import { definition as proposalBlock, ProposalCard } from '@/blocks/proposal'
import ProposalCardDemo from '@/blocks/proposal/block.proposal.demo'
import { definition as textBlock, TextBlock } from '@/blocks/text'
import TextBlockDemo from '@/blocks/text/block.text.demo'
import type { BlockComponentProps, BlockDataState, ProposalBlockProps } from '@/blocks/types'
import { LocaleProvider, LOCALE_STORAGE_KEY, translate, type Locale } from '@/i18n'
import { axe } from '@/test/axe'

import { demoStates } from './demo-state'
import type { AnyBlockDefinition } from './registry'

// R-11 — component evidence for `block.text`, `block.empty` and
// `block.proposal`: each in ready, loading, empty, error and long, in both
// locales, marking the items its `ChangeSet` names.

const locales = ['zh-CN', 'en'] as const satisfies readonly Locale[]
const definitions: AnyBlockDefinition[] = [textBlock, emptyBlock, proposalBlock]

function renderIn(locale: Locale, ui: ReactElement) {
  window.localStorage.setItem(LOCALE_STORAGE_KEY, locale)
  return render(
    <LocaleProvider>
      <MemoryRouter>{ui}</MemoryRouter>
    </LocaleProvider>,
  )
}

/** What each block says in a state it draws itself, per locale: `[zh-CN, en]`. */
const said: Record<string, Partial<Record<BlockDataState, readonly [string, string]>>> = {
  'block.text': {
    empty: ['还没有说明', 'No note yet'],
    error: ['这段说明没有写出来', 'This note could not be written'],
  },
  'block.empty': {
    // It is the empty state: `empty` shows the block's own statement.
    empty: ['今天没有待办', 'Nothing to do today'],
    error: ['无法载入这一部分', 'This part could not be loaded'],
  },
  'block.proposal': {
    empty: ['没有待你决定的建议', 'No proposal is waiting for you'],
    error: ['无法载入这条建议', 'This proposal could not be loaded'],
  },
}

describe.each(definitions.map((definition) => [definition.id, definition] as const))('%s', (id, definition) => {
  const Component = definition.Component as ComponentType<BlockComponentProps>
  const cases = locales.flatMap((locale) => demoStates.map((state) => [locale, state] as const))

  it.each(cases)('%s, %s: draws the state, marks what the change set names, no violation', async (locale, state) => {
    const demo = definition.demo(locale)
    const content = state === 'long' ? demo.long : demo.props
    const dataState: BlockDataState = state === 'long' ? 'ready' : state
    const { container } = renderIn(locale, <Component props={content} changes={demo.changes} state={dataState} onAction={() => {}} />)
    const root = container.querySelector('[data-slot="data-state"]')!
    const drawn = id === 'block.empty' && dataState === 'empty' ? 'ready' : dataState
    expect(root).toHaveAttribute('data-state', drawn)
    // No title of its own and no outer margin: the renderer's section has both.
    expect(container.querySelector('h1, h2, h3, h4, h5, h6')).toBeNull()
    expect(root.className).not.toMatch(/(^|\s)-?m[trblxyse]?-/)

    const marks = [...container.querySelectorAll('[data-change]')].map((mark) => mark.getAttribute('data-change'))
    if (drawn === 'ready') {
      // Every item the change set names is in the demo's content, and each is marked with its kind.
      expect(marks.sort()).toEqual(Object.values(demo.changes).sort())
      expect(container.querySelector('[aria-busy="true"]')).toBeNull()
    } else {
      expect(marks).toEqual([])
    }
    if (dataState === 'loading') {
      expect(container.querySelector('[aria-busy="true"]')).not.toBeNull()
      expect(screen.getByRole('status')).toHaveTextContent(translate(locale, 'common', 'status.loading'))
    }
    const expected = said[id][dataState]
    if (expected) expect(screen.getByText(expected[locales.indexOf(locale)])).toBeInTheDocument()
    expect(await axe(container)).toHaveNoViolations()
  })

  it('nothing is marked without changes', () => {
    const { container } = renderIn('zh-CN', <Component props={definition.demo('zh-CN').props} changes={{}} state="ready" />)
    expect(container.querySelector('[data-change]')).toBeNull()
  })

  it('the long content is longer than the usual one', () => {
    const demo = definition.demo('en')
    expect(JSON.stringify(demo.long).length).toBeGreaterThan(JSON.stringify(demo.props).length * 2)
  })
})

describe('block.text', () => {
  it('splits the body into paragraphs at a reading measure and lists the links', () => {
    const { container } = renderIn(
      'zh-CN',
      <TextBlock
        props={{ body: '第一段。\n\n第二段。\n \n第三段。', links: [{ label: '品种表', href: '/m/duration' }, { label: '外部说明', href: 'https://example.com/a' }] }}
        changes={{ '/m/duration': 'new' }}
        state="ready"
      />,
    )
    const block = container.querySelector('[data-slot="block-text"]')!
    expect(block).toHaveClass('max-w-prose')
    expect([...block.querySelectorAll(':scope > p')].map((p) => p.textContent)).toEqual(['第一段。', '第二段。', '第三段。'])
    const links = within(screen.getByRole('list', { name: '相关链接' })).getAllByRole('link')
    expect(links.map((link) => link.getAttribute('href'))).toEqual(['/m/duration', 'https://example.com/a'])
    for (const link of links) {
      expect(link).toHaveClass('underline')
      expect(link.className).not.toMatch(/-target\b/)
    }
    // The marker stands beside the link it names, not inside it.
    expect(within(links[0].closest('li')!).getByText('新')).toBeInTheDocument()
    expect(links[0]).toHaveTextContent(/^品种表$/)
  })

  it('a note with no text and no link is empty; links alone are shown', () => {
    const { unmount } = renderIn('en', <TextBlock props={{ body: '  \n\n ' }} changes={{}} state="ready" />)
    expect(screen.getByText('No note yet')).toBeInTheDocument()
    unmount()
    renderIn('en', <TextBlock props={{ body: '', links: [{ label: 'Breed table', href: '/m/duration' }] }} changes={{}} state="ready" />)
    expect(screen.getByRole('link', { name: 'Breed table' })).toBeInTheDocument()
  })
})

describe('block.empty', () => {
  const Component = emptyBlock.Component

  it('says what is empty and offers one next step, a link drawn as the kit’s button', () => {
    const { props } = emptyBlock.demo('zh-CN')
    renderIn('zh-CN', <Component props={props} changes={{ action: 'new' }} state="ready" />)
    expect(screen.getByText('今天没有待办')).toBeInTheDocument()
    const action = screen.getByRole('link', { name: '去看今天的预约' })
    expect(action).toHaveAttribute('href', '/m/appointments')
    expect(action).toHaveClass('min-h-8')
    expect(screen.getByText('新')).toBeInTheDocument()
  })

  it('has no link when the page has no next step', () => {
    renderIn('en', <Component props={{ title: 'No mail', body: 'Connect an account first.' }} changes={{}} state="ready" />)
    expect(screen.getByText('No mail')).toBeInTheDocument()
    expect(screen.queryByRole('link')).not.toBeInTheDocument()
  })
})

describe('block.proposal', () => {
  const three: ProposalBlockProps = {
    mode: 'deferred',
    summary: '周六排不开。',
    parts: [
      { id: 'p1', text: '把豆豆挪到 9:00', state: 'pending' },
      { id: 'p2', text: '请阿杰加班', state: 'accepted' },
      { id: 'p3', text: '给主人发消息', state: 'pending' },
    ],
    source: { label: '排班', href: '/m/shifts' },
  }

  /** A caller that applies each decision, as a module's handler does through `resolveProposalPart`. */
  function Live({ start, seen }: { start: ProposalBlockProps; seen?: (actionId: string, partId: string) => void }) {
    const [props, setProps] = useState(start)
    return (
      <ProposalCard
        props={props}
        changes={{}}
        state="ready"
        onAction={(actionId, partId) => {
          seen?.(actionId, partId)
          setProps((before) => ({
            ...before,
            parts: before.parts.map((part) => (part.id === partId ? { ...part, state: actionId === 'accept' ? 'accepted' : 'rejected' } : part)),
          }))
        }}
      />
    )
  }

  /** The card's own status line (its `DataState` has a status region too). */
  const statusLine = () => document.querySelector<HTMLElement>('[data-slot="block-proposal"] p[role="status"]')!

  it('shows the mode, the source and the lead-in; each part is a group named by its text', () => {
    renderIn('zh-CN', <Live start={three} />)
    expect(screen.getByText('待确认')).toHaveAttribute('data-mode', 'deferred')
    expect(screen.getByRole('link', { name: '排班' })).toHaveAttribute('href', '/m/shifts')
    expect(screen.getByText('周六排不开。')).toBeInTheDocument()
    const parts = within(screen.getByRole('list', { name: '建议的各项' })).getAllByRole('group')
    expect(parts.map((part) => part.getAttribute('aria-labelledby')).every(Boolean)).toBe(true)
    const waiting = screen.getByRole('group', { name: '把豆豆挪到 9:00' })
    const accept = within(waiting).getByRole('button', { name: '接受' })
    const reject = within(waiting).getByRole('button', { name: '拒绝' })
    // 接受 and 拒绝 repeat on every part: each is described by the part it decides.
    expect(accept).toHaveAccessibleDescription('把豆豆挪到 9:00')
    expect(reject).toHaveAccessibleDescription('把豆豆挪到 9:00')
    // A decided part says so in words and has no buttons.
    const decided = screen.getByRole('group', { name: '请阿杰加班' })
    expect(within(decided).getByText('已接受')).toBeInTheDocument()
    expect(within(decided).queryByRole('button')).not.toBeInTheDocument()
    expect(screen.getByText('还有 2 项待你决定。')).toHaveAttribute('role', 'status')
  })

  it('reports the decision and moves focus to the next part still waiting, then to the status line', async () => {
    const user = userEvent.setup()
    const seen = vi.fn()
    renderIn('zh-CN', <Live start={three} seen={seen} />)

    await user.click(within(screen.getByRole('group', { name: '把豆豆挪到 9:00' })).getByRole('button', { name: '接受' }))
    expect(seen).toHaveBeenLastCalledWith('accept', 'p1')
    expect(within(screen.getByRole('group', { name: '把豆豆挪到 9:00' })).getByText('已接受')).toBeInTheDocument()
    // p2 is decided already: the next one waiting is p3.
    expect(within(screen.getByRole('group', { name: '给主人发消息' })).getByRole('button', { name: '接受' })).toHaveFocus()
    expect(statusLine()).toHaveTextContent('还有 1 项待你决定。')

    await user.keyboard('{Tab}{Enter}')
    expect(seen).toHaveBeenLastCalledWith('reject', 'p3')
    expect(within(screen.getByRole('group', { name: '给主人发消息' })).getByText('已拒绝')).toBeInTheDocument()
    const status = statusLine()
    expect(status).toHaveTextContent('全部已处理：接受 2 项，拒绝 1 项。')
    expect(status).toHaveFocus()
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })

  it('from the last part focus wraps to an earlier part still waiting', async () => {
    const user = userEvent.setup()
    renderIn('en', <Live start={three} />)
    await user.click(within(screen.getByRole('group', { name: '给主人发消息' })).getByRole('button', { name: 'Reject' }))
    expect(within(screen.getByRole('group', { name: '把豆豆挪到 9:00' })).getByRole('button', { name: 'Accept' })).toHaveFocus()
    expect(statusLine()).toHaveTextContent('1 part is waiting for your decision.')
  })

  it('without an action handler it is read only: a waiting part says it waits', () => {
    renderIn('zh-CN', <ProposalCard props={three} changes={{}} state="ready" />)
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
    expect(within(screen.getByRole('group', { name: '把豆豆挪到 9:00' })).getByText('待你决定')).toBeInTheDocument()
  })

  it('a source without a link is text', () => {
    renderIn('zh-CN', <ProposalCard props={{ ...three, source: { label: '排班' } }} changes={{}} state="ready" />)
    expect(screen.queryByRole('link')).not.toBeInTheDocument()
    expect(screen.getByText('排班')).toBeInTheDocument()
  })
})

describe('the block demos', () => {
  it.each([
    ['block.text', TextBlockDemo],
    ['block.empty', EmptyBlockDemo],
    ['block.proposal', ProposalCardDemo],
  ] as const)('%s: every state can be picked, and none starts busy', async (_id, Demo) => {
    const user = userEvent.setup()
    const { container } = renderIn('zh-CN', <Demo />)
    expect(container.querySelector('[aria-busy="true"]')).toBeNull()
    expect(container.querySelector('[data-change]')).not.toBeNull()
    for (const [name, state] of [['加载中', 'loading'], ['出错', 'error'], ['超长内容', 'ready']] as const) {
      await user.click(screen.getByRole('button', { name }))
      expect(container.querySelector('[data-slot="data-state"]')).toHaveAttribute('data-state', state)
    }
    await user.click(screen.getByRole('button', { name: '标出上次运行的变化' }))
    expect(container.querySelector('[data-change]')).toBeNull()
    expect(await axe(container)).toHaveNoViolations()
  })

  it('the proposal demo answers its buttons and starts over', async () => {
    const user = userEvent.setup()
    renderIn('en', <ProposalCardDemo />)
    const before = screen.getAllByRole('button', { name: 'Accept' }).length
    await user.click(screen.getAllByRole('button', { name: 'Accept' })[0])
    expect(screen.getAllByRole('button', { name: 'Accept' })).toHaveLength(before - 1)
    await user.click(screen.getByRole('button', { name: 'Start over' }))
    expect(screen.getAllByRole('button', { name: 'Accept' })).toHaveLength(before)
  })
})
