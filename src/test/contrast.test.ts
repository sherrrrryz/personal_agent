// @vitest-environment node
//
// docs/design/TOKENS.md § Contrast pairs, recomputed from the token source
// (spec A-05): every listed ratio is the computed one, in both modes; every
// pair the spec introduces is listed. A row marked `ok` meets its requirement.
// A row marked `gap` is a recorded shortfall of shadcn/ui's stock theme, which
// D-43 keeps as it is: it must really be below, so the mark cannot go stale.
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

import { describe, expect, it } from 'vitest'

import { compositeOver, contrastRatio, oklchToLinearRgb } from './color'
import { readTokens, REPO_ROOT, resolveRawColor } from './tokens'

interface Pair {
  foreground: string
  background: string
  light: string
  dark: string
  required: number
  status: string
}

/** The rows of the table under `## Contrast pairs`. */
function readPairs(): Pair[] {
  const doc = readFileSync(join(REPO_ROOT, 'docs/design/TOKENS.md'), 'utf8')
  const section = doc.slice(doc.indexOf('\n## Contrast pairs')).split('\n## ')[1]
  const code = (cell: string) => /^`([^`]+)`$/.exec(cell)?.[1]
  return section
    .split('\n')
    .filter((line) => line.startsWith('| `'))
    .map((line) => line.split('|').slice(1, -1).map((cell) => cell.trim()))
    .map(([foreground, background, , light, dark, required, status]) => ({
      foreground: code(foreground)!,
      background: code(background)!,
      light,
      dark,
      required: Number(required),
      status,
    }))
}

/** Pairs introduced by docs/specs/lofi-prototype-system.md § Accessibility. */
const SPEC_PAIRS: [foreground: string, background: string, required: number][] = [
  ['color.foreground', 'color.background', 4.5],
  ['color.card-foreground', 'color.card', 4.5],
  ['color.popover-foreground', 'color.popover', 4.5],
  ['color.primary-foreground', 'color.primary', 4.5],
  ['color.secondary-foreground', 'color.secondary', 4.5],
  ['color.muted-foreground', 'color.background', 4.5],
  ['color.muted-foreground', 'color.muted', 4.5],
  ['color.accent-foreground', 'color.accent', 4.5],
  ['color.sidebar-foreground', 'color.sidebar', 4.5],
  ['color.sidebar-accent-foreground', 'color.sidebar-accent', 4.5],
  ['color.border', 'color.background', 3],
  ['color.input', 'color.background', 3],
]

const tokens = readTokens()
const pairs = readPairs()
/** The foreground as painted — a translucent role (the stock dark borders) composited over the background. */
const ratio = (pair: Pair, mode: 'light' | 'dark') => {
  const foreground = resolveRawColor(pair.foreground, mode, tokens)
  const background = oklchToLinearRgb(resolveRawColor(pair.background, mode, tokens).oklch)
  return contrastRatio(compositeOver(oklchToLinearRgb(foreground.oklch), foreground.alpha, background), background)
}

/** Ratios are written rounded down to two decimals, so a listed value never overstates. */
const written = (value: number) => (Math.floor(value * 100) / 100).toFixed(2)

describe('TOKENS.md § Contrast pairs', () => {
  it('lists every pair the spec introduces, with its requirement', () => {
    for (const [foreground, background, required] of SPEC_PAIRS) {
      const row = pairs.find((pair) => pair.foreground === foreground && pair.background === background)
      expect(row, `${foreground} on ${background} is missing from the table`).toBeDefined()
      expect(row!.required).toBe(required)
    }
  })

  it('lists no pair twice and only 4.5 or 3 as a requirement', () => {
    const keys = pairs.map((pair) => `${pair.foreground} on ${pair.background}`)
    expect(keys.filter((key, index) => keys.indexOf(key) !== index)).toEqual([])
    expect(pairs.every((pair) => pair.required === 4.5 || pair.required === 3)).toBe(true)
  })

  it('marks every row `ok` or `gap`', () => {
    expect(pairs.filter((pair) => pair.status !== 'ok' && pair.status !== 'gap')).toEqual([])
  })

  it.each(pairs.map((pair) => [`${pair.foreground} on ${pair.background}`, pair] as const))(
    '%s — listed ratios are the computed ones; `ok` meets the requirement, `gap` is a real one',
    (_name, pair) => {
      const computed = { light: ratio(pair, 'light'), dark: ratio(pair, 'dark') }
      for (const mode of ['light', 'dark'] as const)
        expect(pair[mode], `${mode}: the table is stale`).toBe(written(computed[mode]))
      const lowest = Math.min(computed.light, computed.dark)
      if (pair.status === 'ok') expect(lowest, `below ${pair.required}:1 — fix the token or record the gap`).toBeGreaterThanOrEqual(pair.required)
      else expect(lowest, 'no longer a gap — mark the row ok').toBeLessThan(pair.required)
    },
  )
})

describe('colour maths', () => {
  const white = oklchToLinearRgb([1, 0, 0])
  const black = oklchToLinearRgb([0, 0, 0])

  it('gives 21:1 for black on white and 1:1 for a colour on itself', () => {
    expect(contrastRatio(black, white)).toBeCloseTo(21, 5)
    expect(contrastRatio(white, white)).toBeCloseTo(1, 5)
  })

  it('converts a chromatic OKLCH colour (sRGB red)', () => {
    const [red, green, blue] = oklchToLinearRgb([0.627955, 0.257683, 29.2339])
    expect(red).toBeCloseTo(1, 3)
    expect(green).toBeCloseTo(0, 3)
    expect(blue).toBeCloseTo(0, 3)
  })

  it('composites in encoded sRGB: half black over white is mid grey, not half luminance', () => {
    const [channel] = compositeOver(black, 0.5, white)
    expect(channel).toBeCloseTo(0.2140, 3)
    expect(compositeOver(black, 1, white)[0]).toBeCloseTo(0, 6)
    expect(compositeOver(black, 0, white)[0]).toBeCloseTo(1, 6)
  })
})
