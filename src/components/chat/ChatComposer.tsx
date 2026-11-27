import { ArrowUp } from 'lucide-react'
import { useId, useRef, useState, type FormEvent, type KeyboardEvent, type Ref } from 'react'

import { Button } from '@/components/actions'
import { Field, InputGroup, Textarea } from '@/components/inputs'
import { useT } from '@/i18n'

import type { ChatComposerPlacement } from './composer-placements'


export type ChatComposerProps = {
  /**
   * Where it stands. `bar`: the shell's chat bar — as low as it gets, the key
   * hint kept for assistive technology only. `thread`: a dedicated chat.
   * `onboarding`: the interview — room for a longer answer, the key hint kept
   * for assistive technology only and no focus border around the field (D-54).
   */
  placement?: ChatComposerPlacement
  /**
   * The label; it names the text control. Default: the placement's own. Visible
   * in `thread` and `onboarding`; in `bar` it is kept for assistive technology
   * only (D-49) — there the placeholder says what the control is for.
   */
  label?: string
  /** Shown while nothing is typed. Never the label; keep it shorter than the narrowest line. */
  placeholder?: string
  /** The text, when the surface holds it (to keep it after a failed send, or to show suggestions while it is empty). */
  value?: string
  /** The text it starts with, when the composer holds it; it then empties itself on send. */
  defaultValue?: string
  onValueChange?: (value: string) => void
  /** Called with the trimmed text. Never called with nothing, nor while `sending` or `disabled`. */
  onSend: (text: string) => void
  /** A send is on its way: the text can still be edited, the button is busy and nothing is sent again. */
  sending?: boolean
  disabled?: boolean
  /** The text control, for the surface that returns focus to it. */
  ref?: Ref<HTMLTextAreaElement>
}

// The kit's text control grows with what is typed (`field-sizing: content`).
// Here it starts one line high in the bar and in a thread, and in every
// placement stops at six lines — the kit sets the text smaller from `md` up,
// hence two maxima (six lines and the control's padding) — then scrolls inside.
// Reached through the wrapper because `Textarea` takes no class.
const sixLines = '[&_textarea]:max-h-40 md:[&_textarea]:max-h-34'
// In the bar the label is not drawn (D-49): it stays the control's name, out of
// sight. Reached through the wrapper because `Field` always draws its label.
// In the onboarding interview the field draws no focus border or ring when its text has focus
// (D-54, owner: "聊天框选中后的边框不好看，不要"): the caret says where she types. Reached through
// the wrapper because `InputGroup` takes no class; more specific than the kit's own `has-[…]` rule.
const noFocusBorder =
  '[&_[data-slot=input-group]:has([data-slot=input-group-control]:focus-visible)]:border-input [&_[data-slot=input-group]:has([data-slot=input-group-control]:focus-visible)]:ring-0'
const sizeClass: Record<ChatComposerPlacement, string> = {
  bar: `${sixLines} [&_textarea]:min-h-8 [&_label]:sr-only`,
  thread: `${sixLines} [&_textarea]:min-h-8`,
  onboarding: `${sixLines} [&_textarea]:min-h-24 ${noFocusBorder}`,
}

// Where the key hint (Enter sends, Shift+Enter a new line) is drawn under the field. Elsewhere it is
// kept for assistive technology only: in the bar for room, in the interview on the owner's word (D-54).
const visibleHint: Record<ChatComposerPlacement, boolean> = { bar: false, thread: true, onboarding: false }

// The send button with nothing to send: faded like the kit's disabled button
// (which fades only on the `disabled` attribute), but not while it is busy.
const formClass = 'min-w-0 [&_button[aria-disabled=true]:not([aria-busy=true])]:opacity-50'

/**
 * Where a message to the AI is written and sent, composed as the kit's Chat
 * composes its field (D-45): an `InputGroup` holding the text and, under it,
 * the add-on row with the send button. Enter sends, Shift+Enter starts a new
 * line; the send button does the same for a pointer. It is the same component
 * in the chat bar, in a dedicated chat and in the onboarding interview (D-30).
 */
export function ChatComposer({
  placement = 'bar',
  label,
  placeholder,
  value,
  defaultValue = '',
  onValueChange,
  onSend,
  sending = false,
  disabled = false,
  ref,
}: ChatComposerProps) {
  const t = useT('chat-components')
  const hintId = useId()
  const own = useRef<HTMLTextAreaElement | null>(null)
  const [held, setHeld] = useState(defaultValue)
  const text = value ?? held
  const blank = text.trim() === ''

  function setText(next: string) {
    if (value === undefined) setHeld(next)
    onValueChange?.(next)
  }

  function send() {
    if (blank || sending || disabled) return
    onSend(text.trim())
    // A surface that holds the text decides itself when to empty it.
    if (value === undefined) setText('')
    // The button is about to be disabled (nothing left to send): focus stays with the text.
    own.current?.focus()
  }

  function onKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    // Enter while an input method is composing confirms the candidate; it never sends.
    if (event.key !== 'Enter' || event.shiftKey || event.nativeEvent.isComposing || event.keyCode === 229) return
    event.preventDefault()
    send()
  }

  function onSubmit(event: FormEvent) {
    event.preventDefault()
    send()
  }

  // With nothing to send the button is unavailable but stays in the tab order: a
  // real `disabled` would fade the whole group (the kit's `has-disabled`), and an
  // empty composer must look ready to type in.
  const unavailable = { disabled: disabled || blank, focusableWhenDisabled: !disabled, loading: sending }
  // As the kit's Chat composes its field: the text on top, and under it a row of add-ons that
  // ends with the send button.
  const sendButton = (
    <div className="ms-auto flex">
      <Button type="submit" size="icon" aria-label={t('composer.send')} {...unavailable}>
        <ArrowUp aria-hidden="true" />
      </Button>
    </div>
  )

  return (
    <form data-slot="chat-composer" data-placement={placement} onSubmit={onSubmit} className={`${formClass} ${sizeClass[placement]}`}>
      <Field
        label={label ?? t(`composer.label.${placement}`)}
        description={visibleHint[placement] ? t('composer.hint') : undefined}
        disabled={disabled}
      >
        <InputGroup align="block" end={sendButton}>
          <Textarea
            ref={(node) => {
              own.current = node
              if (typeof ref === 'function') ref(node)
              else if (ref) ref.current = node
            }}
            value={text}
            placeholder={placeholder}
            onChange={(event) => setText(event.target.value)}
            onKeyDown={onKeyDown}
            enterKeyHint="send"
            aria-describedby={visibleHint[placement] ? undefined : hintId}
          />
        </InputGroup>
      </Field>
      {!visibleHint[placement] && (
        <p id={hintId} className="sr-only">
          {t('composer.hint')}
        </p>
      )}
    </form>
  )
}
