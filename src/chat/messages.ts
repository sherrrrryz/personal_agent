import type { ChatMessage } from '@/components/chat'
import type { Locale } from '@/i18n'
import type { Conversation, MessageAttachment } from '@/runtime'

/** A conversation's messages as `ChatMessageList` takes them: the text in the viewer's language. */
export function messagesOf(conversation: Conversation, locale: Locale): ChatMessage<MessageAttachment>[] {
  return conversation.messages.map((message) => ({
    id: message.id,
    author: message.author,
    text: message.text[locale],
    at: message.at,
    status: message.status,
    attachments: message.attachments,
  }))
}
