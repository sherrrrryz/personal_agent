import type { Messages } from '../types'

// Namespace `chat` — the chat surfaces (`src/chat/`, `src/screens/chat/`): the
// chat bar with its in-place panel, the recent list in the sidebar and the
// dedicated chat. One writer (package S12). The chat components' own words
// are in `chat-components`.
const messages = {
  'bar.label': 'Chat with the AI',
  'bar.placeholder': 'Ask about this screen, or say what you need',
  'bar.suggestions': 'Suggested questions',

  'panel.heading': 'About: {screen}',
  'panel.screen.view': '{module} · {view}',
  'panel.screen.unnamed': 'this screen',
  'panel.log': 'This conversation',
  'panel.openThread': 'Open in a dedicated chat',
  'panel.close': 'Close',
  'panel.archived': 'Filed under the topic “{topic}”',
  'panel.archived.open': 'Open the topic',

  'attachment.caption': { one: '{name}: {count} row', other: '{name}: {count} rows' },
  'attachment.noData': 'No data yet',

  'thread.label': 'Reply in this chat',
  'thread.untitled': 'Chat',
  'thread.topic': 'Topic: {topic}',
  'thread.module': 'Feature: {module}',
  'thread.details': 'About this chat',
  'thread.error': 'The messages could not be loaded. Nothing is lost — try again.',

  'recent.label': 'Recent chats',
  'recent.row': '{title} · {topic} · {when}',
  'recent.rowPlain': '{title} · {when}',
  'recent.persistent': 'Kept as a feature',
  'recent.all': 'All topics',
  'recent.loading': 'Loading recent chats…',
  'recent.empty': 'No chats yet',
  'recent.error.title': 'Recent chats could not be loaded',
  'recent.error.body': 'Your chats are still filed under Topics.',
  'recent.now': 'just now',

  'demo.title': 'Chat demo',
  'demo.description': 'The chat bar and the recent chats inside the shell. Ask something below: the answer opens above the bar and this page stays in use.',
  'demo.behind.title': 'The screen behind the panel',
  'demo.behind.note': 'Open the panel, then press this button: it still counts.',
  'demo.behind.action': 'Count one',
  'demo.behind.count': { one: 'Pressed {count} time.', other: 'Pressed {count} times.' },
  'demo.filler.title': 'Enough text to scroll',
  'demo.filler.text': 'Paragraph {n}. The page scrolls above the chat bar; the bar and its panel never lie over it.',
} satisfies Messages

export default messages

declare module '@/i18n/types' {
  interface MessageNamespaces {
    chat: typeof messages
  }
}
