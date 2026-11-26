import type { BlockDefinition } from '../types'

import { scheduleDemo } from './demo'
import { ScheduleBlock } from './ScheduleBlock'

// `block.schedule` — registry and contract: docs/design/components/data-blocks.md.
export const scheduleBlock: BlockDefinition<'block.schedule'> = {
  id: 'block.schedule',
  Component: ScheduleBlock,
  demo: scheduleDemo,
}

export default scheduleBlock
