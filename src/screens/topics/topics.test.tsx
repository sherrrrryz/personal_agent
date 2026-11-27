import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMemoryRouter, RouterProvider } from 'react-router'
import type { RouteObject } from 'react-router'
import { describe, expect, it } from 'vitest'

import { NotFound } from '@/app/NotFound'
import { Providers } from '@/app/Providers'
import { Page } from '@/components/layout'
import { LOCALE_STORAGE_KEY } from '@/i18n'
import { createRuntime, RuntimeContext, type Runtime } from '@/runtime'
import { modulePath, Shell } from '@/shell'
import { axe } from '@/test/axe'

import { matrixRoutes, routes } from './routes'

// B-04 of docs/specs/lofi-prototype-screens.md: `topics` — the cards — and
// `topics.<topic>` — the summary, the records in a read-only message list,
// 继续对话 — with the four states of each under 状态预览.

const duration = 'profession.appointments.sub.duration'

function TestBar() {
  return <section aria-label="测试栏" />
}

function open(path: string, options: { scene?: string; preview?: string } = {}) {
  const { scene = 's2', preview } = options
  window.localStorage.setItem(LOCALE_STORAGE_KEY, 'zh-CN')
  const runtime: Runtime = createRuntime({ delay: 0, storage: null, search: `?scene=${scene}${preview ? `&preview=${preview}` : ''}` })
  const tree: RouteObject[] = [
    {
      path: '/',
      element: <Shell slots={{ chatBar: TestBar }} />,
      children: [
        ...routes,
        { path: '/chat/:id', element: <Page title="一段对话" /> },
        { path: '*', element: <NotFound /> },
      ],
    },
  ]
  const router = createMemoryRouter(tree, { initialEntries: [path] })
  const rendered = render(
    <Providers>
      <RuntimeContext value={runtime}>
        <RouterProvider router={router} />
      </RuntimeContext>
    </Providers>,
  )
  return { runtime, router, ...rendered }
}

const main = () => within(screen.getByRole('main'))
const hrefOf = (link: HTMLElement) => decodeURIComponent(link.getAttribute('href') ?? '')
const card = (id: string) => within(document.querySelector<HTMLElement>(`[data-topic="${id}"]`)!)

describe('topics (B-04)', () => {
  it('registers the two routes and lists concrete addresses for the matrix', () => {
    expect(routes.map((route) => route.path)).toEqual(['/topics', '/topics/:topicId'])
    expect(matrixRoutes.map((route) => route.path)).toEqual(expect.arrayContaining(['/topics', '/topics/duration-rule']))
  })

  it('a card per topic: the AI’s title as a link, the first line of the summary, the count, the last activity, the badge', async () => {
    open('/topics')
    expect(await screen.findByRole('heading', { level: 1, name: '话题' })).toBeInTheDocument()
    const link = await main().findByRole('link', { name: '服务时长规则' })
    expect(hrefOf(link)).toBe('/topics/duration-rule')
    const rule = card('duration-rule')
    // The first sentence only.
    expect(rule.getByText('你按品种和毛长给了一条估时规则：长毛大型 4 小时，短毛小型 2 小时，其他 3 小时。')).toBeInTheDocument()
    expect(rule.getByText('1 段对话')).toBeInTheDocument()
    expect(rule.getByText(/^最近活动：2026年11月/)).toBeInTheDocument()
    expect(rule.getByText('已成为模块')).toBeInTheDocument()
    expect(main().getByRole('link', { name: '预约确认' })).toBeInTheDocument()
    expect(await axe(document.body)).toHaveNoViolations()
  })

  it('the four states of the list: 空 in its own words, 加载中, 出错 with 重试, 超长内容 with forty cards', async () => {
    const empty = open('/topics', { preview: 'empty' })
    expect(await main().findByText('你和 AI 的每次对话都会自动归到这里。')).toBeInTheDocument()
    empty.unmount()

    const loading = open('/topics', { preview: 'loading' })
    expect(await main().findByText('正在载入话题…')).toBeInTheDocument()
    expect(document.querySelector('[data-topic]')).toBeNull()
    loading.unmount()

    const failed = open('/topics', { preview: 'error' })
    expect(await main().findByText('无法载入话题')).toBeInTheDocument()
    expect(main().getByRole('button', { name: '重试' })).toBeInTheDocument()
    failed.unmount()

    open('/topics', { preview: 'long' })
    await waitFor(() => expect(document.querySelectorAll('[data-topic]')).toHaveLength(40))
  })
})

describe('topics.<topic> (B-04)', () => {
  it('the summary with its basis, the related modules, and the conversation as a read-only record', async () => {
    open('/topics/duration-rule')
    expect(await screen.findByRole('heading', { level: 1, name: '服务时长规则' })).toBeInTheDocument()

    const summary = await main().findByRole('region', { name: 'AI 摘要' })
    await within(summary).findByText(/^你按品种和毛长给了一条估时规则/)
    expect(summary).toHaveTextContent('根据 1 条对话整理')
    expect(summary).toHaveTextContent('更新于')

    const modules = main().getByRole('region', { name: '相关模块' })
    expect(hrefOf(within(modules).getByRole('link', { name: '服务时长' }))).toBe(modulePath(duration))

    const records = main().getByRole('region', { name: '对话记录' })
    expect(within(records).getByRole('button', { name: /^按品种和毛长估时间 · 2026年11月5日/ })).toHaveAttribute('aria-expanded', 'true')
    expect(within(records).getByText('就地回答')).toBeInTheDocument()
    const log = within(records).getByRole('log', { name: '记录 1：按品种和毛长估时间' })
    expect(log).toHaveTextContent('以后帮我按狗的品种和毛长估时间')
    // Read-only: nothing in the record acts — no retry, no 接受 / 拒绝. The one button is the
    // disclosure of what the AI did before answering (D-45): folded away, complete, not replayed.
    const buttons = within(log).getAllByRole('button')
    expect(buttons.map((button) => button.textContent)).toEqual(['已完成 2 步'])
    expect(buttons[0]).toHaveAttribute('aria-expanded', 'false')
    expect(log.querySelector('[data-status="streaming"]')).toBeNull()
    expect(await axe(document.body)).toHaveNoViolations()
  })

  it('继续对话 opens the dedicated chat of that conversation', async () => {
    const { router, runtime } = open('/topics/duration-rule')
    const conversation = runtime.getState().conversations.find((each) => each.topicId === 'duration-rule')!
    const link = await main().findByRole('link', { name: '继续对话：按品种和毛长估时间' })
    await userEvent.click(link)
    await waitFor(() => expect(router.state.location.pathname).toBe(`/chat/${conversation.id}`))
  })

  it('in s5 the summary tells the whole story', async () => {
    open('/topics/duration-rule', { scene: 's5' })
    const summary = await main().findByRole('region', { name: 'AI 摘要' })
    await within(summary).findByText(/^11 月初，你给了一条估时规则/)
  })

  it('the four states: 空 = 摘要生成中 with the records, 加载中, 出错 = the summary failed and the records stay, 超长内容 = twenty records', async () => {
    const empty = open('/topics/duration-rule', { preview: 'empty' })
    expect(await main().findByText('摘要生成中')).toBeInTheDocument()
    expect(await main().findByRole('log')).toBeInTheDocument()
    empty.unmount()

    const loading = open('/topics/duration-rule', { preview: 'loading' })
    expect(await screen.findByRole('heading', { level: 1, name: '服务时长规则' })).toBeInTheDocument()
    expect(await main().findByText('正在载入摘要…')).toBeInTheDocument()
    expect(main().queryByRole('log')).toBeNull()
    loading.unmount()

    const failed = open('/topics/duration-rule', { preview: 'error' })
    expect(await main().findByText('摘要没有生成出来')).toBeInTheDocument()
    expect(main().getByRole('button', { name: '重试' })).toBeInTheDocument()
    expect(await main().findByRole('log')).toBeInTheDocument()
    failed.unmount()

    open('/topics/duration-rule', { preview: 'long' })
    await waitFor(() => expect(document.querySelectorAll('[data-record]')).toHaveLength(20))
    // One record is open; the others are a press away.
    expect(main().getAllByRole('log')).toHaveLength(1)
  })

  it('an id no topic answers to is the not-found screen', async () => {
    open('/topics/no-such-topic')
    await waitFor(() => expect(document.querySelector('[data-route-not-found]')).not.toBeNull())
  })
})
