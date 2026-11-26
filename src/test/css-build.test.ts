// @vitest-environment node
//
// The built stylesheet (spec A-03, A-05). This file is itself Tailwind
// source: src/index.css scans everything under src/, so the class names
// written below are candidates. A candidate with a mapped token must produce
// a rule (that proves this file is scanned), and so must a candidate of
// Tailwind's stock palette and shadow scale: shadcn/ui's stock styling uses
// them, and the reset that removed them is withdrawn (D-43).
import { mkdtempSync, readdirSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { build } from 'vite'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { REPO_ROOT } from './tokens'

/** Candidates that must exist: each is backed by a token mapped in src/index.css. */
export const MAPPED = ['bg-background', 'text-muted-foreground', 'border-border', 'rounded-lg', 'md:hidden', 'lg:hidden']
/** Candidates of Tailwind's stock palette, opacity modifiers and shadow scale: the kit's scrims and shadows are drawn. */
export const STOCK = ['bg-black/10', 'text-white', 'shadow-xs', 'shadow-md', 'shadow-lg', 'ring-foreground/10']

const escapeClass = (name: string) => name.replace(/[:/]/g, '\\$&')
const hasRule = (css: string, name: string) => css.includes(`.${escapeClass(name)} {`)
/** The declarations of the first rule for a class. */
const ruleOf = (css: string, name: string) => {
  const start = css.indexOf(`.${escapeClass(name)} {`)
  return start < 0 ? '' : css.slice(start, css.indexOf('\n}', start))
}

let outDir = ''
let css = ''

beforeAll(async () => {
  outDir = mkdtempSync(join(tmpdir(), 'pa-css-build-'))
  await build({
    root: REPO_ROOT,
    logLevel: 'silent',
    build: { outDir, emptyOutDir: true, minify: false, cssMinify: false },
  })
  const assets = join(outDir, 'assets')
  css = readdirSync(assets)
    .filter((file) => file.endsWith('.css'))
    .map((file) => readFileSync(join(assets, file), 'utf8'))
    .join('\n')
}, 120_000)

afterAll(() => {
  if (outDir) rmSync(outDir, { recursive: true, force: true })
})

describe('built CSS', () => {
  it.each(MAPPED)('has a rule for the token-backed utility %s', (name) => {
    expect(hasRule(css, name)).toBe(true)
  })

  it.each(STOCK)('has a rule for the stock utility %s', (name) => {
    expect(hasRule(css, name)).toBe(true)
  })

  it('draws the scrim and the shadows: the stock utilities resolve to values', () => {
    expect(ruleOf(css, 'bg-black/10')).toMatch(/background-color:/)
    expect(ruleOf(css, 'shadow-md')).toMatch(/box-shadow:/)
    expect(css).toMatch(/--color-black: #000/)
  })

  it('loads the stock typeface and keeps the system CJK fonts behind it', () => {
    expect(css).toMatch(/@font-face \{[^}]*font-family: ["']?Geist Variable["']?;/)
    expect(css.includes('--primitive-font-stack-sans: "Geist Variable", "PingFang SC", "Microsoft YaHei", "Noto Sans CJK SC", sans-serif;')).toBe(true)
  })

  it('takes the md and lg breakpoints from the token source', () => {
    // The variant's rule sits inside the nearest preceding media query.
    const queryOf = (name: string) => {
      const rule = css.indexOf(`.${escapeClass(name)} {`)
      const query = css.lastIndexOf('@media (', rule)
      return css.slice(query, css.indexOf('{', query)).trim()
    }
    expect(queryOf('md:hidden')).toMatch(/^@media \((min-width: |width >= )48rem\)$/)
    expect(queryOf('lg:hidden')).toMatch(/^@media \((min-width: |width >= )64rem\)$/)
  })

  it('contains the reduced-motion rule: every animation and transition has zero duration', () => {
    const rule = /@media \(prefers-reduced-motion: reduce\) \{\s*\*, :{1,2}before, :{1,2}after \{([^}]*)\}/.exec(css)?.[1]
    expect(rule).toBeDefined()
    expect(rule).toMatch(/animation-duration: 0s !important;/)
    expect(rule).toMatch(/transition-duration: 0s !important;/)
  })

  it('contains the forced-colors focus rule, drawn from the two focus tokens', () => {
    const rule =
      /@media \(forced-colors: active\) \{\s*:focus-visible \{\s*outline: var\(--border-width-focus\) solid var\(--focus-forced\);/
    expect(rule.test(css)).toBe(true)
    expect(css.includes('--focus-forced: var(--primitive-color-system-highlight);')).toBe(true)
    expect(css.includes('--primitive-color-system-highlight: Highlight;')).toBe(true)
  })

  it('carries both modes of the theme, with the stock hues', () => {
    expect(/:root \{[^}]*--background: var\(--primitive-color-neutral-0\);/.test(css)).toBe(true)
    expect(/\.dark \{[^}]*--background: var\(--primitive-color-neutral-950\);/.test(css)).toBe(true)
    expect(/:root \{[^}]*--destructive: var\(--primitive-color-red-600\);/.test(css)).toBe(true)
    expect(/\.dark \{[^}]*--border: var\(--primitive-color-white-alpha-10\);/.test(css)).toBe(true)
  })
})
