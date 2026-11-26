import type { BlockDefinition } from '../types'

import { listDemo } from './demo'
import { ListBlock } from './ListBlock'

// `block.list` — registry and contract: docs/design/components/data-blocks.md.
export const listBlock: BlockDefinition<'block.list'> = { id: 'block.list', Component: ListBlock, demo: listDemo }

export default listBlock
