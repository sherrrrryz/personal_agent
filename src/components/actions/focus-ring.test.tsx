import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { Input } from '@/components/inputs'
import { compositeOver, contrastRatio, oklchToLinearRgb } from '@/test/color'
import { resolveColor } from '@/test/tokens'

import { Button } from './Button'
import { buttonVariants } from './button-variants'

// The focus ring of a rendered `Button` and `Input`, as the browser
// composites it — `ring` at the opacity the rendered class names, over each
// surface a control sits on. D-43 keeps shadcn/ui's stock ring: it is at
// least 2 px wide and the same on every control, but its contrast is under
// the 3:1 that spec A-13 asked for. The measured ratios are pinned here as a
// recorded gap (TOKENS.md § Contrast pairs), so a colour change shows up; the
// colours come from the token source, the opacity and the width are read off
// the rendered element.

const surfaces = ['background', 'card', 'sidebar'] as const
const modes = ['light', 'dark'] as const

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

function ratio(mode: (typeof modes)[number], surface: (typeof surfaces)[number], alpha: number) {
  const ring = oklchToLinearRgb(resolveColor('color.ring', mode))
  const under = oklchToLinearRgb(resolveColor(`color.${surface}`, mode))
  return contrastRatio(compositeOver(ring, alpha, under), under)
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

  it('reports the six measured ratios of the stock ring at the kit’s half opacity — a recorded gap (D-43)', () => {
    const measured = Object.fromEntries(
      modes.flatMap((mode) => surfaces.map((surface) => [`${mode} ${surface}`, Math.round(ratio(mode, surface, 0.5) * 100) / 100])),
    )
    expect(measured).toMatchInlineSnapshot(`
      {
        "dark background": 1.87,
        "dark card": 1.87,
        "dark sidebar": 1.87,
        "light background": 1.54,
        "light card": 1.54,
        "light sidebar": 1.52,
      }
    `)
  })
})
