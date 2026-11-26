import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { Input } from '@/components/inputs'

import { Button } from './Button'
import { buttonVariants } from './button-variants'

// The focus ring of a rendered `Button` and `Input`, read off the rendered
// element's classes. D-43 keeps shadcn/ui's stock ring: at least 2 px wide and
// the same on every control. Its contrast is not measured — the contrast
// requirement is withdrawn by D-43.

/** The ring a focused element draws, read from its classes: width in px, colour role and opacity. */
function ringOf(element: Element, state: '' | 'aria-invalid:' = '') {
  const classes = element.className.split(' ')
  const escaped = state.replace(':', '\\:')
  const colour = (prefix: string) =>
    classes
      .map((name) => new RegExp(`^${prefix}${escaped}focus-visible:ring-([a-z-]+)/(\\d+)$`).exec(name))
      .filter((match) => match !== null)
      .map((match) => ({ role: match[1], alpha: Number(match[2]) / 100 }))
  const width = classes
    .map((name) => /^focus-visible:ring-\[?(\d+)(?:px\])?$/.exec(name))
    .filter((match) => match !== null)
    .map((match) => Number(match[1]))
  return { width, light: colour(''), dark: colour('dark:') }
}

describe('the focus ring', () => {
  const cases = [
    ...buttonVariants.map((variant) => [`Button ${variant}`, <Button variant={variant}>保存</Button>, 'button', ''] as const),
    ['Input', <Input aria-label="名字" />, 'textbox', ''] as const,
    ['Input, invalid', <Input aria-label="名字" aria-invalid />, 'textbox', 'aria-invalid:'] as const,
  ]

  it.each(cases)('%s: the kit’s ring, at least 2 px wide, in one colour role at one opacity', (_name, element, role, state) => {
    render(element)
    const ring = ringOf(screen.getByRole(role), state)
    expect(ring.width).toHaveLength(1)
    expect(ring.width[0]).toBeGreaterThanOrEqual(2)
    expect(ring.light).toHaveLength(1)
    // `ring` everywhere but the kit's danger button, which tints its ring with `destructive` (stock).
    expect(['ring', 'destructive']).toContain(ring.light[0].role)
  })

  it('an invalid field keeps the `ring` colour while focused — the one restated ring (WCAG 2.4.7)', () => {
    render(<Input aria-label="名字" aria-invalid />)
    const ring = ringOf(screen.getByRole('textbox'), 'aria-invalid:')
    expect(ring.light.map(({ role }) => role)).toEqual(['ring'])
    expect(ring.dark.map(({ role }) => role)).toEqual(['ring'])
  })
})
