import { act, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMemoryRouter, RouterProvider } from 'react-router'
import type { RouteObject } from 'react-router'
import { afterEach, describe, expect, it } from 'vitest'

import { Providers } from '@/app/Providers'
import { chatSlots } from '@/chat/slots'
import { Sonner, toast } from '@/components/feedback'
import { Page } from '@/components/layout'
import { compactQuery } from '@/hooks/use-mobile'
import { LOCALE_STORAGE_KEY } from '@/i18n'
import { createRuntime, RuntimeContext, type Runtime } from '@/runtime'
import { modulePath, Shell } from '@/shell'
import { expandedQuery } from '@/shell/use-media'
import { axe } from '@/test/axe'
import { setMediaQuery } from '@/test/match-media'

import { ThreadPage } from './ThreadPage'

// R-19 of docs/specs/lofi-prototype-shell.md, the `chat.thread` half: the
// header, the shell's bottom row as this chat's composer, and the four states
// of the messages under 状态预览. The bar, the panel, the switch and
// `chat.recent`: src/chat/chat-surfaces.test.tsx.

const confirmations = 'profession.appointments.sub.confirmations'
const canned = '原型只演示脚本中的对话。'
// What `src/app/NotFound.tsx` puts on its root (the matrix reads the same attribute).
const NOT_FOUND_ATTRIBUTE = 'data-route-not-found'

const routes: RouteObject[] = [
  {
    path: '/',
    element: (
      <>
        <Shell slots={chatSlots} />
        <Sonner position="top-center" />
      </>
    ),
    children: [
      { path: '/chat/:id', element: <ThreadPage /> },
      { path: '/topics/:id', element: <Page title="一个话题" /> },
      { path: '/m/:id', element: <Page title="一个功能" /> },
    ],
  },
]

function open(path: string, options: { scene?: string; preview?: string; locale?: 'zh-CN' | 'en' } = {}) {
  const { scene = 's2', preview, locale = 'zh-CN' } = options
  window.localStorage.setItem(LOCALE_STORAGE_KEY, locale)
  act(() => {
    setMediaQuery(compactQuery, false)
    setMediaQuery(expandedQuery, true)
  })
  const search = `?scene=${scene}${preview ? `&preview=${preview}` : ''}`
  const runtime: Runtime = createRuntime({ delay: 0, storage: null, search })
  const router = createMemoryRouter(routes, { initialEntries: [path] })
  const view = render(
    <Providers>
      <RuntimeContext value={runtime}>
        <RouterProvider router={router} />
      </RuntimeContext>
    </Providers>,
  )
  return { runtime, router, ...view }
}

afterEach(() => {
  act(() => toast.dismiss())
})

const main = () => within(screen.getByRole('main'))
const bar = () => screen.getByRole('region', { name: '与 AI 对话' })
const composer = () => within(bar()).getByRole('textbox', { name: '在这段对话中回复' })
const title = () => screen.findByRole('heading', { level: 1, name: '明天的预约确认' })
const pathOf = (router: { state: { location: { pathname: string } } }) => decodeURIComponent(router.state.location.pathname)

describe('chat.thread (R-19)', () => {
  it('the header: the conversation’s title, its topic, the module it concerns, the persistence switch', async () => {
    const { router } = open('/chat/conv-1')
    await title()
    const details = main().getByRole('list', { name: '关于这段对话' })
    const topic = within(details).getByRole('link', { name: '话题：预约确认' })
    const module = within(details).getByRole('link', { name: '功能：预约确认' })
    expect(decodeURIComponent(topic.getAttribute('href') ?? '')).toBe('/topics/confirmations')
    expect(decodeURIComponent(module.getAttribute('href') ?? '')).toBe(modulePath(confirmations))
    expect(main().getByRole('switch', { name: '设为长期' })).toBeChecked()

    // The messages are in `main`, after the header.
    const log = await main().findByRole('log')
    expect(await within(log).findByText('明天有哪些预约？帮我给顾客发确认。')).toBeInTheDocument()
    expect(details.compareDocumentPosition(log) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()

    await userEvent.click(topic)
    expect(pathOf(router)).toBe('/topics/confirmations')
  })

  it('the module link is left out once the sub-module is archived; a one-off chat has the switch off', async () => {
    const { runtime } = open('/chat/conv-1')
    await title()
    act(() => runtime.actions.archiveSubModule(confirmations))
    await waitFor(() => expect(main().queryByRole('link', { name: /^功能：/ })).not.toBeInTheDocument())
    expect(main().getByRole('link', { name: '话题：预约确认' })).toBeInTheDocument()
    await waitFor(() => expect(main().getByRole('switch', { name: '设为长期' })).not.toBeChecked())
  })

  it('the bottom bar is this chat’s composer: no suggestions, no panel; a reply is appended to the messages in main', async () => {
    const { router, runtime } = open('/chat/conv-1')
    await title()
    // One composer on the screen, in the shell's bottom row, after main.
    expect(screen.getAllByRole('textbox')).toEqual([composer()])
    expect(screen.getByRole('main').compareDocumentPosition(bar()) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    expect(within(bar()).queryByRole('list', { name: '可以这样问' })).not.toBeInTheDocument()
    expect(within(bar()).queryByRole('textbox', { name: '问 AI' })).not.toBeInTheDocument()

    const before = runtime.getState().conversations.find((conversation) => conversation.id === 'conv-1')?.messages.length ?? 0
    await userEvent.type(composer(), '后天的呢{Enter}')
    const log = main().getByRole('log')
    expect(await within(log).findByText('后天的呢')).toBeInTheDocument()
    expect(await within(log).findByText(canned)).toBeInTheDocument()
    await waitFor(() => expect(composer()).toHaveValue(''))

    // The same conversation grew by her message and the answer; nothing opened, nothing moved.
    const after = runtime.getState().conversations.find((conversation) => conversation.id === 'conv-1')?.messages
    expect(after).toHaveLength(before + 2)
    expect(runtime.getState().conversations.filter((conversation) => conversation.id !== 'conv-1' && conversation.messages.some((message) => message.text['zh-CN'] === '后天的呢'))).toEqual([])
    expect(within(bar()).queryByRole('group', { name: /^关于：/ })).not.toBeInTheDocument()
    expect(pathOf(router)).toBe('/chat/conv-1')
  })

  it('状态预览 empty: a chat that has just begun — her opening message and 正在思考', async () => {
    open('/chat/conv-1', { preview: 'empty' })
    await title()
    const log = await main().findByRole('log')
    expect(await within(log).findByText('明天有哪些预约？帮我给顾客发确认。')).toBeInTheDocument()
    expect(within(log).getByText('正在思考…')).toBeInTheDocument()
    expect(log.querySelectorAll('[data-author]')).toHaveLength(2)
    expect(within(log).queryByText(/明天的预约见下表/)).not.toBeInTheDocument()
  })

  it('状态预览 loading: the messages are loading; the header and the composer are there', async () => {
    open('/chat/conv-1', { preview: 'loading' })
    await title()
    await waitFor(() => expect(screen.getByRole('main').querySelector('[aria-busy="true"]')).toBeInTheDocument())
    expect(main().getByText('正在载入对话…')).toBeInTheDocument()
    expect(main().queryByRole('log')).not.toBeInTheDocument()
    expect(main().getByRole('switch', { name: '设为长期' })).toBeInTheDocument()
    expect(composer()).toBeEnabled()
  })

  it('状态预览 error: 无法载入这段对话 with 重试; the header still says which chat; the retry loads it', async () => {
    const { runtime } = open('/chat/conv-1', { preview: 'error' })
    await title()
    expect(await main().findByText('无法载入这段对话')).toBeInTheDocument()
    expect(main().getByText('消息没有载入成功。内容没有丢失，请重试。')).toBeInTheDocument()
    expect(main().queryByRole('log')).not.toBeInTheDocument()
    expect(main().getByRole('link', { name: '话题：预约确认' })).toBeInTheDocument()

    await userEvent.click(main().getByRole('button', { name: '重试' }))
    expect(await main().findByText('无法载入这段对话')).toBeInTheDocument()

    act(() => runtime.actions.setPreview('normal'))
    expect(await within(await main().findByRole('log')).findByText(/明天的预约见下表/)).toBeInTheDocument()
  })

  it('状态预览 long: the same chat, sixty messages in main, the last one very long and not cut', async () => {
    const { container } = open('/chat/conv-1', { preview: 'long' })
    await title()
    expect(container.querySelector(`[${NOT_FOUND_ATTRIBUTE}]`)).not.toBeInTheDocument()
    const log = await main().findByRole('log')
    await waitFor(() => expect(log.querySelectorAll('[data-author]')).toHaveLength(60))
    const texts = [...log.querySelectorAll('[data-author] p')]
    expect(Math.max(...texts.map((text) => text.textContent?.length ?? 0))).toBeGreaterThanOrEqual(2000)
    for (const element of log.querySelectorAll('*')) {
      expect([...element.classList].filter((name) => /^(?:truncate|line-clamp-\d)/.test(name))).toEqual([])
    }
    // The composer is not part of what scrolls.
    expect(screen.getByRole('main')).not.toContainElement(composer())
  })

  it('an address that names no conversation opens the not-found screen', async () => {
    const { container } = open('/chat/no-such-chat')
    await waitFor(() => expect(container.querySelector(`[${NOT_FOUND_ATTRIBUTE}]`)).toBeInTheDocument())
    expect(screen.queryByRole('log')).not.toBeInTheDocument()
  })

  it('en: the header and the composer are in English', async () => {
    open('/chat/conv-1', { locale: 'en' })
    expect(await screen.findByRole('heading', { level: 1, name: 'Tomorrow’s confirmations' })).toBeInTheDocument()
    const details = main().getByRole('list', { name: 'About this chat' })
    expect(within(details).getByRole('link', { name: /^Topic: / })).toBeInTheDocument()
    expect(within(details).getByRole('link', { name: /^Feature: / })).toBeInTheDocument()
    const region = screen.getByRole('region', { name: 'Chat with the AI' })
    expect(within(region).getByRole('textbox', { name: 'Reply in this chat' })).toBeInTheDocument()
  })

  it('has no accessibility violation, in the normal view and with a failed load', async () => {
    const first = open('/chat/conv-1')
    await title()
    await within(await main().findByRole('log')).findByText(/明天的预约见下表/)
    expect(await axe(first.container)).toHaveNoViolations()
    first.unmount()

    const second = open('/chat/conv-1', { preview: 'error' })
    await main().findByText('无法载入这段对话')
    expect(await axe(second.container)).toHaveNoViolations()
  })
})
