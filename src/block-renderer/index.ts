// The block renderer (D-12) — registry and contract: docs/design/components/blocks.md.
export { arrangeBlocks, countPageChanges, pairSpans } from './arrange'
export type { Pins } from './arrange'
export { BlockRenderer } from './BlockRenderer'
export type { BlockRendererProps } from './BlockRenderer'
export { blockRegistry, collectBlocks, isBlockDefinition } from './registry'
export type { AnyBlockDefinition, BlockRegistry } from './registry'
export { useModulePins } from './use-module-pins'
