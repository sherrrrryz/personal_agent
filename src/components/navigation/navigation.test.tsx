import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ComponentType, ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { Button } from '@/components/actions'
import { compactQuery } from '@/hooks/use-mobile'
import { LocaleProvider, LOCALE_STORAGE_KEY } from '@/i18n'
import { axe } from '@/test/axe'
import { setMediaQuery } from '@/test/match-media'
import { THEME_STORAGE_KEY, ThemeProvider } from '@/theme'

import {
  Breadcrumb,
  DropdownMenu,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  LocaleSelect,
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarItem,
  SidebarProvider,
  SidebarSubItem,
  SidebarTrigger,
  Tabs,
  ThemeToggle,
  type SidebarProviderProps,
} from './index'

// Component evidence for the navigation family (A-14): `Sidebar`,
// `Breadcrumb`, `Tabs`, `DropdownMenu`, `ThemeToggle`, `LocaleSelect`.

const tokens = (element: Element) => element.className.split(' ')
const icon = <svg />

function App({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <LocaleProvider>{children}</LocaleProvider>
    </ThemeProvider>
  )
}

beforeEach(() => {
  window.localStorage.setItem(LOCALE_STORAGE_KEY, 'zh-CN')
})

describe('Sidebar', () => {
  function Example(provider: Omit<SidebarProviderProps, 'children'> & { onRecent?: (open: boolean) => void }) {
    const { onRecent, ...state } = provider
    return (
      <App>
        <SidebarProvider {...state}>
          <Sidebar aria-label="主导航">
            <SidebarHeader>泡泡爪</SidebarHeader>
            <SidebarContent>
              <SidebarGroup label="基础">
                <SidebarItem icon={icon} label="通知" badge="3" render={<a href="#n" />} />
                <SidebarItem icon={icon} label="日程" render={<a href="#s" />} current />
                <SidebarItem icon={icon} label="预约" render={<a href="#b" />}>
                  <SidebarSubItem label="美容时长" render={<a href="#d" />} current />
                </SidebarItem>
                <SidebarItem icon={icon} label="库存" disabled />
              </SidebarGroup>
              <SidebarGroup label="最近对话" collapsible icon={icon} onOpenChange={onRecent}>
                <SidebarItem icon={icon} label="调整周六的预约" render={<a href="#t" />} />
              </SidebarGroup>
            </SidebarContent>
            <SidebarFooter>
              <SidebarGroup label="偏好">
                <SidebarItem icon={icon} label="设置" render={<a href="#set" />} />
              </SidebarGroup>
            </SidebarFooter>
          </Sidebar>
          <SidebarTrigger />
        </SidebarProvider>
      </App>
    )
  }

  it('open: a named nav of named lists, drawn as the kit draws it; a long label wraps; the current item is aria-current', async () => {
    const { container } = render(<Example />)
    const nav = screen.getByRole('navigation', { name: '主导航' })
    expect(within(nav).getByRole('list', { name: '基础' })).toBeInTheDocument()
    const item = within(nav).getByRole('link', { name: /通知/ })
    expect(item).toHaveAccessibleName(expect.stringMatching(/^通知\s*3$/))
    // The kit's height as a minimum, so a label that does not fit wraps instead of being cut.
    expect(item).toHaveClass('min-h-8', 'h-auto')
    expect(item.className).not.toMatch(/-target\b/)
    expect(tokens(item).filter((token) => /^h-\d/.test(token))).toEqual([])
    expect(within(item).getByText('通知')).toHaveClass('whitespace-normal!', 'overflow-visible!')
    // The count is drawn by the kit's badge and stays in the item's name.
    expect(item.parentElement!.querySelector('[data-slot="sidebar-menu-badge"]')).toHaveTextContent('3')
    const current = within(nav).getByRole('link', { name: '日程' })
    expect(current).toHaveAttribute('aria-current', 'page')
    // Current is the kit's own fill (D-43): no bar of ours.
    expect(current).toHaveAttribute('data-active')
    expect(current.querySelector('[class*="border-s-2"]')).toBeNull()
    expect(within(nav).getByRole('link', { name: /^通知\s*3$/ })).not.toHaveAttribute('aria-current')
    // One level of sub-items, each a link.
    expect(within(nav).getByRole('link', { name: '美容时长' })).toHaveAttribute('aria-current', 'page')
    expect(within(nav).getByRole('link', { name: '美容时长' })).toHaveClass('min-h-7', 'h-auto')
    // Disabled: said, and it does nothing.
    expect(within(nav).getByRole('button', { name: '库存' })).toHaveAttribute('aria-disabled', 'true')
    expect(await axe(container)).toHaveNoViolations()
  })

  it('keyboard: Tab walks the items in reading order', async () => {
    render(<Example />)
    const order: string[] = []
    for (let step = 0; step < 4; step += 1) {
      await userEvent.tab()
      order.push(document.activeElement?.textContent ?? '')
    }
    expect(order).toEqual(['通知 3', '日程', '预约', '美容时长'])
  })

  it('a collapsible group: its heading is our button, which shows and hides the list', async () => {
    const onRecent = vi.fn()
    render(<Example onRecent={onRecent} />)
    const heading = screen.getByRole('button', { name: '最近对话' })
    expect(heading).toHaveAttribute('aria-expanded', 'false')
    expect(heading).toHaveClass('min-h-7')
    expect(screen.queryByRole('link', { name: '调整周六的预约' })).not.toBeInTheDocument()
    await userEvent.click(heading)
    expect(heading).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByRole('list', { name: '最近对话' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: '调整周六的预约' })).toBeInTheDocument()
    expect(onRecent).toHaveBeenLastCalledWith(true)
  })

  it('rail: icons only, each still named; the label is also its tooltip; sub-items are not shown', async () => {
    const onOpenChange = vi.fn()
    const onRecent = vi.fn()
    const { container } = render(<Example open={false} onOpenChange={onOpenChange} onRecent={onRecent} />)
    const nav = screen.getByRole('navigation', { name: '主导航' })
    const item = within(nav).getByRole('link', { name: /^通知\s*3$/ })
    expect(within(item).getByText('通知')).toHaveClass('sr-only')
    // The kit's rail: its own square, nothing of ours over it (D-43).
    expect(tokens(item)).toContain('group-data-[collapsible=icon]:size-8!')
    expect(tokens(item)).not.toContain('group-data-[collapsible=icon]:size-auto!')
    expect(item.parentElement!.querySelector('[data-slot="sidebar-menu-badge"]')).toBeNull()
    expect(within(nav).getByRole('list', { name: '基础' })).toBeInTheDocument()
    expect(within(nav).queryByRole('link', { name: '美容时长' })).not.toBeInTheDocument()
    expect(within(nav).getByRole('link', { name: '日程' })).toHaveAttribute('aria-current', 'page')
    expect(await axe(container)).toHaveNoViolations()

    await userEvent.tab()
    expect(item).toHaveFocus()
    await waitFor(() => expect(document.querySelector('[data-slot="tooltip-content"]')).toHaveTextContent('通知'))

    // A collapsible group is one button in the rail: it opens the sidebar with the group shown.
    await userEvent.click(within(nav).getByRole('button', { name: '最近对话' }))
    expect(onOpenChange).toHaveBeenLastCalledWith(true)
    expect(onRecent).toHaveBeenLastCalledWith(true)
  })

  it('the trigger folds the sidebar into the rail and back, and says which', async () => {
    render(<Example />)
    const trigger = screen.getByRole('button', { name: '展开或收起侧边栏' })
    expect(trigger).toHaveAttribute('aria-expanded', 'true')
    expect(trigger).toHaveClass('size-8')
    await userEvent.click(trigger)
    expect(trigger).toHaveAttribute('aria-expanded', 'false')
    expect(screen.getByText('通知')).toHaveClass('sr-only')
    await userEvent.click(trigger)
    expect(screen.getByText('通知')).not.toHaveClass('sr-only')
  })

  it('compact: a sheet off the canvas — focus in, contained, Escape closes, focus back on the trigger', async () => {
    setMediaQuery(compactQuery, true)
    render(<Example />)
    expect(screen.queryByRole('navigation')).not.toBeInTheDocument()
    const trigger = screen.getByRole('button', { name: '展开或收起侧边栏' })
    expect(trigger).toHaveAttribute('aria-expanded', 'false')
    await userEvent.click(trigger)
    const sheet = await screen.findByRole('dialog', { name: '主导航' })
    const close = within(sheet).getByRole('button', { name: '关闭侧边栏' })
    await waitFor(() => expect(sheet).toContainElement(document.activeElement as HTMLElement))
    // Full labels in the sheet, whatever the open/rail state is.
    expect(within(sheet).getByText('通知')).not.toHaveClass('sr-only')
    for (let step = 0; step < 12; step += 1) {
      await userEvent.tab()
      await waitFor(() => expect(sheet).toContainElement(document.activeElement as HTMLElement), { timeout: 200 })
    }
    // The kit's own close button of this sheet is `display: none` by the kit's class (jsdom applies no
    // stylesheet, so it is checked by that class); what the user gets is ours, checked by axe.
    expect(sheet).toHaveClass('[&>button]:hidden')
    expect(close.parentElement?.parentElement?.parentElement).toBe(sheet)
    expect(await axe(close.parentElement!.parentElement!)).toHaveNoViolations()
    await userEvent.keyboard('{Escape}')
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    await waitFor(() => expect(trigger).toHaveFocus())

    await userEvent.click(trigger)
    await userEvent.click(await screen.findByRole('button', { name: '关闭侧边栏' }))
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    expect(close).not.toBeInTheDocument()
  })

  it('inline placement: in the flow of the page, never a sheet', () => {
    setMediaQuery(compactQuery, true)
    render(<Example placement="inline" />)
    expect(screen.getByRole('navigation', { name: '主导航' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: '关闭侧边栏' })).not.toBeInTheDocument()
  })
})

describe('Breadcrumb', () => {
  const path = [
    { label: '我的店', render: <a href="#shop" /> },
    { label: '预约与提醒', render: <a href="#bookings" /> },
    { label: '美容时长' },
  ]

  it('a named nav: every level a link at the target minimum, the open page aria-current', async () => {
    const { container } = render(
      <App>
        <Breadcrumb items={path} />
      </App>,
    )
    const nav = screen.getByRole('navigation', { name: '当前位置' })
    const [whole, folded] = within(nav).getAllByRole('list')
    const links = within(whole).getAllByRole('link')
    expect(links.map((link) => link.textContent)).toEqual(['我的店', '预约与提醒', '美容时长'])
    expect(links[0]).toHaveAttribute('href', '#shop')
    expect(links[0]).toHaveClass('min-h-target', 'min-w-target')
    expect(links[0]).not.toHaveClass('underline')
    expect(links[2]).toHaveAttribute('aria-current', 'page')
    // The whole path shows only with room; the folded one only without (a container query).
    expect(whole).toHaveClass('hidden', '@md:flex')
    expect(folded).toHaveClass('@md:hidden')
    expect(await axe(container)).toHaveNoViolations()
  })

  it('folded: the one truncating slot, with the full path one press away in a menu', async () => {
    const { container } = render(
      <App>
        <Breadcrumb items={path} />
      </App>,
    )
    const folded = within(screen.getByRole('navigation')).getAllByRole('list')[1]
    // The only waiver of the family, on the only element that cuts text.
    const waived = container.querySelectorAll('[data-matrix-allow]')
    expect(waived).toHaveLength(1)
    expect(waived[0]).toHaveAttribute('data-matrix-allow', 'clip')
    expect(within(waived[0] as HTMLElement).getByText('美容时长')).toHaveClass('truncate')
    expect(folded).toContainElement(waived[0] as HTMLElement)

    const open = within(folded).getByRole('button', { name: '显示完整路径' })
    expect(open).toHaveClass('size-8')
    await userEvent.click(open)
    const menu = await screen.findByRole('menu')
    const items = within(menu).getAllByRole('menuitem')
    expect(items.map((item) => item.textContent)).toEqual(['我的店', '预约与提醒', '美容时长'])
    expect(items[0]).toHaveAttribute('href', '#shop')
    expect(items[2]).toHaveAttribute('aria-current', 'page')
    await userEvent.keyboard('{Escape}')
    await waitFor(() => expect(open).toHaveFocus())
  })

  it('a single level has nothing to fold and cuts nothing; a second breadcrumb can be named apart', () => {
    const { container } = render(
      <App>
        <Breadcrumb items={path.slice(0, 1)} aria-label="示例路径" />
      </App>,
    )
    const nav = screen.getByRole('navigation', { name: '示例路径' })
    expect(within(nav).getAllByRole('list')).toHaveLength(1)
    expect(within(nav).queryByRole('button')).not.toBeInTheDocument()
    expect(container.querySelector('[data-matrix-allow], .truncate')).toBeNull()
    // The kit marks the open page as a disabled link: text, not a target.
    expect(within(nav).getByRole('link')).toHaveAttribute('aria-disabled', 'true')
  })
})

describe('Tabs', () => {
  const tabs = [
    { value: 'breeds', label: '品种大致时长', content: <p>每个品种一行</p> },
    { value: 'dogs', label: '每只狗的实际耗时', icon, content: <p>每次到店一行</p> },
    { value: 'archive', label: '归档', disabled: true, content: <p>空</p> },
  ]

  it('a named tablist, drawn as the kit draws it; the first tab is selected and shows its panel; tabs that do not fit run onto a further line', async () => {
    const { container } = render(<Tabs aria-label="记忆里的表格" tabs={tabs} />)
    const list = screen.getByRole('tablist', { name: '记忆里的表格' })
    expect(list).toHaveClass('flex-wrap', 'max-w-full', 'group-data-horizontal/tabs:h-auto')
    expect(tokens(list)).not.toContain('group-data-horizontal/tabs:h-8')
    const [first, second, third] = within(list).getAllByRole('tab')
    expect(first).toHaveAttribute('aria-selected', 'true')
    expect(second).toHaveAttribute('aria-selected', 'false')
    for (const tab of [first, second, third]) {
      // The kit's tab (D-43): one line, the kit's own selected look, nothing of ours on it.
      expect(tab).toHaveClass('flex-1', 'whitespace-nowrap')
      expect(tab.className).not.toMatch(/-target\b/)
      expect(tab.querySelector('[class*="border-b-2"]')).toBeNull()
    }
    expect(screen.getByRole('tabpanel')).toHaveTextContent('每个品种一行')
    expect(third).toHaveAttribute('aria-disabled', 'true')
    expect(await axe(container)).toHaveNoViolations()
  })

  it('keyboard: one tab stop; the arrows move, Enter selects; a press selects', async () => {
    const onValueChange = vi.fn()
    render(<Tabs aria-label="记忆里的表格" tabs={tabs} onValueChange={onValueChange} />)
    const [first, second] = screen.getAllByRole('tab')
    await userEvent.tab()
    expect(first).toHaveFocus()
    await userEvent.keyboard('{ArrowRight}')
    expect(second).toHaveFocus()
    await userEvent.keyboard('{Enter}')
    expect(second).toHaveAttribute('aria-selected', 'true')
    expect(onValueChange).toHaveBeenLastCalledWith('dogs')
    expect(screen.getByRole('tabpanel')).toHaveTextContent('每次到店一行')
    // Tab leaves the list: the next stop is the panel, not another tab.
    await userEvent.tab()
    expect(screen.getByRole('tabpanel')).toHaveFocus()
    await userEvent.click(first)
    expect(first).toHaveAttribute('aria-selected', 'true')
  })

  it('controlled: shows the tab it is given', () => {
    render(<Tabs aria-label="记忆里的表格" tabs={tabs} value="dogs" />)
    expect(screen.getByRole('tab', { name: '每只狗的实际耗时' })).toHaveAttribute('aria-selected', 'true')
  })
})

describe('DropdownMenu', () => {
  function Example({ onEdit = () => {}, onView = () => {} }: { onEdit?: () => void; onView?: (value: string) => void }) {
    return (
      <DropdownMenu trigger={<Button variant="secondary">预约操作</Button>}>
        <DropdownMenuGroup label="这条预约">
          <DropdownMenuItem icon={icon} onClick={onEdit}>
            修改时间
          </DropdownMenuItem>
          <DropdownMenuItem disabled>导出</DropdownMenuItem>
          <DropdownMenuItem variant="danger">取消预约</DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuRadioGroup label="日历视图" value="week" onValueChange={onView}>
          <DropdownMenuRadioItem value="day">日</DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="week">周</DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
      </DropdownMenu>
    )
  }

  it('opens from our button; items are at the target minimum and wrap; groups are named', async () => {
    render(<Example />)
    const trigger = screen.getByRole('button', { name: '预约操作' })
    expect(trigger).toHaveAttribute('aria-haspopup', 'menu')
    expect(trigger).toHaveAttribute('aria-expanded', 'false')
    await userEvent.click(trigger)
    const menu = await screen.findByRole('menu')
    expect(trigger).toHaveAttribute('aria-expanded', 'true')
    // As wide as its items need rather than as its trigger; otherwise the kit's menu (D-43).
    expect(menu).toHaveClass('w-auto', 'max-w-(--available-width)')
    expect(menu).not.toHaveClass('border')
    expect(tokens(menu)).not.toContain('w-(--anchor-width)')
    const items = within(menu).getAllByRole('menuitem')
    expect(items.map((item) => item.textContent)).toEqual(['修改时间', '导出', '取消预约'])
    for (const item of items) expect(item.className).not.toMatch(/-target\b/)
    expect(items[1]).toHaveAttribute('aria-disabled', 'true')
    expect(within(menu).getByRole('group', { name: '这条预约' })).toBeInTheDocument()
    const radios = within(within(menu).getByRole('group', { name: '日历视图' })).getAllByRole('menuitemradio')
    expect(radios.map((radio) => radio.getAttribute('aria-checked'))).toEqual(['false', 'true'])
    expect(await axe(document.body)).toHaveNoViolations()
  })

  it('keyboard: Enter opens on the first item, arrows move, Enter chooses and returns focus; Escape closes', async () => {
    const onEdit = vi.fn()
    const onView = vi.fn()
    render(<Example onEdit={onEdit} onView={onView} />)
    const trigger = screen.getByRole('button', { name: '预约操作' })
    await userEvent.tab()
    expect(trigger).toHaveFocus()
    await userEvent.keyboard('{Enter}')
    await waitFor(() => expect(screen.getByRole('menuitem', { name: '修改时间' })).toHaveFocus())
    await userEvent.keyboard('{Enter}')
    expect(onEdit).toHaveBeenCalledTimes(1)
    await waitFor(() => expect(screen.queryByRole('menu')).not.toBeInTheDocument())
    await waitFor(() => expect(trigger).toHaveFocus())

    await userEvent.keyboard('{Enter}')
    // Focus enters the list a moment after the menu is drawn: a key pressed in between is lost.
    await waitFor(() => expect(screen.getByRole('menuitem', { name: '修改时间' })).toHaveFocus())
    await userEvent.keyboard('{End}')
    await waitFor(() => expect(screen.getByRole('menuitemradio', { name: '周' })).toHaveFocus())
    await userEvent.keyboard('{ArrowUp}{Enter}')
    expect(onView).toHaveBeenLastCalledWith('day')

    if (!screen.queryByRole('menu')) await userEvent.keyboard('{Enter}')
    await waitFor(() => expect(screen.getByRole('menu')).toContainElement(document.activeElement as HTMLElement))
    await userEvent.keyboard('{Escape}')
    await waitFor(() => expect(screen.queryByRole('menu')).not.toBeInTheDocument())
    await waitFor(() => expect(trigger).toHaveFocus())
    expect(onEdit).toHaveBeenCalledTimes(1)
  })
})

describe('ThemeToggle', () => {
  it('a named group of three; the stored choice is pressed; choosing applies and stores it; one always stays pressed', async () => {
    const { container } = render(
      <App>
        <ThemeToggle />
      </App>,
    )
    const group = screen.getByRole('group', { name: '外观' })
    const buttons = within(group).getAllByRole('button')
    expect(buttons.map((button) => button.textContent)).toEqual(['跟随系统', '浅色', '深色'])
    const pressed = () => buttons.map((button) => button.getAttribute('aria-pressed'))
    expect(pressed()).toEqual(['true', 'false', 'false'])
    await userEvent.click(buttons[2])
    expect(pressed()).toEqual(['false', 'false', 'true'])
    expect(document.documentElement).toHaveClass('dark')
    expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBe('dark')
    await userEvent.click(buttons[2])
    expect(pressed()).toEqual(['false', 'false', 'true'])
    // One tab stop; the arrows move inside.
    await userEvent.keyboard('{ArrowLeft}')
    expect(buttons[1]).toHaveFocus()
    await userEvent.keyboard('{Enter}')
    expect(pressed()).toEqual(['false', 'true', 'false'])
    expect(document.documentElement).not.toHaveClass('dark')
    expect(await axe(container)).toHaveNoViolations()
  })
})

describe('LocaleSelect', () => {
  it('a labelled select; each language in its own words with its own lang; choosing switches in place', async () => {
    const { container } = render(
      <App>
        <LocaleSelect />
      </App>,
    )
    const select = screen.getByRole('combobox', { name: '语言' })
    expect(select).toHaveTextContent('简体中文')
    expect(select).toHaveClass('min-h-8')
    expect(await axe(container)).toHaveNoViolations()
    await userEvent.click(select)
    const options = within(await screen.findByRole('listbox')).getAllByRole('option')
    expect(options.map((option) => [option.textContent, option.getAttribute('lang')])).toEqual([
      ['简体中文', 'zh-CN'],
      ['English', 'en'],
    ])
    await userEvent.click(options[1])
    await waitFor(() => expect(screen.getByRole('combobox', { name: 'Language' })).toHaveTextContent('English'))
    expect(document.documentElement).toHaveAttribute('lang', 'en')
    expect(window.localStorage.getItem(LOCALE_STORAGE_KEY)).toBe('en')
  })
})

describe('the navigation family as a whole', () => {
  const sources = readdirSync(import.meta.dirname)
    .filter((file) => /\.tsx?$/.test(file) && !file.includes('.test.') && !file.includes('.demo.'))
    .map((file) => [file, readFileSync(join(import.meta.dirname, file), 'utf8')] as const)

  it.each(sources)('%s sets no fixed block size and no outer margin; only the breadcrumb cuts text', (file, source) => {
    expect(source.match(/(?<![\w-:])(?:h|size|max-h)-(?:\d|\[|px|full|screen|dvh|svh|target)[\w./[\]-]*/g) ?? []).toEqual([])
    expect(source.match(/(?<![\w-])-?m[trblxyse]?-[\w./[\]-]+/g) ?? []).toEqual([])
    const cuts = source.match(/\b(?:truncate|line-clamp-\d+|whitespace-nowrap)\b/g) ?? []
    expect(cuts).toEqual(file === 'Breadcrumb.tsx' ? ['truncate'] : [])
    expect(source.includes('data-matrix-allow')).toBe(file === 'Breadcrumb.tsx')
  })

  const demos = Object.entries(import.meta.glob<ComponentType>('./*.demo.tsx', { eager: true, import: 'default' }))

  it('every component of the family has a demo', () => {
    expect(demos.map(([path]) => path).sort()).toEqual(
      ['Breadcrumb', 'DropdownMenu', 'LocaleSelect', 'Sidebar', 'Tabs', 'ThemeToggle'].map((name) => `./${name}.demo.tsx`),
    )
  })

  it.each(demos)('%s renders in zh-CN with no English text or name and no axe violation', async (_path, Demo) => {
    const { container } = render(
      <App>
        <Demo />
      </App>,
    )
    const prose = container.cloneNode(true) as HTMLElement
    for (const code of prose.querySelectorAll('code')) code.remove()
    expect(prose.textContent).not.toMatch(/[A-Za-z]{2,}/)
    expect(prose.textContent).toMatch(/\p{Script=Han}/u)
    for (const named of container.querySelectorAll('[aria-label], [title]')) {
      for (const attribute of ['aria-label', 'title']) expect(named.getAttribute(attribute) ?? '').not.toMatch(/[A-Za-z]{2,}/)
    }
    expect(await axe(container)).toHaveNoViolations()
  })
})
