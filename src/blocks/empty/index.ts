import type { BlockDefinition } from '@/blocks/types'
import { translate, type MessageKey } from '@/i18n'

import { EmptyBlock } from './EmptyBlock'

export { EmptyBlock } from './EmptyBlock'
export { emptyBlockItems } from './items'

/** `block.empty` — registry row and contract: docs/design/components/blocks.md. */
export const definition: BlockDefinition<'block.empty'> = {
  id: 'block.empty',
  Component: EmptyBlock,
  demo: (locale) => {
    const t = (key: MessageKey<'blocks'>) => translate(locale, 'blocks', key)
    return {
      title: t('demo.empty.title'),
      props: {
        title: t('demo.empty.heading'),
        body: t('demo.empty.body'),
        action: { label: t('demo.empty.action'), href: '/m/appointments' },
      },
      long: {
        title: t('demo.empty.longHeading'),
        body: t('demo.empty.longBody'),
        action: { label: t('demo.empty.longAction'), href: '/m/appointments' },
      },
      changes: { body: 'updated' },
    }
  },
}
