import { useId, type ReactNode } from 'react'

import { FieldContent, FieldDescription, FieldLabel, FieldTitle, Field as KitField } from '@/components/ui/field'
import { Switch as KitSwitch } from '@/components/ui/switch'

import { choiceHitBox, choiceRow } from './field-parts'

export type SwitchProps = {
  /** The visible label; it is the switch's accessible name. */
  label: ReactNode
  description?: ReactNode
  checked?: boolean
  defaultChecked?: boolean
  onCheckedChange?: (checked: boolean) => void
  disabled?: boolean
  readOnly?: boolean
  required?: boolean
  name?: string
}

/** On or off, taking effect at once. The whole labelled row is the target. */
export function Switch({ label, description, onCheckedChange, disabled, ...rest }: SwitchProps) {
  const id = useId()
  const descriptionId = description ? `${id}-description` : undefined
  return (
    <FieldLabel className={choiceRow}>
      <KitField orientation="horizontal" data-disabled={disabled || undefined}>
        <FieldContent>
          <FieldTitle id={`${id}-title`} className="wrap-anywhere">
            {label}
          </FieldTitle>
          {descriptionId && <FieldDescription id={descriptionId}>{description}</FieldDescription>}
        </FieldContent>
        <KitSwitch
          {...rest}
          disabled={disabled}
          onCheckedChange={(checked) => onCheckedChange?.(checked)}
          aria-labelledby={`${id}-title`}
          aria-describedby={descriptionId}
          className={choiceHitBox}
        />
      </KitField>
    </FieldLabel>
  )
}
