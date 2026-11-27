import { Check, CircleAlert, ListChecks, MessagesSquare } from 'lucide-react'
import { useEffect, useRef, useState, type ReactNode } from 'react'

import { Button } from '@/components/actions'
import { DataState, type DataStateValue } from '@/components/feedback'
import { Bubble, BubbleContent } from '@/components/ui/bubble'
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'
import { Message, MessageContent, MessageHeader } from '@/components/ui/message'
import {
  MessageScroller,
  MessageScrollerButton,
  MessageScrollerContent,
  MessageScrollerItem,
  MessageScrollerProvider,
  MessageScrollerViewport,
} from '@/components/ui/message-scroller'
import { Skeleton } from '@/components/ui/skeleton'
import { Spinner } from '@/components/ui/spinner'
import {
  Trace,
  TraceCollapsible,
  TraceCollapsibleContent,
  TraceCollapsibleTrigger,
  TraceIcon,
  TraceLine,
  TraceTitle,
} from '@/components/ui/trace'
import { useFormat, useT } from '@/i18n'
import { prefersReducedMotion } from '@/lib/reduced-motion'
import { motion } from '@/tokens/generated/motion'

export type ChatMessageAuthor = 'user' | 'ai'
export type ChatMessageStatus = 'done' | 'streaming' | 'failed'
/**
 * Where an answer that is still arriving is (D-45): `thinking` — nothing to
 * show yet; `working` — its steps, the last one running; `writing` — its text
 * is being written out; `attaching` — the text is whole, what it carries is
 * on its way.
 */
export type ChatMessagePhase = 'thinking' | 'working' | 'writing' | 'attaching'

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
  /** While `streaming`: where the answer is. Default: `writing` once there is text, `thinking` before. */
  phase?: ChatMessagePhase
  /**
   * What the AI did before answering, in order. While `working` the last one
   * is still running and the steps are open; afterwards they fold away under
   * a line that counts them, and she can open them again.
   */
  steps?: ReadonlyArray<string>
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
  /**
   * Her bubbles: `muted` (default), the kit's grey; `outline`, the kit's
   * bubble on the page's own background — white in light mode (D-54: the
   * onboarding interview, over its gradient).
   */
  userBubble?: 'muted' | 'outline'
  /** While `empty`: the kit's `Empty` in the surface's own words. */
  empty?: ReactNode
  /** While `error`: title and reason in the surface's own words. */
  errorTitle?: ReactNode
  error?: ReactNode
  /**
   * Keeps the newest exchange in view: a new turn of hers goes to the top of
   * the list's viewport and the answer arrives under it (the kit's
   * `scrollAnchor`), so an answer is read from its first line. Default: on,
   * off when `readOnly`. It only ever moves the list's own viewport: a
   * surface that gives the list no limited height — the page scrolls
   * instead — turns it off.
   */
  follow?: boolean
}

const statusClass =
  'flex min-w-0 items-center gap-2 rounded-lg text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50'

// The kit's `TraceTitle` cuts a long line with an ellipsis (`truncate`); ours wrap instead (hard rule 11:
// no clipped text). `text-clip` is what makes the kit's class merge drop `truncate`.
const traceTitleClass = 'text-clip wrap-anywhere'

// Message text: her line breaks kept, a long word or address broken rather than pushed past the edge.
const textClass = 'min-w-0 whitespace-pre-wrap wrap-anywhere'

// The kit's scroller fills its parent. In a parent of limited height that is a flex column the
// list takes the room that is left and scrolls inside; anywhere else it is as tall as its
// messages and the page scrolls. `DataState` takes no class, so its two boxes are reached from here.
const rootClass =
  'flex min-h-0 min-w-0 flex-1 flex-col [&>[data-slot=data-state]]:flex [&>[data-slot=data-state]]:min-h-0 [&>[data-slot=data-state]]:flex-1 [&>[data-slot=data-state]]:flex-col [&>[data-slot=data-state]>[data-slot=data-state-content]]:flex [&>[data-slot=data-state]>[data-slot=data-state-content]]:min-h-0 [&>[data-slot=data-state]>[data-slot=data-state-content]]:flex-1 [&>[data-slot=data-state]>[data-slot=data-state-content]]:flex-col'

/**
 * A conversation: who said what, in order, with whatever a message carries
 * drawn through `renderAttachment`. Built from the kit's Chat parts —
 * `MessageScroller`, `Message`, `Bubble` (D-45): her turns are bubbles at the
 * end, the AI's are unframed text at the start, and the scroller keeps the
 * newest turn in view and offers a jump to the latest message. A `log` that
 * says each new message politely.
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
  userBubble = 'muted',
  empty,
  errorTitle,
  error,
  follow = !readOnly,
}: ChatMessageListProps<Attachment>) {
  const t = useT('chat-components')
  const common = useT('common')
  const format = useFormat()
  const shown = state ?? (messages.length === 0 ? 'empty' : 'ready')
  const name = label ?? t('list.label')

  function retry(message: ChatMessage<Attachment>, status: HTMLElement | null) {
    // The button is about to leave; focus goes to the status line of the same message.
    status?.focus()
    onRetry?.(message.id)
  }

  return (
    <div data-slot="chat-message-list" className={rootClass}>
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
        {/* A record is read from its start; a live conversation opens at its newest message. */}
        <MessageScrollerProvider defaultScrollPosition={readOnly ? 'start' : 'end'}>
          <MessageScroller>
            {/* The viewport's built-in name is English: it takes the log's own. */}
            <MessageScrollerViewport aria-label={name}>
              <MessageScrollerContent aria-label={name} aria-live={readOnly ? 'off' : 'polite'}>
                {messages.map((message) => {
                  const status = message.status ?? 'done'
                  const mine = message.author === 'user'
                  const phase = status === 'streaming' ? (message.phase ?? (message.text === '' ? 'thinking' : 'writing')) : null
                  const steps = mine ? [] : (message.steps ?? [])
                  const sent = message.at ? new Date(message.at) : null
                  return (
                    <MessageScrollerItem
                      key={message.id}
                      messageId={message.id}
                      // A new turn of hers is where the newest exchange starts — only where the list
                      // follows: the kit makes room under an anchored turn, and in a box with no
                      // limit that room would grow without end (§ Pitfalls).
                      scrollAnchor={mine && follow}
                      data-author={message.author}
                      data-status={status}
                      data-phase={phase ?? undefined}
                    >
                      <Message align={mine ? 'end' : 'start'}>
                        <MessageContent>
                          {/* Who said it is text, not only the side it stands on. */}
                          <MessageHeader className="gap-2">
                            <span>{mine ? (userName ?? t('list.author.user')) : (aiName ?? t('list.author.ai'))}</span>
                            {sent && !Number.isNaN(sent.getTime()) && (
                              <time dateTime={message.at} className="font-normal">
                                {format.dateTime(sent)}
                              </time>
                            )}
                          </MessageHeader>
                          {steps.length > 0 && (
                            <MessageSteps
                              steps={steps}
                              running={phase === 'working'}
                              runningTitle={t('list.steps.running')}
                              doneTitle={t('list.steps.done', { count: steps.length })}
                            />
                          )}
                          {mine ? (
                            message.text !== '' && (
                              <Bubble align="end" variant={userBubble}>
                                <BubbleContent render={<p />} className={textClass}>
                                  {message.text}
                                </BubbleContent>
                              </Bubble>
                            )
                          ) : (
                            <AnswerText text={message.text} streaming={status === 'streaming'} />
                          )}
                          {(status === 'failed' || phase === 'thinking' || phase === 'writing' || phase === 'attaching') && (
                            <MessageStatus
                              failed={status === 'failed'}
                              streamingText={phase === 'thinking' ? t('list.thinking') : t('list.streaming')}
                              failedText={t('list.failed')}
                              retryLabel={!readOnly && onRetry ? common('action.retry') : null}
                              onRetry={(element) => retry(message, element)}
                            />
                          )}
                          {renderAttachment && message.attachments && message.attachments.length > 0 && (
                            // Under the text, across the whole message: a block needs the full inline size.
                            <div data-slot="chat-message-attachments" className="flex w-full min-w-0 flex-col gap-3">
                              {message.attachments.map((attachment, index) => (
                                // Attachments have no identity the list can read; their order is fixed.
                                <div key={index} className="min-w-0">
                                  {renderAttachment(attachment, message)}
                                </div>
                              ))}
                            </div>
                          )}
                        </MessageContent>
                      </Message>
                    </MessageScrollerItem>
                  )
                })}
              </MessageScrollerContent>
            </MessageScrollerViewport>
            {/* Named from the messages (kit patch `label`, COMPONENTS.md § Kit patches). */}
            <MessageScrollerButton label={t('list.latest')} />
          </MessageScroller>
        </MessageScrollerProvider>
      </DataState>
    </div>
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
    <div className="flex min-w-0 flex-wrap items-center gap-2">
      <p ref={line} tabIndex={-1} data-slot="chat-message-status" className={statusClass}>
        {failed ? (
          <>
            <CircleAlert aria-hidden="true" className="size-4 shrink-0" />
            <span className="min-w-0 wrap-anywhere">{failedText}</span>
          </>
        ) : (
          // The kit's running line: a spinner, and the words shimmer (not with reduced motion).
          <TraceLine status="running">
            <TraceIcon>
              <Spinner role={undefined} aria-hidden="true" />
            </TraceIcon>
            <TraceTitle className={traceTitleClass}>{streamingText}</TraceTitle>
          </TraceLine>
        )}
      </p>
      {failed && retryLabel && (
        <Button variant="secondary" size="sm" onClick={() => onRetry(line.current)}>
          {retryLabel}
        </Button>
      )}
    </div>
  )
}

type AnswerTextProps = {
  /** While `streaming`: the part that has arrived. */
  text: string
  streaming: boolean
}

/**
 * The AI's text. While the answer is arriving, what newly arrives is written
 * out — a few characters a frame, the whole piece within `motion.reply.write`
 * — instead of standing there at once; with reduced motion it is there at
 * once. Text that was already there when the message was first shown is not
 * written again: a conversation opened later, or a record, is complete.
 */
function AnswerText({ text, streaming }: AnswerTextProps) {
  const characters = Array.from(text)
  const total = characters.length
  const still = prefersReducedMotion()
  // How many characters are shown. It starts at what the message held when it was first drawn.
  const [shown, setShown] = useState(total)
  const reached = useRef(total)

  useEffect(() => {
    if (!streaming || still) {
      reached.current = total
      return
    }
    const start = Math.min(reached.current, total)
    if (start === total) return
    let began: number | null = null
    let frame = requestAnimationFrame(function write(now: number) {
      began ??= now
      const part = Math.min(1, (now - began) / motion.reply.write)
      const next = start + Math.ceil((total - start) * part)
      reached.current = next
      setShown(next)
      if (next < total) frame = requestAnimationFrame(write)
    })
    return () => cancelAnimationFrame(frame)
  }, [streaming, still, total])

  if (text === '') return null
  return (
    <Bubble align="start" variant="ghost">
      {streaming ? (
        // Each arriving piece would be read out one by one: the partial text is kept
        // out of the announcements, and the finished text — a new element, by its
        // key — is said once, whole.
        <BubbleContent key="partial" render={<p />} aria-live="off" className={textClass}>
          {!still && shown < total ? characters.slice(0, shown).join('') : text}
        </BubbleContent>
      ) : (
        <BubbleContent key="whole" render={<p />} className={textClass}>
          {text}
        </BubbleContent>
      )}
    </Bubble>
  )
}

type MessageStepsProps = {
  steps: ReadonlyArray<string>
  /** The last step is still running. */
  running: boolean
  runningTitle: string
  doneTitle: string
}

/**
 * What the AI did before answering — the kit's `Trace` (D-45). While it works
 * the steps are open, the last one running; afterwards they fold away under a
 * line that counts them. She can open and close them herself at any time, and
 * her choice then stands.
 */
function MessageSteps({ steps, running, runningTitle, doneTitle }: MessageStepsProps) {
  const [chosen, setChosen] = useState<boolean | null>(null)
  return (
    <Trace data-slot="chat-message-steps">
      <TraceCollapsible open={chosen ?? running} onOpenChange={(open) => setChosen(open)}>
        <TraceCollapsibleTrigger>
          <TraceLine status={running ? 'running' : undefined}>
            <TraceIcon>{running ? <Spinner role={undefined} aria-hidden="true" /> : <ListChecks />}</TraceIcon>
            <TraceTitle className={traceTitleClass}>{running ? runningTitle : doneTitle}</TraceTitle>
          </TraceLine>
        </TraceCollapsibleTrigger>
        <TraceCollapsibleContent>
          <Trace>
            {steps.map((step, index) => {
              const active = running && index === steps.length - 1
              return (
                // The steps have no identity but their order, which is fixed.
                <TraceLine key={index} status={active ? 'running' : undefined}>
                  <TraceIcon>{active ? <Spinner role={undefined} aria-hidden="true" /> : <Check />}</TraceIcon>
                  <TraceTitle className={traceTitleClass}>{step}</TraceTitle>
                </TraceLine>
              )
            })}
          </Trace>
        </TraceCollapsibleContent>
      </TraceCollapsible>
    </Trace>
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
