import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

import { render, screen, within } from '@testing-library/react'
import type { ComponentType } from 'react'
import { describe, expect, it } from 'vitest'

import { LocaleProvider, LOCALE_STORAGE_KEY } from '@/i18n'
import { axe } from '@/test/axe'

import { gaps, Grid, GridItem, Inline, Page, Section, Stack } from './index'

// Component evidence for the layout primitives (A-10): render, every variant,
// axe, zh-CN text, and no fixed block size. They hold no interactive part, so
// there is no keyboard path and no state to walk.

const gapClasses = ['gap-0', 'gap-1', 'gap-2', 'gap-4', 'gap-6', 'gap-8', 'gap-12']

describe('Stack', () => {
  it('stacks its children with the default gap', () => {
    render(
      <Stack data-testid="stack">
        <p>一</p>
        <p>二</p>
      </Stack>,
    )
    const stack = screen.getByTestId('stack')
    expect(stack.tagName).toBe('DIV')
    expect(stack).toHaveClass('flex', 'flex-col', 'gap-4', 'items-stretch')
    expect(stack.children).toHaveLength(2)
  })

  it.each(gaps.map((gap, index) => [gap, gapClasses[index]] as const))('gap %s → %s', (gap, expected) => {
    render(<Stack gap={gap} data-testid="stack" />)
    expect(screen.getByTestId('stack')).toHaveClass(expected)
  })

  it.each([
    ['stretch', 'items-stretch'],
    ['start', 'items-start'],
    ['center', 'items-center'],
    ['end', 'items-end'],
  ] as const)('align %s', (align, expected) => {
    render(<Stack align={align} data-testid="stack" />)
    expect(screen.getByTestId('stack')).toHaveClass(expected)
  })

  it('renders a list when asked, and passes attributes through', async () => {
    const { container } = render(
      <Stack as="ul" aria-label="清单" id="list">
        <li>一</li>
        <li>二</li>
      </Stack>,
    )
    const list = screen.getByRole('list', { name: '清单' })
    expect(list).toHaveAttribute('id', 'list')
    expect(within(list).getAllByRole('listitem')).toHaveLength(2)
    expect(await axe(container)).toHaveNoViolations()
  })
})

describe('Inline', () => {
  it('is a wrapping cluster, centred on the cross axis by default', () => {
    render(<Inline data-testid="inline" />)
    expect(screen.getByTestId('inline')).toHaveClass('flex', 'flex-wrap', 'gap-2', 'items-center', 'justify-start')
  })

  it.each(gaps.map((gap, index) => [gap, gapClasses[index]] as const))('gap %s → %s', (gap, expected) => {
    render(<Inline gap={gap} data-testid="inline" />)
    expect(screen.getByTestId('inline')).toHaveClass(expected)
  })

  it.each([
    ['start', 'items-start'],
    ['center', 'items-center'],
    ['end', 'items-end'],
    ['baseline', 'items-baseline'],
    ['stretch', 'items-stretch'],
  ] as const)('align %s', (align, expected) => {
    render(<Inline align={align} data-testid="inline" />)
    expect(screen.getByTestId('inline')).toHaveClass(expected)
  })

  it.each([
    ['start', 'justify-start'],
    ['center', 'justify-center'],
    ['end', 'justify-end'],
    ['between', 'justify-between'],
  ] as const)('justify %s', (justify, expected) => {
    render(<Inline justify={justify} data-testid="inline" />)
    expect(screen.getByTestId('inline')).toHaveClass(expected)
  })

  it('renders the element asked for', () => {
    render(<Inline as="ul" data-testid="inline" />)
    expect(screen.getByTestId('inline').tagName).toBe('UL')
  })
})

describe('Grid', () => {
  it('is a container whose columns follow its own width', () => {
    render(
      <Grid data-testid="grid">
        <p>一</p>
      </Grid>,
    )
    const container = screen.getByTestId('grid')
    expect(container).toHaveClass('@container')
    const grid = container.firstElementChild!
    expect(grid).toHaveClass('grid', 'grid-cols-1', 'gap-4')
    // Columns are added by container query (`@…:`), never by a viewport breakpoint.
    const stepped = [...grid.classList].filter((name) => name.includes(':'))
    expect(stepped.length).toBeGreaterThan(0)
    expect(stepped.every((name) => name.startsWith('@'))).toBe(true)
  })

  it.each([
    ['3xs', '@lg:grid-cols-2', 4],
    ['xs', '@2xl:grid-cols-2', 3],
    ['sm', '@3xl:grid-cols-2', 2],
    ['lg', '@5xl:grid-cols-2', 1],
  ] as const)('min %s adds its second column at %s', (min, second, steps) => {
    render(<Grid min={min} data-testid="grid" />)
    const grid = screen.getByTestId('grid').firstElementChild!
    expect(grid).toHaveClass('grid-cols-1', second)
    expect([...grid.classList].filter((name) => name.startsWith('@'))).toHaveLength(steps)
  })

  it.each(gaps.map((gap, index) => [gap, gapClasses[index]] as const))('gap %s → %s', (gap, expected) => {
    render(<Grid gap={gap} data-testid="grid" />)
    expect(screen.getByTestId('grid').firstElementChild).toHaveClass(expected)
  })

  it('GridItem spans the row only when asked', () => {
    render(
      <Grid>
        <GridItem data-testid="auto" />
        <GridItem span="full" data-testid="full" />
      </Grid>,
    )
    expect(screen.getByTestId('auto')).not.toHaveClass('col-span-full')
    expect(screen.getByTestId('full')).toHaveClass('col-span-full')
  })
})

describe('Section', () => {
  it('is a region named by its heading', async () => {
    const { container } = render(
      <Section title="今日预约">
        <p>内容</p>
      </Section>,
    )
    const section = screen.getByRole('region', { name: '今日预约' })
    expect(section.tagName).toBe('SECTION')
    expect(within(section).getByRole('heading', { level: 2, name: '今日预约' })).toBeInTheDocument()
    expect(within(section).getByText('内容')).toBeInTheDocument()
    expect(await axe(container)).toHaveNoViolations()
  })

  it.each([2, 3, 4] as const)('heading level %i', (level) => {
    render(<Section level={level} title="标题" />)
    expect(screen.getByRole('heading', { level, name: '标题' })).toBeInTheDocument()
  })

  it('shows its actions beside the heading, outside it', () => {
    render(<Section title="标题" actions={<button type="button">新建</button>} />)
    const button = screen.getByRole('button', { name: '新建' })
    expect(screen.getByRole('heading')).not.toContainElement(button)
    expect(screen.getByRole('region', { name: '标题' })).toContainElement(button)
  })

  it('two sections get two different heading ids', () => {
    render(
      <>
        <Section title="一" />
        <Section title="二" />
      </>,
    )
    expect(screen.getByRole('region', { name: '一' })).not.toBe(screen.getByRole('region', { name: '二' }))
  })

  it.each(gaps.map((gap, index) => [gap, gapClasses[index]] as const))('gap %s → %s', (gap, expected) => {
    render(<Section title="标题" gap={gap} />)
    expect(screen.getByRole('region')).toHaveClass(expected)
  })
})

describe('Page', () => {
  it('renders the one h1, the description, the actions and the content', async () => {
    const { container } = render(
      <main>
        <Page title="通知" description="等你处理的事" actions={<button type="button">全部已读</button>}>
          <p>内容</p>
        </Page>
      </main>,
    )
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1)
    expect(screen.getByRole('heading', { level: 1, name: '通知' })).toBeInTheDocument()
    expect(screen.getByText('等你处理的事')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '全部已读' })).toBeInTheDocument()
    expect(screen.getByText('内容')).toBeInTheDocument()
    expect(await axe(container)).toHaveNoViolations()
  })

  it('sets the page padding, stepped at the breakpoint tokens only', () => {
    render(<Page title="标题" data-testid="page" />)
    const page = screen.getByTestId('page')
    expect(page).toHaveClass('px-4', 'py-6', 'md:px-6', 'lg:px-8')
    const variants = [...page.classList].filter((name) => name.includes(':')).map((name) => name.split(':')[0])
    expect([...new Set(variants)].sort()).toEqual(['lg', 'md'])
  })

  it.each([
    ['prose', 'max-w-prose'],
    ['wide', 'max-w-7xl'],
    ['full', 'max-w-none'],
  ] as const)('width %s', (width, expected) => {
    render(<Page title="标题" width={width} data-testid="page" />)
    expect(screen.getByTestId('page').firstElementChild).toHaveClass(expected, 'mx-auto')
  })

  it('is wide by default', () => {
    render(<Page title="标题" data-testid="page" />)
    expect(screen.getByTestId('page').firstElementChild).toHaveClass('max-w-7xl')
  })
})

describe('the layout family as a whole', () => {
  const sources = readdirSync(import.meta.dirname)
    .filter((file) => /\.tsx?$/.test(file) && !file.includes('.test.'))
    .map((file) => [file, readFileSync(join(import.meta.dirname, file), 'utf8')] as const)

  it.each(sources)('%s sets no fixed block size', (_file, source) => {
    // A block size may only be a minimum (`min-h-*`); `h-*`, `size-*` and
    // `max-h-*` utilities and height styles would clip wrapped or enlarged text.
    // The one exception: `Page` with `height: fill` is exactly as tall as `main` (`h-full`) so that a
    // conversation can scroll inside it (D-45); it clips nothing — what does not fit spills and `main` scrolls.
    const sizes = source.match(/(?<![\w-])(?:h|size|max-h)-(?:\d|\[|px|full|screen|dvh|svh|target)[\w./[\]-]*/g) ?? []
    expect(sizes).toEqual(_file === 'Page.tsx' ? ['h-full'] : [])
    expect(source.match(/\b(?:height|blockSize|maxHeight)\s*:/g) ?? []).toEqual([])
    expect(source.match(/\b(?:truncate|line-clamp-\d+|overflow-hidden|whitespace-nowrap)\b/g) ?? []).toEqual([])
  })

  it.each(sources)('%s sets no outer margin', (_file, source) => {
    // `mx-auto` centres the inner measure of `Page`; nothing else is a margin.
    expect((source.match(/(?<![\w-])-?m[trblxyse]?-[\w./[\]-]+/g) ?? []).filter((name) => name !== 'mx-auto')).toEqual([])
  })

  const demos = Object.entries(
    import.meta.glob<ComponentType>('./*.demo.tsx', { eager: true, import: 'default' }),
  )

  it('every primitive has a demo', () => {
    expect(demos.map(([path]) => path).sort()).toEqual(
      ['Grid', 'Inline', 'Page', 'Section', 'Stack'].map((name) => `./${name}.demo.tsx`),
    )
  })

  it.each(demos)('%s renders in zh-CN with no English text and no axe violation', async (_path, Demo) => {
    window.localStorage.setItem(LOCALE_STORAGE_KEY, 'zh-CN')
    const { container } = render(
      <LocaleProvider>
        <Demo />
      </LocaleProvider>,
    )
    // Identifiers shown as code (a gap or width name) are not prose.
    const prose = container.cloneNode(true) as HTMLElement
    for (const code of prose.querySelectorAll('code')) code.remove()
    expect(prose.textContent).not.toMatch(/[A-Za-z]{2,}/)
    expect(prose.textContent).toMatch(/\p{Script=Han}/u)
    expect(await axe(container)).toHaveNoViolations()
  })
})
