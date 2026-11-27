import { render, screen, within } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { describe, expect, it } from 'vitest'

import { Providers } from '@/app/Providers'
import { buildRoutes } from '@/app/router'
import { matrixRoutes as allMatrixRoutes } from '@/app/routes'
import { LOCALE_STORAGE_KEY } from '@/i18n'
import { axe } from '@/test/axe'

import { collectDemos, demos } from './demos'
import { families, familyOfDemo, nameOfDemo } from './families'
import { matrixRoutes, routes } from './routes'

function open(path: string, locale: 'zh-CN' | 'en' = 'zh-CN') {
  window.localStorage.setItem(LOCALE_STORAGE_KEY, locale)
  const router = createMemoryRouter(buildRoutes(routes), { initialEntries: [path] })
  return { router, ...render(<Providers><RouterProvider router={router} /></Providers>) }
}

describe('/dev/components', () => {
  it('shows every family that has a demo, each demo under its name', async () => {
    const { container } = open('/dev/components')
    expect(await screen.findByRole('heading', { level: 1, name: '组件库' })).toBeInTheDocument()
    expect(screen.getByRole('main')).toBeInTheDocument()
    const layout = screen.getByRole('region', { name: '布局' })
    for (const name of ['Grid', 'Inline', 'Page', 'Section', 'Stack']) {
      expect(within(layout).getByRole('heading', { level: 3, name })).toBeInTheDocument()
    }
    expect(await axe(container)).toHaveNoViolations()
    // Every demo of every family in one render: under load it needs more than the default five seconds (K1).
  }, 20_000)

  it('?family= shows that family only and marks its link as current', async () => {
    open('/dev/components?family=layout')
    await screen.findByRole('region', { name: '布局' })
    const nav = screen.getByRole('navigation', { name: '组件分类' })
    expect(within(nav).getAllByRole('link')).toHaveLength(families.length + 1)
    expect(within(nav).getByRole('link', { name: '布局' })).toHaveAttribute('aria-current', 'page')
    expect(within(nav).getByRole('link', { name: '全部' })).not.toHaveAttribute('aria-current')
    expect(within(nav).getByRole('link', { name: '布局' })).toHaveAttribute('href', '/dev/components?family=layout')
  })

  it('unknown family → the whole gallery', async () => {
    open('/dev/components?family=nope')
    expect(await screen.findByRole('region', { name: '布局' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: '全部' })).toHaveAttribute('aria-current', 'page')
  })

  it('is in English when the locale is en', async () => {
    open('/dev/components?family=layout', 'en')
    expect(await screen.findByRole('heading', { level: 1, name: 'Component gallery' })).toBeInTheDocument()
    expect(screen.getByRole('region', { name: 'Layout' })).toBeInTheDocument()
    expect(screen.getByText('5 demos')).toBeInTheDocument()
    expect(document.documentElement.lang).toBe('en')
  })

  it('every link has a text name (its size is measured by the matrix, at WCAG’s 24 px)', async () => {
    open('/dev/components')
    await screen.findByRole('navigation', { name: '组件分类' })
    for (const link of screen.getAllByRole('link')) {
      expect(link).toHaveAccessibleName()
    }
  })
})

describe('the demo registry', () => {
  it('finds the layout demos by glob', () => {
    expect(demos.filter((demo) => demo.family === 'layout').map((demo) => demo.name)).toEqual([
      'Grid',
      'Inline',
      'Page',
      'Section',
      'Stack',
    ])
  })

  it('reads the family from the path', () => {
    expect(familyOfDemo('/src/components/data-display/Table.demo.tsx')).toBe('data-display')
    expect(familyOfDemo('/src/blocks/text/text.demo.tsx')).toBe('blocks')
    expect(familyOfDemo('/src/blocks/schedule/schedule.demo.tsx')).toBe('data-blocks')
    expect(familyOfDemo('/src/block-renderer/BlockRenderer.demo.tsx')).toBe('blocks')
    expect(familyOfDemo('/src/module/ModuleFrame.demo.tsx')).toBe('module')
    expect(familyOfDemo('/src/components/nope/X.demo.tsx')).toBeNull()
    expect(familyOfDemo('/src/shell/Shell.demo.tsx')).toBeNull()
    expect(nameOfDemo('/src/components/layout/Stack.demo.tsx')).toBe('Stack')
  })

  it('refuses a demo outside a family, and a file with no default component', () => {
    expect(() => collectDemos({ '/src/shell/Shell.demo.tsx': () => null })).toThrow(/family/)
    expect(() =>
      collectDemos({ '/src/components/layout/X.demo.tsx': undefined as never }),
    ).toThrow(/default-exports/)
  })
})

describe('the route registry', () => {
  it('the dev area registers the gallery and its matrix route', () => {
    expect(routes.map((route) => route.path)).toEqual(['/dev/components'])
    expect(matrixRoutes).toEqual([{ path: '/dev/components' }])
    expect(allMatrixRoutes).toContainEqual({ path: '/dev/components' })
  })
})
