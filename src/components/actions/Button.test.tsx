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

  it('binds the target size, grows with its text and lets it wrap', () => {
    render(<Button>保存</Button>)
    const button = screen.getByRole('button')
    expect(button).toHaveClass('min-h-target', 'min-w-target', 'h-auto', 'whitespace-normal', 'max-w-full', 'shrink')
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
    // A link is underlined at rest: colour alone never marks it (hard rule 13).
    expect(buttonClass({ variant: 'link' }).split(' ')).toContain('underline')
  })

  it.each(buttonSizes)('size %s keeps the target minimum and no fixed size', (size) => {
    const tokens = buttonClass({ size }).split(' ')
    expect(tokens).toEqual(expect.arrayContaining(['min-h-target', 'min-w-target']))
    expect(tokens.filter((token) => /^(?:h|w|size)-\d/.test(token))).toEqual([])
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
