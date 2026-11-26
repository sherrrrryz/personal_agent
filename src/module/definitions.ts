import { translate } from '@/i18n'
import type { Module, ModuleDefinition } from '@/runtime'
import { modulePath } from '@/shell'

// The output side of every module (spec part 2 § Fake workflow runtime, "A
// module's two halves"): `src/modules/<ia-id>/module.ts` default-exports a
// `ModuleDefinition`. Found by glob, so a module's package edits no shared
// file. A module with no `module.ts` renders the stub pattern.

export type ModuleDefinitions = ReadonlyMap<string, ModuleDefinition>

const isDefinition = (value: unknown): value is ModuleDefinition =>
  typeof value === 'object' &&
  value !== null &&
  typeof (value as ModuleDefinition).id === 'string' &&
  typeof (value as ModuleDefinition).page === 'function'

/** The definitions by IA id; throws at start-up on a file without a definition or an id defined twice. */
export function collectDefinitions(files: Record<string, unknown>): ModuleDefinitions {
  const definitions = new Map<string, ModuleDefinition>()
  for (const [path, file] of Object.entries(files).sort(([a], [b]) => a.localeCompare(b))) {
    const definition = (file as { default?: unknown } | null)?.default
    if (!isDefinition(definition)) throw new Error(`${path}: a module.ts default-exports a ModuleDefinition ({ id, page })`)
    if (definitions.has(definition.id)) throw new Error(`${path}: the module "${definition.id}" is defined twice`)
    definitions.set(definition.id, definition)
  }
  return definitions
}

/** Every `src/modules/<ia-id>/module.ts`; empty until part 3 adds them. */
export const moduleDefinitions: ModuleDefinitions = collectDefinitions(
  import.meta.glob('/src/modules/*/module.ts', { eager: true }),
)

/**
 * What a module with no `module.ts` emits — a base module not built yet, and
 * every module she adds herself: one `block.empty` with the next step.
 */
export function stubDefinition(module: Module): ModuleDefinition {
  return {
    id: module.id,
    page: (_view, _preview, { locale }) => ({
      blocks: [
        {
          key: 'stub',
          block: 'block.empty',
          title: translate(locale, 'module', 'stub.section'),
          span: 'full',
          props: {
            title: translate(locale, 'module', 'stub.title'),
            body: translate(locale, 'module', 'stub.body'),
            action: { label: translate(locale, 'module', 'stub.action'), href: `${modulePath(module.id)}/workflow` },
          },
        },
      ],
    }),
  }
}

/**
 * A module's definition: by its id, then by an alias — a promoted sub-module
 * keeps the page it had under its old id. `stub: true` when it has none.
 */
export function definitionOf(
  module: Module,
  definitions: ModuleDefinitions = moduleDefinitions,
): { definition: ModuleDefinition; stub: boolean } {
  const found = definitions.get(module.id) ?? module.aliases.map((alias) => definitions.get(alias)).find(Boolean)
  return found ? { definition: found, stub: false } : { definition: stubDefinition(module), stub: true }
}
