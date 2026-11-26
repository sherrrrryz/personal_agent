// @vitest-environment node
//
// The token source and its build (spec A-02, A-03): three tiers with nothing
// skipped, both modes complete, every colour grey, generated files current.
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

import { describe, expect, it } from 'vitest'

import { cssName, renderTokens } from '../../scripts/build-tokens.mjs'
import { aliasTarget, readTokens, REPO_ROOT } from './tokens'

const tokens = readTokens()
const primitives = tokens.filter((token) => token.tier === 'primitive')
const semantic = tokens.filter((token) => token.tier === 'semantic')
const primitiveByPath = new Map(primitives.map((token) => [token.path, token]))
const indexCss = readFileSync(join(REPO_ROOT, 'src/index.css'), 'utf8')

const isRole = (token: (typeof tokens)[number]) => token.type === 'color'
const roles = (mode: 'light' | 'dark') =>
  semantic.filter((token) => token.mode === mode && isRole(token)).map((token) => token.path)

describe('tiers', () => {
  it('has primitives and semantic tokens, and no component tier', () => {
    expect(primitives.length).toBeGreaterThan(0)
    expect(semantic.length).toBeGreaterThan(0)
    expect(new Set(tokens.map((token) => token.tier))).toEqual(new Set(['primitive', 'semantic']))
  })

  it('every primitive holds a raw value', () => {
    expect(primitives.filter((token) => aliasTarget(token.value) !== null).map((token) => token.path)).toEqual([])
  })

  it('every semantic token of every type is an alias of a primitive of the same type', () => {
    expect(new Set(semantic.map((token) => token.type))).toEqual(new Set(['color', 'string', 'dimension', 'fontFamily']))
    for (const token of semantic) {
      const target = aliasTarget(token.value)
      expect(target, `${token.path} (${token.mode}) holds a raw value`).not.toBeNull()
      const primitive = primitiveByPath.get(target!)
      expect(primitive, `${token.path} (${token.mode}) → {${target}} is not a primitive`).toBeDefined()
      expect(primitive!.type, `${token.path} (${token.mode}) and {${target}} differ in $type`).toBe(token.type)
    }
  })

  it('every token has a $type, and no path is defined twice in a mode', () => {
    expect(tokens.filter((token) => !token.type).map((token) => token.path)).toEqual([])
    const keys = tokens.map((token) => `${token.path} · ${token.mode}`)
    expect(keys.filter((key, index) => keys.indexOf(key) !== index)).toEqual([])
  })

  it('every primitive is used by a semantic token or is a breakpoint', () => {
    const used = new Set(semantic.map((token) => aliasTarget(token.value)))
    const orphans = primitives.filter((token) => !used.has(token.path) && !token.path.startsWith('breakpoint.'))
    expect(orphans.map((token) => token.path)).toEqual([])
  })
})

describe('placeholder theme', () => {
  it('the neutral ramp is the twelve lightness steps of the base values, chroma 0', () => {
    const ramp = primitives.filter((token) => token.type === 'color')
    const components = ramp.map((token) => (token.value as { components: number[] }).components)
    expect(components.map(([lightness]) => lightness).sort((a, b) => a - b)).toEqual([
      0.145, 0.205, 0.269, 0.371, 0.439, 0.556, 0.708, 0.87, 0.922, 0.97, 0.985, 1,
    ])
    expect(components.every(([, chroma]) => chroma === 0)).toBe(true)
  })

  it('every colour role has a light and a dark value', () => {
    expect(roles('light').length).toBeGreaterThan(0)
    expect(roles('dark').sort()).toEqual(roles('light').sort())
  })

  it('has every shadcn/ui role, destructive and the chart roles included', () => {
    const expected = [
      'background', 'foreground', 'card', 'card-foreground', 'popover', 'popover-foreground',
      'primary', 'primary-foreground', 'secondary', 'secondary-foreground', 'muted', 'muted-foreground',
      'accent', 'accent-foreground', 'destructive', 'border', 'input', 'ring',
      'chart-1', 'chart-2', 'chart-3', 'chart-4', 'chart-5',
      'sidebar', 'sidebar-foreground', 'sidebar-primary', 'sidebar-primary-foreground',
      'sidebar-accent', 'sidebar-accent-foreground', 'sidebar-border', 'sidebar-ring',
    ].map((role) => `color.${role}`)
    expect(roles('light').sort()).toEqual(expected.sort())
  })

  it('every colour role is a step of the neutral ramp in both modes', () => {
    for (const token of semantic.filter(isRole))
      expect(aliasTarget(token.value), `${token.path} (${token.mode})`).toMatch(/^color\.neutral\.\d+$/)
  })

  it('ring sits on the same step as foreground in both modes', () => {
    for (const mode of ['light', 'dark'] as const) {
      const step = (path: string) => semantic.find((token) => token.mode === mode && token.path === path)?.value
      expect(step('color.ring')).toBe(step('color.foreground'))
      expect(step('color.sidebar-ring')).toBe(step('color.sidebar-foreground'))
    }
  })

  it('the forced-colours focus colour is a system colour with one value and no mode', () => {
    const forced = semantic.filter((token) => token.path === 'color.focus.forced')
    expect(forced.map((token) => [token.mode, token.value])).toEqual([['light', '{color.system.highlight}']])
    expect(primitiveByPath.get('color.system.highlight')?.value).toBe('Highlight')
  })

  it('the purpose tokens alias the steps the spec names', () => {
    const alias = (path: string) => semantic.find((token) => token.path === path)?.value
    expect(alias('size.target.min')).toBe('{space.11}')
    expect(alias('border.width.focus')).toBe('{border.width.2}')
    expect(alias('radius.base')).toBe('{radius.sm}')
    expect(alias('font.family.sans')).toBe('{font.stack.system}')
  })
})

describe('build', () => {
  it('the generated files are what the build writes now (never hand-edited, never stale)', async () => {
    const rendered = await renderTokens()
    expect(Object.keys(rendered).sort()).toEqual([
      'src/tokens/generated/breakpoints.ts',
      'src/tokens/generated/tokens.css',
    ])
    for (const [file, output] of Object.entries(rendered))
      expect(readFileSync(join(REPO_ROOT, file), 'utf8'), `${file} is stale — run npm run tokens:build`).toBe(output)
  })

  it('names semantic colours as shadcn/ui does and keeps primitives apart', () => {
    expect(cssName(['color', 'muted-foreground'], 'semantic')).toBe('--muted-foreground')
    expect(cssName(['radius', 'base'], 'semantic')).toBe('--radius')
    expect(cssName(['size', 'target', 'min'], 'semantic')).toBe('--size-target-min')
    expect(cssName(['color', 'neutral', '500'], 'primitive')).toBe('--primitive-color-neutral-500')
  })
})

describe('src/index.css', () => {
  it('holds no colour, no :root block and no primitive reference', () => {
    expect(indexCss).not.toMatch(/oklch|rgb\(|hsl\(|#[0-9a-f]{3,8}\b/i)
    expect(indexCss).not.toMatch(/:root|\.dark\s*\{/)
    expect(indexCss).not.toContain('--primitive-')
  })

  it('maps every colour role to a Tailwind colour key, and nothing else', () => {
    const mapped = [...indexCss.matchAll(/--color-([\w-]+):\s*var\(--([\w-]+)\)/g)]
    expect(mapped.every(([, key, variable]) => key === variable)).toBe(true)
    expect(mapped.map(([, key]) => `color.${key}`).sort()).toEqual(roles('light').sort())
  })

  it('resets the stock palette and the shadow scale', () => {
    expect(indexCss).toMatch(/--color-\*:\s*initial/)
    expect(indexCss).toMatch(/--shadow-\*:\s*initial/)
  })
})
