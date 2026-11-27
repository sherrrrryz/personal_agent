import type { Messages } from '../types'

// Namespace `onboarding` — the three steps before the shell (D-30), and the
// two compositions they share with settings: the module set and the
// connector list.
const messages = {
  'step.progress': 'Step {step} of {total}',
  'action.back': 'Back',
  'action.cancel': 'Cancel',
  'action.cancel.note': 'Return to settings without another interview.',

  // Step 1 — the profession interview.
  'profession.title': 'Tell me about your work',
  'profession.description': 'Four questions. From your answers I propose the modules your workspace starts with.',
  'profession.log': 'Interview',
  'profession.suggestions': 'You could answer',
  'profession.continue': 'Continue',
  'profession.continue.note': 'Answer the questions above to continue.',

  // Step 2 — the proposed module set.
  'modules.title': 'Your modules',
  'modules.description': 'What I would set up for you. Rename, remove or add before I generate them.',
  'modules.loading': 'Working out which modules to suggest…',
  'modules.error.title': 'Could not generate the suggestions',
  'modules.error.body': 'Nothing was changed. Try again, or go back a step.',
  'modules.confirm': 'Confirm and generate',
  'modules.confirm.blocked': 'Add at least one module to continue.',

  // The module set (step 2 and `settings.profession`).
  'set.label': 'Profession modules',
  'set.empty.title': 'No modules yet',
  'set.empty.body': 'Add one and say what it should do.',
  'set.rename': 'Rename',
  'set.rename.name': 'Rename {name}',
  'set.rename.title': 'Rename module',
  'set.remove': 'Remove',
  'set.remove.name': 'Remove {name}',
  'set.removed': 'Removed {name}',
  'set.undo': 'Undo',
  'set.remove.confirm.title': 'Remove {name}?',
  'set.remove.confirm.body': 'It leaves the sidebar together with its sub-modules. Its conversations stay in Topics.',
  'set.add': 'Add module',
  'set.add.title': 'Add a module',
  'set.add.description': 'A module you add starts empty: it shows what it will do once it is set up.',
  'set.field.name': 'Name',
  'set.field.name.error': 'Give the module a name.',
  'set.field.purpose': 'What it should do',
  'set.field.purpose.hint': 'Optional. One sentence is enough.',
  'set.save': 'Save',
  'set.added': 'Added {name}',

  // Step 3 — accounts.
  'accounts.title': 'Connect your accounts',
  'accounts.description': 'The accounts your modules draw on. You can connect any of them later in Settings.',
  'accounts.finish': 'Finish',

  // The connector list (step 3 and `settings.accounts`).
  'connectors.primary': 'Your shop’s tools',
  'connectors.more': { one: 'More ({count})', other: 'More ({count})' },
  'connectors.loading': 'Reading your accounts…',
  'connectors.empty.onboarding.title': 'No account needed',
  'connectors.empty.onboarding.body': 'The modules you chose need no account. You can finish.',
  'connectors.empty.settings.title': 'No accounts to connect',
  'connectors.empty.settings.body': 'Accounts appear here once a module needs one.',
  'connectors.error.title': 'Could not read your accounts',
  'connectors.error.body': 'What follows is the last state we read. Authorisations that lapsed are marked.',
  'connectors.status.connected': 'Connected',
  'connectors.status.disconnected': 'Not connected',
  'connectors.status.expired.settings': 'Authorisation expired',
  'connectors.status.expired.onboarding': 'Authorisation failed',
  'connectors.feeds': 'Used by',
  'connectors.feeds.none': 'No module uses it yet.',
  'connectors.connect': 'Connect',
  'connectors.connect.name': 'Connect {name}',
  'connectors.reconnect.settings': 'Reconnect',
  'connectors.reconnect.onboarding': 'Try again',
  'connectors.reconnect.name.settings': 'Reconnect {name}',
  'connectors.reconnect.name.onboarding': 'Try again: {name}',
  'connectors.connect.title': 'Connect {name}',
  'connectors.connect.body': 'Prototype: simulated authorisation. No sign-in page opens and nothing is sent to {name}.',
  'connectors.connect.confirm': 'Simulate connection',
  'connectors.connected': 'Connected {name} (simulated)',
  'connectors.disconnect': 'Disconnect',
  'connectors.disconnect.name': 'Disconnect {name}',
  'connectors.disconnect.title': 'Disconnect {name}?',
  'connectors.disconnect.body': 'These modules stop running until you connect it again: {modules}.',
  'connectors.disconnect.body.none': 'No module uses it; nothing stops.',
  'connectors.disconnected': 'Disconnected {name}',
  'connectors.separator': ', ',
} satisfies Messages

export default messages

declare module '@/i18n/types' {
  interface MessageNamespaces {
    onboarding: typeof messages
  }
}
