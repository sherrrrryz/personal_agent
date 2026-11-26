import { render, screen } from '@testing-library/react'
import { createMemoryRouter, matchRoutes, RouterProvider } from 'react-router'
import type { RouteObject } from 'react-router'
import { describe, expect, it } from 'vitest'

import { LOCALE_STORAGE_KEY } from '@/i18n'
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
