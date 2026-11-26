import { blockIds, type BlockDefinition, type BlockId } from '@/blocks/types'

// The block registry (D-12): a workflow may emit only registered blocks, and
// a block registers by existing. Every `src/blocks/<name>/index.ts` is read
// by glob and every export of it that has the shape of a `BlockDefinition`
// (`src/blocks/types.ts`) is taken, whatever the export is called — so the
// packages that build blocks in parallel edit no shared file and need agree
// on no name. Nobody edits a central list.

/** A definition of any of the seven blocks. */
export type AnyBlockDefinition = { [Id in BlockId]: BlockDefinition<Id> }[BlockId]

/** The registered blocks by id. An id that is not a key has no block: the renderer refuses it. */
export type BlockRegistry = ReadonlyMap<string, AnyBlockDefinition>

const files = import.meta.glob<Record<string, unknown>>('/src/blocks/*/index.ts', { eager: true })

const folderOf = /\/blocks\/([^/]+)\/index\.ts$/

function isComponent(value: unknown): boolean {
  // A function component, or what `memo` / `forwardRef` / `lazy` return.
  return typeof value === 'function' || (typeof value === 'object' && value !== null && '$$typeof' in value)
}

/** True for an object `{ id: 'block.<name>', Component, demo }`. */
export function isBlockDefinition(value: unknown): value is AnyBlockDefinition {
  if (typeof value !== 'object' || value === null) return false
  const { id, Component, demo } = value as Record<string, unknown>
  return typeof id === 'string' && (blockIds as readonly string[]).includes(id) && isComponent(Component) && typeof demo === 'function'
}

/**
 * The registry of a set of `index.ts` modules (path → its exports). Throws on
 * what would make a page ambiguous: two definitions of one id, a definition
 * in a folder of another name, a block folder that defines nothing.
 */
export function collectBlocks(found: Record<string, Record<string, unknown>> = files): BlockRegistry {
  const registry = new Map<string, AnyBlockDefinition>()
  for (const [path, exports] of Object.entries(found)) {
    const folder = folderOf.exec(path)?.[1]
    const definitions = Object.values(exports).filter(isBlockDefinition)
    if (definitions.length === 0) {
      throw new Error(`${path}: a block's index.ts exports a BlockDefinition ({ id, Component, demo } — src/blocks/types.ts)`)
    }
    for (const definition of new Set(definitions)) {
      if (definition.id !== `block.${folder}`) {
        throw new Error(`${path}: defines \`${definition.id}\` — the folder of a block is its name (src/blocks/${definition.id.slice('block.'.length)}/)`)
      }
      if (registry.has(definition.id)) throw new Error(`${path}: \`${definition.id}\` is already registered`)
      registry.set(definition.id, definition)
    }
  }
  return registry
}

/** Every block under `src/blocks/`. */
export const blockRegistry = collectBlocks()
