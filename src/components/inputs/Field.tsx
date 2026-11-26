import { useId, useMemo, type ReactNode } from 'react'

import { FieldDescription, FieldLabel, Field as KitField } from '@/components/ui/field'

import { FieldContext } from './field-context'
import { FieldMessage, hasError } from './field-parts'

export type FieldProps = {
  /** The visible label; it is the control's accessible name. */
  label: ReactNode
  /** Help text under the control, read after its name. */
  description?: ReactNode
  /** Present → the control is invalid and this text says how to fix it. */
  error?: ReactNode
  disabled?: boolean
  /** One control: `Input`, `Textarea`, `Select` or an `InputGroup` holding one. */
  children: ReactNode
}

/** A labelled control: label above, then the control, its description and its error text. */
export function Field({ label, description, error, disabled = false, children }: FieldProps) {
  const id = useId()
  const invalid = hasError(error)
  const descriptionId = description ? `${id}-description` : undefined
  const errorId = invalid ? `${id}-error` : undefined
  const context = useMemo(
    () => ({
      controlId: `${id}-control`,
      describedBy: [descriptionId, errorId].filter(Boolean).join(' ') || undefined,
      invalid,
      disabled,
    }),
    [id, descriptionId, errorId, invalid, disabled],
  )
  return (
    <FieldContext value={context}>
      <KitField data-invalid={invalid || undefined} data-disabled={disabled || undefined}>
        <FieldLabel htmlFor={context.controlId} className="wrap-anywhere">
          {label}
        </FieldLabel>
        {children}
        {descriptionId && <FieldDescription id={descriptionId}>{description}</FieldDescription>}
        {errorId && <FieldMessage id={errorId}>{error}</FieldMessage>}
      </KitField>
    </FieldContext>
  )
}
