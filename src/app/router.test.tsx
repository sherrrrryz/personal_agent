import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMemoryRouter, matchRoutes, RouterProvider } from 'react-router'
import type { RouteObject } from 'react-router'
import { afterEach, describe, expect, it } from 'vitest'

import { toast } from '@/components/feedback'
import { LOCALE_STORAGE_KEY } from '@/i18n'
import { createRuntime, parsePreview, parseSceneRef, previewIds, sceneRefs } from '@/runtime'
import { axe } from '@/test/axe'
import { THEME_STORAGE_KEY } from '@/theme'

import { Providers } from './Providers'
import { buildRoutes, fallbackStart } from './router'
import { areaRoutes, matrixRoutes } from './routes'

function open(path: string, routes: RouteObject[] = buildRoutes()) {
  const router = createMemoryRouter(routes, { initialEntries: [path] })
  return { router, ...render(<Providers><RouterProvider router={router} /></Providers>) }
}

describe('the router host', () => {
  it('finds every area by glob', () => {
    expect(areaRoutes.some((route) => route.path === '/dev/components')).toBe(true)
  })

  // `npm run matrix -- --all` walks these paths as written: one that no route
  // matches would be checked as the not-found screen and pass.
  it('every matrix route is a concrete path that a registered route answers', () => {
    expect(matrixRoutes.length).toBeGreaterThan(0)
    for (const { path } of matrixRoutes) {
      expect(path, path).toMatch(/^\/[^:*]*$/)
      const leaf = matchRoutes(buildRoutes(), path)?.at(-1)?.route
      expect(leaf?.path, path).not.toBe('*')
      expect(leaf, path).toBeDefined()
    }
  })

  // The harness passes these ids as `?scene=&preview=`; the runtime ignores one it
  // does not know and the screen would be walked in the wrong state, and pass.
  it('every scene and preview a matrix route lists is one the runtime reads from the URL', () => {
    for (const { path, scenes = [], previews = [] } of matrixRoutes) {
      for (const scene of scenes) expect(sceneRefs, `${path} scene ${scene}`).toContain(scene)
      for (const preview of previews) expect(parsePreview(preview), `${path} preview ${preview}`).toBe(preview)
    }
    // The harness sends the preview spelled `long` to the stress cells (`e2e/matrix/cells.mjs`).
    expect(previewIds).toContain('long')
    for (const ref of sceneRefs) {
      const search = `?${new URLSearchParams({ scene: ref, preview: 'long' })}`
      const state = createRuntime({ delay: 0, storage: null, search }).getState()
      expect(state.scene, ref).toBe(parseSceneRef(ref)?.scene)
      expect(state.preview, ref).toBe('long')
      expect(state.onboarded, ref).toBe(true)
    }
  })

  it('opens the gallery at / while no area claims the start', async () => {
    const { router } = open('/')
    expect(await screen.findByRole('heading', { level: 1 })).toBeInTheDocument()
    expect(router.state.location.pathname).toBe(fallbackStart)
  })

  it('leaves / to the area that registers it', async () => {
    const routes = buildRoutes([{ index: true, element: <h1>start</h1> }])
    const { router } = open('/', routes)
    expect(await screen.findByRole('heading', { name: 'start' })).toBeInTheDocument()
    expect(router.state.location.pathname).toBe('/')
  })

  it('shows not-found for an unknown path, inside main, in the locale', async () => {
    window.localStorage.setItem(LOCALE_STORAGE_KEY, 'zh-CN')
    const { container } = open('/no/such/page')
    expect(await screen.findByRole('heading', { level: 1, name: '找不到这个页面' })).toBeInTheDocument()
    expect(screen.getByRole('main')).toContainElement(screen.getByRole('link', { name: '回到起始页' }))
    expect(screen.getByRole('link', { name: '回到起始页' })).toHaveClass('min-h-target')
    // The matrix harness fails a cell that lands here: e2e/matrix/harness.ts.
    expect(container.querySelector('[data-route-not-found]')).not.toBeNull()
    expect(await axe(container)).toHaveNoViolations()
  })

  it('Providers give every screen the theme and the locale', async () => {
    window.localStorage.setItem(THEME_STORAGE_KEY, 'dark')
    window.localStorage.setItem(LOCALE_STORAGE_KEY, 'en')
    open('/no/such/page')
    expect(await screen.findByRole('heading', { level: 1, name: 'Page not found' })).toBeInTheDocument()
    expect(document.documentElement).toHaveClass('dark')
    expect(document.documentElement.lang).toBe('en')
  })
})

// The toaster (`Sonner`) is mounted by the root layout: once, last, after `main`.
describe('the toaster of the root layout', () => {
  afterEach(() => act(() => toast.dismiss()))

  const page: RouteObject[] = [
    {
      path: '/page',
      element: (
        <>
          <button type="button">first</button>
          <button type="button">last</button>
        </>
      ),
    },
  ]
  const regions = () => document.querySelectorAll('section[aria-live]')

  it('is mounted once, as the last element of the root, after main, in the locale', async () => {
    window.localStorage.setItem(LOCALE_STORAGE_KEY, 'zh-CN')
    const { container } = open('/page', buildRoutes(page))
    await screen.findByRole('button', { name: 'last' })
    expect(regions()).toHaveLength(1)
    const [region] = regions()
    expect(region).toHaveAttribute('aria-live', 'polite')
    expect(region).toHaveAttribute('aria-label', '通知 alt+T')
    expect(container.lastElementChild).toContainElement(region as HTMLElement)
    expect(container.lastElementChild?.previousElementSibling).toBe(screen.getByRole('main'))
    expect(screen.getByRole('main')).not.toContainElement(region as HTMLElement)
    expect(await axe(container)).toHaveNoViolations()
  })

  it('shows a toast raised by any screen, in the mode of our ThemeProvider', async () => {
    window.localStorage.setItem(THEME_STORAGE_KEY, 'dark')
    open('/page', buildRoutes(page))
    await screen.findByRole('button', { name: 'last' })
    act(() => void toast('已保存'))
    expect(await screen.findByRole('listitem')).toHaveTextContent('已保存')
    expect(document.querySelector('[data-sonner-toaster]')).toHaveAttribute('data-sonner-theme', 'dark')
  })

  it('Tab reaches an open toast after the last control of the page, and goes on past it', async () => {
    window.localStorage.setItem(LOCALE_STORAGE_KEY, 'zh-CN')
    open('/page', buildRoutes(page))
    await screen.findByRole('button', { name: 'last' })
    act(() => void toast('已移除', { persistent: true, action: { label: '撤销', onClick: () => {} } }))
    const item = await screen.findByRole('listitem')
    const [region] = regions()
    await userEvent.tab()
    expect(screen.getByRole('button', { name: 'first' })).toHaveFocus()
    await userEvent.tab()
    expect(screen.getByRole('button', { name: 'last' })).toHaveFocus()
    // Not before: the toast is after `main` in the page, so it is after it in the tab order.
    expect(region).not.toContainElement(document.activeElement as HTMLElement)
    await userEvent.tab()
    expect(item).toContainElement(document.activeElement as HTMLElement)
    const stops = [document.activeElement]
    for (let i = 0; i < 4 && region.contains(document.activeElement); i += 1) {
      await userEvent.tab()
      stops.push(document.activeElement)
    }
    expect(stops).toContain(screen.getByRole('button', { name: '撤销' }))
    expect(stops).toContain(screen.getByRole('button', { name: '关闭这条通知' }))
    // No trap: Tab leaves the toasts again.
    expect(region).not.toContainElement(document.activeElement as HTMLElement)
  })
})
