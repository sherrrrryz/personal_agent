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
// bordered label once it holds a field; the whole row answers a click. The
// kit fades the border of a checked row to 30% of `primary`, which in the
// grey theme is fainter than the unchecked edge, so the checked row keeps a
// full `primary` border.
export const choiceRow =
  'min-h-target w-full has-data-checked:border-primary dark:has-data-checked:border-primary *:data-[slot=field]:items-center'

// The control's own hit box: the kit widens it past the visible mark; here
// it reaches the target minimum in both directions.
export const choiceHitBox = 'after:-inset-4'
