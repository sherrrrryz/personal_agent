import type { BlockDefinition } from '@/blocks/types'
import { translate, type MessageKey } from '@/i18n'

import { TextBlock } from './TextBlock'

export { textBlockItems } from './items'
export { TextBlock } from './TextBlock'

/** `block.text` — registry row and contract: docs/design/components/blocks.md. */
export const definition: BlockDefinition<'block.text'> = {
  id: 'block.text',
  Component: TextBlock,
  demo: (locale) => {
    const t = (key: MessageKey<'blocks'>) => translate(locale, 'blocks', key)
    const links = [
      { label: t('demo.text.link1'), href: '/m/duration' },
      { label: t('demo.text.link2'), href: '/m/clients/pets/doudou' },
    ]
    return {
      title: t('demo.text.title'),
      props: { body: t('demo.text.body'), links },
      long: {
        body: t('demo.text.longBody'),
        links: [
          ...links,
          { label: t('demo.text.longLink3'), href: '/m/appointments' },
          { label: t('demo.text.longLink4'), href: '/m/duration/workflow' },
          { label: t('demo.text.longLink5'), href: '/m/duration/memory' },
        ],
      },
      changes: { body: 'updated', '/m/duration': 'new' },
    }
  },
}
