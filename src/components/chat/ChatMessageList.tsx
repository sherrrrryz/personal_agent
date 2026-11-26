import { CircleAlert, MessagesSquare } from 'lucide-react'
import { useEffect, useRef, type ReactNode } from 'react'

import { Button } from '@/components/actions'
import { Item, ItemContent, ItemGroup, ItemMedia, ItemTitle } from '@/components/data-display'
import { DataState, type DataStateValue } from '@/components/feedback'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'
import { Skeleton } from '@/components/ui/skeleton'
import { Spinner } from '@/components/ui/spinner'
import { useFormat, useT } from '@/i18n'

export type ChatMessageAuthor = 'user' | 'ai'
export type ChatMessageStatus = 'done' | 'streaming' | 'failed'

/**
 * One message as the list shows it. The runtime's `Message` fits once its
 * text is resolved to the locale; `Attachment` is whatever the surface's
 * `renderAttachment` understands — the list never looks inside one.
 */
export type ChatMessage<Attachment = unknown> = {
  id: string
  author: ChatMessageAuthor
  /** Plain text; line breaks are kept. While `streaming`: the part that has arrived. */
  text: string
  /** When it was sent, as an ISO date-time. */
  at?: string
  /** `streaming`: the answer is arriving. `failed`: it did not come and can be asked for again. Default `done`. */
  status?: ChatMessageStatus
  attachments?: ReadonlyArray<Attachment>
}

export type ChatMessageListProps<Attachment = unknown> = {
  messages: ReadonlyArray<ChatMessage<Attachment>>
  /**
   * The state of the conversation as data. Default: `empty` with no message,
   * else `ready`. `loading` and `error` are for a conversation being fetched —
   * a failed answer is a message with status `failed`, not this.
   */
  state?: DataStateValue
  /** Draws one attachment (the chat surfaces pass the block renderer). Without it attachments are not shown. */
  renderAttachment?: (attachment: Attachment, message: ChatMessage<Attachment>) => ReactNode
  /** Asks again for a failed answer; shows the retry button on it. */
  onRetry?: (messageId: string) => void
  /** Fetches the conversation again; shows the retry button of the `error` state. */
  onReload?: () => void
  /** A record to read: no retry, and nothing is announced as it changes. */
  readOnly?: boolean
  /** The name of the log. Default: "Conversation". Two lists on one page need two names. */
  label?: string
  /** What she is called beside her messages. Default: "You". */
  userName?: string
  /** What the AI is called beside its messages. Default: "AI". */
  aiName?: string
  /** While `empty`: the kit's `Empty` in the surface's own words. */
  empty?: ReactNode
  /** While `error`: title and reason in the surface's own words. */
  errorTitle?: ReactNode
  error?: ReactNode
  /**
   * Keeps the newest message in view as messages arrive or an answer grows —
   * unless she has scrolled away from the end. Default: on, off when `readOnly`.
   * It never scrolls when the list first appears.
   */
  follow?: boolean
}

const statusClass =
  'flex min-w-0 items-center gap-2 rounded-lg text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50'

// Message text: her line breaks kept, a long word or address broken rather than pushed past the edge.
const textClass = 'min-w-0 text-base whitespace-pre-wrap wrap-anywhere'

/**
 * A conversation: who said what, in order, with whatever a message carries
 * drawn through `renderAttachment`. A `log` that says each new message
 * politely. It does not scroll by itself — the surface around it does.
 */
export function ChatMessageList<Attachment = unknown>({
  messages,
  state,
  renderAttachment,
  onRetry,
  onReload,
  readOnly = false,
  label,
  userName,
  aiName,
  empty,
  errorTitle,
  error,
  follow = !readOnly,
}: ChatMessageListProps<Attachment>) {
  const t = useT('chat-components')
  const common = useT('common')
  const format = useFormat()
  const shown = state ?? (messages.length === 0 ? 'empty' : 'ready')

  const end = useRef<HTMLDivElement>(null)
  // Whether the end of the list was on screen before the latest change; true until measured.
  const endInView = useRef(true)
  useEffect(() => {
    const marker = end.current
    if (!marker || typeof IntersectionObserver === 'undefined') return
    const observer = new IntersectionObserver(([entry]) => {
      endInView.current = entry.isIntersecting
    })
    observer.observe(marker)
    return () => observer.disconnect()
  }, [shown])

  const last = messages.at(-1)
  const tail = `${messages.length}:${last?.id}:${last?.status}:${last?.text.length}`
  const seen = useRef(tail)
  const count = useRef(messages.length)
  useEffect(() => {
    if (seen.current === tail) return
    seen.current = tail
    const added = messages.length > count.current
    count.current = messages.length
    if (!follow) return
    // Her own message always comes into view; an answer only if she is still at the end.
    if (endInView.current || (added && last?.author === 'user')) end.current?.scrollIntoView?.({ block: 'nearest' })
  }, [tail, follow, messages.length, last?.author])

  function retry(message: ChatMessage<Attachment>, status: HTMLElement | null) {
    // The button is about to leave; focus goes to the status line of the same message.
    status?.focus()
    onRetry?.(message.id)
  }

  return (
    <DataState
      state={shown}
      loadingLabel={t('list.loading')}
      loading={<MessageSkeleton />}
      empty={
        empty ?? (
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <MessagesSquare aria-hidden="true" />
              </EmptyMedia>
              <EmptyTitle>{t('list.empty.title')}</EmptyTitle>
              <EmptyDescription>{t('list.empty.body')}</EmptyDescription>
            </EmptyHeader>
          </Empty>
        )
      }
      errorTitle={errorTitle ?? t('list.error.title')}
      error={error ?? t('list.error.body')}
      onRetry={onReload}
    >
      <div
        role="log"
        aria-label={label ?? t('list.label')}
        aria-live={readOnly ? 'off' : 'polite'}
        data-slot="chat-message-list"
        className="min-w-0"
      >
        <ItemGroup>
          {messages.map((message) => {
            const status = message.status ?? 'done'
            const mine = message.author === 'user'
            const sent = message.at ? new Date(message.at) : null
            return (
              <Item key={message.id} variant={mine ? 'muted' : 'outline'} data-author={message.author} data-status={status}>
                <ItemMedia className="self-start">
                  {/* The name is beside it as text; the avatar is decoration. */}
                  <Avatar aria-hidden="true">
                    <AvatarFallback>{t(mine ? 'list.initial.user' : 'list.initial.ai')}</AvatarFallback>
                  </Avatar>
                </ItemMedia>
                <ItemContent>
                  <ItemTitle>
                    <span>{mine ? (userName ?? t('list.author.user')) : (aiName ?? t('list.author.ai'))}</span>
                    {sent && !Number.isNaN(sent.getTime()) && (
                      <time dateTime={message.at} className="font-normal text-muted-foreground">
                        {format.dateTime(sent)}
                      </time>
                    )}
                  </ItemTitle>
                  {message.text !== '' &&
                    (status === 'streaming' ? (
                      // Each arriving piece would be read out one by one: the partial text is kept
                      // out of the announcements, and the finished text — a new element, by its
                      // key — is said once, whole.
                      <p key="partial" aria-live="off" className={textClass}>
                        {message.text}
                      </p>
                    ) : (
                      <p key="whole" className={textClass}>
                        {message.text}
                      </p>
                    ))}
                  {status !== 'done' && (
                    <MessageStatus
                      failed={status === 'failed'}
                      streamingText={t('list.streaming')}
                      failedText={t('list.failed')}
                      retryLabel={!readOnly && onRetry ? common('action.retry') : null}
                      onRetry={(element) => retry(message, element)}
                    />
                  )}
                </ItemContent>
                {renderAttachment && message.attachments && message.attachments.length > 0 && (
                  // Under the whole message, not in the text column: a block needs the full inline size.
                  <div data-slot="chat-message-attachments" className="flex min-w-0 basis-full flex-col gap-3">
                    {message.attachments.map((attachment, index) => (
                      // Attachments have no identity the list can read; their order is fixed.
                      <div key={index} className="min-w-0">
                        {renderAttachment(attachment, message)}
                      </div>
                    ))}
                  </div>
                )}
              </Item>
            )
          })}
        </ItemGroup>
        <div ref={end} data-slot="chat-message-list-end" />
      </div>
    </DataState>
  )
}

type MessageStatusProps = {
  failed: boolean
  streamingText: string
  failedText: string
  /** `null`: no retry is offered. */
  retryLabel: string | null
  onRetry: (status: HTMLElement | null) => void
}

/** What an unfinished message says about itself: answering, or failed with a way to ask again. Icon and words, never colour alone. */
function MessageStatus({ failed, streamingText, failedText, retryLabel, onRetry }: MessageStatusProps) {
  const line = useRef<HTMLParagraphElement>(null)
  return (
    <div className="flex min-w-0 flex-wrap items-center gap-2 pt-1">
      <p ref={line} tabIndex={-1} data-slot="chat-message-status" className={statusClass}>
        {failed ? (
          <CircleAlert aria-hidden="true" className="size-4 shrink-0" />
        ) : (
          <Spinner role={undefined} aria-hidden="true" className="shrink-0" />
        )}
        <span className="min-w-0 wrap-anywhere">{failed ? failedText : streamingText}</span>
      </p>
      {failed && retryLabel && (
        <Button variant="secondary" size="sm" onClick={() => onRetry(line.current)}>
          {retryLabel}
        </Button>
      )}
    </div>
  )
}

/** The shape of three messages, for the `loading` state. */
function MessageSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      {['w-full', 'w-3/4', 'w-1/2'].map((width) => (
        <div key={width} className="flex gap-2.5 px-3 py-2.5">
          <Skeleton className="size-8 shrink-0 rounded-full" />
          <div className="flex min-w-0 flex-1 flex-col gap-2">
            <Skeleton className="h-4 w-1/4" />
            <Skeleton className={`h-4 ${width}`} />
          </div>
        </div>
      ))}
    </div>
  )
}
