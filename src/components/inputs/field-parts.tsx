import { CircleAlert } from 'lucide-react'
import type { ReactNode } from 'react'

import { FieldError } from '@/components/ui/field'

// Parts the field controls share — not components of the system.

/** The error text of a field: an icon and words, never colour alone (hard rule 13). */
export function FieldMessage({ id, children }: { id: string; children: ReactNode }) {
  return (
    <FieldError id={id} className="flex items-start gap-1.5">
      <CircleAlert aria-hidden="true" className="size-4 shrink-0 translate-y-0.5" />
      <span className="min-w-0 wrap-anywhere">{children}</span>
    </FieldError>
  )
}

/** Whether an `error` prop holds something to show. */
export function hasError(error: ReactNode): boolean {
  return error !== undefined && error !== null && error !== false && error !== ''
}

// A labelled row — a switch or one radio option. The kit draws the row as a
// bordered label once it holds a field; the whole row answers a click.
export const choiceRow = 'w-full'

// The control's own hit box is the kit's (it already reaches past the visible mark).
export const choiceHitBox: string | undefined = undefined
