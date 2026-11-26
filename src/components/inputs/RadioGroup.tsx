import { useId, type ReactNode } from 'react'

import { FieldContent, FieldDescription, FieldLabel, FieldTitle, Field as KitField } from '@/components/ui/field'
import { RadioGroup as KitRadioGroup, RadioGroupItem } from '@/components/ui/radio-group'

import { choiceHitBox, choiceRow, FieldMessage, hasError } from './field-parts'

export type RadioOption<Value extends string = string> = {
  value: Value
  /** The option's name; an icon inside it is decorative (`aria-hidden`). */
  label: ReactNode
  /** One line under the name, read after it. */
  description?: ReactNode
  disabled?: boolean
}

export type RadioGroupProps<Value extends string = string> = {
  /** The visible legend; it is the group's accessible name. */
  legend: ReactNode
  description?: ReactNode
  /** Present → the group is invalid and this text says how to fix it. */
  error?: ReactNode
  options: ReadonlyArray<RadioOption<Value>>
  value?: Value
  defaultValue?: Value
  onValueChange?: (value: Value) => void
  disabled?: boolean
  readOnly?: boolean
  required?: boolean
  name?: string
}

/** One of a few, all visible. Each option is a labelled row that is the target as a whole. */
export function RadioGroup<Value extends string = string>({
  legend,
  description,
  error,
  options,
  onValueChange,
  disabled,
  ...rest
}: RadioGroupProps<Value>) {
  const id = useId()
  const invalid = hasError(error)
  const descriptionId = description ? `${id}-description` : undefined
  const errorId = invalid ? `${id}-error` : undefined
  return (
    <div className="flex min-w-0 flex-col gap-2" data-invalid={invalid || undefined}>
      <FieldTitle id={`${id}-legend`} className="wrap-anywhere">
        {legend}
      </FieldTitle>
      {descriptionId && <FieldDescription id={descriptionId}>{description}</FieldDescription>}
      <KitRadioGroup
        {...rest}
        disabled={disabled}
        onValueChange={(next) => onValueChange?.(next as Value)}
        aria-labelledby={`${id}-legend`}
        aria-describedby={[descriptionId, errorId].filter(Boolean).join(' ') || undefined}
        aria-invalid={invalid || undefined}
      >
        {options.map((option, index) => {
          const optionDescriptionId = option.description ? `${id}-${index}-description` : undefined
          return (
            <FieldLabel key={option.value} className={choiceRow}>
              <KitField orientation="horizontal" data-disabled={disabled || option.disabled || undefined}>
                <RadioGroupItem
                  value={option.value}
                  disabled={option.disabled}
                  aria-labelledby={`${id}-${index}-title`}
                  aria-describedby={optionDescriptionId}
                  className={choiceHitBox}
                />
                <FieldContent>
                  <FieldTitle id={`${id}-${index}-title`} className="wrap-anywhere">
                    {option.label}
                  </FieldTitle>
                  {optionDescriptionId && (
                    <FieldDescription id={optionDescriptionId}>{option.description}</FieldDescription>
                  )}
                </FieldContent>
              </KitField>
            </FieldLabel>
          )
        })}
      </KitRadioGroup>
      {errorId && <FieldMessage id={errorId}>{error}</FieldMessage>}
    </div>
  )
}
