import { act, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMemoryRouter, RouterProvider } from 'react-router'
import type { RouteObject } from 'react-router'
import { describe, expect, it } from 'vitest'

import { Providers } from '@/app/Providers'
import { buildRoutes } from '@/app/router'
import { LOCALE_STORAGE_KEY } from '@/i18n'
import { createRuntime, RuntimeContext } from '@/runtime'
import { axe } from '@/test/axe'
import { setMediaQuery } from '@/test/match-media'
import { expandedQuery } from '@/shell/use-media'

import { matrixRoutes, routes } from './routes'
import { startFallback, startPaths } from './start'

// Area `root`: the start page and `/dev/shell` (R-05 – R-08 of docs/specs/lofi-prototype-shell.md).

function open(path: string, options: { search?: string; extra?: RouteObject[]; locale?: 'zh-CN' | 'en' } = {}) {
  window.localStorage.setItem(LOCALE_STORAGE_KEY, options.locale ?? 'zh-CN')
  act(() => setMediaQuery(expandedQuery, true))
  const runtime = createRuntime({ delay: 0, storage: null, search: options.search ?? '' })
  const router = createMemoryRouter(buildRoutes([...routes, ...(options.extra ?? [])]), { initialEntries: [path] })
  const view = render(
    <Providers>
      <RuntimeContext value={runtime}>
        <RouterProvider router={router} />
      </RuntimeContext>
    </Providers>,
  )
  return { runtime, router, ...view }
}

describe('the start page', () => {
  const built: RouteObject[] = [
    { path: '/onboarding/profession', element: <h1>职业访谈</h1> },
    { path: '/m/:id', element: <h1>模块</h1> },
    { path: '/dev/components', element: <h1>组件库</h1> },
  ]

  it('goes to the profession interview until onboarding is done', async () => {
    const { router } = open('/', { extra: built })
    expect(await screen.findByRole('heading', { name: '职业访谈' })).toBeInTheDocument()
    expect(router.state.location.pathname).toBe(startPaths.onboarding)
    // Onboarding comes before the shell: no module navigation around it.
    expect(screen.queryByRole('navigation')).not.toBeInTheDocument()
  })

  it('goes to 通知, inside the shell, once onboarding is done', async () => {
    const { router } = open('/', { extra: built, search: '?scene=s1' })
    expect(await screen.findByRole('heading', { name: '模块' })).toBeInTheDocument()
    expect(router.state.location.pathname).toBe(startPaths.home)
    expect(startPaths.home).toBe('/m/notifications')
    expect(screen.getByRole('navigation', { name: '模块导航' })).toBeInTheDocument()
  })

  it('opens the gallery while the screen it should open is not registered', async () => {
    const { router } = open('/', { extra: [built[2]] })
    expect(await screen.findByRole('heading', { name: '组件库' })).toBeInTheDocument()
    expect(router.state.location.pathname).toBe(startFallback)
  })
})

describe('/dev/shell', () => {
  it('is a matrix route in a scene that has sub-modules', () => {
    expect(matrixRoutes).toEqual([{ path: '/dev/shell', scenes: ['s2'] }])
  })

  it('shows the shell around the demo, with stand-ins in both slots, and no violation', async () => {
    const { container } = open('/dev/shell', { search: '?scene=s2' })
    expect(await screen.findByRole('heading', { level: 1, name: '外壳演示' })).toBeInTheDocument()
    const nav = screen.getByRole('navigation', { name: '模块导航' })
    expect(within(nav).getByRole('link', { name: '服务时长' })).toBeInTheDocument()
    expect(within(nav).getByRole('button', { name: '最近对话（占位）' })).toHaveAttribute('aria-expanded', 'false')
    const row = container.querySelector('[data-shell-bar]') as HTMLElement
    expect(within(row).getByRole('region', { name: '代替对话栏的占位行' })).toBeInTheDocument()
    expect(screen.getByRole('main').nextElementSibling).toBe(row)
    // The toaster stays the last element of the root, after the shell.
    expect(container.lastElementChild).toContainElement(document.querySelector('section[aria-live]') as HTMLElement)
    expect(container.lastElementChild).not.toContainElement(row)
    expect(await axe(container)).toHaveNoViolations()
  })

  it('its buttons change the modules through the runtime and the sidebar follows at once', async () => {
    open('/dev/shell', { search: '?scene=s2' })
    await screen.findByRole('heading', { level: 1, name: '外壳演示' })
    const nav = screen.getByRole('navigation', { name: '模块导航' })
    await userEvent.click(screen.getByRole('button', { name: '重命名「预约」' }))
    expect(within(nav).getByRole('link', { name: '预约与到店（已重命名）' })).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: '添加一个模块' }))
    expect(within(nav).getByRole('link', { name: '会员' })).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: '移除「排班」' }))
    expect(within(nav).queryByRole('link', { name: '排班' })).not.toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: '在「预约」下添加子模块' }))
    const parent = within(nav).getByRole('link', { name: '预约与到店（已重命名）' }).closest('li') as HTMLElement
    expect(within(parent).getByRole('link', { name: '老顾客的生日提醒' })).toBeInTheDocument()
  })

  it('en: the demo and the shell around it are in English', async () => {
    open('/dev/shell', { search: '?scene=s2', locale: 'en' })
    expect(await screen.findByRole('heading', { level: 1, name: 'Shell demo' })).toBeInTheDocument()
    expect(screen.getByRole('navigation', { name: 'Module navigation' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Skip to main content' })).toBeInTheDocument()
    expect(screen.getByRole('region', { name: 'Stand-in for the chat bar' })).toBeInTheDocument()
  })

  it('following its link moves focus to the heading of the second page, and back', async () => {
    const { router } = open('/dev/shell', { search: '?scene=s2' })
    await screen.findByRole('heading', { level: 1, name: '外壳演示' })
    await userEvent.click(screen.getByRole('link', { name: '打开第二页' }))
    await waitFor(() => expect(screen.getByRole('heading', { level: 1, name: '第二页' })).toHaveFocus())
    expect(router.state.location.pathname).toBe('/dev/shell/second')
    expect(document.title).toBe('第二页 · Personal Agent')
    await userEvent.click(screen.getByRole('link', { name: '回到外壳演示' }))
    await waitFor(() => expect(screen.getByRole('heading', { level: 1, name: '外壳演示' })).toHaveFocus())
  })
})
