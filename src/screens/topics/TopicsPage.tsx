import { useState } from 'react'
import { Link } from 'react-router'

import { topicPath } from '@/chat/paths'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/containers'
import { Badge, DataState, Empty, EmptyDescription, EmptyHeader, EmptyTitle } from '@/components/feedback'
import { Grid, Page } from '@/components/layout'
import { useFormat, useLocale, useT } from '@/i18n'
import { conversationsOf, findModule, toDate, useResource, useRuntimeState, viewOf, type RuntimeState, type Topic } from '@/runtime'

const linkClass = 'inline-flex max-w-full items-center underline underline-offset-4 wrap-anywhere'

/**
 * `topics` (`/topics`, spec part 3 § Screens and flows) — not a module, so no
 * frame: every topic the AI filed her conversations under, as a card with the
 * AI's title, the first line of its summary, how many conversations it holds,
 * when it was last active, and a badge when a module grew from it.
 */
export function TopicsPage() {
  const t = useT('topics')
  const [attempt, setAttempt] = useState(0)
  return (
    <Page title={t('list.title')} description={t('list.description')}>
      <TopicCards key={attempt} onReload={() => setAttempt((count) => count + 1)} />
    </Page>
  )
}

function TopicCards({ onReload }: { onReload: () => void }) {
  const t = useT('topics')
  const state = useRuntimeState()
  const answer = useResource({ kind: 'topics' })
  const shown = answer.state === 'ready' || answer.state === 'long'
  // The same view the answer was read from: under 超长内容 the long variant, conversations included.
  const view = viewOf(state)

  return (
    <DataState
      state={shown ? 'ready' : answer.state === 'loading' ? 'loading' : answer.state === 'empty' ? 'empty' : 'error'}
      loadingLabel={t('list.loading')}
      empty={
        <Empty>
          <EmptyHeader>
            <EmptyTitle>{t('list.empty.title')}</EmptyTitle>
            <EmptyDescription>{t('list.empty.body')}</EmptyDescription>
          </EmptyHeader>
        </Empty>
      }
      errorTitle={t('list.error.title')}
      error={t('list.error.body')}
      onRetry={onReload}
    >
      <Grid min="xs">{shown && answer.data.map((topic) => <TopicCard key={topic.id} topic={topic} view={view} />)}</Grid>
    </DataState>
  )
}

/** The first line of a summary: up to its first sentence end or line break. */
function firstLine(summary: string): string {
  return /^[^\n。.!?！？]*[。.!?！？]?/.exec(summary)?.[0] || summary
}

function TopicCard({ topic, view }: { topic: Topic; view: RuntimeState }) {
  const t = useT('topics')
  const { locale } = useLocale()
  const format = useFormat()
  const conversations = conversationsOf(view, topic.id)
  // A module grew from it: one of its conversations was made persistent and the module is still there.
  const grew = conversations.some((conversation) => {
    const module = conversation.subModuleId ? findModule(view, conversation.subModuleId) : undefined
    return module !== undefined && !module.archived
  })

  return (
    <Card data-topic={topic.id} className="shadow-sm">
      <CardHeader>
        <CardTitle>
          <Link to={topicPath(topic.id)} className={linkClass}>
            {topic.title[locale]}
          </Link>
        </CardTitle>
        <CardDescription>{topic.summary ? firstLine(topic.summary[locale]) : t('card.summaryPending')}</CardDescription>
      </CardHeader>
      <CardContent>
        <ul className="flex min-w-0 flex-wrap items-center gap-x-4 gap-y-1">
          <li>{t('card.conversations', { count: conversations.length })}</li>
          <li>{t('card.lastActivity', { when: format.dateTime(toDate(topic.lastActivityAt)) })}</li>
          {grew && (
            <li>
              <Badge variant="secondary">{t('card.subModule')}</Badge>
            </li>
          )}
        </ul>
      </CardContent>
    </Card>
  )
}
