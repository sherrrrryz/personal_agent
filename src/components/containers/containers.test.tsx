import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ComponentType, ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { Button } from '@/components/actions'
import { LocaleProvider, LOCALE_STORAGE_KEY } from '@/i18n'
import { axe } from '@/test/axe'

import {
  AlertDialog,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
  Dialog,
  Separator,
  Sheet,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from './index'

// Component evidence for the containers family (A-14): `Dialog`,
// `AlertDialog`, `Sheet`, `Collapsible`, `Tooltip`, `Card`, `Separator`.
// The three overlays each prove focus in, containment, return and Escape.

function App({ children }: { children: ReactNode }) {
  return <LocaleProvider>{children}</LocaleProvider>
}

beforeEach(() => {
  window.localStorage.setItem(LOCALE_STORAGE_KEY, 'zh-CN')
})

/** Focus is inside `overlay`, and stays there however often Tab and Shift+Tab are pressed. */
async function expectFocusContained(overlay: HTMLElement, stops: number) {
  const inside = () => waitFor(() => expect(overlay).toContainElement(document.activeElement as HTMLElement), { timeout: 300 })
  await inside()
  const seen = new Set<Element>()
  for (let step = 0; step < stops * 2 + 1; step += 1) {
    await userEvent.tab()
    await inside()
    seen.add(document.activeElement as Element)
  }
  for (let step = 0; step < stops + 1; step += 1) {
    await userEvent.tab({ shift: true })
    await inside()
  }
  // Every stop was reached, and the walk wrapped around instead of leaving.
  expect(seen.size).toBe(stops)
}

const gone = (role: string) => waitFor(() => expect(screen.queryByRole(role)).not.toBeInTheDocument())

describe('Dialog', () => {
  const example = (
    <App>
      <Dialog
        trigger={<Button variant="secondary">连接日历</Button>}
        title="连接你的日历"
        description="原型：模拟授权。"
        footer={
          <>
            <Button variant="ghost">稍后再连</Button>
            <Button>连接</Button>
          </>
        }
      >
        <p>预约和日程都会读取你的日历。</p>
      </Dialog>
      <button type="button">页面上的其他按钮</button>
    </App>
  )

  it('opens from our button, named by its title and described by its description; separates by a border, scrolls inside', async () => {
    render(example)
    const trigger = screen.getByRole('button', { name: '连接日历' })
    expect(trigger).toHaveAttribute('aria-haspopup', 'dialog')
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    await userEvent.click(trigger)
    const dialog = await screen.findByRole('dialog', { name: '连接你的日历' })
    expect(dialog).toHaveAccessibleDescription('原型：模拟授权。')
    expect(dialog).toHaveClass('border', 'max-h-full', 'overflow-y-auto')
    expect(within(dialog).getByText('预约和日程都会读取你的日历。')).toBeInTheDocument()
    // The close control is our button, named in the user's language — not the kit's.
    const close = within(dialog).getByRole('button', { name: '关闭' })
    expect(close).toHaveClass('min-h-target', 'min-w-target')
    expect(dialog.querySelector('.sr-only')).toBeNull()
    expect(within(dialog).getAllByRole('button').map((button) => button.textContent)).toEqual(['', '稍后再连', '连接'])
    expect(await axe(document.body)).toHaveNoViolations()
  })

  it('focus moves in, is contained, and returns to the trigger; Escape closes', async () => {
    render(example)
    const trigger = screen.getByRole('button', { name: '连接日历' })
    await userEvent.tab()
    expect(trigger).toHaveFocus()
    await userEvent.keyboard('{Enter}')
    const dialog = await screen.findByRole('dialog')
    await expectFocusContained(dialog, 3)
    await userEvent.keyboard('{Escape}')
    await gone('dialog')
    await waitFor(() => expect(trigger).toHaveFocus())
  })

  it('open and onOpenChange control it from outside', async () => {
    const onOpenChange = vi.fn()
    const { rerender } = render(
      <App>
        <Dialog open title="连接你的日历" onOpenChange={onOpenChange} />
      </App>,
    )
    const dialog = await screen.findByRole('dialog', { name: '连接你的日历' })
    await userEvent.click(within(dialog).getByRole('button', { name: '关闭' }))
    expect(onOpenChange).toHaveBeenLastCalledWith(false)
    rerender(
      <App>
        <Dialog open={false} title="连接你的日历" onOpenChange={onOpenChange} />
      </App>,
    )
    await gone('dialog')
  })

  it('the close button closes and returns focus to the trigger', async () => {
    render(example)
    const trigger = screen.getByRole('button', { name: '连接日历' })
    await userEvent.click(trigger)
    await userEvent.click(within(await screen.findByRole('dialog')).getByRole('button', { name: '关闭' }))
    await gone('dialog')
    await waitFor(() => expect(trigger).toHaveFocus())
  })
})

describe('AlertDialog', () => {
  function Example({ onConfirm = () => {}, cancelLabel }: { onConfirm?: () => void; cancelLabel?: string }) {
    return (
      <App>
        <AlertDialog
          trigger={<Button variant="danger">断开日历</Button>}
          title="要断开日历吗？"
          description="预约和日程会停止更新。"
          confirmLabel="断开"
          confirmVariant="danger"
          onConfirm={onConfirm}
          cancelLabel={cancelLabel}
        />
      </App>
    )
  }

  it('an alertdialog named by its question; focus starts on Cancel, is contained, and Escape returns it to the trigger', async () => {
    const onConfirm = vi.fn()
    render(<Example onConfirm={onConfirm} />)
    const trigger = screen.getByRole('button', { name: '断开日历' })
    await userEvent.click(trigger)
    const dialog = await screen.findByRole('alertdialog', { name: '要断开日历吗？' })
    expect(dialog).toHaveAccessibleDescription('预约和日程会停止更新。')
    expect(dialog).toHaveClass('border', 'max-h-full', 'overflow-y-auto')
    const cancel = within(dialog).getByRole('button', { name: '取消' })
    const confirm = within(dialog).getByRole('button', { name: '断开' })
    for (const button of [cancel, confirm]) expect(button).toHaveClass('min-h-target', 'min-w-target')
    await waitFor(() => expect(cancel).toHaveFocus())
    expect(await axe(document.body)).toHaveNoViolations()
    await expectFocusContained(dialog, 2)
    await userEvent.keyboard('{Escape}')
    await gone('alertdialog')
    await waitFor(() => expect(trigger).toHaveFocus())
    expect(onConfirm).not.toHaveBeenCalled()
  })

  it('Confirm acts once and closes; Cancel only closes; the cancelling words can be set', async () => {
    const onConfirm = vi.fn()
    render(<Example onConfirm={onConfirm} cancelLabel="先不断开" />)
    const trigger = screen.getByRole('button', { name: '断开日历' })
    await userEvent.click(trigger)
    await userEvent.click(within(await screen.findByRole('alertdialog')).getByRole('button', { name: '先不断开' }))
    await gone('alertdialog')
    expect(onConfirm).not.toHaveBeenCalled()
    await userEvent.click(trigger)
    await userEvent.click(within(await screen.findByRole('alertdialog')).getByRole('button', { name: '断开' }))
    await gone('alertdialog')
    expect(onConfirm).toHaveBeenCalledTimes(1)
    await waitFor(() => expect(trigger).toHaveFocus())
  })
})

describe('Sheet', () => {
  const example = (side?: 'end' | 'bottom') => (
    <App>
      <Sheet
        side={side}
        trigger={<Button variant="secondary">运行记录</Button>}
        title="运行记录"
        description="每运行一次多一行。"
        footer={<Button variant="secondary">完成</Button>}
      >
        <a href="#run-1">今天 09:00</a>
      </Sheet>
    </App>
  )

  it.each([
    ['end', 'right'],
    ['bottom', 'bottom'],
  ] as const)('side %s: a named dialog on that edge with our close button; never taller than the window', async (side, kitSide) => {
    render(example(side))
    await userEvent.click(screen.getByRole('button', { name: '运行记录' }))
    const sheet = await screen.findByRole('dialog', { name: '运行记录' })
    expect(sheet).toHaveAttribute('data-side', kitSide)
    expect(sheet).toHaveAccessibleDescription('每运行一次多一行。')
    expect(sheet).toHaveClass('border', 'max-h-full', 'overflow-y-auto')
    expect(within(sheet).getByRole('button', { name: '关闭' })).toHaveClass('min-h-target', 'min-w-target')
    expect(sheet.querySelector('.sr-only')).toBeNull()
    expect(await axe(document.body)).toHaveNoViolations()
  })

  it('the default side is the inline end; focus moves in, is contained, and Escape returns it to the trigger', async () => {
    render(example())
    const trigger = screen.getByRole('button', { name: '运行记录' })
    await userEvent.tab()
    await userEvent.keyboard('{Enter}')
    const sheet = await screen.findByRole('dialog')
    expect(sheet).toHaveAttribute('data-side', 'right')
    await expectFocusContained(sheet, 3)
    await userEvent.keyboard('{Escape}')
    await gone('dialog')
    await waitFor(() => expect(trigger).toHaveFocus())
    await userEvent.click(trigger)
    await userEvent.click(within(await screen.findByRole('dialog')).getByRole('button', { name: '关闭' }))
    await gone('dialog')
    await waitFor(() => expect(trigger).toHaveFocus())
  })
})

describe('Collapsible (kit)', () => {
  it('its trigger is our button, which says whether the content shows; Enter and Space toggle it', async () => {
    const { container } = render(
      <Collapsible>
        <CollapsibleTrigger render={<Button variant="secondary">3 月 12 日的对话</Button>} />
        <CollapsibleContent>
          <p>三位主人已经同意。</p>
        </CollapsibleContent>
      </Collapsible>,
    )
    const trigger = screen.getByRole('button', { name: '3 月 12 日的对话' })
    expect(trigger).toHaveClass('min-h-target', 'min-w-target')
    expect(trigger).toHaveAttribute('aria-expanded', 'false')
    expect(screen.queryByText('三位主人已经同意。')).not.toBeInTheDocument()
    await userEvent.tab()
    await userEvent.keyboard('{Enter}')
    expect(trigger).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByText('三位主人已经同意。')).toBeVisible()
    expect(trigger).toHaveAttribute('aria-controls', screen.getByText('三位主人已经同意。').parentElement?.id)
    expect(await axe(container)).toHaveNoViolations()
    await userEvent.keyboard(' ')
    expect(trigger).toHaveAttribute('aria-expanded', 'false')
    expect(trigger).toHaveFocus()
  })

  it('defaultOpen starts with the content showing', () => {
    render(
      <Collapsible defaultOpen>
        <CollapsibleTrigger render={<Button>对话</Button>} />
        <CollapsibleContent>内容</CollapsibleContent>
      </Collapsible>,
    )
    expect(screen.getByRole('button', { name: '对话' })).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByText('内容')).toBeVisible()
  })
})

describe('Tooltip (kit)', () => {
  it('shows on keyboard focus of our button and hides on Escape; the button is named without it', async () => {
    render(
      <Tooltip>
        <TooltipTrigger
          render={
            <Button size="icon" aria-label="添加预约">
              <svg aria-hidden="true" />
            </Button>
          }
        />
        <TooltipContent>新建一条今天的空白预约</TooltipContent>
      </Tooltip>,
    )
    const trigger = screen.getByRole('button', { name: '添加预约' })
    expect(trigger).toHaveClass('min-h-target', 'min-w-target')
    expect(screen.queryByText('新建一条今天的空白预约')).not.toBeInTheDocument()
    await userEvent.tab()
    expect(trigger).toHaveFocus()
    const tip = await screen.findByText('新建一条今天的空白预约')
    expect(tip).toHaveAttribute('data-slot', 'tooltip-content')
    // Still named by its own label: the tooltip is a hint, never the only name.
    expect(trigger).toHaveAccessibleName('添加预约')
    expect(await axe(document.body)).toHaveNoViolations()
    await userEvent.keyboard('{Escape}')
    await waitFor(() => expect(screen.queryByText('新建一条今天的空白预约')).not.toBeInTheDocument())
    expect(trigger).toHaveFocus()
  })
})

describe('Card (kit)', () => {
  it.each(['default', 'sm'] as const)('size %s: header, content and footer in a card surface, no role of its own', async (size) => {
    const { container } = render(
      <Card size={size}>
        <CardHeader>
          <CardTitle>明天</CardTitle>
          <CardDescription>六个预约。</CardDescription>
        </CardHeader>
        <CardContent>上午有两只长毛狗。</CardContent>
        <CardFooter>
          <Button variant="secondary">打开日程</Button>
        </CardFooter>
      </Card>,
    )
    const card = container.firstElementChild as HTMLElement
    expect(card).toHaveAttribute('data-size', size)
    expect(card).toHaveClass('bg-card', 'text-card-foreground')
    expect(card).not.toHaveAttribute('role')
    expect(card).toHaveTextContent('明天六个预约。上午有两只长毛狗。打开日程')
    expect(await axe(container)).toHaveNoViolations()
  })
})

describe('Separator (kit)', () => {
  it.each(['horizontal', 'vertical'] as const)('%s: a separator with that orientation, not focusable', async (orientation) => {
    const { container } = render(<Separator orientation={orientation} />)
    const separator = screen.getByRole('separator')
    expect(separator).toHaveAttribute('aria-orientation', orientation)
    expect(separator).not.toHaveAttribute('tabindex')
    expect(separator).toHaveClass('bg-border')
    expect(await axe(container)).toHaveNoViolations()
  })
})

describe('the containers family as a whole', () => {
  const sources = readdirSync(import.meta.dirname)
    .filter((file) => /\.tsx?$/.test(file) && !file.includes('.test.') && !file.includes('.demo.'))
    .map((file) => [file, readFileSync(join(import.meta.dirname, file), 'utf8')] as const)

  it.each(sources)('%s sets no fixed block size, cuts no text, has no outer margin and no matrix waiver', (_file, source) => {
    // `max-h-full` is the one block limit: an overlay is never taller than the window and scrolls inside.
    expect(source.match(/(?<![\w-:])(?:h|size|max-h)-(?:\d|\[|px|full|screen|dvh|svh|target)[\w./[\]-]*/g) ?? []).toEqual(
      source.includes('overlaySurface =') ? ['max-h-full'] : [],
    )
    expect(source.match(/\b(?:truncate|line-clamp-\d+|overflow-hidden|whitespace-nowrap)\b/g) ?? []).toEqual([])
    expect(source.match(/(?<![\w-])-?m[trblxyse]?-[\w./[\]-]+/g) ?? []).toEqual([])
    expect(source).not.toContain('data-matrix-allow')
    // No scrim or shadow is put back with a value of our own.
    expect(source.match(/\b(?:bg-black|shadow-\w+|backdrop-\w+)/g) ?? []).toEqual([])
  })

  const demos = Object.entries(import.meta.glob<ComponentType>('./*.demo.tsx', { eager: true, import: 'default' }))

  it('every component of the family has a demo', () => {
    expect(demos.map(([path]) => path).sort()).toEqual(
      ['AlertDialog', 'Card', 'Collapsible', 'Dialog', 'Separator', 'Sheet', 'Tooltip'].map((name) => `./${name}.demo.tsx`),
    )
  })

  it.each(demos)('%s renders in zh-CN with no English text or name and no axe violation, closed and open', async (_path, Demo) => {
    const { container } = render(
      <App>
        <Demo />
      </App>,
    )
    const check = async (root: HTMLElement) => {
      const prose = root.cloneNode(true) as HTMLElement
      for (const code of prose.querySelectorAll('code, script, style')) code.remove()
      expect(prose.textContent).not.toMatch(/[A-Za-z]{2,}/)
      expect(prose.textContent).toMatch(/\p{Script=Han}/u)
      for (const named of root.querySelectorAll('[aria-label], [title]')) {
        for (const attribute of ['aria-label', 'title']) expect(named.getAttribute(attribute) ?? '').not.toMatch(/[A-Za-z]{2,}/)
      }
      expect(await axe(root)).toHaveNoViolations()
    }
    await check(container)
    const opener = container.querySelector<HTMLElement>('[aria-haspopup="dialog"]')
    if (opener) {
      await userEvent.click(opener)
      await waitFor(() => expect(document.querySelector('[role="dialog"], [role="alertdialog"]')).not.toBeNull())
      await check(document.body)
    }
  })
})
