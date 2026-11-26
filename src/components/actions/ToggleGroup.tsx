import { useState, type ReactNode } from 'react'

import { ToggleGroup as KitToggleGroup, ToggleGroupItem as KitToggleGroupItem } from '@/components/ui/toggle-group'

import { kitToggleSize, kitToggleVariant, toggleClass, type ToggleSize, type ToggleVariant } from './toggle-class'

/** A group is always named: by `aria-label`, or by the element `aria-labelledby` points at. */
type Naming = { 'aria-label': string; 'aria-labelledby'?: never } | { 'aria-labelledby': string; 'aria-label'?: never }

type Single<Value extends string> = {
  multiple?: false
  value?: Value | null
  defaultValue?: Value
  onValueChange?: (value: Value | null) => void
  /** One item always stays pressed: pressing the pressed item does nothing. */
  required?: boolean
}

type Multiple<Value extends string> = {
  multiple: true
  value?: ReadonlyArray<Value>
  defaultValue?: ReadonlyArray<Value>
  onValueChange?: (value: Value[]) => void
  required?: never
}

export type ToggleGroupProps<Value extends string = string> = Naming &
  (Single<Value> | Multiple<Value>) & {
    variant?: ToggleVariant
    size?: ToggleSize
    disabled?: boolean
    orientation?: 'horizontal' | 'vertical'
    /** `ToggleGroupItem`s. */
    children: ReactNode
  }

const toList = <Value,>(value: Value | ReadonlyArray<Value> | null | undefined): Value[] | undefined =>
  value === undefined ? undefined : value === null ? [] : Array.isArray(value) ? [...value] : [value as Value]

/**
 * Toggles that belong together: one choice of several (`required` keeps one
 * pressed) or any number (`multiple`). One tab stop; the arrows move inside.
 */
export function ToggleGroup<Value extends string = string>(props: ToggleGroupProps<Value>) {
  const { multiple, value, defaultValue, onValueChange, required, variant = 'outline', size = 'md', children, ...rest } = props
  const [own, setOwn] = useState<Value[]>(() => toList<Value>(defaultValue) ?? [])
  const pressed = toList<Value>(value) ?? own
  return (
    <KitToggleGroup
      {...rest}
      multiple={multiple}
      value={pressed}
      onValueChange={(group) => {
        const next = group as Value[]
        if (!multiple && required && next.length === 0) return
        setOwn(next)
        if (multiple) (onValueChange as Multiple<Value>['onValueChange'])?.(next)
        else (onValueChange as Single<Value>['onValueChange'])?.(next[0] ?? null)
      }}
      variant={kitToggleVariant[variant]}
      size={kitToggleSize[size]}
      className="max-w-full flex-wrap"
    >
      {children}
    </KitToggleGroup>
  )
}

export type ToggleGroupItemProps = {
  value: string
  disabled?: boolean
  /** Required when the item shows only an icon. */
  'aria-label'?: string
  children: ReactNode
}

/** One toggle of a `ToggleGroup`. */
export function ToggleGroupItem(props: ToggleGroupItemProps) {
  return <KitToggleGroupItem {...props} className={toggleClass} />
}
