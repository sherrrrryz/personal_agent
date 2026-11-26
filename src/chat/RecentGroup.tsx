import { HistoryIcon, MessageSquareIcon, MessagesSquareIcon } from 'lucide-react'
import { useState } from 'react'
import { Link, useLocation } from 'react-router'

import { DataState } from '@/components/feedback'
import { SidebarGroup, SidebarItem } from '@/components/navigation'
import { useLocale, useT } from '@/i18n'
import { findTopic, recentConversations, useResource, useRuntimeState, viewOf, type Conversation } from '@/runtime'

import { threadPath, topicPath } from './paths'
import { relativeTime } from './relative-time'

/** Where the group's open / closed state is kept, beside `pa.theme` and `pa.locale`. */
export const RECENT_STORAGE_KEY = 'pa.recent'

/** `chat.recent` shows this many conversations; the rest is behind 全部话题. */
export const RECENT_LIMIT = 10

function readOpen(): boolean {
  try {
    return window.localStorage.getItem(RECENT_STORAGE_KEY) === 'open'
  } catch {
    return false
  }
}

function writeOpen(open: boolean): void {
  try {
    window.localStorage.setItem(RECENT_STORAGE_KEY, open ? 'open' : 'closed')
  } catch {
    // Storage refused: the choice lasts for this visit only.
  }
}

/**
 * `chat.recent` — the sidebar group 最近对话 (spec part 2 § Chat): collapsed
 * until she opens it (D-39), and it stays as she left it. The ten latest
 * conversations, then 全部话题. A dedicated chat opens `chat.thread`; an
 * in-place conversation opens its topic, where its record is kept.
 *
 * Unlike the module navigation it reads a resource: a list of data has the
 * four data states, and 状态预览 shows them.
 */
export function RecentGroup() {
  const t = useT('chat')
  const [open, setOpen] = useState(readOpen)
  return (
    <SidebarGroup
      label={t('recent.label')}
      collapsible
      icon={<HistoryIcon />}
      open={open}
      onOpenChange={(next) => {
        setOpen(next)
        writeOpen(next)
      }}
    >
      <RecentList />
    </SidebarGroup>
  )
}

/** The rows of the open group. A child of the group, so a reload of the list starts it afresh. */
function RecentList() {
  const t = useT('chat')
  const [attempt, setAttempt] = useState(0)
  return (
    <>
      <RecentRows key={attempt} onRetry={() => setAttempt((count) => count + 1)} />
      <SidebarItem icon={<MessagesSquareIcon />} label={t('recent.all')} render={<Link to="/topics" />} />
    </>
  )
}

function RecentRows({ onRetry }: { onRetry: () => void }) {
  const t = useT('chat')
  const { locale } = useLocale()
  const { pathname } = useLocation()
  const state = useRuntimeState()
  const answer = useResource({ kind: 'conversations' })

  if (answer.state === 'ready' || answer.state === 'long') {
    // The same view the answer was read from: under 超长内容 it is the long variant, topics included.
    const view = viewOf(state)
    const rows = recentConversations(view, RECENT_LIMIT)
    const label = (title: string, topic: string | undefined, when: string) =>
      topic ? t('recent.row', { title, topic, when }) : t('recent.rowPlain', { title, when })
    const row = (conversation: Conversation) => {
      const to = conversation.surface === 'thread' ? threadPath(conversation.id) : topicPath(conversation.topicId)
      const at = conversation.messages.at(-1)?.at ?? conversation.startedAt
      const when = relativeTime(locale, at, state.storyTime) ?? t('recent.now')
      return (
        <SidebarItem
          key={conversation.id}
          icon={<MessageSquareIcon />}
          label={label(conversation.title[locale], findTopic(view, conversation.topicId)?.title[locale], when)}
          badge={conversation.persistence === 'persistent' ? t('recent.persistent') : undefined}
          current={pathname === to}
          render={<Link to={to} />}
        />
      )
    }
    return <>{rows.map(row)}</>
  }

  return (
    <li className="min-w-0 px-2 py-1 text-sm">
      <DataState
        state={answer.state}
        loadingLabel={t('recent.loading')}
        empty={<p>{t('recent.empty')}</p>}
        errorTitle={t('recent.error.title')}
        error={t('recent.error.body')}
        onRetry={onRetry}
      />
    </li>
  )
}
