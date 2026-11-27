import { useEffect, useId, useRef, useState } from 'react'
import { useNavigate } from 'react-router'

import { Button } from '@/components/actions'
import { ChatComposer, ChatMessageList, type ChatMessage } from '@/components/chat'
import { Inline, Page, Stack } from '@/components/layout'
import { interview, interviewMessages, longInterview } from '@/fixtures'
import { useLocale, useT, type Locale } from '@/i18n'
import { SIMULATED_DELAY, useRuntimeState, type Message } from '@/runtime'

import { onboardingPaths, settingsPaths, useOnboarding, useReentry } from './paths'

const total = interview.questions.length

/** Her answer to question `index` as the list shows it: her own words if she typed, else the scripted answer. */
function answerId(index: number): string {
  return `interview-${interview.questions[index].id}-answer`
}

function shown(messages: Message[], said: Record<number, string>, locale: Locale): ChatMessage[] {
  const own = new Map(Object.entries(said).map(([index, text]) => [answerId(Number(index)), text]))
  return messages.map((message) => ({
    id: message.id,
    author: message.author,
    text: own.get(message.id) ?? message.text[locale],
    at: message.at,
    status: message.status,
  }))
}

/**
 * `onboarding.profession` — step 1 (D-30): the AI asks four things in turn,
 * her scripted answer types itself into the composer and she sends it
 * (D-48), and the AI closes with a summary; then 继续. The states follow 状态预览 from the address: 加载中 is a
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
  const [reply, setReply] = useState<'idle' | 'streaming' | 'failed'>('idle')
  const [draft, setDraft] = useState('')
  const noteId = useId()

  const long = preview === 'long'
  const done = long || answered >= total
  // A forced preview shows its state at once: as if she had just answered.
  const forced = preview === 'loading' ? 'streaming' : preview === 'error' ? 'failed' : 'idle'
  const pending = done ? 'idle' : reply === 'idle' ? forced : reply

  useEffect(() => {
    // 加载中 leaves the reply arriving for as long as the preview lasts.
    if (reply !== 'streaming' || preview === 'loading') return
    const timer = setTimeout(() => {
      if (preview === 'error') setReply('failed')
      else {
        setAnswered(answered + 1)
        setReply('idle')
      }
    }, SIMULATED_DELAY)
    return () => clearTimeout(timer)
  }, [reply, preview, answered, setAnswered])

  // The composer stays at the end of the window (it is sticky), so the newest message would arrive
  // underneath it: after each exchange the end of the page is brought into view. Not when the step
  // opens — a long interview is read from its start.
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
    const still = typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
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
    if (done || pending === 'streaming') return
    cancelAnimationFrame(frame.current)
    setSaid({ ...said, [answered]: text })
    setDraft('')
    setReply('streaming')
  }

  const messages = long ? shown(longInterview(), {}, locale) : shown(interviewMessages(answered), said, locale)
  if (pending !== 'idle') {
    const question = interview.questions[answered]
    const next = answered + 1 < total ? interview.questions[answered + 1].question : interview.summary
    const arriving = next[locale]
    messages.push(
      { id: answerId(answered), author: 'user', text: said[answered] ?? question.answer[locale] },
      {
        id: 'interview-reply',
        author: 'ai',
        // The part of the reply that has arrived so far.
        text: pending === 'streaming' ? arriving.slice(0, Math.ceil(arriving.length / 2)) : '',
        status: pending,
      },
    )
  }

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
      <ChatMessageList messages={messages} label={t('profession.log')} follow={false} onRetry={() => setReply('streaming')} />
      {/* The composer stays at the end of the window while the interview scrolls above it. */}
      <div className="sticky bottom-0 bg-background py-4">
        <Stack gap="md">
          <ChatComposer
            placement="onboarding"
            value={draft}
            onValueChange={(text) => {
              cancelAnimationFrame(frame.current)
              setDraft(text)
            }}
            onSend={send}
            sending={pending === 'streaming'}
            disabled={done}
          />
          <Inline gap="sm">
            <Button
              disabled={!done}
              focusableWhenDisabled
              aria-describedby={done ? undefined : noteId}
              onClick={() => navigate(to(onboardingPaths.modules))}
            >
              {t('profession.continue')}
            </Button>
            {!done && (
              <p id={noteId} className="text-sm text-muted-foreground">
                {t('profession.continue.note')}
              </p>
            )}
          </Inline>
        </Stack>
      </div>
      <div ref={end} />
    </Page>
  )
}
