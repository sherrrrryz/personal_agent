import type { Messages } from '../types'

// Namespace `chat-components` — the chat components (package S8): what
// `ChatComposer`, `ChatMessageList` and `PersistenceSwitch` say by themselves,
// and the sample text of their demos on `/dev/components`. The chat surfaces
// (bar, panel, thread, recent list) have their own namespace, `chat`.
const messages = {
  // ChatComposer.
  'composer.label.bar': 'Ask the AI',
  'composer.label.thread': 'Reply',
  'composer.label.onboarding': 'Your answer',
  'composer.hint': 'Enter sends. Shift+Enter starts a new line.',
  'composer.send': 'Send',

  // ChatMessageList.
  'list.label': 'Conversation',
  'list.author.user': 'You',
  'list.author.ai': 'AI',
  'list.initial.user': 'Y',
  'list.initial.ai': 'AI',
  'list.streaming': 'Answering…',
  'list.failed': 'The answer did not arrive.',
  'list.loading': 'Loading the conversation…',
  'list.empty.title': 'No messages yet',
  'list.empty.body': 'What you send and what the AI answers will appear here.',
  'list.error.title': 'This conversation could not be loaded',
  'list.error.body': 'Nothing was lost. Try again in a moment.',

  // PersistenceSwitch.
  'persistence.label': 'Keep as a module',
  'persistence.description.off':
    'Turning this on makes this conversation a sub-module with its own workflow that can run again. You confirm its name and where it belongs first.',
  'persistence.description.on': 'This conversation is a sub-module. Turning this off archives it; the conversation stays in Topics.',
  'persistence.description.named':
    'This conversation is the sub-module “{name}”. Turning this off archives it; the conversation stays in Topics.',
  'persistence.confirm.title': 'Create the sub-module',
  'persistence.confirm.name': 'Name',
  'persistence.confirm.nameRequired': 'Give the sub-module a name.',
  'persistence.confirm.parent': 'Belongs to',
  'persistence.confirm.create': 'Create',
  'persistence.archive.title': 'Archive this sub-module?',
  'persistence.archive.titleNamed': 'Archive “{name}”?',
  'persistence.archive.body':
    'It leaves the navigation and stops running. Its conversations stay in Topics, and nothing it has recorded is deleted.',
  'persistence.archive.confirm': 'Archive',

  // Demo captions.
  'demo.placements': 'Placements',
  'demo.states': 'States',
  'demo.placement.bar': 'In the chat bar',
  'demo.placement.thread': 'In a dedicated chat',
  'demo.placement.onboarding': 'In the onboarding interview',

  // ChatComposer demo.
  'demo.composer.typing': 'Typing: more than six lines scroll inside',
  'demo.composer.typingValue':
    'Tomorrow has five appointments.\nSend each owner a confirmation tonight.\nMention the time and who the groomer is.\nAsk long-haired dogs to come ten minutes early.\nIf someone cannot come, offer Thursday.\nDo not message the owner of Lucky, she already confirmed.\nTell me when all of them have answered.\nThank you.',
  'demo.composer.sending': 'Sending',
  'demo.composer.sendingOn': 'Show the sending state',
  'demo.composer.sendingOff': 'End the sending state',
  'demo.composer.disabled': 'Disabled',
  'demo.composer.sent': { one: '{count} message sent. The last one: {text}', other: '{count} messages sent. The last one: {text}' },
  'demo.composer.none': 'Nothing sent yet.',

  // ChatMessageList demo.
  'demo.list.pick': 'State of the list',
  'demo.list.conversation': 'A conversation',
  'demo.list.empty': 'Empty',
  'demo.list.loading': 'Loading',
  'demo.list.error': 'Could not load',
  'demo.list.streaming': 'Streaming',
  'demo.list.failed': 'Failed answer',
  'demo.list.long': '60 messages',
  'demo.list.streamingCaption': 'Streaming: the part that has arrived, and the status',
  'demo.list.failedCaption': 'Failed answer: said in words, with retry',
  'demo.list.note': 'Loading keeps the page busy; the matrix runs it with the loading preview.',
  'demo.list.user1': 'Which appointments are there tomorrow? Send the owners a confirmation.',
  'demo.list.ai1':
    'Tomorrow has five appointments. I drafted a confirmation for each owner; nothing is sent until you agree.',
  'demo.list.user2': 'Send them, except to the owner of Lucky. She already confirmed by phone.',
  'demo.list.ai2': 'Four confirmations are ready to go out at 20:00 tonight.',
  'demo.list.partial': 'Tomorrow has five appointments. I am drafting',
  'demo.list.attachmentCaption': 'Attachment — drawn by the surface that shows the list',
  'demo.list.attachmentTitle': 'Proposal: send four confirmations',
  'demo.list.attachmentBody': 'To the owners of Doudou, Dafu, Snowball and Max, at 20:00.',
  'demo.list.retried': { one: 'Retry asked {count} time.', other: 'Retry asked {count} times.' },
  'demo.list.longCaption': '60 messages inside a region that scrolls, with one message of 2,000 characters',
  'demo.list.scroller': 'A long conversation',
  'demo.list.numbered': 'Message {n}: Dafu took 4 h 10 min today, ten minutes more than planned.',
  'demo.list.numberedAi': 'Message {n}: noted. The average for Dafu is now 4 h 10 min.',
  'demo.list.sentence':
    'Golden retrievers take three hours and forty-five minutes on average here, between three hours twenty and four hours ten. ',
  'demo.list.readOnly': 'Read-only: a record, with no retry',
  'demo.list.add': 'Add a message',

  // PersistenceSwitch demo.
  'demo.persistence.oneOff': 'One-off conversation',
  'demo.persistence.persistent': 'Already a sub-module',
  'demo.persistence.disabled': 'Disabled',
  'demo.persistence.name': 'Appointment confirmations',
  'demo.persistence.parent1': 'Appointments',
  'demo.persistence.parent2': 'Customers',
  'demo.persistence.parent3': 'Staff rota',
  'demo.persistence.created': 'Created “{name}” under {parent}.',
  'demo.persistence.archived': 'Archived.',
  'demo.persistence.nothing': 'Nothing created yet.',
} satisfies Messages

export default messages

declare module '@/i18n/types' {
  interface MessageNamespaces {
    'chat-components': typeof messages
  }
}
