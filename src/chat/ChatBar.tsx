import { useId, useLayoutEffect, useRef, useState, type KeyboardEvent } from 'react'
import { useNavigate } from 'react-router'

import { Button } from '@/components/actions'
import { ChatComposer, ChatMessageList } from '@/components/chat'
import { Collapsible, CollapsibleContent } from '@/components/containers'
import { toast } from '@/components/feedback'
import { useLocale, useT } from '@/i18n'
import { findConversation, findTopic, suggestedPrompts, useRuntimeState, type Conversation } from '@/runtime'

import { MessageAttachmentBlock } from './attachments'
import { ConversationPersistence } from './ConversationPersistence'
import { messagesOf } from './messages'
import { threadPath, topicPath } from './paths'
import { screenName, useChatScreen, type ChatScreen } from './screen'
import { useSend } from './use-send'

// The bar's own padding; the shell's bottom row brings only its top border.
const barClass = 'flex min-w-0 flex-col gap-3 px-4 py-3 md:px-6 lg:px-8'

/**
 * The shell's bottom row (spec part 2 § Chat): a region 与 AI 对话 after
 * `main`. On a screen it is the chat bar — suggestions, the composer and,
 * once something is sent, the in-place panel above them. In a dedicated chat
 * (`/chat/<id>`) it is that conversation's composer and nothing else.
 */
export function ChatBar() {
  const screen = useChatScreen()
  // One bar per address: what is typed or open on one screen does not follow her to the next.
  return screen.threadId ? (
    <ThreadBar key={screen.pathname} conversationId={screen.threadId} />
  ) : (
    <ScreenBar screen={screen} />
  )
}

/** The panel that is open: which conversation, and the screen it was opened on. */
type OpenPanel = { conversationId: string; pathname: string; screen: string; epoch: number }

function ScreenBar({ screen }: { screen: ChatScreen }) {
  const t = useT('chat')
  const { locale } = useLocale()
  const state = useRuntimeState()
  const navigate = useNavigate()
  const { text, setText, sending, send, retry } = useSend(screen.context)
  const [panel, setPanel] = useState<OpenPanel | null>(null)
  const region = useRef<HTMLElement>(null)
  const composer = useRef<HTMLTextAreaElement>(null)

  // The panel belongs to the screen it was opened on and to the story as it stood then: a scene jump
  // (a new `epoch`) closes it — conversation ids repeat between scenes, so the id alone would reopen
  // the panel on another scene's conversation and send the next message into that one.
  const conversation =
    panel && panel.pathname === screen.pathname && panel.epoch === state.epoch ? findConversation(state, panel.conversationId) : undefined
  const open = panel && conversation ? panel : null

  // Offered while nothing is typed; a prompt already asked in the open conversation is not offered again.
  const asked = new Set(conversation?.messages.map((message) => message.script))
  const suggestions =
    text === '' && !sending ? suggestedPrompts(state, screen.context).filter((script) => !asked.has(script.id)) : []

  // The panel grows as the answer arrives. In a window too small for the header, `main` and the
  // bar together the shell scrolls as a whole, and the growth would push the composer she is
  // typing in out of view: keep the bar's end — the composer — in the window while it has focus.
  useLayoutEffect(() => {
    const bar = region.current
    if (!bar || typeof ResizeObserver === 'undefined') return
    const observer = new ResizeObserver(() => {
      if (document.activeElement === composer.current) bar.scrollIntoView({ block: 'end' })
    })
    observer.observe(bar)
    return () => observer.disconnect()
  }, [])

  function onSend(message: string) {
    const sent = send(message, open?.conversationId)
    if (!sent) return
    if (sent.surface === 'thread') {
      // The scripted reply decides the surface: this one is answered in a dedicated chat.
      setPanel(null)
      void navigate(threadPath(sent.conversationId))
      return
    }
    if (!open) {
      const name = screenName(screen.module?.name[locale] ?? '', (module, view) => t('panel.screen.view', { module, view }))
      setPanel({ conversationId: sent.conversationId, pathname: screen.pathname, screen: name || t('panel.screen.unnamed'), epoch: state.epoch })
    }
    // Focus stays in the composer: the panel is a disclosure, the log announces what arrives.
    composer.current?.focus()
  }

  function close() {
    if (!open || !conversation) return
    setPanel(null)
    composer.current?.focus()
    const topic = findTopic(state, conversation.topicId)
    if (!topic) return
    // D-23: closing files the conversation under its topic, and says where.
    toast(t('panel.archived', { topic: topic.title[locale] }), {
      id: 'chat-archived',
      action: { label: t('panel.archived.open'), onClick: () => void navigate(topicPath(topic.id)) },
    })
  }

  function onKeyDown(event: KeyboardEvent) {
    if (event.key !== 'Escape' || !open || event.defaultPrevented || event.nativeEvent.isComposing) return
    // A popup or dialog opened from the panel is drawn elsewhere and takes its own Escape.
    if (!(event.target instanceof Node) || !region.current?.contains(event.target)) return
    event.preventDefault()
    close()
  }

  return (
    // oxlint-disable-next-line jsx-a11y/no-static-element-interactions -- Escape collapses the disclosure from anywhere inside the region
    <section ref={region} aria-label={t('bar.label')} className={barClass} onKeyDown={onKeyDown}>
      <Collapsible open={open !== null}>
        <CollapsibleContent>
          {open && conversation && (
            <InPlacePanel
              panel={open}
              conversation={conversation}
              screenModuleId={screen.module?.id}
              onRetry={() => retry(conversation.id)}
              onOpenThread={() => {
                setPanel(null)
                void navigate(threadPath(conversation.id))
              }}
              onClose={close}
            />
          )}
        </CollapsibleContent>
      </Collapsible>
      {suggestions.length > 0 && (
        <ul aria-label={t('bar.suggestions')} className="flex min-w-0 flex-wrap gap-2">
          {suggestions.map((script) => (
            <li key={script.id} className="min-w-0">
              <Button variant="secondary" size="sm" onClick={() => onSend(script.prompt[locale])}>
                {script.prompt[locale]}
              </Button>
            </li>
          ))}
        </ul>
      )}
      <ChatComposer
        ref={composer}
        placement="bar"
        placeholder={t('bar.placeholder')}
        value={text}
        onValueChange={setText}
        onSend={onSend}
        sending={sending}
      />
    </section>
  )
}

/**
 * The panel's upper limit, measured in the shell it stands in (`undefined` outside one): half of
 * the shell's block size, and less when the window is too short for that — whatever the header,
 * `main` at its minimum and the rest of the bar leave, so that opening the panel does not make the
 * whole shell scroll. It never falls under the minimum `main` itself is given: in a window too
 * small for both, the shell scrolls as a whole (its own fallback) rather than the panel vanishing.
 */
function usePanelLimit(inside: { current: HTMLElement | null }): number | undefined {
  const [limit, setLimit] = useState<number>()
  useLayoutEffect(() => {
    const panel = inside.current
    const shell = panel?.closest<HTMLElement>('[data-shell]')
    const row = panel?.closest<HTMLElement>('[data-shell-bar]')
    if (!panel || !shell || !row || typeof ResizeObserver === 'undefined') return
    const main = shell.querySelector<HTMLElement>(':scope > main')
    const measure = () => {
      const floor = main ? parseFloat(getComputedStyle(main).minHeight) || 0 : 0
      let chrome = 0
      for (const part of shell.children) {
        if (part !== main && part !== row && part instanceof HTMLElement) chrome += part.offsetHeight
      }
      // The row's size less the panel's does not change as the panel grows: no loop.
      const room = shell.clientHeight - chrome - floor - (row.offsetHeight - panel.offsetHeight)
      setLimit(Math.floor(Math.max(floor, Math.min(shell.clientHeight / 2, room))))
    }
    const observer = new ResizeObserver(measure)
    observer.observe(shell)
    observer.observe(row)
    return () => observer.disconnect()
  }, [inside])
  return limit
}

/**
 * The in-place panel: heading 关于：<screen>, the conversation, then one row —
 * the persistence switch, 在专门对话中打开, 关闭. Not a dialog: the screen
 * behind stays in use. It is never taller than half the shell — less in a
 * short window (`usePanelLimit`) — and scrolls inside, so `main` keeps its room.
 */
function InPlacePanel({
  panel,
  conversation,
  screenModuleId,
  onRetry,
  onOpenThread,
  onClose,
}: {
  panel: OpenPanel
  conversation: Conversation
  screenModuleId?: string
  onRetry: () => void
  onOpenThread: () => void
  onClose: () => void
}) {
  const t = useT('chat')
  const { locale } = useLocale()
  const headingId = useId()
  const scroller = useRef<HTMLDivElement>(null)
  // A measured limit, not a design value: it follows whatever block size the shell has in this window.
  const maxBlockSize = usePanelLimit(scroller)

  // The panel is the scroller, so it decides what a new message shows: the newest exchange from
  // its start — her question, or the answer's first line when the question alone would fill the
  // panel — whatever the panel's size and however long the answer grows. Only the panel moves (the
  // shell around it stays), and it stops as soon as she scrolls: a new message starts it again.
  const messages = messagesOf(conversation, locale)
  const last = messages.at(-1)
  const newest = `${messages.length}:${last?.id}`
  const grown = `${last?.status}:${last?.text.length}`
  const pin = useRef({ newest: '', top: 0, on: true })
  useLayoutEffect(() => {
    const panel = scroller.current
    if (!panel) return
    const kept = pin.current
    if (kept.newest !== newest) {
      kept.newest = newest
      kept.on = true
    } else if (Math.abs(panel.scrollTop - kept.top) > 1) {
      kept.on = false
    }
    if (!kept.on) return
    const items = [...panel.querySelectorAll<HTMLElement>('[data-slot="chat-message-list"] [data-author]')]
    const answer = items.at(-1)
    if (!answer) return
    const question = answer.dataset.author === 'user' ? answer : items.findLast((item) => item.dataset.author === 'user')
    const top = (item: HTMLElement) => item.getBoundingClientRect().top
    const whole = question !== undefined && top(answer) - top(question) < panel.clientHeight / 2
    const from = whole ? question : answer
    if (from === items[0]) {
      // The first message: the heading above it stays in view too.
      panel.scrollTop = 0
    } else {
      const inset = parseFloat(getComputedStyle(panel).paddingBlockStart) || 0
      panel.scrollTop += top(from) - panel.getBoundingClientRect().top - inset
    }
    kept.top = panel.scrollTop
  }, [newest, grown, maxBlockSize])

  return (
    <div
      ref={scroller}
      role="group"
      aria-labelledby={headingId}
      tabIndex={0}
      data-chat-panel=""
      style={{ maxBlockSize }}
      className="flex min-w-0 flex-col gap-3 overflow-y-auto rounded-lg border p-3 outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
    >
      <h2 id={headingId} className="text-base font-semibold wrap-anywhere">
        {t('panel.heading', { screen: panel.screen })}
      </h2>
      <ChatMessageList
        label={t('panel.log')}
        messages={messages}
        // The list's own following scrolls every scroller around it; here the panel does it (above).
        follow={false}
        onRetry={onRetry}
        renderAttachment={(attachment, message) => (
          <MessageAttachmentBlock
            attachment={attachment}
            messageId={message.id}
            index={message.attachments?.indexOf(attachment) ?? 0}
            level={3}
          />
        )}
      />
      <div className="flex min-w-0 flex-wrap items-start justify-between gap-x-4 gap-y-3">
        <div className="min-w-0 flex-1 basis-64">
          <ConversationPersistence conversation={conversation} screenModuleId={screenModuleId} />
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" onClick={onOpenThread}>
            {t('panel.openThread')}
          </Button>
          <Button variant="secondary" onClick={onClose}>
            {t('panel.close')}
          </Button>
        </div>
      </div>
    </div>
  )
}

/** In a dedicated chat the bottom row is that conversation's composer (no in-place panel there). */
function ThreadBar({ conversationId }: { conversationId: string }) {
  const t = useT('chat')
  const conversation = useRuntimeState((state) => findConversation(state, conversationId))
  const { text, setText, sending, send } = useSend({ moduleId: conversation?.moduleId })
  return (
    <section aria-label={t('bar.label')} className={barClass}>
      <ChatComposer
        placement="thread"
        label={t('thread.label')}
        value={text}
        onValueChange={setText}
        onSend={(message) => send(message, conversationId)}
        sending={sending}
        disabled={!conversation}
      />
    </section>
  )
}
