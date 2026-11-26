// Reads the token source (tokens/, DTCG JSON) for tests: the flat token list
// with tier and mode, and the resolved colour of a role in a mode.
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

import { SOURCES } from '../../scripts/build-tokens.mjs'
import type { Oklch } from './color'

export const REPO_ROOT = join(import.meta.dirname, '..', '..')

export type Mode = 'light' | 'dark'
export type Tier = 'primitive' | 'semantic'

export interface SourceToken {
  /** Dot-separated path, e.g. `color.muted-foreground`. */
  path: string
  tier: Tier
  /** The mode the file belongs to; primitives and unmoded tokens are `light`. */
  mode: Mode
  type: string | undefined
  value: unknown
  extensions: Record<string, unknown> | undefined
  file: string
}

interface Group {
  [key: string]: unknown
}

function flatten(group: Group, trail: string[], inherited: string | undefined, out: Omit<SourceToken, 'tier' | 'mode' | 'file'>[]) {
  const type = (group.$type as string | undefined) ?? inherited
  if ('$value' in group) {
    out.push({
      path: trail.join('.'),
      type,
      value: group.$value,
      extensions: group.$extensions as Record<string, unknown> | undefined,
    })
    return out
  }
  for (const [key, child] of Object.entries(group))
    if (!key.startsWith('$')) flatten(child as Group, [...trail, key], type, out)
  return out
}

function load(files: readonly string[], tier: Tier, mode: Mode): SourceToken[] {
  return files.flatMap((file) =>
    flatten(JSON.parse(readFileSync(join(REPO_ROOT, file), 'utf8')) as Group, [], undefined, []).map((token) => ({
      ...token,
      tier,
      mode,
      file,
    })),
  )
}

/** Every token of the source: primitives, semantic (light) and semantic (dark). */
export function readTokens(): SourceToken[] {
  return [
    ...load(SOURCES.primitive, 'primitive', 'light'),
    ...load(SOURCES.semantic, 'semantic', 'light'),
    ...load(SOURCES.dark, 'semantic', 'dark'),
  ]
}

const ALIAS = /^\{([^{}]+)\}$/

/** The path an alias value points at, or `null` for a raw value. */
export function aliasTarget(value: unknown): string | null {
  return typeof value === 'string' ? (ALIAS.exec(value)?.[1] ?? null) : null
}

/** The OKLCH value of a semantic colour (`color.<role>`) in a mode. */
export function resolveColor(path: string, mode: Mode, tokens: SourceToken[] = readTokens()): Oklch {
  const token = tokens.find((candidate) => candidate.tier === 'semantic' && candidate.mode === mode && candidate.path === path)
  if (!token) throw new Error(`No semantic token ${path} in ${mode} mode`)
  const target = aliasTarget(token.value)
  const primitive = tokens.find((candidate) => candidate.tier === 'primitive' && candidate.path === target)
  const value = primitive?.value as { colorSpace?: string; components?: number[] } | undefined
  if (value?.colorSpace !== 'oklch' || value.components?.length !== 3)
    throw new Error(`${path} (${mode}) does not resolve to an OKLCH primitive`)
  return [value.components[0], value.components[1], value.components[2]]
}
