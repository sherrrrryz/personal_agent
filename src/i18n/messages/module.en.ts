import type { Messages } from '../types'

// Namespace `module` — the module frame (`src/module/`), the `/m/<ia-id>`
// routes and `/dev/frame` (`src/screens/module/`).
const messages = {
  'view.page': 'Page',
  'view.workflow': 'Process',
  'view.memory': 'Records',

  'run.never': 'Not updated yet',
  'run.ok': 'Last updated: {time} · succeeded',
  'run.failed': 'Last updated: {time} · failed',
  'run.failedNow': 'The update failed',
  'run.running': 'Updating…',
  'run.next': 'Next update: {time}',
  'run.next.none': 'No next update is scheduled',
  'run.now': 'Refresh',

  'settings.open': 'Feature settings',
  'settings.title': 'Feature settings',
  'settings.description': 'When {module} updated, its process and its records.',
  'settings.full': 'Open as a page',
  'settings.full.name': 'Open {part} as a page',

  'failure.title': 'The last update failed',
  'failure.account-expired': 'The connection to {account} has expired, so this update could read nothing from it.',
  'failure.account-missing': '{account} is not connected, so this update could read nothing from it.',
  'failure.source-failed': 'The data from {module} did not arrive. The other sources answered as usual.',
  'failure.platform-unreachable': 'The platform could not be reached. Nothing was changed.',
  'failure.generation-failed': 'The summary could not be written this time. The records themselves are intact.',
  'failure.not-found': 'This feature has no process to update.',
  'failure.fix.accounts': 'Reconnect it in Settings',
  'failure.fix.connect': 'Connect it in Settings',
  'failure.fix.source': 'Open {module}',
  'failure.fix.retry': 'Try again',

  'approvals.open': 'Awaiting you ({count})',
  'approvals.title': 'Awaiting you',
  'approvals.description': 'What {module} has put aside for you to decide.',
  'approvals.empty.title': 'Nothing is waiting for you',
  'approvals.empty.body': 'When this feature needs your decision, it shows up here and in Notifications.',
  'approvals.error.title': 'These could not be loaded',
  'approvals.error.reason': 'The list did not arrive. Nothing was changed; try again.',

  'history.open': 'Update history',
  'history.title': 'Update history',
  'history.description': 'Every update of {module}: when, what started it, how it ended and what it changed.',
  'history.caption': 'One row per update, the latest first',
  'history.column.time': 'Time',
  'history.column.trigger': 'Started by',
  'history.column.result': 'Result',
  'history.column.changes': 'Changes',
  'history.column.version': 'Process version',
  'history.trigger.schedule': 'Schedule',
  'history.trigger.event': 'An event',
  'history.trigger.manual': 'By hand',
  'history.trigger.module': 'Another feature',
  'history.result.ok': 'Succeeded',
  'history.result.failed': 'Failed',
  'history.result.running': 'Updating',
  'history.changes': { one: '{count} update', other: '{count} updates' },
  'history.changes.none': 'No changes',
  'history.version': 'Version {n}',
  'history.empty.title': 'No updates yet',
  'history.empty.body': 'An update appears here as soon as the process has updated once.',
  'history.error.title': 'The history could not be loaded',
  'history.error.reason': 'The list of updates did not arrive. Nothing was changed; try again.',

  'page.error.title': 'This page could not be loaded',
  'page.stale.title': 'This is what the last successful update produced',
  'page.stale.body': 'The latest update did not succeed, so what follows may be out of date.',
  'page.partial.title': 'What follows is incomplete',
  'page.partial.body': 'One source did not answer. Everything else is shown as usual.',

  'stub.section': 'Page content',
  'stub.title': 'This feature has no content yet',
  'stub.body': 'Its process has not produced a page. Set up the process and update it, and what it emits appears here.',
  'stub.action': 'Open the process',

  'demo.module.name': 'Frame demo',
  'demo.module.description': 'A made-up feature that shows the frame around a page of all seven cards.',
  'demo.workflow.reason': 'Written for the demo',
  'demo.workflow.trigger': 'Every morning at 8',
  'demo.workflow.source': 'Source: sample data',
  'demo.workflow.output': 'Content: the page',
  'demo.proposal.first.title': 'Move two appointments',
  'demo.proposal.first.summary': 'Two bookings overlap on Thursday afternoon.',
  'demo.proposal.first.partA': 'Move the 14:00 booking to 15:30',
  'demo.proposal.first.partB': 'Tell the customer about the new time',
  'demo.proposal.second.title': 'Reorder shampoo',
  'demo.proposal.second.part': 'Order six bottles of the mild shampoo',

  'demo.control.caption': 'Prototype demo — set how the last update ended (the device’s state preview does the same from the header):',
  'demo.control.label': 'How the last update ended',
  'demo.control.story': 'As update',
  'demo.control.account-expired': 'Failed: connection expired',
  'demo.control.account-missing': 'Failed: not connected',
  'demo.control.platform-unreachable': 'Failed: platform',
  'demo.control.generation-failed': 'Failed: summary',
  'demo.account': 'Demo account',

  'demo.view.workflow.title': 'Process',
  'demo.view.workflow.body': 'The process editor sits here: the same first row, then the view’s own title and content.',
  'demo.view.memory.title': 'Records',
  'demo.view.memory.body': 'The records tables sit here: the same first row, then the view’s own title and content.',
  'demo.view.child.title': 'A sub-page',
  'demo.view.child.body': 'A feature’s own sub-page — a pet’s file, say — sits here. None of the three view links is the open one.',
  'demo.view.back': 'Back to the page view',

  'demo.gallery.note':
    'ModuleFrame draws the page’s one h1 and the page padding, so it cannot be nested in the gallery. Open it in place:',
  'demo.gallery.ok': 'Page view, last update succeeded',
  'demo.gallery.never': 'Page view, not update yet',
  'demo.gallery.running': 'Page view, updating',
  'demo.gallery.failed': 'Page view, last update failed',
  'demo.gallery.long': 'Page view, long content',
  'demo.gallery.workflow': 'Process view',
  'demo.gallery.memory': 'Records view',
  'demo.gallery.child': 'Sub-page view',
} satisfies Messages

export default messages

declare module '@/i18n/types' {
  interface MessageNamespaces {
    module: typeof messages
  }
}
