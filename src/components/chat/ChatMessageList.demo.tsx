import { useEffect, useState } from 'react'

import { Button, ToggleGroup, ToggleGroupItem } from '@/components/actions'
import { DemoGroup } from '@/components/actions/demo-parts'
import { Stack } from '@/components/layout'
import { useT } from '@/i18n'

import { ChatMessageList, type ChatMessage } from './ChatMessageList'

type DemoAttachment = { title: string; body: string }
type DemoMessage = ChatMessage<DemoAttachment>

const views = ['conversation', 'empty', 'loading', 'error'] as const
type View = (typeof views)[number]

/**
 * The view the first list opens in: the conversation, or the state named by
 * `?preview=` — the parameter the matrix adds with `--preview`. `loading`
 * keeps the page busy, so that run uses `--cells smoke`.
 */
function initialView(): View {
  const preview = new URLSearchParams(window.location.search).get('preview')
  return views.find((view) => view === preview) ?? 'conversation'
}

const at = (minute: number) => `2026-11-21T19:${String(minute).padStart(2, '0')}:00+08:00`

export default function ChatMessageListDemo() {
  const t = useT('chat-components')
  const [view, setView] = useState<View>(initialView)
  const [extra, setExtra] = useState(0)
  const [retries, setRetries] = useState(0)
  // The failed answer of the third group: asked again, it streams, then arrives.
  const [retried, setRetried] = useState<'failed' | 'streaming' | 'done'>('failed')
  useEffect(() => {
    if (retried !== 'streaming') return
    const timer = window.setTimeout(() => setRetried('done'), 1500)
    return () => window.clearTimeout(timer)
  }, [retried])

  const asked: DemoMessage = { id: 'u1', author: 'user', text: t('demo.list.user1'), at: at(30) }
  const opening: DemoMessage[] = [
    asked,
    {
      id: 'a1',
      author: 'ai',
      text: t('demo.list.ai1'),
      at: at(30),
      attachments: [{ title: t('demo.list.attachmentTitle'), body: t('demo.list.attachmentBody') }],
    },
    { id: 'u2', author: 'user', text: t('demo.list.user2'), at: at(32) },
    { id: 'a2', author: 'ai', text: t('demo.list.ai2'), at: at(32) },
  ]
  const added: DemoMessage[] = Array.from({ length: extra }, (_, index) => ({
    id: `x${index}`,
    author: index % 2 === 0 ? 'user' : 'ai',
    text: t(index % 2 === 0 ? 'demo.list.numbered' : 'demo.list.numberedAi', { n: index + 1 }),
  }))

  const retriedAnswer: DemoMessage =
    retried === 'done'
      ? { id: 'a1', author: 'ai', text: t('demo.list.ai2') }
      : { id: 'a1', author: 'ai', text: '', status: retried }

  // A 2,000-character message, then the rest of the sixty.
  const sentence = t('demo.list.sentence')
  const twoThousand = sentence.repeat(Math.ceil(2000 / sentence.length)).slice(0, 2000)
  const sixty: DemoMessage[] = Array.from({ length: 60 }, (_, index) => ({
    id: `m${index}`,
    author: index % 2 === 0 ? 'user' : 'ai',
    text: index === 1 ? twoThousand : t(index % 2 === 0 ? 'demo.list.numbered' : 'demo.list.numberedAi', { n: index + 1 }),
  }))

  return (
    <Stack gap="lg">
      <ToggleGroup aria-label={t('demo.list.pick')} required value={view} onValueChange={(next) => next && setView(next)}>
        {views.map((value) => (
          <ToggleGroupItem key={value} value={value}>
            {t(`demo.list.${value}`)}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
      <p className="text-sm text-muted-foreground">{t('demo.list.note')}</p>
      <ChatMessageList<DemoAttachment>
        messages={view === 'conversation' ? [...opening, ...added] : []}
        state={view === 'loading' || view === 'error' ? view : undefined}
        onReload={() => setView('conversation')}
        renderAttachment={(attachment) => (
          <div className="flex min-w-0 flex-col gap-1 rounded-lg border bg-card p-3 text-card-foreground">
            <p className="text-sm text-muted-foreground">{t('demo.list.attachmentCaption')}</p>
            <p className="font-medium wrap-anywhere">{attachment.title}</p>
            <p className="wrap-anywhere">{attachment.body}</p>
          </div>
        )}
      />
      <div className="flex">
        <Button variant="secondary" disabled={view !== 'conversation'} onClick={() => setExtra((before) => before + 1)}>
          {t('demo.list.add')}
        </Button>
      </div>
      <DemoGroup caption={t('demo.list.streamingCaption')}>
        <ChatMessageList
          label={t('demo.list.streaming')}
          messages={[asked, { id: 'a1', author: 'ai', text: t('demo.list.partial'), status: 'streaming' }]}
        />
      </DemoGroup>
      <DemoGroup caption={t('demo.list.failedCaption')}>
        <ChatMessageList
          label={t('demo.list.failed')}
          messages={[asked, retriedAnswer]}
          onRetry={() => {
            setRetries((before) => before + 1)
            setRetried('streaming')
          }}
        />
        <p role="status" className="text-sm text-muted-foreground">
          {retries > 0 && t('demo.list.retried', { count: retries })}
        </p>
      </DemoGroup>
      <DemoGroup caption={t('demo.list.readOnly')}>
        <ChatMessageList
          readOnly
          label={t('demo.list.readOnly')}
          onRetry={() => undefined}
          messages={[asked, { id: 'a1', author: 'ai', text: '', status: 'failed' }]}
        />
      </DemoGroup>
      <DemoGroup caption={t('demo.list.longCaption')}>
        {/* What the in-place panel does: a region of limited height that scrolls and can be reached by keyboard. */}
        <div
          role="group"
          aria-label={t('demo.list.scroller')}
          tabIndex={0}
          className="max-h-96 min-w-0 overflow-y-auto rounded-lg border p-2 outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          <ChatMessageList label={t('demo.list.long')} messages={sixty} />
        </div>
      </DemoGroup>
    </Stack>
  )
}
