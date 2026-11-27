import { useState } from 'react'
import { Link, useParams } from 'react-router'

import { NotFound } from '@/app/NotFound'
import { MessageAttachmentBlock } from '@/chat/attachments'
import { ConversationPersistence } from '@/chat/ConversationPersistence'
import { messagesOf } from '@/chat/messages'
import { topicPath } from '@/chat/paths'
import { ChatMessageList } from '@/components/chat'
import { Page, Stack } from '@/components/layout'
import { useLocale, useT } from '@/i18n'
import { findConversation, findModule, findTopic, useActions, useResource, useRuntimeState, type Conversation } from '@/runtime'
import { modulePath } from '@/shell'

const linkClass = 'inline-flex items-center underline underline-offset-4 wrap-anywhere'

/**
 * `chat.thread` (`/chat/<id>`) — a dedicated chat (spec part 2 § Chat): the
 * conversation's title, its topic and the module it concerns, the persistence
 * switch, and the messages, which scroll inside the room `main` has left
 * (the kit's `MessageScroller`). Its composer is the shell's bottom row
 * (`ChatBar`).
 *
 * The header reads the state itself — like the breadcrumb above it — and only
 * the messages follow 状态预览: a forced error leaves her knowing which chat
 * failed to load.
 */
export function ThreadPage() {
  const { id = '' } = useParams()
  const t = useT('chat')
  const { locale } = useLocale()
  const state = useRuntimeState()
  const conversation = findConversation(state, id)
  if (!conversation) return <NotFound />

  const topic = findTopic(state, conversation.topicId)
  const module = findModule(state, conversation.subModuleId ?? conversation.moduleId ?? '')

  return (
    <Page title={conversation.title[locale] || t('thread.untitled')} width="prose" height="fill">
      <Stack gap="md">
        <ul aria-label={t('thread.details')} className="flex min-w-0 flex-wrap gap-x-6">
          {topic && (
            <li className="min-w-0">
              <Link to={topicPath(topic.id)} className={linkClass}>
                {t('thread.topic', { topic: topic.title[locale] })}
              </Link>
            </li>
          )}
          {module && !module.archived && (
            <li className="min-w-0">
              <Link to={modulePath(module.id)} className={linkClass}>
                {t('thread.module', { module: module.name[locale] })}
              </Link>
            </li>
          )}
        </ul>
        <ConversationPersistence conversation={conversation} />
      </Stack>
      {/* What the header leaves of `main` is the conversation's: it scrolls inside itself. */}
      <div className="flex min-h-48 flex-1 flex-col">
        <ThreadMessages conversation={conversation} />
      </div>
    </Page>
  )
}

/** The messages, through the facade: loading, a failed load with 重试, or the conversation as the preview shapes it. */
function ThreadMessages({ conversation }: { conversation: Conversation }) {
  const [attempt, setAttempt] = useState(0)
  return <ThreadLog key={attempt} conversation={conversation} onReload={() => setAttempt((count) => count + 1)} />
}

function ThreadLog({ conversation, onReload }: { conversation: Conversation; onReload: () => void }) {
  const t = useT('chat')
  const { locale } = useLocale()
  const actions = useActions()
  const answer = useResource({ kind: 'conversation', id: conversation.id })
  // 空 is a thread that has just begun — her opening message and 正在回答 — so it is drawn like any other.
  const shown = answer.state === 'loading' || answer.state === 'error' ? undefined : answer.data

  return (
    <ChatMessageList
      messages={shown ? messagesOf(shown, locale) : []}
      state={answer.state === 'loading' ? 'loading' : answer.state === 'error' ? 'error' : 'ready'}
      error={t('thread.error')}
      onReload={onReload}
      onRetry={() =>
        actions.sendMessage({ text: '', conversationId: conversation.id, retry: true, context: { moduleId: conversation.moduleId } })
      }
      renderAttachment={(attachment, message) => (
        <MessageAttachmentBlock
          attachment={attachment}
          messageId={message.id}
          index={message.attachments?.indexOf(attachment) ?? 0}
          level={2}
        />
      )}
    />
  )
}
