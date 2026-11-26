import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMemoryRouter, RouterProvider } from 'react-router'
import type { RouteObject } from 'react-router'
import { describe, expect, it } from 'vitest'

import { NotFound } from '@/app/NotFound'
import { Providers } from '@/app/Providers'
import { blockIds } from '@/blocks/types'
import { LOCALE_STORAGE_KEY, locales } from '@/i18n'
import { accountsPath, definitionOf, moduleDefinitions } from '@/module'
import { answerOf, createRuntime, findModule, RuntimeContext, sceneRefs, viewOf, type Runtime } from '@/runtime'
import { moduleRoutes } from '@/screens/module/routes'
import { modulePath, Shell } from '@/shell'
import { axe } from '@/test/axe'

import calendar from '../calendar/module'
import messages from '../messages/module'
import notifications from './module'

// B-02 and B-03 of docs/specs/lofi-prototype-screens.md: the pages of 通知,
// 消息 and 日程 — built from the state in every scene, and their four states
// under 状态预览 with the partial and the expired failure in words — and the
// three stubs 待办 · 邮件 · 文件.

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
      // The real routes and the real definitions: `src/modules/*/module.ts`, found by glob.
      children: [...moduleRoutes(), { path: '*', element: <NotFound /> }],
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
const block = (name: string) => main().findByRole('region', { name: new RegExp(`^${name}`) })
const hrefOf = (link: HTMLElement) => decodeURIComponent(link.getAttribute('href') ?? '')

describe('the base modules’ pages (B-02)', () => {
  it('are found by the frame: the six base modules have a definition of their own', () => {
    for (const id of ['notifications', 'messages', 'calendar', 'todo', 'mail', 'files']) expect(moduleDefinitions.get(id)?.id).toBe(id)
  })

  it.each(sceneRefs)('%s: 通知, 消息 and 日程 build from the state, in both locales and under 超长内容', (ref) => {
    for (const preview of ['normal', 'long'] as const) {
      const state = createRuntime({ delay: 0, storage: null, search: `?scene=${ref}&preview=${preview}` }).getState()
      for (const definition of [notifications, messages, calendar]) {
        for (const locale of locales) {
          const { blocks } = definition.page(viewOf(state), preview, { locale })
          expect(blocks.length).toBeGreaterThan(0)
          for (const each of blocks) expect(blockIds).toContain(each.block)
          // A block is a region named by its title, and pins and change sets go by its key.
          expect(new Set(blocks.map((each) => each.key)).size).toBe(blocks.length)
          expect(new Set(blocks.map((each) => each.title)).size).toBe(blocks.length)
        }
      }
    }
  })

  it('通知 in s3: the figures, the review’s two-part proposal naming 服务时长, the important items — and accepting both parts', async () => {
    const { runtime } = open('/m/notifications', { scene: 's3' })
    expect(await screen.findByRole('heading', { level: 1, name: '通知' })).toBeInTheDocument()

    const summary = await block('概况')
    expect(summary).toHaveTextContent('待你确认')
    expect(summary).toHaveTextContent('今天新增')

    const proposal = await block('每周复盘：金毛的时长和实际差得多')
    expect(proposal).toHaveTextContent('金毛的大致时长改为 3 小时 45 分')
    expect(proposal).toHaveTextContent('豆豆 3 小时 20 分，大福 4 小时 10 分')
    expect(hrefOf(within(proposal).getByRole('link', { name: /服务时长/ }))).toBe(modulePath(duration))

    const important = await block('重要的事')
    const first = within(important).getAllByRole('listitem')[0]
    expect(first).toHaveTextContent('每周复盘：金毛的时长有两条修改建议，等你确认。')
    expect(first).toHaveTextContent('服务时长')
    expect(await axe(document.body)).toHaveNoViolations()

    // 接受 on each part goes to the runtime; the resolved proposal leaves the page.
    for (const accept of within(proposal).getAllByRole('button', { name: /^接受/ })) await userEvent.click(accept)
    await waitFor(() => expect(main().queryByRole('region', { name: /^每周复盘：金毛的时长和实际差得多/ })).toBeNull())
    const review = runtime.getState().proposals.find((each) => each.id === 'proposal-duration-review')
    expect(review?.parts.map((part) => part.state)).toEqual(['accepted', 'accepted'])
    expect(review?.applied).toBe(true)
  })

  it('通知 in e2: one proposal per customer who has not answered', async () => {
    open('/m/notifications', { scene: 'e2' })
    expect(await block('刘女士还没有回复明天的预约确认')).toBeInTheDocument()
    expect(await block('赵先生还没有回复明天的预约确认')).toBeInTheDocument()
  })

  it('消息: how many are unread, then each message with its channel and a link to the module it was filed under', async () => {
    open('/m/messages')
    expect(await block('概况')).toHaveTextContent('未读')
    const list = await block('顾客消息')
    const row = within(list).getAllByRole('listitem')[0]
    expect(row).toHaveTextContent('林女士：豆豆十点到，这次麻烦把脚底毛修短一点。')
    expect(row).toHaveTextContent('微信')
    expect(row).toHaveTextContent('归到「预约」')
    expect(hrefOf(within(row).getByRole('link'))).toBe(modulePath('profession.appointments'))
  })

  it('日程: the week with her own events beside the bookings 预约 wrote in, and today as a list', async () => {
    open('/m/calendar')
    const week = await block('本周')
    expect(within(week).getByRole('group', { name: '我的日程' })).toHaveTextContent('供应商来访')
    const bookings = within(week).getByRole('group', { name: '美容预约' })
    expect(bookings).toHaveTextContent('豆豆 · 洗剪吹')
    expect(bookings).toHaveTextContent('美容师：')
    const today = await block('今天')
    const rows = within(today).getAllByRole('listitem')
    expect(rows[0]).toHaveTextContent('豆豆 · 洗剪吹')
    expect(rows[0]).toHaveTextContent('预约')
    expect(hrefOf(within(rows[0]).getByRole('link'))).toBe(modulePath('profession.appointments'))
  })

  it('日程 under 超长内容: six bookings at once are all listed', () => {
    const state = createRuntime({ delay: 0, storage: null, search: '?scene=s2&preview=long' }).getState()
    const answer = answerOf(state, { kind: 'module', moduleId: 'calendar' })
    const view = 'data' in answer && answer.data ? answer.data.view : state
    const today = calendar.page(view, 'long', { locale: 'zh-CN' }).blocks.find((each) => each.key === 'today')
    const items = today?.block === 'block.list' ? today.props.items : []
    expect(items).toHaveLength(14)
    // 10:00 to 11:00: the second to the seventh booking overlap.
    expect(items.filter((item) => /^1[01]:[03]0 – /.test(item.meta)).length).toBeGreaterThanOrEqual(6)
  })

  describe('the four states under 状态预览', () => {
    it('空: each page is one `block.empty` in its own words', async () => {
      const first = open('/m/notifications', { preview: 'empty' })
      expect(await main().findByText('现在没有需要你处理的事')).toBeInTheDocument()
      first.unmount()

      const second = open('/m/messages', { preview: 'empty' })
      expect(await main().findByText('还没有消息')).toBeInTheDocument()
      expect(main().getByText('连接微信后，顾客的消息会出现在这里。')).toBeInTheDocument()
      expect(hrefOf(main().getByRole('link', { name: '去连接账号' }))).toBe(accountsPath)
      second.unmount()

      open('/m/calendar', { preview: 'empty' })
      expect(await main().findByText('今天没有安排')).toBeInTheDocument()
      // The week is still a block of the page.
      expect(await block('本周')).toBeInTheDocument()
    })

    it.each(['notifications', 'messages', 'calendar'])('加载中: %s says it is loading', async (id) => {
      open(`/m/${id}`, { preview: 'loading' })
      await waitFor(() => expect(document.querySelector('main [aria-busy="true"]')).not.toBeNull())
      expect(main().queryByRole('region', { name: /^概况/ })).toBeNull()
    })

    it('出错, 通知 (`source-failed`): the failure names the module, and the rest still shows', async () => {
      open('/m/notifications', { scene: 's3', preview: 'error' })
      // 排班 did not answer: what the other modules gave is still there, under a note saying so.
      expect((await main().findAllByText(/来自「排班」的数据没有送达/)).length).toBeGreaterThan(0)
      expect(await main().findByText('下面的内容不完整')).toBeInTheDocument()
      expect(await block('每周复盘：金毛的时长和实际差得多')).toBeInTheDocument()
      expect(await block('重要的事')).toBeInTheDocument()
    })

    it('出错, 消息 and 日程 (`account-expired`): the expired account by name, and the way to reconnect it', async () => {
      const first = open('/m/messages', { preview: 'error' })
      expect((await main().findAllByText(/「微信」的授权已过期/)).length).toBeGreaterThan(0)
      expect(hrefOf(main().getAllByRole('link', { name: '去设置里重新连接' })[0])).toBe(accountsPath)
      expect(main().queryByRole('region', { name: /^顾客消息/ })).toBeNull()
      first.unmount()

      open('/m/calendar', { preview: 'error' })
      expect((await main().findAllByText(/「日历」的授权已过期/)).length).toBeGreaterThan(0)
      expect(hrefOf(main().getAllByRole('link', { name: '去设置里重新连接' })[0])).toBe(accountsPath)
    })
  })
})

describe('待办 · 邮件 · 文件 (B-03)', () => {
  const stubs = [
    ['todo', '待办', '你的待办会汇总在这里'],
    ['mail', '邮件', '需要你处理的邮件会整理在这里'],
    ['files', '文件', '最近用到的文件会列在这里'],
  ] as const

  it.each(stubs)('%s: the frame, one `block.empty` with the way to the accounts, and 尚未运行', async (id, name, title) => {
    const { runtime } = open(`/m/${id}`)
    expect(await screen.findByRole('heading', { level: 1, name })).toBeInTheDocument()
    expect(await main().findByText(title)).toBeInTheDocument()
    expect(hrefOf(main().getByRole('link', { name: '去连接账号' }))).toBe(accountsPath)
    expect(main().getByText('尚未运行')).toBeInTheDocument()

    const module = findModule(runtime.getState(), id)!
    const { definition, stub } = definitionOf(module)
    expect(stub).toBe(false)
    const { blocks } = definition.page(runtime.getState(), 'normal', { locale: 'en' })
    expect(blocks.map((each) => each.block)).toEqual(['block.empty'])
  })

  it('待办 has no accessibility violation', async () => {
    open('/m/todo')
    await main().findByText('你的待办会汇总在这里')
    expect(await axe(document.body)).toHaveNoViolations()
  })
})
