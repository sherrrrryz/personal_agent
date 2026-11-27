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

// The trigger, the list and its options are drawn as stock shadcn/ui draws
// them (D-43). Deviations (docs/design/components/inputs.md § Deviations from
// stock): the trigger fills its field, as the kit's input does; the kit cuts a
// chosen value to one line at a fixed height, ours keeps that height as a
// minimum and lets a value that does not fit wrap; and an invalid trigger
// keeps the focus ring while focused.
const triggerClass = `h-auto min-h-8 w-full py-1 text-start whitespace-normal data-[size=default]:h-auto *:data-[slot=select-value]:line-clamp-none *:data-[slot=select-value]:wrap-anywhere ${focusRingOverInvalid}`

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
      {/* The list floats over the page: a frosted surface (D-47). */}
      <SelectContent className="surface-frosted">
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value} disabled={option.disabled} lang={option.lang}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </KitSelect>
  )
}
