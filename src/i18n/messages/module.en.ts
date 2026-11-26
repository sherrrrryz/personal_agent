import type { Messages } from '../types'

// Namespace `module` — the module frame (`src/module/`), the `/m/<ia-id>`
// routes and `/dev/frame` (`src/screens/module/`).
const messages = {
  'views.label': 'Module views',
  'view.page': 'Page',
  'view.workflow': 'Workflow',
  'view.memory': 'Memory',

  'run.never': 'Not run yet',
  'run.ok': 'Last run: {time} · succeeded',
  'run.failed': 'Last run: {time} · failed',
  'run.failedNow': 'The run failed',
  'run.running': 'Running…',
  'run.next': 'Next run: {time}',
  'run.next.none': 'No next run is scheduled',
  'run.now': 'Run now',

  'failure.title': 'The last run failed',
  'failure.account-expired': 'The connection to {account} has expired, so this run could read nothing from it.',
  'failure.account-missing': '{account} is not connected, so this run could read nothing from it.',
  'failure.source-failed': 'The data from {module} did not arrive. The other sources answered as usual.',
  'failure.platform-unreachable': 'The platform could not be reached. Nothing was changed.',
  'failure.generation-failed': 'The summary could not be written this time. The records themselves are intact.',
  'failure.not-found': 'This module has no workflow to run.',
  'failure.fix.accounts': 'Reconnect it in Settings',
  'failure.fix.connect': 'Connect it in Settings',
  'failure.fix.source': 'Open {module}',
  'failure.fix.retry': 'Run again',

  'approvals.open': 'Awaiting you ({count})',
  'approvals.title': 'Awaiting you',
  'approvals.description': 'What {module} has put aside for you to decide.',
  'approvals.empty.title': 'Nothing is waiting for you',
  'approvals.empty.body': 'When this module needs your decision, it shows up here and in Notifications.',
  'approvals.error.title': 'These could not be loaded',
  'approvals.error.reason': 'The list did not arrive. Nothing was changed; try again.',

  'history.open': 'Run history',
  'history.title': 'Run history',
  'history.description': 'Every run of {module}: when, what started it, how it ended and what it changed.',
  'history.caption': 'One row per run, the latest first',
  'history.column.time': 'Time',
  'history.column.trigger': 'Started by',
  'history.column.result': 'Result',
  'history.column.changes': 'Changes',
  'history.column.version': 'Workflow version',
  'history.trigger.schedule': 'Schedule',
  'history.trigger.event': 'An event',
  'history.trigger.manual': 'By hand',
  'history.trigger.module': 'Another module',
  'history.result.ok': 'Succeeded',
  'history.result.failed': 'Failed',
  'history.result.running': 'Running',
  'history.changes': { one: '{count} update', other: '{count} updates' },
  'history.changes.none': 'No changes',
  'history.version': 'Version {n}',
  'history.empty.title': 'No runs yet',
  'history.empty.body': 'A run appears here as soon as the workflow has run once.',
  'history.error.title': 'The history could not be loaded',
  'history.error.reason': 'The list of runs did not arrive. Nothing was changed; try again.',

  'page.error.title': 'This page could not be loaded',
  'page.stale.title': 'This is what the last successful run produced',
  'page.stale.body': 'The latest run did not succeed, so what follows may be out of date.',
  'page.partial.title': 'What follows is incomplete',
  'page.partial.body': 'One source did not answer. Everything else is shown as usual.',

  'stub.section': 'Page content',
  'stub.title': 'This module has no output yet',
  'stub.body': 'Its workflow has not produced a page. Set up the workflow and run it, and what it emits appears here.',
  'stub.action': 'Open the workflow',

  'demo.module.name': 'Frame demo',
  'demo.module.description': 'A made-up module that shows the frame around a page of all seven blocks.',
  'demo.workflow.reason': 'Written for the demo',
  'demo.workflow.trigger': 'Every morning at 8',
  'demo.workflow.source': 'Source: sample data',
  'demo.workflow.output': 'Output: the page',
  'demo.proposal.first.title': 'Move two appointments',
  'demo.proposal.first.summary': 'Two bookings overlap on Thursday afternoon.',
  'demo.proposal.first.partA': 'Move the 14:00 booking to 15:30',
  'demo.proposal.first.partB': 'Tell the customer about the new time',
  'demo.proposal.second.title': 'Reorder shampoo',
  'demo.proposal.second.part': 'Order six bottles of the mild shampoo',

  'demo.control.caption': 'Prototype demo — set how the last run ended (the device’s state preview does the same from the header):',
  'demo.control.label': 'How the last run ended',
  'demo.control.story': 'As run',
  'demo.control.account-expired': 'Failed: connection expired',
  'demo.control.account-missing': 'Failed: not connected',
  'demo.control.platform-unreachable': 'Failed: platform',
  'demo.control.generation-failed': 'Failed: summary',
  'demo.account': 'Demo account',

  'demo.view.workflow.title': 'Workflow',
  'demo.view.workflow.body': 'The workflow editor sits here: the same first row, then the view’s own title and content.',
  'demo.view.memory.title': 'Memory',
  'demo.view.memory.body': 'The memory tables sit here: the same first row, then the view’s own title and content.',
  'demo.view.child.title': 'A sub-page',
  'demo.view.child.body': 'A module’s own sub-page — a pet’s file, say — sits here. None of the three view links is the open one.',
  'demo.view.back': 'Back to the page view',

  'demo.gallery.note':
    'ModuleFrame draws the page’s one h1 and the page padding, so it cannot be nested in the gallery. Open it in place:',
  'demo.gallery.ok': 'Page view, last run succeeded',
  'demo.gallery.never': 'Page view, not run yet',
  'demo.gallery.running': 'Page view, running',
  'demo.gallery.failed': 'Page view, last run failed',
  'demo.gallery.long': 'Page view, long content',
  'demo.gallery.workflow': 'Workflow view',
  'demo.gallery.memory': 'Memory view',
  'demo.gallery.child': 'Sub-page view',
} satisfies Messages

export default messages

declare module '@/i18n/types' {
  interface MessageNamespaces {
    module: typeof messages
  }
}
