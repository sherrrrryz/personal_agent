import type { Messages } from '../types'

// Namespace `topics` — the topics list and a topic's home
// (`src/screens/topics/`). One writer (package C1).
const messages = {
  'list.title': 'Topics',
  'list.description': 'Every conversation with the AI is filed under a topic by itself.',
  'list.loading': 'Loading topics…',
  'list.empty.title': 'No topics yet',
  'list.empty.body': 'Every conversation you have with the AI is filed here by itself.',
  'list.error.title': 'Topics could not be loaded',
  'list.error.body': 'The platform cannot be reached right now. Your conversations are kept — try again.',
  'card.conversations': { one: '{count} conversation', other: '{count} conversations' },
  'card.lastActivity': 'Last activity: {when}',
  'card.subModule': 'Became a feature',
  'card.summaryPending': 'The summary is being written',

  'topic.summary': 'AI summary',
  'topic.summary.basis': { one: 'Written from {count} conversation', other: 'Written from {count} conversations' },
  'topic.summary.at': 'Updated {when}',
  'topic.summary.loading': 'Loading the summary…',
  'topic.summary.pending.title': 'The summary is being written',
  'topic.summary.pending.body': 'It appears here once the AI has gone through the conversations below.',
  'topic.summary.error.title': 'The summary could not be written',
  'topic.summary.error.body': 'The conversations below are not affected. Try again to have it written once more.',
  'topic.modules': 'Related features',
  'topic.records': 'Conversations',
  'topic.records.loading': 'Loading the conversations…',
  'topic.record.toggle': '{title} · {date}',
  'topic.record.log': 'Record {n}: {title}',
  'topic.record.surface.in-place': 'Answered in place',
  'topic.record.surface.thread': 'Dedicated chat',
  'topic.record.continue': 'Continue this conversation',
  'topic.record.continueNamed': 'Continue this conversation: {title}',
  'topic.record.untitled': 'Conversation',
} satisfies Messages

export default messages

declare module '@/i18n/types' {
  interface MessageNamespaces {
    topics: typeof messages
  }
}
