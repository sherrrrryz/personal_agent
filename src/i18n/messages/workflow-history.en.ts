import type { Messages } from '../types'

// Namespace `workflow-history` — the workflow editor's comparison and version
// history (`src/screens/workflow/diff/`, `src/screens/workflow/history/`).
const messages = {
  'history.open': 'History',
  'history.title': 'Version history',
  'history.description': 'Every version of this workflow, newest first, with who made it and why.',
  'history.version': 'Version {n}',
  'history.current': 'Current',
  'history.author.ai': 'AI',
  'history.author.user': 'You',
  'history.meta': '{date} · by {author}',
  'history.view': 'View',
  'history.view.name': 'View version {n}',
  'history.compare': 'Compare with current',
  'history.compare.name': 'Compare with current: version {n}',

  'old.title': 'You are looking at version {n} — read-only',
  'old.body': 'Version {current} is the one in force. An older version can be read but not changed or restored.',
  'old.back': 'Back to the current version',

  'diff.previous': 'Compare with the previous version',
  'diff.stop': 'Stop comparing',
  'diff.proposed.open': 'Look at the change waiting for approval',
  'diff.proposed.back': 'Back to the current version',

  'summary.title': 'What changed',
  'summary.versions': 'Version {to} compared with version {from}.',
  'summary.proposed': 'The proposed change compared with version {from} (current).',
  'summary.none': 'These two versions do not differ.',
  'summary.node.added': 'Added {kind} “{label}”',
  'summary.node.changed': 'Changed {kind} “{label}”',
  'summary.node.removed': 'Removed {kind} “{label}”',
  'summary.edge.added': 'Added connection: {from} → {to}',
  'summary.edge.changed': 'Changed connection: {from} → {to}',
  'summary.edge.removed': 'Removed connection: {from} → {to}',

  'proposal.title': 'The AI proposes this change',
  'proposal.approve': 'Approve',
  'proposal.reject': 'Reject',
  'proposal.approved': 'Approved. Version {n} is now in force.',
  'proposal.rejected': 'Rejected. The workflow stays at version {n}.',
} satisfies Messages

export default messages

declare module '@/i18n/types' {
  interface MessageNamespaces {
    'workflow-history': typeof messages
  }
}
