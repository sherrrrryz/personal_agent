import type { Messages } from '../types'

// Namespace `dev` — the component gallery (`/dev/components`) and the sample
// text of the layout demos. Not part of the product; outside the IA map.
const messages = {
  'gallery.title': 'Component gallery',
  'gallery.intro': 'Every registered component, shown by its demo. Not part of the product.',
  'gallery.families': 'Component families',
  'gallery.all': 'All',
  'gallery.empty': 'No demo in this family yet.',
  'gallery.count': { one: '{count} demo', other: '{count} demos' },

  'family.layout': 'Layout',
  'family.actions': 'Actions',
  'family.inputs': 'Inputs',
  'family.navigation': 'Navigation',
  'family.containers': 'Containers',
  'family.feedback': 'Feedback',
  'family.data-display': 'Data display',
  'family.chat': 'Chat',
  'family.blocks': 'Blocks',
  'family.data-blocks': 'Data blocks',
  'family.module': 'Module frame',
  'family.workflow': 'Workflow',

  'sample.item': 'Item {n}',
  'sample.short': 'Short',
  'sample.long':
    'A longer piece of text that has to wrap onto several lines at narrow widths and large text sizes without being cut off.',
  'sample.longTitle': 'A section title long enough to wrap beside its actions',
  'sample.action': 'Action',

  'layout.page.prose': 'Reading width',
  'layout.page.wide': 'Wide',
  'layout.page.full': 'Full width',
  'layout.stack.gaps': 'Gap steps',
  'layout.inline.wrap': 'Wraps when it runs out of room',
  'layout.inline.between': 'Pushed to both ends',
  'layout.grid.columns': 'Columns follow the width of the grid itself',
  'layout.grid.span': 'An item that spans the whole row',
  'layout.section.level': 'A section with a level {level} heading',
} satisfies Messages

export default messages

declare module '@/i18n/types' {
  interface MessageNamespaces {
    dev: typeof messages
  }
}
