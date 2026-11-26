import { useContext, type ComponentProps } from 'react'

import { Input as KitInput } from '@/components/ui/input'
import { InputGroupInput } from '@/components/ui/input-group'

import { controlClass, groupedControlClass } from './control-class'
import { InputGroupContext, useFieldControl } from './field-context'

export type InputProps = Omit<ComponentProps<'input'>, 'className' | 'style' | 'size'>

/** A one-line text control. Inside a `Field` it takes its label, description and error from it. */
export function Input(props: InputProps) {
  const control = useFieldControl(props)
  return useContext(InputGroupContext) ? (
    <InputGroupInput {...props} {...control} className={groupedControlClass} />
  ) : (
    <KitInput {...props} {...control} className={controlClass} />
  )
}
