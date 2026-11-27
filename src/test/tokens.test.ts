// @vitest-environment node
//
// The token source and its build (spec A-02, A-03): three tiers with nothing
// skipped, both modes complete, the colour roles at shadcn/ui's stock values
// (D-43), generated files current.
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

import { describe, expect, it } from 'vitest'

import { cssName, renderTokens } from '../../scripts/build-tokens.mjs'
import { aliasTarget, readTokens, REPO_ROOT, resolveRawColor } from './tokens'

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
    expect(new Set(semantic.map((token) => token.type))).toEqual(new Set(['color', 'string', 'dimension', 'fontFamily', 'duration']))
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

/**
 * shadcn/ui's stock `neutral` theme (style `base-nova`, CLI 4.23.1 — D-05), as
 * `shadcn init` writes it: `[lightness, chroma, hue, opacity?]` per role.
 */
type Stock = [number, number, number, number?]
const white: Stock = [1, 0, 0]
const n50: Stock = [0.985, 0, 0]
const n100: Stock = [0.97, 0, 0]
const n200: Stock = [0.922, 0, 0]
const n300: Stock = [0.87, 0, 0]
const n400: Stock = [0.708, 0, 0]
const n500: Stock = [0.556, 0, 0]
const n600: Stock = [0.439, 0, 0]
const n700: Stock = [0.371, 0, 0]
const n800: Stock = [0.269, 0, 0]
const n900: Stock = [0.205, 0, 0]
const n950: Stock = [0.145, 0, 0]
const STOCK: Record<string, { light: Stock; dark: Stock }> = {
  background: { light: white, dark: n950 },
  foreground: { light: n950, dark: n50 },
  card: { light: white, dark: n900 },
  'card-foreground': { light: n950, dark: n50 },
  popover: { light: white, dark: n900 },
  'popover-foreground': { light: n950, dark: n50 },
  primary: { light: n900, dark: n200 },
  'primary-foreground': { light: n50, dark: n900 },
  secondary: { light: n100, dark: n800 },
  'secondary-foreground': { light: n900, dark: n50 },
  muted: { light: n100, dark: n800 },
  'muted-foreground': { light: n500, dark: n400 },
  accent: { light: n100, dark: n800 },
  'accent-foreground': { light: n900, dark: n50 },
  destructive: { light: [0.577, 0.245, 27.325], dark: [0.704, 0.191, 22.216] },
  border: { light: n200, dark: [1, 0, 0, 0.1] },
  input: { light: n200, dark: [1, 0, 0, 0.15] },
  ring: { light: n400, dark: n500 },
  'chart-1': { light: n300, dark: n300 },
  'chart-2': { light: n500, dark: n500 },
  'chart-3': { light: n600, dark: n600 },
  'chart-4': { light: n700, dark: n700 },
  'chart-5': { light: n800, dark: n800 },
  sidebar: { light: n50, dark: n900 },
  'sidebar-foreground': { light: n950, dark: n50 },
  'sidebar-primary': { light: n900, dark: [0.488, 0.243, 264.376] },
  'sidebar-primary-foreground': { light: n50, dark: n50 },
  'sidebar-accent': { light: n100, dark: n800 },
  'sidebar-accent-foreground': { light: n900, dark: n50 },
  'sidebar-border': { light: n200, dark: [1, 0, 0, 0.1] },
  'sidebar-ring': { light: n400, dark: n500 },
}

/** Colour roles of ours beside shadcn/ui's: the frosted surface and its small shadow (D-47). */
const FROSTED = ['surface-frosted', 'surface-frosted-shadow']

/** The roles `docs/design/TOKENS.md` § Changed from stock lists: the owner's colour changes (D-43). */
function changedRoles(): Set<string> {
  const doc = readFileSync(join(REPO_ROOT, 'docs/design/TOKENS.md'), 'utf8')
  const section = doc.slice(doc.indexOf('\n## Changed from stock')).split('\n## ')[1] ?? ''
  return new Set([...section.matchAll(/^\| `color\.([\w-]+)` \|/gm)].map(([, role]) => role))
}

describe('stock theme (D-43)', () => {
  it('every colour role has a light and a dark value', () => {
    expect(roles('light').length).toBeGreaterThan(0)
    expect(roles('dark').sort()).toEqual(roles('light').sort())
  })

  it('has every shadcn/ui role, and beside them only the two colours of the frosted surface (D-47)', () => {
    expect(roles('light').sort()).toEqual([...Object.keys(STOCK), ...FROSTED].map((role) => `color.${role}`).sort())
  })

  it('the frosted surface (D-47) has a colour and a shadow colour in both modes, a blur and a shadow blur', () => {
    for (const role of FROSTED)
      for (const mode of ['light', 'dark'] as const)
        expect(resolveRawColor(`color.${role}`, mode, tokens).alpha, `color.${role} (${mode}) is translucent`).toBeLessThan(1)
    const alias = (path: string) => semantic.find((token) => token.path === path)?.value
    expect(alias('surface.frosted.blur')).toBe('{blur.md}')
    expect(alias('surface.frosted.shadow.blur')).toBe('{blur.sm}')
    // One place for the look: the class in src/index.css reads all four, and nothing else in src/ does.
    for (const name of ['--surface-frosted)', '--surface-frosted-shadow)', '--surface-frosted-blur)', '--surface-frosted-shadow-blur)'])
      expect(indexCss.slice(indexCss.indexOf('.surface-frosted {')), name).toContain(`var(${name}`)
  })

  it('every colour role holds its stock value in both modes, unless TOKENS.md § Changed from stock lists it', () => {
    const changed = changedRoles()
    const differing = new Set<string>()
    for (const [role, stock] of Object.entries(STOCK))
      for (const mode of ['light', 'dark'] as const) {
        const { oklch, alpha } = resolveRawColor(`color.${role}`, mode, tokens)
        const [lightness, chroma, hue, opacity = 1] = stock[mode]
        if (oklch[0] !== lightness || oklch[1] !== chroma || oklch[2] !== hue || alpha !== opacity) differing.add(role)
      }
    // A changed colour is recorded where the owner reads it; a row for an unchanged role is stale.
    expect([...differing].sort(), 'list a changed role in TOKENS.md § Changed from stock, and remove stale rows').toEqual(
      [...changed].sort(),
    )
  })

  it('the base radius is the stock 0.625rem', () => {
    expect(primitiveByPath.get('radius.lg')?.value).toEqual({ value: 0.625, unit: 'rem' })
  })

  it('the font stack is the stock typeface followed by the system CJK fonts (D-25)', () => {
    expect(primitiveByPath.get('font.stack.sans')?.value).toEqual([
      'Geist Variable',
      'PingFang SC',
      'Microsoft YaHei',
      'Noto Sans CJK SC',
      'sans-serif',
    ])
    expect(indexCss).toContain('@import "@fontsource-variable/geist";')
  })

  it('the forced-colours focus colour is a system colour with one value and no mode', () => {
    const forced = semantic.filter((token) => token.path === 'color.focus.forced')
    expect(forced.map((token) => [token.mode, token.value])).toEqual([['light', '{color.system.highlight}']])
    expect(primitiveByPath.get('color.system.highlight')?.value).toBe('Highlight')
  })

  it('the purpose tokens alias their steps', () => {
    const alias = (path: string) => semantic.find((token) => token.path === path)?.value
    expect(alias('border.width.focus')).toBe('{border.width.2}')
    expect(alias('radius.base')).toBe('{radius.lg}')
    expect(alias('font.family.sans')).toBe('{font.stack.sans}')
  })
})

describe('build', () => {
  it('the generated files are what the build writes now (never hand-edited, never stale)', async () => {
    const rendered = await renderTokens()
    expect(Object.keys(rendered).sort()).toEqual([
      'src/tokens/generated/breakpoints.ts',
      'src/tokens/generated/motion.ts',
      'src/tokens/generated/tokens.css',
    ])
    for (const [file, output] of Object.entries(rendered))
      expect(readFileSync(join(REPO_ROOT, file), 'utf8'), `${file} is stale — run npm run tokens:build`).toBe(output)
  })

  it('names semantic colours as shadcn/ui does and keeps primitives apart', () => {
    expect(cssName(['color', 'muted-foreground'], 'semantic')).toBe('--muted-foreground')
    expect(cssName(['radius', 'base'], 'semantic')).toBe('--radius')
    expect(cssName(['border', 'width', 'focus'], 'semantic')).toBe('--border-width-focus')
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

  it('leaves Tailwind\'s stock palette and shadow scale in place (D-43)', () => {
    expect(indexCss).not.toMatch(/--color-\*:\s*initial/)
    expect(indexCss).not.toMatch(/--(inset-|drop-)?shadow-\*:\s*initial/)
  })
})
