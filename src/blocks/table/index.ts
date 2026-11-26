import type { BlockDefinition } from '../types'

import { tableDemo } from './demo'
import { TableBlock } from './TableBlock'

// `block.table` — registry and contract: docs/design/components/data-blocks.md.
export const tableBlock: BlockDefinition<'block.table'> = { id: 'block.table', Component: TableBlock, demo: tableDemo }

export default tableBlock
