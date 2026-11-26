#!/usr/bin/env node
/**
 * Token build — `npm run tokens:build`.
 *
 * Reads the one token source (tokens/, W3C DTCG JSON) with Style Dictionary
 * and writes the generated outputs:
 *
 *   src/tokens/generated/tokens.css      :root (primitives + semantic, light),
 *                                        .dark (the roles that have a mode),
 *                                        @theme (breakpoints, as literals)
 *   src/tokens/generated/breakpoints.ts  the same breakpoints as constants
 *
 * Tiers are folders: tokens/primitive/ holds raw values, tokens/semantic/
 * holds aliases of primitives only. Modes exist on the semantic tier only:
 * `<type>.json` is the default (light) mode, `<type>.dark.json` the dark one.
 * The build fails when a tier rule is broken or a mode has a gap.
 *
 * CSS names (recorded in docs/design/TOKENS.md § One source):
 *   primitive  a.b.c           → --primitive-a-b-c
 *   semantic   color.<role>    → --<role>            (shadcn/ui's names)
 *   semantic   radius.base     → --radius            (shadcn/ui's name)
 *   semantic   anything else   → --a-b-c
 *
 * Rules: docs/design/TOKENS.md. Never edit the generated files by hand.
 */
import { realpathSync } from 'node:fs'
import { dirname, join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'

import StyleDictionary from 'style-dictionary'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const OUT_DIR = 'src/tokens/generated/'

/** Source files, in output order. No glob: the order is part of the output. */
export const SOURCES = {
  primitive: [
    'tokens/primitive/color.json',
    'tokens/primitive/dimension.json',
    'tokens/primitive/font.json',
  ],
  semantic: [
    'tokens/semantic/color.json',
    'tokens/semantic/dimension.json',
    'tokens/semantic/font.json',
  ],
  dark: ['tokens/semantic/color.dark.json'],
}

const HEADER =
  'generated — do not edit. Source: tokens/ · build: npm run tokens:build (scripts/build-tokens.mjs)'

const ALIAS = /^\{([^{}]+)\}$/
const GENERIC_FAMILIES = new Set([
  'serif',
  'sans-serif',
  'monospace',
  'cursive',
  'fantasy',
  'system-ui',
  'ui-serif',
  'ui-sans-serif',
  'ui-monospace',
  'ui-rounded',
  'emoji',
  'math',
  'fangsong',
])

const sourcePath = (token) => relative(ROOT, token.filePath).split('\\').join('/')
const tierOf = (token) => (sourcePath(token).startsWith('tokens/primitive/') ? 'primitive' : 'semantic')
const pathKey = (token) => token.path.join('.')
const aliasTarget = (token) => {
  const value = token.original.$value
  const match = typeof value === 'string' ? ALIAS.exec(value) : null
  return match ? match[1] : null
}

/** The CSS custom-property name of a token. */
export function cssName(path, tier) {
  if (tier === 'primitive') return `--primitive-${path.join('-')}`
  if (path[0] === 'color') return `--${path.slice(1).join('-')}`
  if (path.join('.') === 'radius.base') return '--radius'
  return `--${path.join('-')}`
}

/** A raw (primitive) value as CSS text. */
function rawCss(token) {
  const value = token.original.$value
  switch (token.$type) {
    case 'color': {
      if (value?.colorSpace !== 'oklch' || !Array.isArray(value.components))
        throw new Error(`${pathKey(token)}: a colour is { colorSpace: "oklch", components: [l, c, h] }`)
      const alpha = value.alpha === undefined || value.alpha === 1 ? '' : ` / ${value.alpha}`
      return `oklch(${value.components.join(' ')}${alpha})`
    }
    case 'dimension': {
      if (typeof value?.value !== 'number' || !['px', 'rem'].includes(value.unit))
        throw new Error(`${pathKey(token)}: a dimension is { value, unit: "px" | "rem" }`)
      return `${value.value}${value.unit}`
    }
    case 'fontFamily':
      return [value]
        .flat()
        .map((family) => (GENERIC_FAMILIES.has(family) ? family : JSON.stringify(family)))
        .join(', ')
    case 'string':
    case 'number':
      return String(value)
    default:
      throw new Error(`${pathKey(token)}: no CSS output is defined for $type "${token.$type}"`)
  }
}

/** A semantic value as CSS text: a var() of the primitive, scaled if the token says so. */
function aliasCss(token, primitives) {
  const target = primitives.get(aliasTarget(token))
  const reference = `var(${cssName(target.path, 'primitive')})`
  const scale = token.$extensions?.['pa.scale']
  if (scale === undefined || scale === 1) return reference
  if (typeof scale !== 'number')
    throw new Error(`${pathKey(token)}: $extensions["pa.scale"] must be a number`)
  return `calc(${reference} * ${scale})`
}

/** Tier and mode rules. Throws on the first set of problems found. */
function validate(tokens, darkTokens) {
  const problems = []
  const primitives = new Map()
  for (const token of tokens) if (tierOf(token) === 'primitive') primitives.set(pathKey(token), token)

  for (const token of primitives.values())
    if (aliasTarget(token)) problems.push(`${pathKey(token)}: a primitive holds a raw value, not an alias`)

  const checkSemantic = (token, mode) => {
    const target = aliasTarget(token)
    const label = `${pathKey(token)}${mode}`
    if (!target) problems.push(`${label}: a semantic token holds an alias, never a raw value`)
    else if (!primitives.has(target)) problems.push(`${label}: {${target}} is not a primitive`)
    else if (primitives.get(target).$type !== token.$type)
      problems.push(`${label}: $type "${token.$type}" differs from {${target}} ("${primitives.get(target).$type}")`)
  }
  const semantic = tokens.filter((token) => tierOf(token) === 'semantic')
  for (const token of semantic) checkSemantic(token, '')
  for (const token of darkTokens) checkSemantic(token, ' (dark)')

  // Every colour role has a value in every mode. System colours have no mode.
  const moded = (token) => token.$type === 'color'
  const light = new Set(semantic.filter(moded).map(pathKey))
  const dark = new Set(darkTokens.map(pathKey))
  for (const key of light) if (!dark.has(key)) problems.push(`${key}: no dark value`)
  for (const key of dark) if (!light.has(key)) problems.push(`${key}: a dark value without a light one`)

  if (problems.length > 0)
    throw new Error(`tokens:build — ${problems.length} problem(s) in the token source:\n  ${problems.join('\n  ')}`)
  return { primitives, semantic }
}

const declarations = (lines) => lines.map(([name, value]) => `  ${name}: ${value};`).join('\n')

function formatCss({ dictionary, options }) {
  const { primitives, semantic } = validate(dictionary.allTokens, options.darkTokens)
  const breakpoints = [...primitives.values()].filter((token) => token.path[0] === 'breakpoint')
  const emitted = [...primitives.values()].filter((token) => token.path[0] !== 'breakpoint')

  return [
    `/* ${HEADER} */`,
    '',
    ':root {',
    '  /* primitive — never referenced outside this file */',
    declarations(emitted.map((token) => [cssName(token.path, 'primitive'), rawCss(token)])),
    '',
    '  /* semantic — light (default) */',
    declarations(semantic.map((token) => [cssName(token.path, 'semantic'), aliasCss(token, primitives)])),
    '}',
    '',
    '.dark {',
    declarations(options.darkTokens.map((token) => [cssName(token.path, 'semantic'), aliasCss(token, primitives)])),
    '}',
    '',
    '/* Breakpoints are literals: a media or container query cannot read a custom property. */',
    '@theme {',
    declarations(breakpoints.map((token) => [`--${token.path.join('-')}`, rawCss(token)])),
    '}',
    '',
  ].join('\n')
}

function formatBreakpoints({ dictionary }) {
  const breakpoints = dictionary.allTokens.filter(
    (token) => tierOf(token) === 'primitive' && token.path[0] === 'breakpoint',
  )
  return [
    `// ${HEADER}`,
    '',
    '/** The breakpoint tokens, as CSS lengths for media and container queries. */',
    'export const breakpoints = {',
    ...breakpoints.map((token) => `  ${token.path[1]}: '${rawCss(token)}',`),
    '} as const',
    '',
    'export type Breakpoint = keyof typeof breakpoints',
    '',
  ].join('\n')
}

const absolute = (files) => files.map((file) => join(ROOT, file))
const LOG = { verbosity: 'silent', warnings: 'error' }
/** Style Dictionary's own collision check runs on these names, so two tokens can never share one. */
const TRANSFORMS = {
  'pa/name': { type: 'name', transform: (token) => cssName(token.path, tierOf(token)) },
}

/** The dark values, resolved by their own Style Dictionary run over the primitives. */
async function loadDarkTokens() {
  const sd = new StyleDictionary({
    usesDtcg: true,
    log: LOG,
    include: absolute(SOURCES.primitive),
    source: absolute(SOURCES.dark),
    hooks: { transforms: TRANSFORMS },
    platforms: { web: { transforms: ['pa/name'] } },
  })
  const { allTokens } = await sd.getPlatformTokens('web')
  return allTokens.filter((token) => token.isSource)
}

async function createBuild() {
  const darkTokens = await loadDarkTokens()
  return new StyleDictionary({
    usesDtcg: true,
    log: LOG,
    source: absolute([...SOURCES.primitive, ...SOURCES.semantic]),
    hooks: {
      transforms: TRANSFORMS,
      formats: { 'pa/css': formatCss, 'pa/breakpoints-ts': formatBreakpoints },
    },
    platforms: {
      web: {
        transforms: ['pa/name'],
        buildPath: join(ROOT, OUT_DIR) + '/',
        files: [
          { destination: 'tokens.css', format: 'pa/css', options: { darkTokens } },
          { destination: 'breakpoints.ts', format: 'pa/breakpoints-ts' },
        ],
      },
    },
  })
}

/** The generated files as text, keyed by repo-relative path. Writes nothing. */
export async function renderTokens() {
  const sd = await createBuild()
  const files = await sd.formatPlatform('web')
  return Object.fromEntries(
    files.map(({ destination, output }) => [relative(ROOT, destination).split('\\').join('/'), String(output)]),
  )
}

/** Writes the generated files. */
export async function buildTokens() {
  const sd = await createBuild()
  await sd.buildAllPlatforms()
  return Object.keys(await renderTokens())
}

if (process.argv[1] && realpathSync(fileURLToPath(import.meta.url)) === realpathSync(process.argv[1])) {
  try {
    for (const file of await buildTokens()) console.log(`tokens:build — wrote ${file}`)
  } catch (error) {
    console.error(error instanceof Error ? error.message : error)
    process.exit(1)
  }
}
