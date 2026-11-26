// @vitest-environment node
//
// The built stylesheet (spec A-03, A-05). This file is itself Tailwind
// source: src/index.css scans everything under src/, so the class names
// written below are candidates. A candidate with a mapped token must produce
// a rule (that proves this file is scanned); a stock palette or shadow-scale
// candidate must produce none.
import { mkdtempSync, readdirSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { build } from 'vite'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

import { REPO_ROOT } from './tokens'

/** Candidates that must exist: each is backed by a token mapped in src/index.css. */
export const MAPPED = ['bg-background', 'text-muted-foreground', 'border-border', 'rounded-lg', 'min-h-target', 'min-w-target', 'md:hidden', 'lg:hidden']
/** Candidates that must not exist: Tailwind's stock palette and shadow scale. */
export const STOCK = ['bg-red-500', 'text-blue-600', 'border-neutral-200', 'bg-black', 'text-white', 'shadow-md', 'shadow-lg']

const escapeClass = (name: string) => name.replace(/:/g, '\\:')
const hasRule = (css: string, name: string) => css.includes(`.${escapeClass(name)} {`)

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

  it.each(STOCK)('has no rule for the stock utility %s', (name) => {
    expect(hasRule(css, name)).toBe(false)
  })

  it('holds no stock palette variable and no colour outside the token block', () => {
    expect(/--color-(red|blue|green|black|white|neutral|gray|zinc|slate|stone)\b/.test(css)).toBe(false)
    const colours = [...css.matchAll(/^.*oklch\(.*$/gm)].map(([line]) => line.trim())
    expect(colours.length).toBeGreaterThan(0)
    expect(colours.every((line) => line.startsWith('--primitive-color-neutral-'))).toBe(true)
  })

  it('binds the target size to size.target.min', () => {
    expect(/\.min-h-target \{\s*min-height: var\(--size-target-min\);/.test(css)).toBe(true)
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

  it('carries both modes of the theme', () => {
    expect(/:root \{[^}]*--background: var\(--primitive-color-neutral-0\);/.test(css)).toBe(true)
    expect(/\.dark \{[^}]*--background: var\(--primitive-color-neutral-950\);/.test(css)).toBe(true)
  })
})
