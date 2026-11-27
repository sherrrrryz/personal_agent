import { act, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMemoryRouter, RouterProvider, useParams } from 'react-router'
import type { RouteObject } from 'react-router'
import { describe, expect, it, vi } from 'vitest'

import { NotFound } from '@/app/NotFound'
import { Providers } from '@/app/Providers'
import { blockIds } from '@/blocks/types'
import { LOCALE_STORAGE_KEY } from '@/i18n'
import { ModuleFrame, useRouteModule, type ModuleChildRoute, type ModuleDefinitions } from '@/module'
import { demoModuleId } from '@/module/demo-module'
import { createRuntime, RuntimeContext, storageKeys, type ModuleDefinition, type Runtime } from '@/runtime'
import { Shell } from '@/shell'
import { axe } from '@/test/axe'

import { collectChildRoutes } from './child-routes'
import { matrixRoutes, moduleRoutes, routes } from './routes'

// R-15 and R-16 of docs/specs/lofi-prototype-shell.md: `/dev/frame`, and the
// routes of a module — resolved in the scene, the stub pattern, not-found, an
// alias, and child routes contributed by glob.

const appointments = 'profession.appointments'
const clients = 'profession.clients'
const duration = 'profession.appointments.sub.duration'

function TestBar() {
  return (
    <section aria-label="测试栏">
      <button type="button">栏内按钮</button>
    </section>
  )
}

function WorkflowView() {
  const { module } = useRouteModule()
  return (
    <ModuleFrame module={module} view="workflow" title="流程编辑">
      <p>流程视图的内容</p>
    </ModuleFrame>
  )
}

function PetFile({ label }: { label: string }) {
  const { module } = useRouteModule()
  const { petId } = useParams()
  return (
    <ModuleFrame module={module} view="child" title={`${label}：${petId}`}>
      <p>宠物档案</p>
    </ModuleFrame>
  )
}

const childRoutes: ModuleChildRoute[] = [
  { path: 'workflow', element: <WorkflowView /> },
  { path: 'pets/:petId', match: (module) => module.id === clients, element: <PetFile label="档案" /> },
  { path: 'pets/:petId', match: (module) => module.id === appointments, element: <PetFile label="预约里的宠物" /> },
]

const onAction = vi.fn()
const appointmentsPage: ModuleDefinition = {
  id: appointments,
  page: (view, preview, { locale }) => ({
    blocks: [
      {
        key: 'list',
        block: 'block.list',
        title: '今日预约',
        span: 'full',
        props: {
          items: [
            {
              id: 'a-1',
              title: `${view.modules.length > 0 ? '可乐' : ''} · ${preview} · ${locale}`,
              meta: '14:00',
              badges: [],
              actions: [{ id: 'start', label: '开始' }],
            },
          ],
        },
      },
    ],
  }),
  onAction,
}
const definitions: ModuleDefinitions = new Map([[appointments, appointmentsPage]])

function open(path: string, options: { scene?: string; preview?: string; app?: RouteObject[] } = {}) {
  const { scene = 's2', preview } = options
  window.localStorage.setItem(LOCALE_STORAGE_KEY, 'zh-CN')
  const runtime: Runtime = createRuntime({ delay: 0, storage: null, search: `?scene=${scene}${preview ? `&preview=${preview}` : ''}` })
  const tree: RouteObject[] = [
    {
      path: '/',
      element: <Shell slots={{ chatBar: TestBar }} />,
      children: [...(options.app ?? moduleRoutes({ definitions, childRoutes })), { path: '*', element: <NotFound /> }],
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

const main = () => screen.getByRole('main')
const h1 = () => within(main()).getByRole('heading', { level: 1 })
const frame = () => document.querySelector<HTMLElement>('[data-module-frame]')!
const notFound = () => document.querySelector('[data-route-not-found]')
const runStatus = () => document.querySelector<HTMLElement>('[data-run-status]')!
// 刷新 stands in the shell header (D-50), not in main.
const runNow = () => screen.getByRole('button', { name: '刷新' })

describe('/m/<ia-id> (R-16)', () => {
  it('resolves a module of the scene and draws the page its definition emits', async () => {
    onAction.mockClear()
    const { runtime } = open(`/m/${appointments}`)
    expect(h1()).toHaveTextContent('预约')
    expect(frame()).toHaveAttribute('data-view', 'page')
    expect(frame()).toHaveAttribute('data-module-frame', appointments)
    const block = await within(main()).findByRole('region', { name: '今日预约' })
    // `page(view, preview, { locale })`.
    expect(block).toHaveTextContent('可乐 · normal · zh-CN')
    // `onAction(event, actions, view)`.
    await userEvent.click(within(block).getByRole('button', { name: /开始/ }))
    expect(onAction).toHaveBeenCalledTimes(1)
    const [event, actions, view] = onAction.mock.calls[0]
    expect(event).toEqual({ blockKey: 'list', actionId: 'start', itemId: 'a-1' })
    expect(actions).toBe(runtime.actions)
    expect(view).toBe(runtime.getState())
  })

  it('renders the stub pattern for a module without module.ts', async () => {
    const { runtime, router } = open(`/m/${clients}`)
    let added: string | null = null
    act(() => {
      added = runtime.actions.addModule({ name: '我的新功能' })
    })
    expect(added).toBeTruthy()
    await act(() => router.navigate(`/m/${added}`))
    expect(h1()).toHaveTextContent('我的新功能')
    // The frame, the never-run state, `block.empty`.
    expect(runStatus()).toHaveAttribute('data-run-status', 'never-run')
    const blocks = await waitFor(() => {
      const found = [...document.querySelectorAll('[data-block]')]
      expect(found).toHaveLength(1)
      return found
    })
    expect(blocks[0]).toHaveAttribute('data-block', 'block.empty')
    const stub = within(main()).getByRole('region', { name: '页面内容' })
    expect(stub).toHaveTextContent('这个功能还没有内容')
    expect(within(stub).getByRole('link', { name: '打开流程' })).toHaveAttribute('href', `/m/${added}/workflow`)
    expect(await axe(document.body)).toHaveNoViolations()
  })

  it('shows not-found for an id nothing answers to, inside the shell', () => {
    open('/m/nothing.here')
    expect(notFound()).toBeInTheDocument()
    expect(document.querySelector('[data-module-frame]')).toBeNull()
    expect(screen.getByRole('navigation', { name: '功能导航' })).toBeInTheDocument()
  })

  it('redirects an alias to the module’s own address and keeps the rest of the path', async () => {
    const { runtime, router } = open(`/m/${clients}`)
    let promoted: string | null = null
    act(() => {
      promoted = runtime.actions.promoteSubModule(duration)
    })
    expect(promoted).toBeTruthy()
    expect(promoted).not.toBe(duration)
    await act(() => router.navigate(`/m/${duration}`))
    await waitFor(() => expect(router.state.location.pathname).toBe(`/m/${promoted}`))
    expect(h1()).toHaveTextContent('服务时长')
    await act(() => router.navigate(`/m/${duration}/workflow?node=n-1#top`))
    await waitFor(() => expect(router.state.location.pathname).toBe(`/m/${promoted}/workflow`))
    expect(router.state.location.search).toBe('?node=n-1')
    expect(router.state.location.hash).toBe('#top')
    expect(h1()).toHaveTextContent('流程编辑')
  })

  it('renders a child route in its view, with the bottom row reachable below it', async () => {
    open(`/m/${appointments}/workflow`)
    expect(frame()).toHaveAttribute('data-view', 'workflow')
    expect(h1()).toHaveTextContent('流程编辑')
    expect(within(main()).getByText('流程视图的内容')).toBeInTheDocument()
    // 功能设置 is in the header (D-50); its 流程 part links to this view, which is current (D-52).
    await userEvent.click(screen.getByRole('button', { name: '功能设置' }))
    const settings = await screen.findByRole('dialog', { name: '功能设置' })
    expect(within(settings).getByRole('link', { name: '整页打开「流程」' })).toHaveAttribute('aria-current', 'page')
    await userEvent.keyboard('{Escape}')
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull())
    // The bar is a row of the layout after `main`, never inside or over it.
    const bar = document.querySelector<HTMLElement>('[data-shell-bar]')!
    expect(bar).toBeInTheDocument()
    expect(main().contains(bar)).toBe(false)
    expect(main().compareDocumentPosition(bar) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    // Tab from the last control of the view reaches the bar's button.
    const links = within(main()).queryAllByRole('link')
    ;(links.at(-1) ?? main()).focus()
    await userEvent.tab()
    expect(screen.getByRole('button', { name: '栏内按钮' })).toHaveFocus()
  })

  it('gives a path to the first route whose `match` accepts the module, and to none elsewhere', async () => {
    const { router } = open(`/m/${clients}/pets/p-1`)
    expect(frame()).toHaveAttribute('data-view', 'child')
    expect(h1()).toHaveTextContent('档案：p-1')
    await act(() => router.navigate(`/m/${appointments}/pets/p-2`))
    expect(h1()).toHaveTextContent('预约里的宠物：p-2')
    await act(() => router.navigate(`/m/${duration}/pets/p-3`))
    expect(notFound()).toBeInTheDocument()
    await act(() => router.navigate(`/m/${clients}/no-such-view`))
    expect(notFound()).toBeInTheDocument()
  })

  it('keeps the frame under a forced preview and shows the page’s four states', async () => {
    const { runtime } = open(`/m/${appointments}`, { preview: 'loading' })
    expect(h1()).toHaveTextContent('预约')
    expect(runStatus()).toHaveAttribute('data-run-status', 'running')
    expect(main().querySelector('[aria-busy="true"][data-slot="data-state-content"]')).toBeInTheDocument()
    // 出错 on 预约: the platform is unreachable and the last good page stays, marked as such.
    act(() => runtime.actions.setPreview('error'))
    expect(await within(main()).findByText('这是上次成功更新时的内容')).toBeInTheDocument()
    expect(runStatus()).toHaveAttribute('data-run-status', 'failed')
    expect(await within(main()).findByRole('region', { name: '今日预约' })).toBeInTheDocument()
    act(() => runtime.actions.setPreview('empty'))
    await waitFor(() => expect(runStatus()).toHaveAttribute('data-run-status', 'never-run'))
    expect(await within(main()).findByRole('region', { name: '今日预约' })).toHaveTextContent('empty')
  })

  it('says why a page that kept nothing failed, and offers to run again', async () => {
    const { runtime } = open('/m/messages', { preview: 'error' })
    expect(h1()).toHaveTextContent('消息')
    expect(await within(main()).findByText('无法载入这个页面')).toBeInTheDocument()
    const page = main().querySelector<HTMLElement>('[data-slot="block-renderer"]')!
    expect(page).toHaveTextContent('的授权已过期')
    const runs = runtime.getState().runs.length
    await userEvent.click(within(page).getByRole('button', { name: '重试' }))
    expect(runtime.getState().runs.length).toBe(runs + 1)
  })

  it('refuses a malformed module-routes.tsx', () => {
    const element = <p />
    expect(collectChildRoutes({ '/src/screens/b/module-routes.tsx': { moduleRoutes: [{ path: 'memory', element }] } })).toHaveLength(1)
    expect(() => collectChildRoutes({ '/src/screens/a/module-routes.tsx': {} })).toThrow(/exports `moduleRoutes`/)
    expect(() => collectChildRoutes({ '/src/screens/a/module-routes.tsx': { moduleRoutes: [{ path: '/m/x', element }] } })).toThrow(
      /relative/,
    )
  })
})

describe('/dev/frame (R-15)', () => {
  const openDemo = (path = '/dev/frame', preview?: string) => open(path, { app: routes, preview })
  const blocks = () => [...document.querySelectorAll<HTMLElement>('[data-block]')]
  const marksIn = (id: string) => document.querySelectorAll(`[data-block="${id}"] [data-change]`).length
  const summary = () => document.querySelector('[data-slot="block-changes"]')

  async function runOnce(n: number) {
    await userEvent.click(runNow())
    await waitFor(() => expect(runStatus()).toHaveAttribute('data-run-status', 'running'))
    await waitFor(() => expect(runStatus()).toHaveAttribute('data-run-status', 'ok'), { timeout: 3000 })
    expect(n).toBeGreaterThan(0)
  }

  it('renders a page description of all seven blocks inside the frame and the shell', async () => {
    openDemo()
    expect(h1()).toHaveTextContent('框架演示')
    expect(screen.getByRole('navigation', { name: '功能导航' })).toBeInTheDocument()
    await waitFor(() => expect(blocks().map((block) => block.dataset.block)).toEqual([...blockIds]))
    // Nothing is marked before a run of this session.
    expect(document.querySelectorAll('[data-block] [data-change]')).toHaveLength(0)
    expect(summary()).toHaveTextContent('')
    expect(await axe(document.body)).toHaveNoViolations()
  })

  it('marks exactly the two items a run changed and their blocks, counts them, and clears them on the next run', async () => {
    openDemo()
    await waitFor(() => expect(blocks()).toHaveLength(7))
    await runOnce(1)
    await waitFor(() => expect(summary()).toHaveTextContent('这次带来 2 处更新'))
    // In each of the two blocks: the marker on the title and the one on the item.
    for (const id of blockIds) {
      expect([id, marksIn(id)]).toEqual([id, id === 'block.list' || id === 'block.table' ? 2 : 0])
    }
    for (const id of ['block.list', 'block.table']) {
      expect(document.querySelectorAll(`[data-block="${id}"] :is(h2) [data-change]`)).toHaveLength(1)
    }
    await runOnce(2)
    await waitFor(() => expect(summary()).toHaveTextContent(''))
    expect(document.querySelectorAll('[data-block] [data-change]')).toHaveLength(0)
  })

  it('keeps a pin across a reload', async () => {
    const first = openDemo()
    await waitFor(() => expect(blocks()).toHaveLength(7))
    const title = blocks()[2].querySelector('h2')!.textContent!
    const pin = () => within(main()).getByRole('button', { name: `固定「${title}」` })
    await userEvent.click(pin())
    expect(pin()).toHaveAttribute('aria-pressed', 'true')
    expect(JSON.parse(window.localStorage.getItem(storageKeys.pins) ?? '{}')).toEqual({ [demoModuleId]: { 'block.table': 2 } })
    first.unmount()
    openDemo()
    await waitFor(() => expect(blocks()).toHaveLength(7))
    expect(pin()).toHaveAttribute('aria-pressed', 'true')
    expect(document.querySelector('[data-block="block.table"]')).toHaveAttribute('data-pinned', 'true')
  })

  it('follows 状态预览: never-run with block.empty alone, a failed run over the last good page, long content', async () => {
    const { runtime } = openDemo('/dev/frame', 'empty')
    await waitFor(() => expect(blocks().map((block) => block.dataset.block)).toEqual(['block.empty']))
    expect(runStatus()).toHaveAttribute('data-run-status', 'never-run')
    act(() => runtime.actions.setPreview('error'))
    await waitFor(() => expect(runStatus()).toHaveAttribute('data-run-status', 'failed'))
    await waitFor(() => expect(blocks()).toHaveLength(7))
    expect(main().querySelector('[data-page-kept="stale"]')).toBeInTheDocument()
    act(() => runtime.actions.setPreview('long'))
    await waitFor(() => expect(runStatus()).toHaveAttribute('data-run-status', 'ok'))
    await waitFor(() => expect(blocks()).toHaveLength(7))
    act(() => runtime.actions.setPreview('loading'))
    await waitFor(() => expect(runStatus()).toHaveAttribute('data-run-status', 'running'))
  })

  it('sets how the last run ended from the demo’s own control', async () => {
    openDemo()
    await userEvent.click(await within(main()).findByRole('button', { name: '失败：授权过期' }))
    await waitFor(() => expect(runStatus().querySelector('[data-run-failure]')).toHaveAttribute('data-run-failure', 'account-expired'))
    await userEvent.click(within(main()).getByRole('button', { name: '按实际更新' }))
    await waitFor(() => expect(runStatus()).toHaveAttribute('data-run-status', 'ok'))
  })

  it.each([
    ['/dev/frame/workflow', 'workflow', '流程'],
    ['/dev/frame/memory', 'memory', '资料'],
    ['/dev/frame/pets/demo', 'child', '一个子页面'],
  ])('shows the other views with the same controls in the header: %s', async (path, view, title) => {
    openDemo(path)
    expect(frame()).toHaveAttribute('data-view', view)
    expect(h1()).toHaveTextContent(title)
    // The frame's controls stand in the shell header (D-50); 流程 and 资料 are in 功能设置 (D-52).
    const slot = document.querySelector<HTMLElement>('[data-shell-slot]')!
    await userEvent.click(within(slot).getByRole('button', { name: '功能设置' }))
    const settings = await screen.findByRole('dialog', { name: '功能设置' })
    expect(settings).toHaveTextContent('框架演示')
    const full = ['流程', '资料'].map((part) => within(settings).getByRole('link', { name: `整页打开「${part}」` }).getAttribute('href'))
    expect(full).toEqual(['/dev/frame/workflow', '/dev/frame/memory'])
  })

  it('lists the demo for the matrix, usual scene first, with every forced state', () => {
    expect(matrixRoutes[0]).toEqual({ path: '/dev/frame', scenes: ['s2'], previews: ['empty', 'loading', 'error', 'long'] })
  })
})
