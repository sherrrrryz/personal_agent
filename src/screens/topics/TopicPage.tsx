import { ChevronsUpDownIcon } from 'lucide-react'
import { useState } from 'react'
import { Link, useParams } from 'react-router'

import { NotFound } from '@/app/NotFound'
import { MessageAttachmentBlock } from '@/chat/attachments'
import { messagesOf } from '@/chat/messages'
import { threadPath } from '@/chat/paths'
import { Button } from '@/components/actions'
import { ChatMessageList } from '@/components/chat'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/containers'
import { Badge, DataState, Empty, EmptyDescription, EmptyHeader, EmptyTitle } from '@/components/feedback'
import { Page, Section, Stack } from '@/components/layout'
import { useFormat, useLocale, useT } from '@/i18n'
import {
  findTopic,
  resolveModule,
  toDate,
  useResource,
  useRuntimeState,
  viewOf,
  type Conversation,
  type Module,
  type RuntimeState,
  type Topic,
} from '@/runtime'
import { modulePath } from '@/shell'

const linkClass = 'inline-flex max-w-full items-center underline underline-offset-4 wrap-anywhere'

/**
 * `topics.<topic>` (`/topics/<topicId>`, spec part 3 § Screens and flows): the
 * AI's summary of the topic, the modules it concerns, and every conversation
 * filed under it as a record to read — each with the way back into it.
 *
 * The title reads the state itself, like the breadcrumb above it, so the
 * address opens whatever is being previewed; the summary and the records
 * follow 状态预览.
 */
export function TopicPage() {
  const { topicId = '' } = useParams()
  const { locale } = useLocale()
  const state = useRuntimeState()
  const [attempt, setAttempt] = useState(0)
  // Under 超长内容 the list holds topics only the long variant has.
  const topic = findTopic(state, topicId) ?? findTopic(viewOf(state), topicId)
  if (!topic) return <NotFound />

  return (
    <Page title={topic.title[locale]} width="prose">
      <TopicBody key={attempt} topic={topic} onReload={() => setAttempt((count) => count + 1)} />
    </Page>
  )
}

/** The modules a topic concerns, and the ones that grew from its conversations. */
function modulesOf(state: RuntimeState, topic: Topic, conversations: Conversation[]): Module[] {
  const ids = [...topic.moduleIds, ...conversations.flatMap((conversation) => conversation.subModuleId ?? [])]
  const found = ids.flatMap((id) => resolveModule(state, id)?.module ?? [])
  return found.filter((module, index) => !module.archived && found.indexOf(module) === index)
}

function TopicBody({ topic, onReload }: { topic: Topic; onReload: () => void }) {
  const t = useT('topics')
  const { locale } = useLocale()
  const format = useFormat()
  const state = useRuntimeState()
  const answer = useResource({ kind: 'topic', id: topic.id })

  const loading = answer.state === 'loading'
  // A failed summary still brings the records (`partial`); 空 is a topic whose summary is still to come.
  const data = 'data' in answer ? answer.data : undefined
  const conversations = data?.conversations ?? []
  const summary = data?.topic.summary?.[locale]
  const summaryAt = data?.topic.summaryAt
  const failed = answer.state === 'error'
  const modules = modulesOf(state, topic, conversations)

  return (
    <>
      <Section title={t('topic.summary')}>
        <DataState
          state={loading ? 'loading' : failed ? 'error' : summary ? 'ready' : 'empty'}
          loadingLabel={t('topic.summary.loading')}
          empty={
            <Empty>
              <EmptyHeader>
                <EmptyTitle>{t('topic.summary.pending.title')}</EmptyTitle>
                <EmptyDescription>{t('topic.summary.pending.body')}</EmptyDescription>
              </EmptyHeader>
            </Empty>
          }
          errorTitle={t('topic.summary.error.title')}
          error={t('topic.summary.error.body')}
          onRetry={onReload}
        >
          <Stack gap="sm">
            <p className="whitespace-pre-wrap wrap-anywhere">{summary}</p>
            <p className="text-sm text-muted-foreground">
              {t('topic.summary.basis', { count: conversations.length })}
              {summaryAt ? ` · ${t('topic.summary.at', { when: format.dateTime(toDate(summaryAt)) })}` : null}
            </p>
          </Stack>
        </DataState>
      </Section>

      {modules.length > 0 && (
        <Section title={t('topic.modules')}>
          <ul className="flex min-w-0 flex-wrap gap-x-6 gap-y-1">
            {modules.map((module) => (
              <li key={module.id} className="min-w-0">
                <Link to={modulePath(module.id)} className={linkClass}>
                  {module.name[locale]}
                </Link>
              </li>
            ))}
          </ul>
        </Section>
      )}

      <Section title={t('topic.records')}>
        <DataState state={loading ? 'loading' : 'ready'} loadingLabel={t('topic.records.loading')}>
          <Stack gap="md">
            {conversations.map((conversation, index) => (
              // The latest record is open; the others open one by one.
              <TopicRecord key={conversation.id} conversation={conversation} n={index + 1} defaultOpen={index === conversations.length - 1} />
            ))}
          </Stack>
        </DataState>
      </Section>
    </>
  )
}

/** One conversation as a record: when, where it was held, the way back into it, and the messages to read. */
function TopicRecord({ conversation, n, defaultOpen }: { conversation: Conversation; n: number; defaultOpen: boolean }) {
  const t = useT('topics')
  const { locale } = useLocale()
  const format = useFormat()
  const title = conversation.title[locale] || t('topic.record.untitled')

  return (
    <Collapsible defaultOpen={defaultOpen} data-record={conversation.id} className="flex min-w-0 flex-col gap-2">
      <div className="flex min-w-0 flex-wrap items-center gap-x-4 gap-y-2">
        <CollapsibleTrigger
          render={
            <Button variant="secondary">
              <ChevronsUpDownIcon aria-hidden="true" />
              {t('topic.record.toggle', { title, date: format.date(toDate(conversation.startedAt)) })}
            </Button>
          }
        />
        <Badge variant="secondary">{t(`topic.record.surface.${conversation.surface}`)}</Badge>
        <Link to={threadPath(conversation.id)} className={linkClass} aria-label={t('topic.record.continueNamed', { title })}>
          {t('topic.record.continue')}
        </Link>
      </div>
      <CollapsibleContent>
        <ChatMessageList
          readOnly
          label={t('topic.record.log', { n, title })}
          messages={messagesOf(conversation, locale)}
          renderAttachment={(attachment, message) =>
            // A record is read, not acted on: the tables an answer carried are shown, its proposals are not.
            attachment.kind === 'table' ? (
              <MessageAttachmentBlock
                attachment={attachment}
                messageId={message.id}
                index={message.attachments?.indexOf(attachment) ?? 0}
                level={3}
              />
            ) : null
          }
        />
      </CollapsibleContent>
    </Collapsible>
  )
}
