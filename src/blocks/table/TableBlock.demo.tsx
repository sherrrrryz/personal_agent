import { translate } from '@/i18n'

import { BlockDemoView } from '../list/demo-view'
import type { BlockDefinition } from '../types'

import { tableBlock } from './index'

// The renderer's demo page (family `blocks`) draws this block's usual content
// as well. A table's scroller is a `region` named by its caption, so on the
// whole gallery one caption twice would be two landmarks with one name (axe
// `landmark-unique`): the family demo captions its own table.
const alone: BlockDefinition<'block.table'> = {
  ...tableBlock,
  demo: (locale) => {
    const demo = tableBlock.demo(locale)
    return { ...demo, props: { ...demo.props, caption: translate(locale, 'data-blocks', 'table.demo.alone.caption') } }
  },
}

export default function TableBlockDemo() {
  return <BlockDemoView definition={alone} />
}
