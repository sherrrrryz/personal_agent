// Not a kit file: the test of the patches listed in
// `docs/design/COMPONENTS.md` § Kit patches (spec A-06). After a kit upgrade,
// re-apply the patches until this file passes. It lives here because only
// files under `src/components/` may import the kit.

import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'

import { compactQuery } from '@/hooks/use-mobile'
import { setMediaQuery } from '@/test/match-media'

import { Breadcrumb, BreadcrumbEllipsis } from './breadcrumb'
import { Dialog, DialogContent, DialogFooter, DialogTitle } from './dialog'
import { Sheet, SheetContent, SheetTitle } from './sheet'
import { Sidebar, SidebarProvider, SidebarRail, SidebarTrigger } from './sidebar'
import { Spinner } from './spinner'

const kitFiles = readdirSync(import.meta.dirname).filter((file) => file.endsWith('.tsx') && !file.includes('.test.'))

describe('kit files hold no user-visible string literal', () => {
  // Text between tags, and the attributes a user can see or hear.
  const jsxText = />\s*([^<>{}()=;,]*[A-Za-z][^<>{}()=;,]*?)\s*<\//g
  const namingAttribute = /\b(aria-label|aria-description|aria-roledescription|aria-valuetext|aria-placeholder|title|alt|placeholder|label)=(?:"[^"]*"|'[^']*'|\{\s*["'`][^}]*\})/g

  it.each(kitFiles)('%s', (file) => {
    const source = readFileSync(join(import.meta.dirname, file), 'utf8')
    expect([...source.matchAll(jsxText)].map((match) => match[1])).toEqual([])
    expect([...source.matchAll(namingAttribute)].map((match) => match[0])).toEqual([])
  })

  it('finds a literal when one is there (the scan can fail)', () => {
    const seeded = '<button aria-label="Close" title={"Close"}><span className="sr-only">Toggle Sidebar</span></button>'
    expect([...seeded.matchAll(jsxText)].map((match) => match[1])).toEqual(['Toggle Sidebar'])
    expect([...seeded.matchAll(namingAttribute)].map((match) => match[0])).toEqual(['aria-label="Close"', 'title={"Close"}'])
  })
})

describe('each built-in name is a prop', () => {
  it('Dialog: closeLabel names the close control of the content and of the footer', () => {
    render(
      <Dialog open>
        <DialogContent closeLabel="关闭">
          <DialogTitle>标题</DialogTitle>
          <DialogFooter showCloseButton closeLabel="取消" />
        </DialogContent>
      </Dialog>,
    )
    expect(screen.getByRole('button', { name: '关闭' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '取消' })).toBeInTheDocument()
    expect(screen.getByRole('dialog').textContent).not.toMatch(/[A-Za-z]/)
  })

  it('Sheet: closeLabel names the close control', () => {
    render(
      <Sheet open>
        <SheetContent closeLabel="关闭">
          <SheetTitle>标题</SheetTitle>
        </SheetContent>
      </Sheet>,
    )
    expect(screen.getByRole('button', { name: '关闭' })).toBeInTheDocument()
  })

  it('Sidebar: label names the trigger and the rail; mobileTitle and mobileDescription name the compact sheet', async () => {
    setMediaQuery(compactQuery, true)
    render(
      <SidebarProvider>
        <Sidebar mobileTitle="导航" mobileDescription="应用的全部模块">
          <SidebarRail label="收起或展开侧边栏" />
        </Sidebar>
        <SidebarTrigger label="切换侧边栏" />
      </SidebarProvider>,
    )
    await userEvent.click(screen.getByRole('button', { name: '切换侧边栏' }))
    const sheet = await screen.findByRole('dialog', { name: '导航' })
    expect(sheet).toHaveAccessibleDescription('应用的全部模块')
    const rail = sheet.querySelector('[data-slot="sidebar-rail"]')
    expect(rail).toHaveAttribute('aria-label', '收起或展开侧边栏')
    expect(rail).toHaveAttribute('title', '收起或展开侧边栏')
    expect(document.body.textContent).not.toMatch(/[A-Za-z]/)
  })

  it('Sidebar: no description element without mobileDescription', async () => {
    setMediaQuery(compactQuery, true)
    render(
      <SidebarProvider>
        <Sidebar mobileTitle="导航" />
        <SidebarTrigger label="切换侧边栏" />
      </SidebarProvider>,
    )
    await userEvent.click(screen.getByRole('button', { name: '切换侧边栏' }))
    const sheet = await screen.findByRole('dialog', { name: '导航' })
    expect(sheet).not.toHaveAttribute('aria-describedby')
  })

  it('Breadcrumb: the nav is named by the caller; the ellipsis text is the label prop', () => {
    render(
      <Breadcrumb aria-label="路径">
        <BreadcrumbEllipsis label="更多" />
      </Breadcrumb>,
    )
    const nav = screen.getByRole('navigation', { name: '路径' })
    expect(nav.textContent).toBe('更多')
  })

  it('Spinner: the status is named by the caller', () => {
    render(<Spinner aria-label="加载中" />)
    expect(screen.getByRole('status', { name: '加载中' })).toBeInTheDocument()
  })
})
