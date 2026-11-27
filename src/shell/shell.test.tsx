import { act, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMemoryRouter, Link, RouterProvider, useParams } from 'react-router'
import type { RouteObject } from 'react-router'
import { describe, expect, it, vi } from 'vitest'

import { Providers } from '@/app/Providers'
import { SidebarGroup, SidebarItem } from '@/components/navigation'
import { Page } from '@/components/layout'
import { compactQuery } from '@/hooks/use-mobile'
import { LOCALE_STORAGE_KEY } from '@/i18n'
import {
  createRuntime,
  previewIds,
  resolveModule,
  RuntimeContext,
  sceneIds,
  storageKeys,
  typed,
  useRuntimeState,
  type Runtime,
  type RuntimeOptions,
} from '@/runtime'
import { memoryStorage } from '@/runtime/test-support'
import { axe } from '@/test/axe'
import { setMediaQuery } from '@/test/match-media'

import { ancestorsOf, routeAfterJump } from './crumbs'
import { chromeOf, type ShellHandle } from './route'
import { Shell } from './Shell'
import type { ShellSlots } from './slots'
import { expandedQuery } from './use-media'

// The chat registers its real slots for every screen (`src/chat/shell-slots.tsx`); this file
// is about the shell and its own stand-ins, so the registration is left out here.
vi.mock('@/chat/shell-slots', () => ({}))

// R-05 – R-08 of docs/specs/lofi-prototype-shell.md: the shell's structure in
// each size class, the sidebar, the keyboard order and the 时间推进 device.

const appointments = 'profession.appointments'
const duration = 'profession.appointments.sub.duration'

function ModulePage() {
  const { id = '' } = useParams()
  const state = useRuntimeState()
  return (
    <Page title={resolveModule(state, id)?.module.name['zh-CN'] ?? id}>
      <button type="button">页面按钮</button>
      <Link to={`/m/${id}/workflow`}>流程</Link>
    </Page>
  )
}

function TestBar() {
  return (
    <section aria-label="测试栏">
      <button type="button">栏内按钮</button>
    </section>
  )
}

function TestRecent() {
  return (
    <SidebarGroup label="最近对话">
      <SidebarItem icon={<svg />} label="一段对话" />
    </SidebarGroup>
  )
}

const standIns: ShellHandle = { shell: 'app', slots: { chatBar: TestBar } }

function routesWith(slots?: ShellSlots): RouteObject[] {
  return [
    {
      path: '/',
      element: <Shell slots={slots} />,
      children: [
        { path: '/m/:id', element: <ModulePage /> },
        { path: '/m/:id/workflow', element: <Page title="流程" /> },
        { path: '/topics', element: <Page title="话题" /> },
        { path: '/settings', element: <Page title="设置" /> },
        { path: '/dev/plain', element: <Page title="工具" /> },
        { path: '/dev/inside', element: <Page title="演示" />, handle: standIns },
        { index: true, element: <Page title="起始页" /> },
      ],
    },
  ]
}

type Size = 'compact' | 'medium' | 'expanded'

function setSize(size: Size) {
  act(() => {
    setMediaQuery(compactQuery, size === 'compact')
    setMediaQuery(expandedQuery, size === 'expanded')
  })
}

function open(
  path = '/m/notifications',
  options: { size?: Size; scene?: string; locale?: 'zh-CN' | 'en'; slots?: ShellSlots; runtime?: RuntimeOptions } = {},
) {
  const { size = 'expanded', scene = 's2', locale = 'zh-CN', slots } = options
  window.localStorage.setItem(LOCALE_STORAGE_KEY, locale)
  setSize(size)
  const runtime: Runtime = createRuntime({ delay: 0, storage: null, search: `?scene=${scene}`, ...options.runtime })
  const router = createMemoryRouter(routesWith(slots), { initialEntries: [path] })
  const view = render(
    <Providers>
      <RuntimeContext value={runtime}>
        <RouterProvider router={router} />
      </RuntimeContext>
    </Providers>,
  )
  return { runtime, router, ...view }
}

const nav = () => screen.getByRole('navigation', { name: '功能导航' })
const deviceButton = () => screen.getByRole('button', { name: /^原型控制 · 时间推进：/ })
const shellHeader = () => document.querySelector('[data-shell] > header')
const announced = () => shellHeader()?.querySelector('[role="status"]')?.textContent

async function openDevice() {
  await userEvent.click(deviceButton())
  return screen.findByRole('menu')
}

describe('the shell in each size class (R-05)', () => {
  it('expanded: the sidebar is open with its labels and headings; header, main and nothing under main', async () => {
    const { container } = open()
    expect(await screen.findByRole('heading', { level: 1, name: '通知' })).toBeInTheDocument()
    expect(within(nav()).getByText('我的店 · 宠物美容')).not.toHaveClass('sr-only')
    expect(within(nav()).getByRole('link', { name: '服务时长' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '展开或收起侧边栏' })).toHaveAttribute('aria-expanded', 'true')
    expect(deviceButton()).toHaveTextContent('原型控制 · 时间推进：第 1–2 周')
    expect(shellHeader()).toContainElement(deviceButton())
    expect(screen.getByRole('main')).toContainElement(screen.getByRole('button', { name: '页面按钮' }))
    expect(container.querySelector('[data-shell-bar]')).toBeNull()
  })

  it('medium: an icon rail — names kept, sub-modules and headings not drawn; the trigger opens it until the size class changes', async () => {
    open('/m/notifications', { size: 'medium' })
    await screen.findByRole('heading', { level: 1 })
    expect(within(nav()).getByRole('link', { name: '消息' })).toBeInTheDocument()
    expect(within(nav()).getByText('我的店 · 宠物美容')).toHaveClass('sr-only')
    expect(within(nav()).queryByRole('link', { name: '服务时长' })).not.toBeInTheDocument()
    const trigger = screen.getByRole('button', { name: '展开或收起侧边栏' })
    expect(trigger).toHaveAttribute('aria-expanded', 'false')

    await userEvent.click(trigger)
    expect(trigger).toHaveAttribute('aria-expanded', 'true')
    expect(within(nav()).getByRole('link', { name: '服务时长' })).toBeInTheDocument()

    setSize('expanded')
    expect(trigger).toHaveAttribute('aria-expanded', 'true')
    setSize('medium')
    expect(trigger).toHaveAttribute('aria-expanded', 'false')
    expect(within(nav()).queryByRole('link', { name: '服务时长' })).not.toBeInTheDocument()
  })

  it('compact: the sidebar is off the canvas until the header button opens it; the device is an icon that keeps its name; a link closes the sheet', async () => {
    const { router } = open('/m/notifications', { size: 'compact' })
    await screen.findByRole('heading', { level: 1 })
    expect(screen.queryByRole('navigation', { name: '功能导航' })).not.toBeInTheDocument()
    expect(deviceButton()).toHaveAccessibleName('原型控制 · 时间推进：第 1–2 周')
    expect(deviceButton()).toHaveTextContent('')

    await userEvent.click(screen.getByRole('button', { name: '展开或收起侧边栏' }))
    const sheet = await screen.findByRole('dialog', { name: '功能导航' })
    await userEvent.click(within(sheet).getByRole('link', { name: '服务时长' }))
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    expect(router.state.location.pathname).toBe(`/m/${duration}`)
    expect(await screen.findByRole('heading', { level: 1, name: '服务时长' })).toBeInTheDocument()
  })

  it.each(['compact', 'medium', 'expanded'] as const)('%s: the bottom row follows main and is not inside it', async (size) => {
    const { container } = open('/m/notifications', { size, slots: { chatBar: TestBar } })
    await screen.findByRole('heading', { level: 1 })
    const row = container.querySelector('[data-shell-bar]')
    const main = screen.getByRole('main')
    expect(row).toContainElement(screen.getByRole('region', { name: '测试栏' }))
    expect(main.nextElementSibling).toBe(row)
    expect(main).not.toContainElement(row as HTMLElement)
    expect(main.previousElementSibling).toBe(shellHeader())
    // The column is one grid cell as tall as the window and `main` is the part that scrolls.
    expect(main.parentElement).toHaveClass('h-svh', 'grid', 'grid-rows-1')
    expect(main).toHaveClass('row-start-1', 'overflow-y-auto')
  })

  it('the header and the bottom row are floating frosted panels over the two ends of main, which keeps their room (D-47, D-50)', async () => {
    const { container } = open('/m/notifications', { slots: { chatBar: TestBar } })
    await screen.findByRole('heading', { level: 1 })
    const row = container.querySelector('[data-shell-bar]') as HTMLElement
    const main = screen.getByRole('main')
    // The same cell as `main`: the header at its start, the row at its end, both above what a screen stacks.
    expect(shellHeader()).toHaveClass('row-start-1', 'self-start', 'z-10')
    expect(row).toHaveClass('row-start-1', 'self-end', 'z-10')
    // Each is a transparent row with room around a floating panel (D-50): frosted, rounded on every corner, ringed.
    for (const bar of [shellHeader()!, row]) {
      expect(bar).toHaveClass('pointer-events-none', 'p-2')
      expect(bar.querySelector(':scope > [data-shell-panel]')).toHaveClass(
        'surface-frosted',
        'bg-background',
        'rounded-xl',
        'ring-1',
        'pointer-events-auto',
      )
    }
    expect(main).toHaveClass('isolate')
    // The room of each bar, and the same again as scroll padding: a focused control is not left under one.
    expect(main).toHaveClass('pt-(--shell-header-size)', 'pb-(--shell-bar-size)')
    expect(main).toHaveClass('scroll-pt-(--shell-header-size)', 'scroll-pb-(--shell-bar-size)')
  })

  it('writes the size of each bar onto the shell and follows it as it changes (D-47)', async () => {
    const observed: { target: Element; notify: () => void }[] = []
    vi.stubGlobal(
      'ResizeObserver',
      class {
        private readonly notify: () => void
        constructor(callback: () => void) {
          this.notify = callback
        }
        observe(target: Element) {
          observed.push({ target, notify: this.notify })
        }
        disconnect() {}
      },
    )
    const sizes = new Map<Element, number>()
    const offsetHeight = vi.spyOn(HTMLElement.prototype, 'offsetHeight', 'get').mockImplementation(function (this: HTMLElement) {
      return sizes.get(this) ?? 0
    })
    try {
      const { container } = open('/m/notifications', { slots: { chatBar: TestBar } })
      await screen.findByRole('heading', { level: 1 })
      const shell = container.querySelector('[data-shell]') as HTMLElement
      const row = container.querySelector('[data-shell-bar]') as HTMLElement
      expect(observed.map(({ target }) => target)).toEqual(expect.arrayContaining([shellHeader(), row]))
      sizes.set(shellHeader()!, 40)
      sizes.set(row, 96)
      act(() => observed.find(({ target }) => target === row)!.notify())
      expect(shell.style.getPropertyValue('--shell-header-size')).toBe('40px')
      expect(shell.style.getPropertyValue('--shell-bar-size')).toBe('96px')
    } finally {
      offsetHeight.mockRestore()
      vi.unstubAllGlobals()
    }
  })

  it('the recent slot sits in the sidebar between the modules and the footer', async () => {
    open('/m/notifications', { slots: { sidebarRecent: TestRecent } })
    await screen.findByRole('heading', { level: 1 })
    const names = within(nav())
      .getAllByRole('list')
      .map((list) => list.getAttribute('aria-labelledby'))
      .map((id) => (id ? document.getElementById(id)?.textContent : null))
    expect(names).toEqual(expect.arrayContaining(['基础', '我的店 · 宠物美容', '最近对话', '设置与偏好']))
    expect(names.indexOf('最近对话')).toBeGreaterThan(names.indexOf('我的店 · 宠物美容'))
    expect(names.indexOf('最近对话')).toBeLessThan(names.indexOf('设置与偏好'))
  })

  it('a bare route gets main alone; a route may ask for the shell and bring stand-ins for the slots', async () => {
    expect(['/m/notifications', '/topics/t-1', '/chat/c-1', '/settings'].map(chromeOf)).toEqual(['app', 'app', 'app', 'app'])
    expect(['/', '/onboarding/profession', '/dev/components', '/no/such/page'].map(chromeOf)).toEqual(['bare', 'bare', 'bare', 'bare'])

    const plain = open('/dev/plain')
    expect(await screen.findByRole('heading', { level: 1, name: '工具' })).toBeInTheDocument()
    expect(screen.getByRole('main')).toBeInTheDocument()
    expect(screen.queryByRole('navigation')).not.toBeInTheDocument()
    expect(shellHeader()).toBeNull()
    expect(screen.queryByRole('link', { name: '跳到主要内容' })).not.toBeInTheDocument()
    plain.unmount()

    open('/dev/inside')
    expect(await screen.findByRole('heading', { level: 1, name: '演示' })).toBeInTheDocument()
    expect(nav()).toBeInTheDocument()
    expect(screen.getByRole('region', { name: '测试栏' })).toBeInTheDocument()
  })

  it('has no accessibility violation and no English name in zh-CN', async () => {
    const { container } = open(`/m/${duration}`, { scene: 's3', slots: { chatBar: TestBar } })
    await screen.findByRole('heading', { level: 1, name: '服务时长' })
    expect(await axe(container)).toHaveNoViolations()
    const names = [...container.querySelectorAll('[aria-label]')].map((element) => element.getAttribute('aria-label') ?? '')
    expect(names.length).toBeGreaterThan(0)
    for (const name of names) expect(name).not.toMatch(/[A-Za-z]{3,}/)
  })
})

describe('the sidebar (R-06)', () => {
  const linkNames = () =>
    within(nav())
      .getAllByRole('link')
      .map((link) => link.textContent)

  it('lists the seven base entries, the profession heading with its modules and nested sub-modules, and 设置', async () => {
    open()
    await screen.findByRole('heading', { level: 1 })
    expect(linkNames()).toEqual([
      '通知',
      '消息',
      '日程',
      '待办',
      '邮件',
      '文件',
      '话题',
      '预约',
      '预约确认',
      '服务时长',
      '顾客与宠物',
      '商品与库存',
      '排班',
      '设置',
    ])
    const base = within(nav()).getByRole('list', { name: '基础' })
    expect(within(base).getAllByRole('link')).toHaveLength(7)
    expect(within(base).getByRole('link', { name: '话题' })).toHaveAttribute('href', '/topics')
    const profession = within(nav()).getByRole('list', { name: '我的店 · 宠物美容' })
    const parent = within(profession).getByRole('link', { name: '预约' }).closest('li') as HTMLElement
    expect(within(parent).getByRole('link', { name: '服务时长' })).toHaveAttribute('href', `/m/${duration}`)
    expect(within(nav()).getByRole('link', { name: '设置' })).toHaveAttribute('href', '/settings')
    // No preferences menu (D-50): appearance and language live in 设置 alone.
    expect(within(nav()).queryByRole('button', { name: '偏好设置' })).toBeNull()
  })

  it('shows renameModule, addModule, removeModule and createSubModule at once', async () => {
    const { runtime } = open()
    await screen.findByRole('heading', { level: 1 })
    act(() => runtime.actions.renameModule({ moduleId: appointments, name: '预约与到店' }))
    expect(within(nav()).getByRole('link', { name: '预约与到店' })).toBeInTheDocument()
    expect(within(nav()).queryByRole('link', { name: '预约' })).not.toBeInTheDocument()

    act(() => void runtime.actions.addModule({ name: '会员' }))
    expect(within(within(nav()).getByRole('list', { name: '我的店 · 宠物美容' })).getByRole('link', { name: '会员' })).toBeInTheDocument()

    act(() => runtime.actions.removeModule('profession.shifts'))
    expect(within(nav()).queryByRole('link', { name: '排班' })).not.toBeInTheDocument()

    act(() => void runtime.actions.createSubModule({ parentId: appointments, name: typed('生日提醒') }))
    const parent = within(nav()).getByRole('link', { name: '预约与到店' }).closest('li') as HTMLElement
    expect(within(parent).getByRole('link', { name: '生日提醒' })).toBeInTheDocument()
  })

  it('keeps its modules under every forced preview: it reads the state, not a resource', async () => {
    const { runtime } = open()
    await screen.findByRole('heading', { level: 1 })
    for (const preview of previewIds) {
      act(() => runtime.actions.setPreview(preview))
      expect(linkNames(), preview).toHaveLength(14)
    }
  })

  it('says how many things wait for her beside 通知, in words', async () => {
    open('/m/notifications', { scene: 's3' })
    await screen.findByRole('heading', { level: 1 })
    expect(within(nav()).getByRole('link', { name: /^通知\s*1 项等待你确认$/ })).toBeInTheDocument()
  })

  it('marks the open destination: the sub-module itself when open, its parent in the rail', async () => {
    open(`/m/${duration}`)
    await screen.findByRole('heading', { level: 1, name: '服务时长' })
    expect(within(nav()).getByRole('link', { name: '服务时长' })).toHaveAttribute('aria-current', 'page')
    expect(within(nav()).getByRole('link', { name: '预约' })).not.toHaveAttribute('aria-current')
    setSize('medium')
    expect(within(nav()).getByRole('link', { name: '预约' })).toHaveAttribute('aria-current', 'page')
    expect(within(nav()).getAllByRole('link').filter((link) => link.hasAttribute('aria-current'))).toHaveLength(1)
  })

  it('en: labels are in English and wrap instead of being cut', async () => {
    open('/m/notifications', { locale: 'en' })
    await screen.findByRole('heading', { level: 1 })
    const english = screen.getByRole('navigation', { name: 'Feature navigation' })
    const label = within(english).getByText('Clients and pets')
    expect(label.className).toContain('whitespace-normal!')
    expect(label.className).toContain('wrap-anywhere')
    expect(label.className).not.toContain('truncate')
    expect(within(english).getByText('My shop · Pet grooming')).toBeInTheDocument()
  })
})

describe('keyboard and focus (R-07)', () => {
  it.each(['expanded', 'medium'] as const)('%s: Tab goes skip link, sidebar, header, device, main, bottom row', async (size) => {
    open('/m/notifications', { size, slots: { chatBar: TestBar } })
    await screen.findByRole('heading', { level: 1 })
    const last = screen.getByRole('button', { name: '栏内按钮' })
    const stops: Element[] = []
    for (let i = 0; i < 40 && document.activeElement !== last; i += 1) {
      await userEvent.tab()
      stops.push(document.activeElement as Element)
    }
    const at = (element: Element) => stops.indexOf(element)
    const order = [
      screen.getByRole('link', { name: '跳到主要内容' }),
      within(nav()).getByRole('link', { name: '通知' }),
      within(nav()).getByRole('link', { name: '设置' }),
      screen.getByRole('button', { name: '展开或收起侧边栏' }),
      deviceButton(),
      screen.getByRole('button', { name: '页面按钮' }),
      last,
    ].map(at)
    expect(order[0]).toBe(0)
    expect(order).not.toContain(-1)
    expect(order).toEqual([...order].sort((a, b) => a - b))
    // No trap: every stop was taken once.
    expect(new Set(stops).size).toBe(stops.length)
  })

  it('compact: Tab goes skip link, header button, device, main, bottom row', async () => {
    open('/m/notifications', { size: 'compact', slots: { chatBar: TestBar } })
    await screen.findByRole('heading', { level: 1 })
    const names: string[] = []
    for (let i = 0; i < 6; i += 1) {
      await userEvent.tab()
      names.push(document.activeElement?.getAttribute('aria-label') ?? document.activeElement?.textContent ?? '')
    }
    expect(names).toEqual(['跳到主要内容', '展开或收起侧边栏', '原型控制 · 时间推进：第 1–2 周', '页面按钮', '流程', '栏内按钮'])
  })

  it('the skip link moves focus to main', async () => {
    open()
    await screen.findByRole('heading', { level: 1 })
    await userEvent.tab()
    expect(screen.getByRole('link', { name: '跳到主要内容' })).toHaveFocus()
    await userEvent.keyboard('{Enter}')
    expect(screen.getByRole('main')).toHaveFocus()
  })

  it('a route change moves focus to the h1 and names the document; the first screen leaves focus alone', async () => {
    open()
    await screen.findByRole('heading', { level: 1, name: '通知' })
    expect(document.body).toHaveFocus()
    await waitFor(() => expect(document.title).toBe('通知 · Personal Agent'))

    await userEvent.click(within(nav()).getByRole('link', { name: '服务时长' }))
    const heading = await screen.findByRole('heading', { level: 1, name: '服务时长' })
    await waitFor(() => expect(heading).toHaveFocus())
    await waitFor(() => expect(document.title).toBe('服务时长 · Personal Agent'))

    await userEvent.click(screen.getByRole('link', { name: '流程' }))
    await waitFor(() => expect(screen.getByRole('heading', { level: 1, name: '流程' })).toHaveFocus())
  })

  it('the breadcrumb names the open page by its h1 and the levels above it from the address', async () => {
    const { runtime } = open(`/m/${duration}`)
    await screen.findByRole('heading', { level: 1, name: '服务时长' })
    const crumbs = () => screen.getByRole('navigation', { name: '当前位置' })
    await waitFor(() => expect(within(crumbs()).getAllByText('服务时长').length).toBeGreaterThan(0))
    expect(within(crumbs()).getAllByRole('link', { name: '预约' })[0]).toHaveAttribute('href', `/m/${appointments}`)

    await userEvent.click(screen.getByRole('link', { name: '流程' }))
    await waitFor(() => expect(within(crumbs()).getAllByText('流程').length).toBeGreaterThan(0))
    expect(within(crumbs()).getAllByRole('link', { name: '服务时长' })[0]).toHaveAttribute('href', `/m/${duration}`)

    const state = runtime.getState()
    const names = { topics: '话题', settings: '设置' }
    expect(ancestorsOf('/settings/accounts', state, 'zh-CN', names).ancestors).toEqual([{ label: '设置', to: '/settings' }])
    expect(ancestorsOf('/topics', state, 'zh-CN', names)).toEqual({ ancestors: [], fallback: '话题' })
    const conversation = state.conversations[0]
    expect(ancestorsOf(`/chat/${conversation.id}`, state, 'zh-CN', names).ancestors.map((crumb) => crumb.to)).toEqual([
      '/topics',
      `/topics/${conversation.topicId}`,
    ])
  })
})

describe('the 时间推进 device and 状态预览 (R-08)', () => {
  it('lists every scene in its two groups, the current one checked, and jumps to each; the jump is announced', async () => {
    const { runtime } = open()
    await screen.findByRole('heading', { level: 1 })
    const menu = await openDevice()
    const groups = within(menu).getAllByRole('group')
    const named = (name: string) => groups.find((group) => document.getElementById(group.getAttribute('aria-labelledby') ?? '')?.textContent === name) as HTMLElement
    expect(within(named('热身')).getAllByRole('menuitemradio').map((item) => item.textContent)).toEqual(['第一晚', '第二晚'])
    expect(within(named('主线')).getAllByRole('menuitemradio').map((item) => item.textContent)).toEqual([
      '今天',
      '变成流程',
      '第 1–2 周',
      '第 3 周',
      '第 2 个月',
      '回看',
    ])
    expect(within(menu).getByRole('menuitemradio', { name: '第 1–2 周' })).toHaveAttribute('aria-checked', 'true')

    const scenes = [...within(named('热身')).getAllByRole('menuitemradio'), ...within(named('主线')).getAllByRole('menuitemradio')]
    expect(scenes).toHaveLength(sceneIds.length)
    for (const [index, id] of sceneIds.entries()) {
      const item = scenes[index]
      await userEvent.click(item)
      expect(runtime.getState().scene, id).toBe(id)
      expect(item).toHaveAttribute('aria-checked', 'true')
      expect(announced()).toBe(`已跳到「${item.textContent}」`)
    }
    expect(deviceButton()).toHaveTextContent('原型控制 · 时间推进：回看')
  })

  it('上一幕 and 下一幕 step through the story and stop at its ends', async () => {
    const { runtime } = open('/m/notifications', { scene: 'e2' })
    await screen.findByRole('heading', { level: 1 })
    await userEvent.click(within(await openDevice()).getByRole('menuitem', { name: '下一幕' }))
    expect(runtime.getState().scene).toBe('s0')
    await waitFor(() => expect(screen.queryByRole('menu')).not.toBeInTheDocument())
    await userEvent.click(within(await openDevice()).getByRole('menuitem', { name: '上一幕' }))
    await waitFor(() => expect(screen.queryByRole('menu')).not.toBeInTheDocument())
    await userEvent.click(within(await openDevice()).getByRole('menuitem', { name: '上一幕' }))
    expect(runtime.getState().scene).toBe('e1')
    await waitFor(() => expect(screen.queryByRole('menu')).not.toBeInTheDocument())

    expect(within(await openDevice()).getByRole('menuitem', { name: '上一幕' })).toHaveAttribute('aria-disabled', 'true')
    await userEvent.click(screen.getByRole('menuitemradio', { name: '回看' }))
    expect(within(screen.getByRole('menu')).getByRole('menuitem', { name: '下一幕' })).toHaveAttribute('aria-disabled', 'true')
    expect(within(screen.getByRole('menu')).getByRole('menuitem', { name: '上一幕' })).not.toHaveAttribute('aria-disabled', 'true')
  })

  it('works by keyboard: Enter opens the menu, the arrows move, Enter jumps, Escape returns focus', async () => {
    const { runtime } = open('/m/notifications', { size: 'compact', scene: 's0' })
    await screen.findByRole('heading', { level: 1 })
    await userEvent.tab()
    await userEvent.tab()
    await userEvent.tab()
    expect(deviceButton()).toHaveFocus()
    await userEvent.keyboard('{Enter}')
    await waitFor(() => expect(screen.getByRole('menuitemradio', { name: '第一晚' })).toHaveFocus())
    await userEvent.keyboard('{ArrowDown}')
    await waitFor(() => expect(screen.getByRole('menuitemradio', { name: '第二晚' })).toHaveFocus())
    await userEvent.keyboard('{Enter}')
    expect(runtime.getState().scene).toBe('e2')
    if (!screen.queryByRole('menu')) await userEvent.keyboard('{Enter}')
    await waitFor(() => expect(screen.getByRole('menu')).toContainElement(document.activeElement as HTMLElement))
    await userEvent.keyboard('{End}')
    await waitFor(() => expect(screen.getByRole('menuitem', { name: '重新开始（回到首次使用）' })).toHaveFocus())
    await userEvent.keyboard('{Escape}')
    await waitFor(() => expect(screen.queryByRole('menu')).not.toBeInTheDocument())
    await waitFor(() => expect(deviceButton()).toHaveFocus())
  })

  it('the scene survives a reload; a forced preview does not', async () => {
    const storage = memoryStorage()
    const { runtime } = open('/m/notifications', { runtime: { storage, search: '' } })
    await screen.findByRole('heading', { level: 1 })
    expect(runtime.getState().scene).toBe('e1')
    const menu = await openDevice()
    await userEvent.click(within(menu).getByRole('menuitemradio', { name: '第 2 个月' }))
    await userEvent.click(within(menu).getByRole('menuitemradio', { name: '出错' }))
    expect(storage.items.get(storageKeys.scene)).toBe('s4')
    expect(runtime.getState().preview).toBe('error')

    const reloaded = createRuntime({ delay: 0, storage, search: '' }).getState()
    expect(reloaded.scene).toBe('s4')
    expect(reloaded.preview).toBe('normal')
  })

  it('状态预览 forces each state, says so in a line with 恢复正常, and survives navigation', async () => {
    const { runtime, container } = open()
    await screen.findByRole('heading', { level: 1 })
    const line = () => container.querySelector('[data-shell-preview]')
    expect(line()).toBeNull()
    const menu = await openDevice()
    const states = { empty: '空', loading: '加载中', error: '出错', long: '超长内容' } as const
    for (const [id, name] of Object.entries(states)) {
      await userEvent.click(within(menu).getByRole('menuitemradio', { name }))
      expect(runtime.getState().preview).toBe(id)
      expect(line()).toHaveTextContent(`原型控制：正在预览「${name}」状态`)
      expect(announced()).toBe(`原型控制：正在预览「${name}」状态`)
    }
    await userEvent.keyboard('{Escape}')
    await waitFor(() => expect(screen.queryByRole('menu')).not.toBeInTheDocument())

    await userEvent.click(within(nav()).getByRole('link', { name: '消息' }))
    await screen.findByRole('heading', { level: 1, name: '消息' })
    expect(line()).toHaveTextContent('原型控制：正在预览「超长内容」状态')

    await userEvent.click(within(line() as HTMLElement).getByRole('button', { name: '恢复正常' }))
    expect(runtime.getState().preview).toBe('normal')
    expect(line()).toBeNull()
    expect(announced()).toBe('预览已结束：各页面恢复显示自己的状态')
  })

  it('a scene jump resets the preview and takes ?scene= and ?preview= out of the address', async () => {
    const { runtime, router, container } = open('/m/notifications?scene=s2&preview=error&tab=1', { runtime: { search: '?scene=s2&preview=error' } })
    await screen.findByRole('heading', { level: 1 })
    expect(container.querySelector('[data-shell-preview]')).toHaveTextContent('出错')

    const menu = await openDevice()
    await userEvent.click(within(menu).getByRole('menuitemradio', { name: '加载中' }))
    await waitFor(() => expect(router.state.location.search).toBe('?scene=s2&tab=1'))

    await userEvent.click(within(menu).getByRole('menuitemradio', { name: '第 3 周' }))
    expect(runtime.getState().preview).toBe('normal')
    expect(container.querySelector('[data-shell-preview]')).toBeNull()
    await waitFor(() => expect(router.state.location.search).toBe('?tab=1'))
    expect(router.state.location.pathname).toBe('/m/notifications')
  })

  it('a jump keeps the route when the module exists in that scene, and goes to 通知 when it does not', async () => {
    const { runtime, router } = open(`/m/${duration}`)
    await screen.findByRole('heading', { level: 1, name: '服务时长' })
    const menu = await openDevice()
    await userEvent.click(within(menu).getByRole('menuitemradio', { name: '第 3 周' }))
    expect(router.state.location.pathname).toBe(`/m/${duration}`)
    await userEvent.click(within(menu).getByRole('menuitemradio', { name: '第一晚' }))
    await waitFor(() => expect(router.state.location.pathname).toBe('/m/notifications'))
    expect(await screen.findByRole('heading', { level: 1, name: '通知' })).toBeInTheDocument()

    const state = runtime.getState()
    expect(routeAfterJump('/m/notifications/workflow', state)).toBeNull()
    expect(routeAfterJump('/topics', state)).toBeNull()
    expect(routeAfterJump('/chat/no-such-conversation', state)).toBe('/m/notifications')
    expect(routeAfterJump('/topics/no-such-topic', state)).toBe('/m/notifications')
    expect(routeAfterJump('/settings/accounts', state)).toBeNull()
  })

  it('重新开始 goes back to first use: the first scene, onboarding not done, the start page', async () => {
    const storage = memoryStorage()
    const { runtime, router } = open('/m/notifications', { runtime: { storage } })
    await screen.findByRole('heading', { level: 1 })
    expect(runtime.getState().onboarded).toBe(true)
    await userEvent.click(within(await openDevice()).getByRole('menuitem', { name: '重新开始（回到首次使用）' }))
    expect(runtime.getState().scene).toBe('e1')
    expect(runtime.getState().onboarded).toBe(false)
    expect(storage.items.size).toBe(0)
    await waitFor(() => expect(router.state.location.pathname).toBe('/'))
    expect(await screen.findByRole('heading', { level: 1, name: '起始页' })).toBeInTheDocument()
  })

  it('en: the device, its menu and the preview line are in English', async () => {
    const { container } = open('/m/notifications', { locale: 'en' })
    await screen.findByRole('heading', { level: 1 })
    const button = screen.getByRole('button', { name: 'Prototype controls · Time travel: Weeks 1–2' })
    await userEvent.click(button)
    const menu = await screen.findByRole('menu')
    await userEvent.click(within(menu).getByRole('menuitemradio', { name: 'Error' }))
    expect(container.querySelector('[data-shell-preview]')).toHaveTextContent('Prototype controls: previewing the “Error” state')
    expect(within(container.querySelector('[data-shell-preview]') as HTMLElement).getByRole('button', { name: 'Back to normal' })).toBeInTheDocument()
    expect(within(menu).getByRole('menuitem', { name: 'Start over (back to first use)' })).toBeInTheDocument()
  })
})
