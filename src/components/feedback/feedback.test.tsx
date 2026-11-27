import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

import { render, screen } from '@testing-library/react'
import type { ComponentType } from 'react'
import { describe, expect, it } from 'vitest'

import { LocaleProvider, LOCALE_STORAGE_KEY } from '@/i18n'
import { axe } from '@/test/axe'
import { ThemeProvider } from '@/theme'

import {
  Alert,
  AlertDescription,
  AlertTitle,
  Badge,
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  Progress,
  ProgressLabel,
  ProgressValue,
  Skeleton,
  Spinner,
} from './index'

// Component evidence for the `kit` rows of the feedback family (A-15) —
// `Badge`, `Alert`, `Skeleton`, `Spinner`, `Empty`, `Progress` — and the
// checks that hold for the whole family. `Sonner` and `DataState` have their
// own files.

describe('Badge', () => {
  it.each(['default', 'secondary', 'outline', 'destructive'] as const)('variant %s: text in a span, an icon beside it hidden', async (variant) => {
    const { container } = render(
      <Badge variant={variant}>
        <svg aria-hidden="true" />
        已连接
      </Badge>,
    )
    const badge = screen.getByText('已连接')
    expect(badge.tagName).toBe('SPAN')
    expect(badge).toHaveAttribute('data-slot', 'badge')
    expect(badge.querySelector('svg')).toHaveAttribute('aria-hidden', 'true')
    // Not interactive: nothing to focus, no role to announce.
    expect(badge).not.toHaveAttribute('tabindex')
    expect(badge).not.toHaveAttribute('role')
    expect(await axe(container)).toHaveNoViolations()
  })
})

describe('Alert', () => {
  it('is an assertive alert with a title and a description; a variant changes no role', async () => {
    const { container } = render(
      <>
        <Alert>
          <svg aria-hidden="true" />
          <AlertTitle>周六有两个预约时间重叠</AlertTitle>
          <AlertDescription>请改掉其中一个。</AlertDescription>
        </Alert>
        <Alert variant="destructive">
          <AlertTitle>日历已断开连接</AlertTitle>
        </Alert>
      </>,
    )
    const [first, second] = screen.getAllByRole('alert')
    expect(first).toHaveTextContent('周六有两个预约时间重叠请改掉其中一个。')
    expect(second).toHaveTextContent('日历已断开连接')
    expect(await axe(container)).toHaveNoViolations()
  })

  it('shown from the start, it can drop the live role', () => {
    render(
      <Alert role={undefined}>
        <AlertDescription>提醒会在前一天晚上发出。</AlertDescription>
      </Alert>,
    )
    expect(screen.queryByRole('alert')).toBeNull()
    expect(screen.getByText('提醒会在前一天晚上发出。').closest('[data-slot="alert"]')).not.toBeNull()
  })
})

describe('Skeleton', () => {
  it('is an empty shape with no role and no text', () => {
    const { container } = render(
      <div aria-hidden="true">
        <Skeleton className="h-4 w-full" />
      </div>,
    )
    const skeleton = container.querySelector('[data-slot="skeleton"]')!
    expect(skeleton).toBeEmptyDOMElement()
    expect(skeleton).not.toHaveAttribute('role')
    expect(skeleton).toHaveClass('h-4', 'w-full')
  })
})

describe('Spinner', () => {
  it('has no built-in name: named by the caller it is a status', async () => {
    const { container } = render(<Spinner aria-label="正在发送提醒" />)
    expect(screen.getByRole('status', { name: '正在发送提醒' })).toHaveAttribute('data-slot', 'spinner')
    expect(await axe(container)).toHaveNoViolations()
  })

  it('beside its status text it is decoration', () => {
    const { container } = render(
      <p>
        <Spinner role={undefined} aria-hidden="true" />
        正在发送提醒…
      </p>,
    )
    expect(screen.queryByRole('status')).toBeNull()
    expect(container.querySelector('[data-slot="spinner"]')).not.toHaveAttribute('aria-label')
  })
})

describe('Empty', () => {
  it('holds a title, a description and an action', async () => {
    const { container } = render(
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <svg aria-hidden="true" />
          </EmptyMedia>
          <EmptyTitle>今天没有预约</EmptyTitle>
          <EmptyDescription>预约会出现在这里。</EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <button type="button">添加预约</button>
        </EmptyContent>
      </Empty>,
    )
    const empty = container.querySelector('[data-slot="empty"]')!
    expect(empty).toHaveTextContent('今天没有预约预约会出现在这里。添加预约')
    expect(screen.getByRole('button', { name: '添加预约' })).toBeInTheDocument()
    expect(await axe(container)).toHaveNoViolations()
  })
})

describe('Progress', () => {
  it('is a progressbar named by its label, with its value as text', async () => {
    const { container } = render(
      <Progress value={2} max={3} locale="zh-CN">
        <ProgressLabel>第 2 步，共 3 步</ProgressLabel>
        <ProgressValue />
      </Progress>,
    )
    const bar = screen.getByRole('progressbar', { name: '第 2 步，共 3 步' })
    expect(bar).toHaveAttribute('aria-valuenow', '2')
    expect(bar).toHaveAttribute('aria-valuemax', '3')
    // The text equivalent: on screen, and as the value assistive technology reads.
    expect(container.querySelector('[data-slot="progress-value"]')).toHaveTextContent('67%')
    expect(bar.getAttribute('aria-valuetext')).toMatch(/67/)
    expect(await axe(container)).toHaveNoViolations()
  })

  it('without a value it is indeterminate and still named', () => {
    render(
      <Progress value={null}>
        <ProgressLabel>正在准备流程</ProgressLabel>
      </Progress>,
    )
    expect(screen.getByRole('progressbar', { name: '正在准备流程' })).not.toHaveAttribute('aria-valuenow')
  })
})

describe('the feedback family as a whole', () => {
  const sources = readdirSync(import.meta.dirname)
    .filter((file) => /\.tsx?$/.test(file) && !file.includes('.test.'))
    .map((file) => [file, readFileSync(join(import.meta.dirname, file), 'utf8')] as const)

  it.each(sources)('%s sets no fixed block size on text, no truncation and no outer margin', (_file, source) => {
    // A skeleton bar holds no text; its height is its shape.
    const ours = source
      .split('\n')
      .filter((line) => !line.includes('<Skeleton '))
      .join('\n')
    expect(ours.match(/(?<![\w-])(?:h|size|max-h)-(?:\d|\[|px|full|screen|dvh|svh|target)[\w./[\]-]*/g) ?? []).toEqual([])
    expect(ours.match(/\b(?:truncate|line-clamp-\d+|overflow-hidden|whitespace-nowrap)\b/g) ?? []).toEqual([])
    expect(ours.match(/(?<![\w-])-?m[trblxyse]?-[\w./[\]-]+/g) ?? []).toEqual([])
  })

  const demos = Object.entries(import.meta.glob<ComponentType>('./*.demo.tsx', { eager: true, import: 'default' }))

  it('every component of the family has a demo', () => {
    expect(demos.map(([path]) => path).sort()).toEqual(
      ['Alert', 'Badge', 'DataState', 'Empty', 'Progress', 'Skeleton', 'Sonner', 'Spinner'].map((name) => `./${name}.demo.tsx`),
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
        // The toaster's name ends in the key chord of its shortcut — key names, not words (`Sonner.test.tsx`).
        expect((named.getAttribute(attribute) ?? '').replace(/ alt\+T$/, '')).not.toMatch(/[A-Za-z]{2,}/)
      }
    }
    // A demo that started busy would hold every matrix cell for the harness's eight-second wait.
    expect(container.querySelector('[aria-busy="true"]')).toBeNull()
    expect(await axe(container)).toHaveNoViolations()
  })
})
