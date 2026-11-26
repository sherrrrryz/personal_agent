import type { BlockDefinition } from '../types'

import { summaryDemo } from './demo'
import { SummaryBlock } from './SummaryBlock'

// `block.summary` — registry and contract: docs/design/components/data-blocks.md.
export const summaryBlock: BlockDefinition<'block.summary'> = {
  id: 'block.summary',
  Component: SummaryBlock,
  demo: summaryDemo,
}

export default summaryBlock
