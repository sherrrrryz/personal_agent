import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { axe } from '@/test/axe'

import { Button } from './Button'
import { buttonClass, buttonSizes, buttonVariants } from './button-variants'

// Component evidence for `Button` (A-13): render, every variant, size and
// state, the keyboard path, axe. The demo in zh-CN is in `actions.test.tsx`.

describe('Button', () => {
  it('is a native button that never submits by accident', () => {
    render(<Button>保存</Button>)
    const button = screen.getByRole('button', { name: '保存' })
    expect(button.tagName).toBe('BUTTON')
    expect(button).toHaveAttribute('type', 'button')
  })

  it('is the kit’s button: its height is a minimum, and a label that does not fit wraps (D-43)', () => {
    render(<Button>保存</Button>)
    const button = screen.getByRole('button')
    expect(button).toHaveClass('min-h-8', 'h-auto', 'whitespace-normal', 'max-w-full', 'shrink')
    // No forced target size: the kit's 32 px is above the 24 px floor of WCAG 2.2 AA.
    expect(button.className).not.toMatch(/-target\b/)
    // The kit's fixed height and single line are gone, not merely outranked.
    const tokens = button.className.split(' ')
    expect(tokens.filter((token) => /^h-\d/.test(token) || token === 'whitespace-nowrap' || token === 'shrink-0')).toEqual([])
  })

  it.each(buttonVariants)('variant %s renders a pressable button', async (variant) => {
    const onClick = vi.fn()
    render(
      <Button variant={variant} onClick={onClick}>
        保存
      </Button>,
    )
    await userEvent.click(screen.getByRole('button', { name: '保存' }))
    expect(onClick).toHaveBeenCalledTimes(1)
  })

  it.each(buttonVariants)('variant %s renders exactly the classes `buttonClass` describes', (variant) => {
    render(<Button variant={variant}>保存</Button>)
    // The kit's default look must not leak under another variant.
    expect(new Set(screen.getByRole('button').className.split(' '))).toEqual(new Set(buttonClass({ variant }).split(' ')))
  })

  it('only the primary variant is filled with `primary`', () => {
    for (const variant of buttonVariants) {
      render(<Button variant={variant}>{variant}</Button>)
      const filled = screen.getByRole('button', { name: variant }).className.split(' ').includes('bg-primary')
      expect(filled).toBe(variant === 'primary')
    }
  })

  it('gives each variant its own look', () => {
    const classes = buttonVariants.map((variant) => buttonClass({ variant }))
    expect(new Set(classes).size).toBe(buttonVariants.length)
    // Every variant is the kit's own: nothing restated on top, the link's underline on hover included.
    expect(buttonClass({ variant: 'link' }).split(' ')).not.toContain('underline')
    expect(buttonClass({ variant: 'link' }).split(' ')).toContain('hover:underline')
    expect(buttonClass({ variant: 'danger' })).not.toMatch(/focus-visible:ring-ring/)
  })

  it('sizes: sm and md keep the kit’s height as a minimum, icon is the kit’s square; no size binds the target token', () => {
    expect(buttonClass({ size: 'sm' }).split(' ')).toEqual(expect.arrayContaining(['min-h-7', 'h-auto']))
    expect(buttonClass({ size: 'md' }).split(' ')).toEqual(expect.arrayContaining(['min-h-8', 'h-auto']))
    const icon = buttonClass({ size: 'icon' }).split(' ')
    expect(icon).toContain('size-8')
    expect(icon).not.toContain('h-auto')
    for (const size of buttonSizes) expect(buttonClass({ size })).not.toMatch(/-target\b/)
  })

  it('an icon-only button is named by its aria-label', () => {
    render(
      <Button size="icon" aria-label="添加">
        <svg aria-hidden="true" />
      </Button>,
    )
    expect(screen.getByRole('button', { name: '添加' })).toBeInTheDocument()
    // @ts-expect-error — an icon-only button without a name does not compile
    void (<Button size="icon">+</Button>)
  })

  it('is operated with Enter and Space and reached with Tab', async () => {
    const onClick = vi.fn()
    render(<Button onClick={onClick}>保存</Button>)
    await userEvent.tab()
    expect(screen.getByRole('button')).toHaveFocus()
    await userEvent.keyboard('{Enter}')
    await userEvent.keyboard(' ')
    expect(onClick).toHaveBeenCalledTimes(2)
  })

  it('disabled: leaves the tab order and does not act', async () => {
    const onClick = vi.fn()
    render(
      <Button disabled onClick={onClick}>
        保存
      </Button>,
    )
    const button = screen.getByRole('button')
    expect(button).toBeDisabled()
    await userEvent.tab()
    expect(button).not.toHaveFocus()
    await userEvent.click(button)
    expect(onClick).not.toHaveBeenCalled()
  })

  it('loading: busy, still focusable, keeps its label and does not act again', async () => {
    const onClick = vi.fn()
    const { container } = render(
      <Button loading onClick={onClick}>
        保存
      </Button>,
    )
    const button = screen.getByRole('button', { name: '保存' })
    expect(button).toHaveAttribute('aria-busy', 'true')
    expect(button).toHaveAttribute('aria-disabled', 'true')
    expect(button).not.toHaveAttribute('disabled')
    // The spinner is decoration: the label and `aria-busy` carry the state.
    expect(container.querySelector('[data-slot="spinner"]')).toHaveAttribute('aria-hidden', 'true')
    expect(container.querySelector('[role="status"]')).toBeNull()
    await userEvent.tab()
    expect(button).toHaveFocus()
    await userEvent.click(button)
    await userEvent.keyboard('{Enter}')
    expect(onClick).not.toHaveBeenCalled()
  })

  it('a loading icon-only button keeps its name while the spinner replaces the icon', () => {
    render(
      <Button size="icon" aria-label="添加" loading>
        <svg aria-hidden="true" data-testid="icon" />
      </Button>,
    )
    expect(screen.getByRole('button', { name: '添加' })).toHaveAttribute('aria-busy', 'true')
    expect(screen.queryByTestId('icon')).toBeNull()
  })

  it('is not busy when it is not loading', () => {
    render(<Button>保存</Button>)
    expect(screen.getByRole('button')).not.toHaveAttribute('aria-busy')
  })

  it('passes a pressed or expanded state and a ref through, for the kit triggers that render it', () => {
    let node: HTMLButtonElement | null = null
    render(
      <Button
        aria-expanded="false"
        aria-haspopup="menu"
        ref={(element: HTMLButtonElement | null) => {
          node = element
        }}
      >
        菜单
      </Button>,
    )
    const button = screen.getByRole('button', { name: '菜单' })
    expect(button).toHaveAttribute('aria-expanded', 'false')
    expect(node).toBe(button)
  })

  it('has no axe violation in any variant', async () => {
    const { container } = render(
      <div>
        {buttonVariants.map((variant) => (
          <Button key={variant} variant={variant}>
            保存
          </Button>
        ))}
        <Button size="icon" aria-label="添加">
          <svg aria-hidden="true" />
        </Button>
        <Button loading>保存</Button>
        <Button disabled>保存</Button>
      </div>,
    )
    expect(await axe(container)).toHaveNoViolations()
  })
})
