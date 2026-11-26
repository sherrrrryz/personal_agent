import type { Messages } from '../types'

// Namespace `settings` — the settings home and its three pages. The module
// set and the connector list are shared with onboarding and speak from the
// `onboarding` namespace.
const messages = {
  'home.title': 'Settings',
  'home.pages': 'Settings pages',
  'home.accounts': 'Accounts',
  'home.accounts.status': { one: '{count} connected', other: '{count} connected' },
  'home.accounts.none': 'No account connected yet',
  'home.modes': 'AI behaviour modes',
  'home.modes.status': { one: '{count} kind of task set', other: '{count} kinds of task set' },
  'home.modes.none': 'Nothing set yet',
  'home.profession': 'Profession modules',
  'home.profession.status': { one: '{count} module', other: '{count} modules' },
  'home.status.error': 'The status cannot be read right now',
  'home.display': 'Display',

  'accounts.title': 'Accounts',
  'accounts.description': 'The accounts your modules draw on. A module stops when its account is disconnected.',

  'modes.title': 'AI behaviour modes',
  'modes.lead':
    'What you choose here is a ceiling for each kind of task: the AI picks a mode at or below it, case by case. Where nothing is set, the AI decides and defaults to Assisted.',
  'modes.loading': 'Reading your settings…',
  'modes.error.title': 'Could not read your settings',
  'modes.error.body': 'What follows is the last state we read. A change cannot be saved until the settings can be read again.',
  'modes.unset': 'Not set',
  'modes.unset.meaning': 'The AI decides; Assisted by default.',
  'modes.save.error': 'Could not save. Your earlier choice is still in force; try again.',
  'modes.affected': 'Actions this setting applies to',
  'modes.affected.none': 'No action is affected by this setting at present.',
  'modes.affected.item': '{module} · {action}',
  'modes.capped': 'Held back by the ceiling',
  'modes.showAll': { one: 'Show all ({count})', other: 'Show all ({count})' },

  'profession.title': 'Profession modules',
  'profession.description': 'The modules made for your work. Changes show in the sidebar at once.',
  'profession.error.title': 'Could not read your modules',
  'profession.regenerate': 'Regenerate',
  'profession.regenerate.title': 'Regenerate the module set?',
  'profession.regenerate.body':
    'The set goes back to what the AI first proposed. Modules you added are removed and renamed ones get their first names back.',
  'profession.regenerated': 'The module set was regenerated',
  'profession.interview': 'Redo the profession interview',
  'profession.interview.note': 'Opens the three onboarding steps again; you can cancel and come back here.',
  'profession.promotions': 'Promotion suggestions',
  'profession.promotions.none': 'No suggestions at present.',
  'profession.promoted': 'Promoted to a top-level module',
  'profession.promoted.open': 'Open {name}',
} satisfies Messages

export default messages

declare module '@/i18n/types' {
  interface MessageNamespaces {
    settings: typeof messages
  }
}
