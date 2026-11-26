import { useRef, useState } from 'react'

import { findConversation, useActions, useRuntime, type ChatContext } from '@/runtime'

/** What a send started: the conversation it went to and where the answer appears. */
export type Sent = { conversationId: string; surface: 'in-place' | 'thread' }

/**
 * The composer's text and the sending of it, for a chat surface. The surface
 * holds the text so that it survives a failed answer (回答失败: her text stays
 * in the composer): it is emptied only once the answer has arrived, and only
 * if she has not typed something else meanwhile.
 */
export function useSend(context: ChatContext) {
  const runtime = useRuntime()
  const actions = useActions()
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  // What was sent and is still in the composer, waiting for its answer.
  const kept = useRef<string | null>(null)

  function settle(conversationId: string) {
    setSending(false)
    const answer = findConversation(runtime.getState(), conversationId)?.messages.at(-1)
    if (answer?.status === 'failed') return
    const sent = kept.current
    kept.current = null
    setText((current) => (current.trim() === sent ? '' : current))
  }

  function start(input: { text: string; conversationId?: string; retry?: boolean }): Sent | null {
    const result = actions.sendMessage({ ...input, context })
    if (!result) return null
    setSending(true)
    void result.done.then(() => settle(result.conversationId))
    return { conversationId: result.conversationId, surface: result.surface }
  }

  return {
    text,
    setText,
    sending,
    /** Sends `message` (the composer's text, or a suggestion put into it). */
    send(message: string, conversationId?: string): Sent | null {
      kept.current = message.trim()
      setText(message)
      return start({ text: message, conversationId })
    },
    /** Asks again for the answer that failed. */
    retry(conversationId: string): void {
      start({ text: '', conversationId, retry: true })
    },
  }
}
