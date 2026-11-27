import type { Messages } from '../types'

// Namespace `memory` — the memory view of a module (`src/screens/memory/`).
const messages = {
  title: 'Records',
  'tabs.label': 'Record tables',

  'cell.none': 'No data yet',
  'flag.yes': 'Yes',
  'flag.no': 'No',
  'table.empty': 'No records yet',

  'breeds.basis.seed': 'Your rule of thumb',
  'breeds.basis.average': { one: 'Average of {count} dog', other: 'Average of {count} dogs' },
  'breeds.observed': { one: 'About {average} ({count} dog, {min} – {max})', other: 'About {average} ({count} dogs, {min} – {max})' },
  'dogs.applied': '{duration} ({basis})',

  'readers.title': 'Who reads these records',
  'readers.shared': 'Records are shared across your whole workspace: any feature can read what another one has learned. There is nothing to switch on or off here.',
  'readers.none': 'No other feature reads these records yet.',
  'readers.reads': 'Reads: {tables}',
  'readers.separator': ', ',

  'empty.title': 'This feature has not remembered anything yet',
  'empty.body': 'What its process learns will appear here as tables.',

  loading: 'Loading the records…',
  'error.title': 'The records could not be loaded',
  'error.body': 'The record tables did not arrive. Nothing was changed, the links above still work, and you can try again.',
} satisfies Messages

export default messages

declare module '@/i18n/types' {
  interface MessageNamespaces {
    memory: typeof messages
  }
}
