import type { ReactNode } from 'react'

import { InputGroupAddon, InputGroup as KitInputGroup } from '@/components/ui/input-group'

import { InputGroupContext } from './field-context'

export type InputGroupProps = {
  /** Before the control: an icon (`aria-hidden`), a unit, a `Button`. */
  start?: ReactNode
  /** After the control. */
  end?: ReactNode
  /** `inline`: beside the control. `block`: `start` above and `end` below it — for a `Textarea`. */
  align?: 'inline' | 'block'
  /** One `Input` or `Textarea`. */
  children: ReactNode
}

// The group draws the border and the focus ring of the control inside it, as
// stock (D-43). The one deviation: an invalid control keeps that ring while
// it is focused (`focusRingOverInvalid`, here for the group's own selector).
// Written out in full: Tailwind reads class names from the source text and
// cannot see one assembled at run time.
const groupClass =
  'has-[[data-slot=input-group-control][aria-invalid=true]:focus-visible]:border-ring has-[[data-slot=input-group-control][aria-invalid=true]:focus-visible]:ring-ring/50 dark:has-[[data-slot=input-group-control][aria-invalid=true]:focus-visible]:ring-ring/50'

/** A text control with something attached to it, inside one border. */
export function InputGroup({ start, end, align = 'inline', children }: InputGroupProps) {
  return (
    <InputGroupContext value={true}>
      <KitInputGroup className={groupClass}>
        {start != null && <InputGroupAddon align={`${align}-start`}>{start}</InputGroupAddon>}
        {children}
        {end != null && <InputGroupAddon align={`${align}-end`}>{end}</InputGroupAddon>}
      </KitInputGroup>
    </InputGroupContext>
  )
}
