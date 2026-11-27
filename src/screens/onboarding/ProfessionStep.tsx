import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router'

import { Button } from '@/components/actions'
import { ChatComposer, ChatMessageList, type ChatMessage } from '@/components/chat'
import { Page } from '@/components/layout'
import { interview, interviewMessages, longInterview } from '@/fixtures'
import { useLocale, useT, type Locale } from '@/i18n'
import { prefersReducedMotion } from '@/lib/reduced-motion'
import { REPLY_PACE, useRuntimeState, type Message } from '@/runtime'
import { shellPanelClass } from '@/shell/panel'

import { onboardingPaths, settingsPaths, useOnboarding, useOnboardingBar, useReentry } from './paths'

const total = interview.questions.length

/** Her answer to question `index` as the list shows it: her own words if she typed, else the scripted answer. */
function answerId(index: number): string {
  return `interview-${interview.questions[index].id}-answer`
}

/** What a message of the interview carries: the AI's closing summary carries 下一步 (D-52). */
type InterviewAttachment = 'next'

const summaryId = 'interview-summary'

function shown(messages: Message[], said: Record<number, string>, locale: Locale): ChatMessage<InterviewAttachment>[] {
  const own = new Map(Object.entries(said).map(([index, text]) => [answerId(Number(index)), text]))
  return messages.map((message) => ({
    id: message.id,
    author: message.author,
    text: own.get(message.id) ?? message.text[locale],
    at: message.at,
    status: message.status,
    attachments: message.id === summaryId ? (['next'] as const) : undefined,
  }))
}

/**
 * `onboarding.profession` — step 1 (D-30): the AI asks four things in turn,
 * her scripted answer types itself into the composer and she sends it
 * (D-48), and the AI closes with a summary that carries 下一步 (D-52). Each question arrives
 * as a reply does everywhere (D-45): a thinking state, then its text written
 * out. The states follow 状态预览 from the address: 加载中 is a
 * reply still arriving, 出错 a reply that failed (retry in the list), 超长内容
 * the 40-message interview. Empty is how the step opens: the first question
 * is already there.
 */
export function ProfessionStep() {
  const t = useT('onboarding')
  const { locale } = useLocale()
  const navigate = useNavigate()
  const { reentry, to } = useReentry()
  const preview = useRuntimeState((state) => state.preview)
  const { answered, setAnswered, said, setSaid } = useOnboarding()
  // After she sends: the AI thinks for a beat, then its next question is written out.
  const [reply, setReply] = useState<'idle' | 'thinking' | 'writing' | 'failed'>('idle')
  const [draft, setDraft] = useState('')
  const bar = useOnboardingBar()

  const long = preview === 'long'
  const done = long || answered >= total
  // A forced preview shows its state at once: as if she had just answered.
  const forced = preview === 'loading' ? 'writing' : preview === 'error' ? 'failed' : 'idle'
  const pending = done ? 'idle' : reply === 'idle' ? forced : reply
  const arriving = pending === 'thinking' || pending === 'writing'

  useEffect(() => {
    if (reply !== 'thinking' && reply !== 'writing') return
    // 加载中 leaves the reply arriving for as long as the preview lasts.
    if (reply === 'writing' && preview === 'loading') return
    const timer = setTimeout(
      () => {
        if (reply === 'thinking') setReply(preview === 'error' ? 'failed' : 'writing')
        else {
          setAnswered(answered + 1)
          setReply('idle')
        }
      },
      // The list writes the question out over `write`; with reduced motion it is there at once.
      reply === 'thinking' ? REPLY_PACE.beat : prefersReducedMotion() ? 0 : REPLY_PACE.write,
    )
    return () => clearTimeout(timer)
  }, [reply, preview, answered, setAnswered])

  // The composer floats over the end of the page (D-52), so the newest message would arrive
  // underneath it: after each exchange the end of the page is brought into view — the page keeps the
  // composer's room as scroll padding. Not when the step opens — a long interview is read from its start.
  const end = useRef<HTMLDivElement>(null)
  const opened = useRef(true)
  useEffect(() => {
    if (opened.current) opened.current = false
    else end.current?.scrollIntoView?.({ block: 'end' })
  }, [answered, pending])

  // Her scripted answer types itself into the composer, a character a frame, as soon as a question
  // is waiting; she reads it, changes it if she likes, and sends (D-48). With reduced motion it is
  // there at once. Whatever she types herself stops it.
  const scripted = !done && pending === 'idle' ? interview.questions[answered].answer[locale] : null
  const frame = useRef(0)
  useEffect(() => {
    if (scripted === null) return
    const characters = Array.from(scripted)
    const still = prefersReducedMotion()
    let shown = 0
    const type = () => {
      shown = still ? characters.length : shown + 1
      setDraft(characters.slice(0, shown).join(''))
      frame.current = shown < characters.length ? requestAnimationFrame(type) : 0
    }
    frame.current = requestAnimationFrame(type)
    return () => cancelAnimationFrame(frame.current)
  }, [scripted])

  function send(text: string) {
    if (done || arriving) return
    cancelAnimationFrame(frame.current)
    setSaid({ ...said, [answered]: text })
    setDraft('')
    setReply('thinking')
  }

  const messages = long ? shown(longInterview(), {}, locale) : shown(interviewMessages(answered), said, locale)
  if (pending !== 'idle') {
    const asked = interview.questions[answered]
    const next = answered + 1 < total ? interview.questions[answered + 1].question : interview.summary
    const question = next[locale]
    messages.push(
      { id: answerId(answered), author: 'user', text: said[answered] ?? asked.answer[locale] },
      {
        id: 'interview-reply',
        author: 'ai',
        // The part of the reply that has arrived so far: nothing while it thinks, then the question —
        // half of it for as long as 加载中 is forced.
        text: pending !== 'writing' ? '' : reply === 'writing' ? question : question.slice(0, Math.ceil(question.length / 2)),
        status: arriving ? 'streaming' : 'failed',
        phase: arriving ? pending : undefined,
      },
    )
  }

  // The composer, in a floating frosted panel as wide as the page's reading measure.
  const composer = (
    <div className={`${shellPanelClass} mx-auto max-w-prose p-3`} data-onboarding-panel="">
      <ChatComposer
        placement="onboarding"
        value={draft}
        onValueChange={(text) => {
          cancelAnimationFrame(frame.current)
          setDraft(text)
        }}
        onSend={send}
        sending={arriving}
        disabled={done}
      />
    </div>
  )

  return (
    <Page
      title={t('profession.title')}
      description={t('profession.description')}
      width="prose"
      actions={
        reentry ? (
          <Button variant="secondary" onClick={() => navigate(settingsPaths.profession)}>
            {t('action.cancel')}
          </Button>
        ) : undefined
      }
    >
      {/* The page scrolls here, not the list: its own following is off, the step brings the end into view (above). */}
      <ChatMessageList
        messages={messages}
        label={t('profession.log')}
        follow={false}
        userBubble="outline"
        onRetry={() => setReply('thinking')}
        // The AI's closing summary carries 下一步 (D-52): it is there once the summary is whole.
        renderAttachment={(attachment) =>
          attachment === 'next' ? (
            <div className="flex">
              <Button onClick={() => navigate(to(onboardingPaths.modules))}>{t('profession.next')}</Button>
            </div>
          ) : null
        }
      />
      {/* The composer floats in the layout's bottom bar (D-52) while the interview scrolls beneath it. */}
      {bar ? createPortal(composer, bar) : composer}
      <div ref={end} />
    </Page>
  )
}
