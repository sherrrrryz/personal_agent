import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ComponentType, ReactElement } from 'react'
import { describe, expect, it } from 'vitest'

import { Button } from '@/components/actions'
import { LocaleProvider, LOCALE_STORAGE_KEY, translate, type Locale } from '@/i18n'
import { behaviourMode, behaviourModes, changeKind, changeKinds } from '@/lib/vocab'
import { axe } from '@/test/axe'
import { ThemeProvider } from '@/theme'

import {
  Avatar,
  AvatarFallback,
  AvatarGroup,
  AvatarGroupCount,
  AvatarImage,
  BehaviourModeBadge,
  ChangeMarker,
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemMedia,
  ItemTitle,
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from './index'

// Component evidence for the data-display family (A-15): `BehaviourModeBadge`,
// `ChangeMarker`, `Avatar`, `Item`, `Table`, and the checks that hold for the
// whole family.

const localesUnderTest = ['zh-CN', 'en'] as const satisfies readonly Locale[]

function renderIn(locale: Locale, ui: ReactElement) {
  window.localStorage.setItem(LOCALE_STORAGE_KEY, locale)
  return render(<LocaleProvider>{ui}</LocaleProvider>)
}

describe('BehaviourModeBadge', () => {
  const cases = localesUnderTest.flatMap((locale) => behaviourModes.map((mode) => [locale, mode] as const))

  it.each(cases)('%s, %s: the mode’s icon and its name from the shared vocabulary', async (locale, mode) => {
    const { container } = renderIn(locale, <BehaviourModeBadge mode={mode} />)
    const name = translate(locale, 'common', behaviourMode[mode].nameKey)
    const badge = screen.getByText(name)
    expect(badge).toHaveAttribute('data-slot', 'badge')
    expect(badge).toHaveAttribute('data-mode', mode)
    // Text carries the mode; the icon repeats it for the eye and is not announced.
    expect(badge.textContent).toBe(name)
    const icons = badge.querySelectorAll('svg')
    expect(icons).toHaveLength(1)
    expect(icons[0]).toHaveAttribute('aria-hidden', 'true')
    // Not a control and not a landmark: nothing to focus, nothing announced but the word.
    expect(badge).not.toHaveAttribute('role')
    expect(badge).not.toHaveAttribute('tabindex')
    expect(badge).not.toHaveAttribute('aria-label')
    expect(await axe(container)).toHaveNoViolations()
  })

  it('the three modes show three different icons and three different names', () => {
    const { container } = renderIn(
      'zh-CN',
      <>
        {behaviourModes.map((mode) => (
          <BehaviourModeBadge key={mode} mode={mode} />
        ))}
      </>,
    )
    const badges = [...container.querySelectorAll('[data-mode]')]
    expect(badges.map((badge) => badge.textContent)).toEqual(['自主', '协助', '待确认'])
    expect(new Set(badges.map((badge) => badge.querySelector('svg')!.innerHTML)).size).toBe(3)
  })

  it('is part of the accessible name of what contains it', () => {
    renderIn(
      'zh-CN',
      <a href="#reminder">
        发送晚间提醒 <BehaviourModeBadge mode="assisted" />
      </a>,
    )
    expect(screen.getByRole('link', { name: '发送晚间提醒 协助' })).toBeInTheDocument()
  })

  it('is the kit’s badge as stock draws it: nothing of ours on top (D-43)', () => {
    renderIn('en', <BehaviourModeBadge mode="autonomous" />)
    const badge = screen.getByText('Autonomous')
    expect(badge).toHaveAttribute('data-slot', 'badge')
    expect(badge).toHaveClass('h-5', 'whitespace-nowrap')
    expect(badge).not.toHaveClass('h-auto')
  })
})

describe('ChangeMarker', () => {
  const cases = localesUnderTest.flatMap((locale) => changeKinds.map((kind) => [locale, kind] as const))

  it.each(cases)('%s, %s: the kind’s icon and its word from the shared vocabulary', async (locale, kind) => {
    const { container } = renderIn(locale, <ChangeMarker kind={kind} />)
    const label = translate(locale, 'common', changeKind[kind].labelKey)
    const marker = screen.getByText(label)
    expect(marker).toHaveAttribute('data-slot', 'badge')
    expect(marker).toHaveAttribute('data-change', kind)
    expect(marker.textContent).toBe(label)
    const icons = marker.querySelectorAll('svg')
    expect(icons).toHaveLength(1)
    expect(icons[0]).toHaveAttribute('aria-hidden', 'true')
    expect(marker).not.toHaveAttribute('role')
    expect(marker).not.toHaveAttribute('tabindex')
    expect(marker).not.toHaveAttribute('aria-label')
    expect(await axe(container)).toHaveNoViolations()
  })

  it('the three kinds show three different icons and three different words', () => {
    const { container } = renderIn(
      'zh-CN',
      <>
        {changeKinds.map((kind) => (
          <ChangeMarker key={kind} kind={kind} />
        ))}
      </>,
    )
    const markers = [...container.querySelectorAll('[data-change]')]
    expect(markers.map((marker) => marker.textContent)).toEqual(['新', '已更新', '已移除'])
    expect(new Set(markers.map((marker) => marker.querySelector('svg')!.innerHTML)).size).toBe(3)
  })

  it('is part of the heading it marks, and wraps instead of keeping the kit’s one line', () => {
    renderIn(
      'zh-CN',
      <h3>
        今日预约 <ChangeMarker kind="new" />
      </h3>,
    )
    expect(screen.getByRole('heading', { name: '今日预约 新' })).toBeInTheDocument()
    const marker = screen.getByText('新')
    // The kit's badge, as stock draws it (D-43).
    expect(marker).toHaveClass('h-5', 'whitespace-nowrap')
  })
})

describe('Avatar', () => {
  it.each(['sm', 'default', 'lg'] as const)('size %s: decorative beside the name — hidden, and the name is text', async (size) => {
    const { container } = render(
      <p>
        <Avatar size={size} aria-hidden="true">
          <AvatarFallback>周</AvatarFallback>
        </Avatar>
        周岚
      </p>,
    )
    const avatar = container.querySelector('[data-slot="avatar"]')!
    expect(avatar).toHaveAttribute('data-size', size)
    expect(avatar).toHaveAttribute('aria-hidden', 'true')
    expect(avatar).not.toHaveAttribute('tabindex')
    expect(within(avatar as HTMLElement).getByText('周')).toHaveAttribute('data-slot', 'avatar-fallback')
    expect(await axe(container)).toHaveNoViolations()
  })

  it('shows the fallback until its image has loaded', () => {
    const { container } = render(
      <Avatar aria-hidden="true">
        <AvatarImage src="/momo.png" alt="" />
        <AvatarFallback>毛</AvatarFallback>
      </Avatar>,
    )
    // jsdom loads no image: the fallback stands in and no broken `img` is left.
    expect(container.querySelector('img')).toBeNull()
    expect(screen.getByText('毛')).toBeInTheDocument()
  })

  it('a group with a count is hidden as a whole; the people are named in text beside it', async () => {
    const { container } = render(
      <p>
        <AvatarGroup aria-hidden="true">
          <Avatar>
            <AvatarFallback>周</AvatarFallback>
          </Avatar>
          <Avatar>
            <AvatarFallback>陈</AvatarFallback>
          </Avatar>
          <AvatarGroupCount>+2</AvatarGroupCount>
        </AvatarGroup>
        周岚、小陈，还有 2 位美容师
      </p>,
    )
    const group = container.querySelector('[data-slot="avatar-group"]')!
    expect(group).toHaveAttribute('aria-hidden', 'true')
    expect(group.querySelectorAll('[data-slot="avatar"]')).toHaveLength(2)
    expect(group.querySelector('[data-slot="avatar-group-count"]')).toHaveTextContent('+2')
    expect(await axe(container)).toHaveNoViolations()
  })
})

describe('Item', () => {
  it.each(['default', 'outline', 'muted'] as const)('variant %s: a row with media, title, description and actions', async (variant) => {
    const { container } = render(
      <Item variant={variant}>
        <ItemMedia variant="icon">
          <svg aria-hidden="true" />
        </ItemMedia>
        <ItemContent>
          <ItemTitle>毛毛</ItemTitle>
          <ItemDescription>贵宾犬 · 主人林女士</ItemDescription>
        </ItemContent>
        <ItemActions>
          <Button variant="secondary">打开档案</Button>
        </ItemActions>
      </Item>,
    )
    const item = container.querySelector('[data-slot="item"]')!
    expect(item.tagName).toBe('DIV')
    expect(item).toHaveAttribute('data-variant', variant)
    expect(item.className).not.toMatch(/-target\b/)
    // On its own it is no list item, and it is not a tab stop: only the control inside it is.
    expect(item).not.toHaveAttribute('role')
    expect(item.parentElement).not.toHaveAttribute('role')
    expect(item).not.toHaveAttribute('tabindex')
    expect(screen.getByRole('button', { name: '打开档案' })).toBeInTheDocument()
    expect(await axe(container)).toHaveNoViolations()
  })

  it.each(['default', 'sm', 'xs'] as const)('size %s keeps the target minimum', (size) => {
    const { container } = render(
      <Item size={size}>
        <ItemContent>
          <ItemTitle>毛毛</ItemTitle>
        </ItemContent>
      </Item>,
    )
    const item = container.querySelector('[data-slot="item"]')!
    expect(item).toHaveAttribute('data-size', size)
    expect(item.className).not.toMatch(/-target\b/)
  })

  it('shows its title and description in full: the kit’s one-line and two-line cuts are off', () => {
    const { container } = render(
      <Item>
        <ItemContent>
          <ItemTitle>你的职业与模块</ItemTitle>
          <ItemDescription>4 个模块</ItemDescription>
        </ItemContent>
        <ItemActions>
          <Button>重命名</Button>
        </ItemActions>
      </Item>,
    )
    const title = container.querySelector('[data-slot="item-title"]')!
    expect(title).toHaveClass('line-clamp-none', 'flex-wrap')
    expect(title).not.toHaveClass('line-clamp-1')
    const description = container.querySelector('[data-slot="item-description"]')!
    expect(description).toHaveClass('line-clamp-none')
    expect(description).not.toHaveClass('line-clamp-2')
    // The text column keeps a width; the actions wrap.
    expect(container.querySelector('[data-slot="item-content"]')).toHaveClass('min-w-24', 'wrap-anywhere')
    expect(container.querySelector('[data-slot="item-actions"]')).toHaveClass('flex-wrap')
  })

  it('as a link the whole row is the link: one tab stop, named by its title and description, at the target size', async () => {
    const user = userEvent.setup()
    const { container } = renderIn(
      'zh-CN',
      <>
        <Item render={<a href="#accounts" />}>
          <ItemContent>
            <ItemTitle>已连接的账号</ItemTitle>
            <ItemDescription>3 个已连接</ItemDescription>
          </ItemContent>
        </Item>
        <Item render={<a href="#modes" />}>
          <ItemContent>
            <ItemTitle>
              发送晚间提醒 <BehaviourModeBadge mode="assisted" />
            </ItemTitle>
          </ItemContent>
        </Item>
      </>,
    )
    const first = screen.getByRole('link', { name: /^已连接的账号\s*3 个已连接$/ })
    expect(first).toHaveAttribute('data-slot', 'item')
    expect(first).toHaveAttribute('href', '#accounts')
    expect(first).toHaveClass('w-full')
    // A badge in the title is part of the link's name.
    const second = screen.getByRole('link', { name: /^发送晚间提醒\s*协助$/ })
    await user.tab()
    expect(first).toHaveFocus()
    await user.tab()
    expect(second).toHaveFocus()
    // The kit's focus ring is kept.
    expect(first.className).toMatch(/focus-visible:ring-/)
    expect(await axe(container)).toHaveNoViolations()
  })

  it('in a group every item is a list item of the list, whatever it renders as', async () => {
    const { container } = render(
      <ItemGroup aria-label="设置">
        <Item render={<a href="#accounts" />}>
          <ItemContent>
            <ItemTitle>已连接的账号</ItemTitle>
          </ItemContent>
        </Item>
        <Item>
          <ItemContent>
            <ItemTitle>显示</ItemTitle>
          </ItemContent>
          <ItemActions>
            <Button>更改</Button>
          </ItemActions>
        </Item>
      </ItemGroup>,
    )
    const list = screen.getByRole('list', { name: '设置' })
    const items = within(list).getAllByRole('listitem')
    expect(items).toHaveLength(2)
    for (const item of items) expect(item.parentElement).toBe(list)
    expect(within(items[0]).getByRole('link', { name: '已连接的账号' })).toBeInTheDocument()
    expect(within(items[1]).getByRole('button', { name: '更改' })).toBeInTheDocument()
    expect(await axe(container)).toHaveNoViolations()
  })
})

describe('Table', () => {
  function Durations() {
    return (
      <Table caption="本周已完成预约的预计时长与实际时长">
        <TableHeader>
          <TableRow>
            <TableHead>狗狗</TableHead>
            <TableHead>服务</TableHead>
            <TableHead align="end">预计</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableHead scope="row">毛毛</TableHead>
            <TableCell>洗澡加修剪</TableCell>
            <TableCell align="end">90 分钟</TableCell>
          </TableRow>
          <TableRow>
            <TableHead scope="row">饼干</TableHead>
            <TableCell>剪指甲</TableCell>
            <TableCell align="end">20 分钟</TableCell>
          </TableRow>
        </TableBody>
        <TableFooter>
          <TableRow>
            <TableHead scope="row">合计</TableHead>
            <TableCell />
            <TableCell align="end">110 分钟</TableCell>
          </TableRow>
        </TableFooter>
      </Table>
    )
  }

  it('is a table named by its caption, with column and row header cells', async () => {
    const { container } = render(<Durations />)
    const table = screen.getByRole('table', { name: '本周已完成预约的预计时长与实际时长' })
    expect(table.querySelector('caption')).toHaveTextContent('本周已完成预约的预计时长与实际时长')
    const columns = within(table).getAllByRole('columnheader')
    expect(columns.map((cell) => cell.textContent)).toEqual(['狗狗', '服务', '预计'])
    for (const cell of columns) expect(cell).toHaveAttribute('scope', 'col')
    const rows = within(table).getAllByRole('rowheader')
    expect(rows.map((cell) => cell.textContent)).toEqual(['毛毛', '饼干', '合计'])
    for (const cell of rows) expect(cell).toHaveAttribute('scope', 'row')
    expect(within(table).getByRole('row', { name: '毛毛 洗澡加修剪 90 分钟' })).toBeInTheDocument()
    expect(await axe(container)).toHaveNoViolations()
  })

  it('sits in its own sideways scroller: a region named by the caption and reached with Tab', async () => {
    const user = userEvent.setup()
    render(
      <>
        <Durations />
        <Durations />
      </>,
    )
    const regions = screen.getAllByRole('region', { name: '本周已完成预约的预计时长与实际时长' })
    expect(regions).toHaveLength(2)
    const [region, other] = regions
    expect(region).toHaveAttribute('tabindex', '0')
    expect(region).toHaveClass('overflow-x-auto')
    expect(region.className).toMatch(/focus-visible:ring-/)
    expect(within(region).getByRole('table')).toBeInTheDocument()
    // Each table has its own caption id, so two tables do not name each other.
    expect(region.getAttribute('aria-labelledby')).not.toBe(other.getAttribute('aria-labelledby'))
    expect(region.querySelector('caption')).toHaveAttribute('id', region.getAttribute('aria-labelledby'))
    // The kit's own scroller, which has no name and takes no focus, is switched off from outside.
    expect(region).toHaveClass('*:overflow-visible')
    expect(region.firstElementChild).toHaveAttribute('data-slot', 'table-container')
    await user.tab()
    expect(region).toHaveFocus()
    await user.tab()
    expect(other).toHaveFocus()
  })

  it('header and cells are the kit’s (D-43); alignment follows the reading direction, and a number column goes to the end', () => {
    render(<Durations />)
    const head = screen.getByRole('columnheader', { name: '狗狗' })
    expect(head).toHaveClass('h-10', 'whitespace-nowrap', 'text-start')
    expect(head).not.toHaveClass('text-left')
    const cell = screen.getByRole('cell', { name: '洗澡加修剪' })
    expect(cell).toHaveClass('whitespace-nowrap', 'text-start')
    expect(screen.getByRole('columnheader', { name: '预计' })).toHaveClass('text-end')
    expect(screen.getByRole('cell', { name: '90 分钟' })).toHaveClass('text-end')
  })
})

describe('the data-display family as a whole', () => {
  const sources = readdirSync(import.meta.dirname)
    .filter((file) => /\.tsx?$/.test(file) && !file.includes('.test.'))
    .map((file) => [file, readFileSync(join(import.meta.dirname, file), 'utf8')] as const)

  it.each(sources)('%s sets no fixed block size on text, no truncation and no outer margin', (_file, source) => {
    expect(source.match(/(?<![\w-])(?:h|size|max-h)-(?:\d|\[|px|full|screen|dvh|svh|target)[\w./[\]-]*/g) ?? []).toEqual([])
    expect(source.match(/\b(?:truncate|line-clamp-\d+|overflow-hidden|whitespace-nowrap)\b/g) ?? []).toEqual([])
    expect(source.match(/(?<![\w-])-?m[trblxyse]?-[\w./[\]-]+/g) ?? []).toEqual([])
    expect(source).not.toMatch(/data-matrix-allow/)
  })

  const demos = Object.entries(import.meta.glob<ComponentType>('./*.demo.tsx', { eager: true, import: 'default' }))

  it('every component of the family has a demo', () => {
    expect(demos.map(([path]) => path).sort()).toEqual(
      ['Avatar', 'BehaviourModeBadge', 'ChangeMarker', 'Item', 'Table'].map((name) => `./${name}.demo.tsx`),
    )
  })

  it.each(demos)('%s renders in zh-CN with no English text or name, never busy, and no axe violation', async (_path, Demo) => {
    window.localStorage.setItem(LOCALE_STORAGE_KEY, 'zh-CN')
    const { container } = render(
      <ThemeProvider>
        <LocaleProvider>
          <Demo />
        </LocaleProvider>
      </ThemeProvider>,
    )
    const prose = container.cloneNode(true) as HTMLElement
    for (const code of prose.querySelectorAll('code')) code.remove()
    expect(prose.textContent).not.toMatch(/[A-Za-z]{2,}/)
    expect(prose.textContent).toMatch(/\p{Script=Han}/u)
    for (const named of container.querySelectorAll('[aria-label], [title]')) {
      for (const attribute of ['aria-label', 'title']) {
        expect(named.getAttribute(attribute) ?? '').not.toMatch(/[A-Za-z]{2,}/)
      }
    }
    expect(container.querySelector('[aria-busy="true"]')).toBeNull()
    expect(await axe(container)).toHaveNoViolations()
  })

  it.each(demos)('%s renders in en with no Chinese text', (_path, Demo) => {
    window.localStorage.setItem(LOCALE_STORAGE_KEY, 'en')
    const { container } = render(
      <ThemeProvider>
        <LocaleProvider>
          <Demo />
        </LocaleProvider>
      </ThemeProvider>,
    )
    expect(container.textContent).not.toMatch(/\p{Script=Han}/u)
    expect(container.textContent).toMatch(/[A-Za-z]{2,}/)
  })
})
