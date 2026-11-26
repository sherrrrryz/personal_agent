// The component families, in the order of the registry index
// (docs/design/COMPONENTS.md). A demo file belongs to the family its folder
// says: `src/components/<family>/Name.demo.tsx`, and for the registered
// components that live elsewhere, the family whose file holds their row.
export const families = [
  'layout',
  'actions',
  'inputs',
  'navigation',
  'containers',
  'feedback',
  'data-display',
  'chat',
  'blocks',
  'data-blocks',
  'module',
  'workflow',
] as const

export type Family = (typeof families)[number]

export function isFamily(value: unknown): value is Family {
  return families.includes(value as Family)
}

/** Blocks registered in `components/data-blocks.md`; every other block is in `blocks.md`. */
const dataBlocks = ['summary', 'list', 'table', 'schedule']

/** The family of a demo file, from its path under `src/`; `null` when it has none. */
export function familyOfDemo(path: string): Family | null {
  const component = /\/src\/components\/([a-z-]+)\//.exec(path)
  if (component) return isFamily(component[1]) ? component[1] : null
  const block = /\/src\/blocks\/([a-z-]+)\//.exec(path)
  if (block) return dataBlocks.includes(block[1]) ? 'data-blocks' : 'blocks'
  if (path.includes('/src/block-renderer/')) return 'blocks'
  if (path.includes('/src/module/')) return 'module'
  return null
}

/** `Stack` for `…/Stack.demo.tsx`. */
export function nameOfDemo(path: string): string {
  return /\/([^/]+)\.demo\.tsx$/.exec(path)?.[1] ?? path
}
