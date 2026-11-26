import {
  Select as KitSelect,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { focusRingOverInvalid } from '@/components/actions/focus-ring'

import { useFieldControl } from './field-context'

export type SelectOption<Value extends string = string> = {
  value: Value
  label: string
  /** The language of the label when it differs from the page's (a locale's own name). */
  lang?: string
  disabled?: boolean
}

export type SelectProps<Value extends string = string> = {
  options: ReadonlyArray<SelectOption<Value>>
  value?: Value | null
  defaultValue?: Value
  onValueChange?: (value: Value) => void
  /** Shown while nothing is chosen. Never the label. */
  placeholder?: string
  disabled?: boolean
  readOnly?: boolean
  required?: boolean
  name?: string
  id?: string
  'aria-label'?: string
  'aria-labelledby'?: string
  'aria-describedby'?: string
  'aria-invalid'?: boolean
}

// The kit's trigger is one fixed line that clamps its value; ours is the
// target minimum, fills its field and wraps a long value.
const triggerClass = `h-auto min-h-target w-full whitespace-normal text-start data-[size=default]:h-auto *:data-[slot=select-value]:line-clamp-none *:data-[slot=select-value]:wrap-anywhere ${focusRingOverInvalid}`

// The kit's option text is one unshrinkable line that the popup would cut;
// its class cannot be reached by a prop, hence the important modifier.
const itemClass = 'min-h-target *:shrink! *:whitespace-normal! wrap-anywhere'

/** One of several, chosen from a list that opens. Inside a `Field` it takes its label from it. */
export function Select<Value extends string = string>({
  options,
  value,
  defaultValue,
  onValueChange,
  placeholder,
  readOnly,
  required,
  name,
  'aria-label': ariaLabel,
  'aria-labelledby': ariaLabelledBy,
  ...own
}: SelectProps<Value>) {
  const control = useFieldControl(own)
  return (
    <KitSelect
      items={options}
      value={value}
      defaultValue={defaultValue}
      onValueChange={(next) => {
        if (next != null) onValueChange?.(next as Value)
      }}
      disabled={control.disabled}
      readOnly={readOnly}
      required={required}
      name={name}
    >
      <SelectTrigger
        id={control.id}
        aria-label={ariaLabel}
        aria-labelledby={ariaLabelledBy}
        aria-describedby={control['aria-describedby']}
        aria-invalid={control['aria-invalid']}
        className={triggerClass}
      >
        <SelectValue placeholder={placeholder}>
          {(current: Value | null) => {
            const option = options.find((candidate) => candidate.value === current)
            return option ? <span lang={option.lang}>{option.label}</span> : placeholder
          }}
        </SelectValue>
      </SelectTrigger>
      {/* No shadow in the placeholder theme: the list separates from the page by its border. */}
      <SelectContent alignItemWithTrigger={false} className="border">
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value} disabled={option.disabled} lang={option.lang} className={itemClass}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </KitSelect>
  )
}
