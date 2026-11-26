import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { Input } from '@/components/inputs'
import { compositeOver, contrastRatio, oklchToLinearRgb } from '@/test/color'
import { resolveColor } from '@/test/tokens'

import { Button } from './Button'
import { buttonVariants } from './button-variants'

// A-13: the focus ring of a rendered `Button` and `Input`, as the browser
// composites it — `ring` at the opacity the rendered class names, over each
// surface a control sits on — is at least 3:1 against that surface in both
// modes, and at least 2 px wide. The colours come from the token source; the
// opacity and the width are read off the rendered element, so a kit upgrade
// or a wrapper change that weakens the ring fails here.

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

  it.each(cases)('%s: `ring` only, at least 2 px, at least 3:1 on every surface in both modes', (_name, element, role, state) => {
    render(element)
    const ring = ringOf(screen.getByRole(role), state)
    expect(ring.width).toHaveLength(1)
    expect(ring.width[0]).toBeGreaterThanOrEqual(2)
    // One colour at rest, and nothing but `ring` in dark either.
    expect(ring.light).toHaveLength(1)
    for (const { role: colourRole } of [...ring.light, ...ring.dark]) expect(colourRole).toBe('ring')
    for (const mode of modes) {
      const alpha = (mode === 'dark' ? ring.dark[0] : undefined)?.alpha ?? ring.light[0].alpha
      for (const surface of surfaces) expect(ratio(mode, surface, alpha), `${mode} ${surface}`).toBeGreaterThanOrEqual(3)
    }
  })

  it('reports the six measured ratios of the ring at the kit’s half opacity', () => {
    const measured = Object.fromEntries(
      modes.flatMap((mode) => surfaces.map((surface) => [`${mode} ${surface}`, Math.round(ratio(mode, surface, 0.5) * 100) / 100])),
    )
    expect(Object.values(measured).every((value) => value >= 3)).toBe(true)
    expect(measured).toMatchInlineSnapshot(`
      {
        "dark background": 5.15,
        "dark card": 5.09,
        "dark sidebar": 5.09,
        "light background": 3.71,
        "light card": 3.71,
        "light sidebar": 3.68,
      }
    `)
  })
})
