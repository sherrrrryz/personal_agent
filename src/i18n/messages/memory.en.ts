import type { Messages } from '../types'

// Namespace `memory` — the memory view of a module (`src/screens/memory/`).
const messages = {
  title: 'Memory',
  'tabs.label': 'Memory tables',

  'cell.none': 'No data yet',
  'flag.yes': 'Yes',
  'flag.no': 'No',
  'table.empty': 'No records yet',

  'breeds.basis.seed': 'Your rule of thumb',
  'breeds.basis.average': { one: 'Average of {count} dog', other: 'Average of {count} dogs' },
  'breeds.observed': { one: 'About {average} ({count} dog, {min} – {max})', other: 'About {average} ({count} dogs, {min} – {max})' },
  'dogs.applied': '{duration} ({basis})',

  'readers.title': 'Who reads this memory',
  'readers.shared': 'Memory is shared across your whole workspace: any module can read what another one has learned. There is nothing to switch on or off here.',
  'readers.none': 'No other module reads this memory yet.',
  'readers.reads': 'Reads: {tables}',
  'readers.separator': ', ',

  'empty.title': 'This module has not remembered anything yet',
  'empty.body': 'What its workflow learns will appear here as tables.',

  loading: 'Loading the memory…',
  'error.title': 'The memory could not be loaded',
  'error.body': 'The memory tables did not arrive. Nothing was changed, the links above still work, and you can try again.',
} satisfies Messages

export default messages

declare module '@/i18n/types' {
  interface MessageNamespaces {
    memory: typeof messages
  }
}
