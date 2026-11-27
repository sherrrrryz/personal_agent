import type { Messages } from '../types'

// Namespace `common` — words every part of the app shares, and the two
// vocabularies of `src/lib/vocab.ts`. One writer (package S2); a package
// needing another shared word asks for it instead of adding a near-copy.
const messages = {
  'app.name': 'Personal Agent',

  'action.close': 'Close',
  'action.cancel': 'Cancel',
  'action.confirm': 'Confirm',
  'action.save': 'Save',
  'action.retry': 'Try again',
  'action.back': 'Back',
  'status.loading': 'Loading…',

  'notFound.title': 'Page not found',
  'notFound.body': 'Nothing lives at this address.',
  'notFound.home': 'Go to the start page',

  // Behaviour modes (D-22): name + one line of meaning.
  'mode.autonomous.name': 'Autonomous',
  'mode.autonomous.meaning': 'Does it on its own and tells you afterwards.',
  'mode.assisted.name': 'Assisted',
  'mode.assisted.meaning': 'Prepares it, then carries it out once you approve.',
  'mode.deferred.name': 'Deferred',
  'mode.deferred.meaning': 'Waits in your notifications until you decide.',

  // Change kinds: what a marker says about an item since the last look.
  'change.new': 'New',
  'change.updated': 'Updated',
  'change.removed': 'Removed',
} satisfies Messages

export default messages

declare module '@/i18n/types' {
  interface MessageNamespaces {
    common: typeof messages
  }
}
