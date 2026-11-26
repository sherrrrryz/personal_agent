import { act, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMemoryRouter, RouterProvider, useParams } from 'react-router'
import type { RouteObject } from 'react-router'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { Providers } from '@/app/Providers'
import { Sonner, toast } from '@/components/feedback'
import { Page } from '@/components/layout'
import { compactQuery } from '@/hooks/use-mobile'
import { LOCALE_STORAGE_KEY } from '@/i18n'
import { createRuntime, findModule, resolveModule, RuntimeContext, useRuntimeState, workflowOf, type Runtime, type RuntimeOptions } from '@/runtime'
import { ThreadPage } from '@/screens/chat/ThreadPage'
import { Shell } from '@/shell'
import { expandedQuery } from '@/shell/use-media'
import { axe } from '@/test/axe'
import { setMediaQuery } from '@/test/match-media'

import { RECENT_STORAGE_KEY } from './RecentGroup'
import { chatSlots } from './slots'

// R-17 – R-20 of docs/specs/lofi-prototype-shell.md: the chat bar and its
// in-place panel, one-off ↔ persistent, the recent list, and where the bar
// sits in the shell. `chat.thread` itself: src/screens/chat/thread.test.tsx.

const appointments = 'profession.appointments'
const confirmations = 'profession.appointments.sub.confirmations'
const duration = 'profession.appointments.sub.duration'

const confirmPrompt = '明天有哪些预约？帮我给顾客发确认。'
const heroPrompt = '我给长毛大狗做一次要 4 小时，短毛小狗 2 小时左右。以后帮我按狗的品种和毛长估时间，预约和排班都按这个来。'
const threadPrompt = '帮我想想下个月的店庆活动怎么做'
const reviewPrompt = '把每周复盘改到周一早上 9 点'
const canned = '原型只演示脚本中的对话。'

function ModulePage({ view }: { view?: string }) {
  const { id = '' } = useParams()
  const state = useRuntimeState()
  const name = resolveModule(state, id)?.module.name['zh-CN'] ?? id
  return (
    <Page title={view ?? name}>
      <button type="button">页面按钮</button>
    </Page>
  )
}

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
      { path: '/m/:id', element: <ModulePage /> },
      { path: '/m/:id/workflow', element: <ModulePage view="工作流" /> },
      { path: '/topics', element: <Page title="话题" /> },
      { path: '/topics/:id', element: <Page title="一个话题" /> },
      { path: '/chat/:id', element: <ThreadPage /> },
    ],
  },
]

type Size = 'compact' | 'medium' | 'expanded'

function open(
  path: string,
  options: { scene?: string; preview?: string; locale?: 'zh-CN' | 'en'; size?: Size; runtime?: RuntimeOptions } = {},
) {
  const { scene = 'e1', preview, locale = 'zh-CN', size = 'expanded' } = options
  window.localStorage.setItem(LOCALE_STORAGE_KEY, locale)
  act(() => {
    setMediaQuery(compactQuery, size === 'compact')
    setMediaQuery(expandedQuery, size === 'expanded')
  })
  const search = `?scene=${scene}${preview ? `&preview=${preview}` : ''}`
  const runtime: Runtime = createRuntime({ delay: 0, storage: null, search, ...options.runtime })
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

const bar = () => screen.getByRole('region', { name: '与 AI 对话' })
const composer = () => within(bar()).getByRole('textbox', { name: '问 AI' })
const panel = (name: string | RegExp = /^关于：/) => within(bar()).getByRole('group', { name })
const queryPanel = () => within(bar()).queryByRole('group', { name: /^关于：/ })
const nav = () => screen.getByRole('navigation', { name: '模块导航' })
const pathOf = (router: { state: { location: { pathname: string } } }) => decodeURIComponent(router.state.location.pathname)

async function ask(text: string) {
  await userEvent.type(composer(), `${text}{Enter}`)
}

describe('the chat bar and its in-place panel (R-17)', () => {
  it('offers the scene’s scripted prompts while nothing is typed, at most three', async () => {
    open(`/m/${appointments}`)
    await screen.findByRole('heading', { level: 1, name: '预约' })
    const suggestions = within(bar()).getByRole('list', { name: '可以这样问' })
    expect(within(suggestions).getAllByRole('button').map((button) => button.textContent)).toEqual([confirmPrompt])
    expect(within(suggestions).getAllByRole('button').length).toBeLessThanOrEqual(3)

    await userEvent.type(composer(), '明')
    expect(within(bar()).queryByRole('list', { name: '可以这样问' })).not.toBeInTheDocument()
    await userEvent.clear(composer())
    expect(within(bar()).getByRole('list', { name: '可以这样问' })).toBeInTheDocument()
    expect(queryPanel()).not.toBeInTheDocument()
  })

  it('a scripted in-place prompt opens the panel above the composer, named after the screen; the screen behind stays in use', async () => {
    const { runtime } = open(`/m/${appointments}`)
    await screen.findByRole('heading', { level: 1, name: '预约' })
    await userEvent.click(within(bar()).getByRole('button', { name: confirmPrompt }))

    const opened = panel('关于：预约')
    expect(within(opened).getByRole('heading', { level: 2, name: '关于：预约' })).toBeInTheDocument()
    const log = within(opened).getByRole('log', { name: '这段对话' })
    expect(within(log).getByText(confirmPrompt)).toBeInTheDocument()
    await waitFor(() => expect(runtime.getState().conversations[0]?.messages.at(-1)?.status).toBe('done'))
    expect(within(log).getByText(/^明天的预约见下表/)).toBeInTheDocument()

    // A disclosure, not a dialog: focus stays in the composer, nothing behind is inert.
    expect(composer()).toHaveFocus()
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(opened.compareDocumentPosition(composer()) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    expect(screen.getByRole('main')).not.toHaveAttribute('inert')
    await userEvent.click(screen.getByRole('button', { name: '页面按钮' }))
    expect(screen.getByRole('button', { name: '页面按钮' })).toHaveFocus()
    expect(panel('关于：预约')).toBeInTheDocument()

    // The row under the conversation: the switch, the dedicated chat, close.
    expect(within(opened).getByRole('switch', { name: '设为长期' })).not.toBeChecked()
    expect(within(opened).getByRole('button', { name: '在专门对话中打开' })).toBeInTheDocument()
    expect(within(opened).getByRole('button', { name: '关闭' })).toBeInTheDocument()
    // The answered message has left the composer, and its prompt is not offered again.
    await waitFor(() => expect(composer()).toHaveValue(''))
    expect(within(bar()).queryByRole('button', { name: confirmPrompt })).not.toBeInTheDocument()
  })

  it('Escape collapses the panel, returns focus to the composer and a toast names the topic and leads to it', async () => {
    const { router } = open(`/m/${appointments}`)
    await screen.findByRole('heading', { level: 1, name: '预约' })
    await userEvent.click(within(bar()).getByRole('button', { name: confirmPrompt }))
    await waitFor(() => expect(composer()).toHaveValue(''))
    await userEvent.click(within(panel()).getByRole('button', { name: '在专门对话中打开' }).parentElement as HTMLElement)

    within(panel()).getByRole('switch', { name: '设为长期' }).focus()
    await userEvent.keyboard('{Escape}')
    expect(queryPanel()).not.toBeInTheDocument()
    expect(composer()).toHaveFocus()
    expect(await screen.findByText('已归档到话题「预约确认」')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: '查看话题' }))
    expect(pathOf(router)).toBe('/topics/confirmations')
  })

  it('关闭 does the same as Escape; a later message starts a new conversation', async () => {
    const { runtime } = open(`/m/${appointments}`)
    await screen.findByRole('heading', { level: 1, name: '预约' })
    await ask('今天忙吗')
    expect(await within(panel()).findByText(canned)).toBeInTheDocument()
    await userEvent.click(within(panel()).getByRole('button', { name: '关闭' }))
    expect(queryPanel()).not.toBeInTheDocument()
    expect(composer()).toHaveFocus()
    expect(await screen.findByText('已归档到话题「其他对话」')).toBeInTheDocument()

    await ask('再问一句')
    await within(panel()).findByText(canned)
    expect(runtime.getState().conversations).toHaveLength(2)
    // In the open panel a further message continues the same conversation.
    await ask('还有一句')
    await waitFor(() => expect(runtime.getState().conversations[1]?.messages).toHaveLength(4))
    expect(runtime.getState().conversations).toHaveLength(2)
  })

  it('Escape in a dialog opened from the panel closes that dialog, not the panel', async () => {
    open(`/m/${appointments}`, { scene: 's2' })
    await screen.findByRole('heading', { level: 1, name: '预约' })
    await ask('今天忙吗')
    await within(panel()).findByText(canned)
    await userEvent.click(within(panel()).getByRole('switch', { name: '设为长期' }))
    const form = within(panel()).getByRole('group', { name: '创建子模块' })
    await userEvent.click(within(form).getByRole('combobox', { name: '所属模块' }))
    await screen.findByRole('listbox')
    await userEvent.keyboard('{Escape}')
    await waitFor(() => expect(screen.queryByRole('listbox')).not.toBeInTheDocument())
    expect(panel()).toBeInTheDocument()
  })

  it('the s0 thread prompt opens a dedicated chat instead of the panel', async () => {
    const { router, runtime } = open('/m/notifications', { scene: 's0' })
    await screen.findByRole('heading', { level: 1, name: '通知' })
    await userEvent.click(within(bar()).getByRole('button', { name: threadPrompt }))
    const thread = runtime.getState().conversations.find((conversation) => conversation.surface === 'thread')
    expect(thread).toBeDefined()
    expect(pathOf(router)).toBe(`/chat/${thread?.id}`)
    expect(await screen.findByRole('heading', { level: 1, name: '店庆活动怎么做' })).toBeInTheDocument()
    expect(queryPanel()).not.toBeInTheDocument()
    // The bottom row is now this chat's composer.
    expect(within(bar()).getByRole('textbox', { name: '在这段对话中回复' })).toBeInTheDocument()
    expect(within(bar()).queryByRole('textbox', { name: '问 AI' })).not.toBeInTheDocument()
    expect(await within(screen.getByRole('main')).findByText(/可以从三个方向想/)).toBeInTheDocument()
  })

  it('unscripted input gets the one canned reply, in place', async () => {
    open('/m/notifications', { scene: 's0' })
    await screen.findByRole('heading', { level: 1, name: '通知' })
    await ask('帮我订一张去上海的机票')
    const opened = panel('关于：通知')
    expect(within(opened).getByText('帮我订一张去上海的机票')).toBeInTheDocument()
    expect(await within(opened).findByText(canned)).toBeInTheDocument()
  })

  it('on a module’s sub-page the heading names the module and the page', async () => {
    open(`/m/${duration}/workflow`, { scene: 's1' })
    await screen.findByRole('heading', { level: 1, name: '工作流' })
    await ask('这一步是做什么的')
    expect(panel('关于：服务时长 · 工作流')).toBeInTheDocument()
  })

  it('streaming: the panel is never blank — her message and 正在回答 at once, then the part that has arrived', async () => {
    const { runtime } = open(`/m/${appointments}`, { preview: 'loading' })
    await screen.findByRole('heading', { level: 1, name: '预约' })
    await userEvent.click(within(bar()).getByRole('button', { name: confirmPrompt }))
    const log = within(panel()).getByRole('log')
    expect(within(log).getByText(confirmPrompt)).toBeInTheDocument()
    expect(within(log).getByText('正在回答…')).toBeInTheDocument()
    // Under 加载中 the answer keeps streaming: half of it has arrived and the status stays.
    await waitFor(() => expect(runtime.getState().conversations[0]?.messages.at(-1)?.text['zh-CN']).not.toBe(''))
    const partial = runtime.getState().conversations[0]?.messages.at(-1)?.text['zh-CN'] ?? ''
    expect(within(log).getByText(partial)).toBeInTheDocument()
    expect(within(log).getByText('正在回答…')).toBeInTheDocument()
    expect(within(bar()).queryByRole('status', { busy: true })).not.toBeInTheDocument()
  })

  it('error: 回答失败 with 重试 in the list, her text stays in the composer; the retry brings the answer and empties it', async () => {
    const { runtime } = open(`/m/${appointments}`, { preview: 'error' })
    await screen.findByRole('heading', { level: 1, name: '预约' })
    await ask('今天忙吗')
    const log = within(panel()).getByRole('log')
    expect(await within(log).findByText('回答失败。')).toBeInTheDocument()
    expect(composer()).toHaveValue('今天忙吗')
    expect(within(log).getByText('今天忙吗')).toBeInTheDocument()

    act(() => runtime.actions.setPreview('normal'))
    await userEvent.click(within(log).getByRole('button', { name: '重试' }))
    expect(await within(log).findByText(canned)).toBeInTheDocument()
    expect(within(log).queryByText('回答失败。')).not.toBeInTheDocument()
    await waitFor(() => expect(composer()).toHaveValue(''))
    expect(runtime.getState().conversations[0]?.messages).toHaveLength(2)
  })

  it('long: the panel is a named, focusable scroller and shows the newest exchange from its start', async () => {
    // jsdom lays nothing out: every message gets a box 100 px under the one before, in a panel 300 px tall.
    const boxes = vi.spyOn(Element.prototype, 'getBoundingClientRect').mockImplementation(function (this: Element) {
      const scroller = this.closest('[data-chat-panel]')
      const index = scroller ? [...scroller.querySelectorAll('[data-author]')].indexOf(this) : -1
      return new DOMRect(0, index < 0 ? 0 : 100 + index * 100 - (scroller?.scrollTop ?? 0), 0, 100)
    })
    const size = vi.spyOn(HTMLElement.prototype, 'clientHeight', 'get').mockReturnValue(300)
    try {
      open(`/m/${appointments}`)
      await screen.findByRole('heading', { level: 1, name: '预约' })
      await ask('第一句')
      await waitFor(() => expect(composer()).toHaveValue(''))
      const opened = panel()
      expect(opened).toHaveAttribute('tabindex', '0')
      expect(opened).toHaveClass('overflow-y-auto')
      // The first exchange: from the top, the heading 关于：… with it.
      expect(opened.scrollTop).toBe(0)

      for (const text of ['第二句', '第三句']) {
        await ask(text)
        await waitFor(() => expect(composer()).toHaveValue(''))
      }
      expect(within(opened).getAllByText(canned)).toHaveLength(3)
      // The third question (the fifth message, 500 px down) at the panel's top, its answer under it.
      expect(opened.scrollTop).toBe(500)

      // She scrolls back to read; the next message brings the newest exchange into view again.
      opened.scrollTop = 120
      await ask('第四句')
      await waitFor(() => expect(composer()).toHaveValue(''))
      expect(opened.scrollTop).toBe(700)
    } finally {
      boxes.mockRestore()
      size.mockRestore()
    }
  })

  it('long: a question that would fill the panel gives way to the answer’s first line', async () => {
    const boxes = vi.spyOn(Element.prototype, 'getBoundingClientRect').mockImplementation(function (this: Element) {
      const scroller = this.closest('[data-chat-panel]')
      const index = scroller ? [...scroller.querySelectorAll('[data-author]')].indexOf(this) : -1
      return new DOMRect(0, index < 0 ? 0 : 100 + index * 100 - (scroller?.scrollTop ?? 0), 0, 100)
    })
    // A panel 150 px tall: the answer begins 100 px under its question, past the panel's middle.
    const size = vi.spyOn(HTMLElement.prototype, 'clientHeight', 'get').mockReturnValue(150)
    try {
      open(`/m/${appointments}`)
      await screen.findByRole('heading', { level: 1, name: '预约' })
      await ask('第一句')
      await within(panel()).findByText(canned)
      await waitFor(() => expect(panel().scrollTop).toBe(200))
    } finally {
      boxes.mockRestore()
      size.mockRestore()
    }
  })

  it('en: the bar, the panel and the toast are in English', async () => {
    open(`/m/${appointments}`, { locale: 'en' })
    await screen.findByRole('heading', { level: 1 })
    const region = screen.getByRole('region', { name: 'Chat with the AI' })
    await userEvent.click(within(region).getByRole('button', { name: /^What is booked for tomorrow/ }))
    const opened = within(region).getByRole('group', { name: /^About: / })
    expect(within(opened).getByRole('button', { name: 'Open in a dedicated chat' })).toBeInTheDocument()
    await userEvent.click(within(opened).getByRole('button', { name: 'Close' }))
    expect(await screen.findByText('Filed under the topic “Booking confirmations”')).toBeInTheDocument()
  })

  it('has no accessibility violation with the panel open, and no English name in zh-CN', async () => {
    const { container, runtime } = open('/m/notifications', { scene: 's0' })
    await screen.findByRole('heading', { level: 1, name: '通知' })
    await userEvent.click(within(bar()).getByRole('button', { name: heroPrompt }))
    await waitFor(() => expect(runtime.getState().proposals.some((proposal) => proposal.conversationId)).toBe(true))
    await within(panel()).findByRole('button', { name: /接受/ })
    expect(await axe(container)).toHaveNoViolations()
    for (const element of bar().querySelectorAll('[aria-label]')) {
      expect(element.getAttribute('aria-label')).not.toMatch(/[A-Za-z]{3,}/)
    }
  })
})

describe('one-off ↔ persistent (R-18)', () => {
  it('switch on → confirmation → the sub-module exists, is in the sidebar under its parent, and its workflow opens', async () => {
    const { router, runtime } = open(`/m/${appointments}`)
    await screen.findByRole('heading', { level: 1, name: '预约' })
    await userEvent.click(within(bar()).getByRole('button', { name: confirmPrompt }))
    await waitFor(() => expect(composer()).toHaveValue(''))
    expect(findModule(runtime.getState(), confirmations)).toBeUndefined()

    await userEvent.click(within(panel()).getByRole('switch', { name: '设为长期' }))
    const form = within(panel()).getByRole('group', { name: '创建子模块' })
    // Prefilled: the story's name for it, and the module of the screen she is on.
    expect(within(form).getByRole('textbox', { name: '名称' })).toHaveValue('预约确认')
    expect(within(form).getByRole('combobox', { name: '所属模块' })).toHaveTextContent('预约')
    await userEvent.click(within(form).getByRole('button', { name: '创建' }))

    const created = findModule(runtime.getState(), confirmations)
    expect(created).toMatchObject({ kind: 'sub', parentId: appointments })
    expect(created?.archived).toBeFalsy()
    expect(runtime.getState().conversations[0]).toMatchObject({ persistence: 'persistent', subModuleId: confirmations })
    expect(pathOf(router)).toBe(`/m/${confirmations}/workflow`)
    const parent = within(nav()).getByRole('link', { name: '预约' }).closest('li') as HTMLElement
    expect(within(parent).getByRole('link', { name: '预约确认' })).toBeInTheDocument()
    // The conversation is the module's now: the panel does not follow her to its workflow.
    expect(queryPanel()).not.toBeInTheDocument()
  })

  it('a name she changes is the sub-module’s name', async () => {
    const { runtime } = open(`/m/${appointments}`)
    await screen.findByRole('heading', { level: 1, name: '预约' })
    await ask('每天提醒我看库存')
    await within(panel()).findByText(canned)
    await userEvent.click(within(panel()).getByRole('switch', { name: '设为长期' }))
    const form = within(panel()).getByRole('group', { name: '创建子模块' })
    const name = within(form).getByRole('textbox', { name: '名称' })
    expect(name).toHaveValue('每天提醒我看库存')
    await userEvent.clear(name)
    await userEvent.type(name, '库存提醒')
    await userEvent.click(within(form).getByRole('button', { name: '创建' }))
    const created = runtime.getState().modules.find((module) => module.kind === 'sub')
    expect(created).toMatchObject({ parentId: appointments, name: { 'zh-CN': '库存提醒', en: '库存提醒' } })
    expect(within(nav()).getByRole('link', { name: '库存提醒' })).toBeInTheDocument()
  })

  it('the AI-raised proposal does the same when she accepts it', async () => {
    const { router, runtime } = open('/m/notifications', { scene: 's0' })
    await screen.findByRole('heading', { level: 1, name: '通知' })
    await userEvent.click(within(bar()).getByRole('button', { name: heroPrompt }))
    const card = await within(panel()).findByRole('region', { name: '把这条规则设为长期' })
    // The answer also carries her rule of thumb as a table, drawn by the block renderer.
    expect(within(panel()).getByRole('table')).toBeInTheDocument()
    expect(findModule(runtime.getState(), duration)).toBeUndefined()

    await userEvent.click(within(card).getByRole('button', { name: /接受/ }))
    expect(findModule(runtime.getState(), duration)).toMatchObject({ kind: 'sub', parentId: appointments })
    expect(pathOf(router)).toBe(`/m/${duration}/workflow`)
    const parent = within(nav()).getByRole('link', { name: '预约' }).closest('li') as HTMLElement
    expect(within(parent).getByRole('link', { name: '服务时长' })).toBeInTheDocument()
    expect(runtime.getState().conversations.at(-1)).toMatchObject({ persistence: 'persistent', subModuleId: duration })
  })

  it('switching off asks in an alert dialog, then archives the sub-module; the conversation stays', async () => {
    const { runtime } = open('/chat/conv-1', { scene: 's2' })
    await screen.findByRole('heading', { level: 1, name: '明天的预约确认' })
    const main = within(screen.getByRole('main'))
    const toggle = main.getByRole('switch', { name: '设为长期' })
    expect(toggle).toBeChecked()
    expect(within(nav()).getByRole('link', { name: '预约确认' })).toBeInTheDocument()

    await userEvent.click(toggle)
    const dialog = await screen.findByRole('alertdialog', { name: '归档「预约确认」？' })
    expect(findModule(runtime.getState(), confirmations)?.archived).toBeFalsy()
    await userEvent.click(within(dialog).getByRole('button', { name: '归档' }))

    await waitFor(() => expect(findModule(runtime.getState(), confirmations)?.archived).toBe(true))
    expect(within(nav()).queryByRole('link', { name: '预约确认' })).not.toBeInTheDocument()
    expect(runtime.getState().conversations.find((conversation) => conversation.id === 'conv-1')).toMatchObject({
      persistence: 'one-off',
      topicId: 'confirmations',
    })
    await waitFor(() => expect(main.getByRole('switch', { name: '设为长期' })).not.toBeChecked())
  })

  it('accepting a proposal whose effect is saveNodeParams adds a workflow version and stays on the screen', async () => {
    const { router, runtime } = open(`/m/${duration}/workflow`, { scene: 's1' })
    await screen.findByRole('heading', { level: 1, name: '工作流' })
    const before = workflowOf(runtime.getState(), duration)?.versions.length ?? 0
    expect(before).toBeGreaterThan(0)
    await userEvent.click(within(bar()).getByRole('button', { name: reviewPrompt }))
    const card = await within(panel()).findByRole('region', { name: '修改复盘时间' })
    await userEvent.click(within(card).getByRole('button', { name: /接受/ }))

    const workflow = workflowOf(runtime.getState(), duration)
    expect(workflow?.versions).toHaveLength(before + 1)
    expect(workflow?.current).toBe(before + 1)
    expect(workflow?.versions.at(-1)).toMatchObject({ author: 'ai' })
    expect(pathOf(router)).toBe(`/m/${duration}/workflow`)
    expect(panel()).toBeInTheDocument()
  })

  it('the review prompt is offered only in a workflow editor', async () => {
    open(`/m/${duration}`, { scene: 's1' })
    await screen.findByRole('heading', { level: 1, name: '服务时长' })
    expect(within(bar()).queryByRole('button', { name: reviewPrompt })).not.toBeInTheDocument()
  })
})

describe('chat.recent (R-19)', () => {
  const group = () => within(nav()).getByRole('button', { name: '最近对话' })
  const rows = () => within(nav()).getByRole('list', { name: '最近对话' })

  it('is collapsed on first load, expands, and stays expanded after a reload', async () => {
    const first = open('/m/notifications', { scene: 's2' })
    await screen.findByRole('heading', { level: 1, name: '通知' })
    expect(group()).toHaveAttribute('aria-expanded', 'false')
    expect(within(nav()).queryByRole('list', { name: '最近对话' })).not.toBeInTheDocument()

    await userEvent.click(group())
    expect(group()).toHaveAttribute('aria-expanded', 'true')
    expect(await within(rows()).findByRole('link', { name: /^按品种和毛长估时间/ })).toBeInTheDocument()
    expect(window.localStorage.getItem(RECENT_STORAGE_KEY)).toBe('open')

    first.unmount()
    open('/m/notifications', { scene: 's2' })
    await screen.findByRole('heading', { level: 1, name: '通知' })
    expect(group()).toHaveAttribute('aria-expanded', 'true')
    await userEvent.click(group())
    expect(window.localStorage.getItem(RECENT_STORAGE_KEY)).toBe('closed')
  })

  it('lists the latest first — title, topic, how long ago, 长期 — then 全部话题', async () => {
    window.localStorage.setItem(RECENT_STORAGE_KEY, 'open')
    open('/m/notifications', { scene: 's2' })
    await within(rows()).findByRole('link', { name: /^明天的预约确认/ })
    const links = within(rows()).getAllByRole('link')
    expect(links.map((link) => link.textContent)).toEqual([
      '按品种和毛长估时间 · 服务时长规则 · 16天前 长期',
      '明天的预约确认 · 预约确认 · 18天前 长期',
      '全部话题',
    ])
    expect(links.at(-1)).toHaveAttribute('href', '/topics')
  })

  it('an in-place conversation opens its record in the topic; a dedicated chat opens the thread and is marked current', async () => {
    window.localStorage.setItem(RECENT_STORAGE_KEY, 'open')
    const { router, runtime } = open('/m/notifications', { scene: 's0' })
    await screen.findByRole('heading', { level: 1, name: '通知' })
    expect(await within(rows()).findByRole('link', { name: /^明天的预约确认/ })).toHaveAttribute('href', '/topics/confirmations')

    await userEvent.click(within(bar()).getByRole('button', { name: threadPrompt }))
    const thread = runtime.getState().conversations.at(-1)
    const row = await within(rows()).findByRole('link', { name: /^店庆活动怎么做 · 店庆活动 · 刚刚/ })
    expect(row).toHaveAttribute('href', `/chat/${thread?.id}`)
    expect(row).toHaveAttribute('aria-current', 'page')
    expect(row).not.toHaveTextContent('长期')

    await userEvent.click(within(rows()).getByRole('link', { name: /^明天的预约确认/ }))
    expect(pathOf(router)).toBe('/topics/confirmations')
    await userEvent.click(within(rows()).getByRole('link', { name: /^店庆活动怎么做/ }))
    expect(pathOf(router)).toBe(`/chat/${thread?.id}`)
  })

  it.each([
    ['empty', '还没有对话'],
    ['loading', '正在载入最近对话…'],
    ['error', '无法载入'],
  ])('状态预览 %s: the group says so and keeps 全部话题', async (preview, words) => {
    window.localStorage.setItem(RECENT_STORAGE_KEY, 'open')
    open('/m/notifications', { scene: 's2', preview })
    expect(await within(rows()).findByText(words)).toBeInTheDocument()
    expect(within(rows()).getByRole('link', { name: '全部话题' })).toBeInTheDocument()
    expect(within(rows()).queryByRole('link', { name: /^明天的预约确认/ })).not.toBeInTheDocument()
    // The module navigation itself reads the state and stays.
    expect(within(nav()).getByRole('link', { name: '预约' })).toBeInTheDocument()
  })

  it('状态预览 error: 重试 asks again', async () => {
    window.localStorage.setItem(RECENT_STORAGE_KEY, 'open')
    const { runtime } = open('/m/notifications', { scene: 's2', preview: 'error' })
    await within(rows()).findByText('无法载入')
    act(() => runtime.actions.setPreview('normal'))
    await within(rows()).findByRole('link', { name: /^明天的预约确认/ })
    act(() => runtime.actions.setPreview('error'))
    await userEvent.click(await within(rows()).findByRole('button', { name: '重试' }))
    expect(await within(rows()).findByText('无法载入')).toBeInTheDocument()
  })

  it('状态预览 long: ten rows with long titles that wrap, then 全部话题', async () => {
    window.localStorage.setItem(RECENT_STORAGE_KEY, 'open')
    open('/m/notifications', { scene: 's2', preview: 'long' })
    await waitFor(() => expect(within(rows()).getAllByRole('link')).toHaveLength(11))
    const links = within(rows()).getAllByRole('link')
    expect(links.at(-1)).toHaveTextContent('全部话题')
    for (const link of links) {
      const classes = [...link.querySelectorAll('*')].flatMap((element) => [...element.classList])
      expect(classes.filter((name) => /^(?:truncate|line-clamp-\d)/.test(name) && !name.includes(':'))).toEqual([])
    }
  })

  it('in the icon rail it is one button that opens the sidebar with the group expanded', async () => {
    open('/m/notifications', { scene: 's2', size: 'medium' })
    await screen.findByRole('heading', { level: 1, name: '通知' })
    expect(within(nav()).queryByRole('list', { name: '最近对话' })).not.toBeInTheDocument()
    await userEvent.click(group())
    expect(screen.getByRole('button', { name: '展开或收起侧边栏' })).toHaveAttribute('aria-expanded', 'true')
    expect(group()).toHaveAttribute('aria-expanded', 'true')
    expect(await within(rows()).findByRole('link', { name: /^明天的预约确认/ })).toBeInTheDocument()
    expect(window.localStorage.getItem(RECENT_STORAGE_KEY)).toBe('open')
  })

  it('en: the group and its rows are in English', async () => {
    window.localStorage.setItem(RECENT_STORAGE_KEY, 'open')
    open('/m/notifications', { scene: 's2', locale: 'en' })
    const list = await within(screen.getByRole('navigation', { name: 'Module navigation' })).findByRole('list', { name: 'Recent chats' })
    expect(await within(list).findByRole('link', { name: /^Estimate time by breed and coat · .+ · 16 days ago/ })).toBeInTheDocument()
    expect(within(list).getByRole('link', { name: 'All topics' })).toBeInTheDocument()
  })
})

describe('the bar in the shell (R-20)', () => {
  it.each(['compact', 'medium', 'expanded'] as const)('%s: the bar is the row after main, with the open panel inside it', async (size) => {
    const { container } = open(`/m/${appointments}`, { size })
    await screen.findByRole('heading', { level: 1, name: '预约' })
    await userEvent.click(within(bar()).getByRole('button', { name: confirmPrompt }))
    const row = container.querySelector('[data-shell-bar]') as HTMLElement
    const main = screen.getByRole('main')
    expect(main.nextElementSibling).toBe(row)
    expect(row).toContainElement(panel())
    expect(main).not.toContainElement(panel())
    // Nothing of the bar is taken out of the flow: it cannot lie over the page.
    for (const element of [row, ...row.querySelectorAll('*')]) {
      expect([...element.classList].filter((name) => /^(?:fixed|absolute|sticky)$/.test(name))).toEqual([])
    }
  })

  it('Tab reaches the bar after main: the page, then the panel, its controls, the composer', async () => {
    open(`/m/${appointments}`, { size: 'compact' })
    await screen.findByRole('heading', { level: 1, name: '预约' })
    await userEvent.click(within(bar()).getByRole('button', { name: confirmPrompt }))
    await waitFor(() => expect(composer()).toHaveValue(''))
    const page = screen.getByRole('button', { name: '页面按钮' })
    page.focus()
    const stops: Element[] = []
    for (let i = 0; i < 12 && document.activeElement !== composer(); i += 1) {
      await userEvent.tab()
      stops.push(document.activeElement as Element)
    }
    expect(stops[0]).toBe(panel())
    expect(stops.at(-1)).toBe(composer())
    const at = (element: Element) => stops.indexOf(element)
    const order = [
      panel(),
      within(panel()).getByRole('switch', { name: '设为长期' }),
      within(panel()).getByRole('button', { name: '在专门对话中打开' }),
      within(panel()).getByRole('button', { name: '关闭' }),
      composer(),
    ].map(at)
    expect(order).not.toContain(-1)
    expect(order).toEqual([...order].sort((a, b) => a - b))
    expect(stops.every((stop) => bar().contains(stop))).toBe(true)
  })
})
