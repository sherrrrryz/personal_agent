import { createContext, useContext } from 'react'

// What a `Field` tells the control inside it, so the label, the description
// and the error text are wired to the control without the screen doing it.
export type FieldContextValue = {
  controlId: string
  describedBy: string | undefined
  invalid: boolean
  disabled: boolean
}

export const FieldContext = createContext<FieldContextValue | null>(null)

/** True inside an `InputGroup`: the control gives its border and ring to the group. */
export const InputGroupContext = createContext(false)

type ControlProps = {
  id?: string
  disabled?: boolean
  'aria-describedby'?: string
  'aria-invalid'?: boolean | 'true' | 'false' | 'grammar' | 'spelling'
}

/**
 * The wiring a control takes from the `Field` around it. Its own `disabled`,
 * description and validity win; the `id` is the field's, because the label
 * points at it.
 */
export function useFieldControl(props: ControlProps) {
  const field = useContext(FieldContext)
  const describedBy = [field?.describedBy, props['aria-describedby']].filter(Boolean).join(' ')
  return {
    id: field?.controlId ?? props.id,
    disabled: props.disabled ?? field?.disabled,
    'aria-describedby': describedBy || undefined,
    'aria-invalid': props['aria-invalid'] ?? (field?.invalid || undefined),
  }
}
