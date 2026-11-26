import { useContext, type ComponentProps } from 'react'

import { InputGroupTextarea } from '@/components/ui/input-group'
import { Textarea as KitTextarea } from '@/components/ui/textarea'

import { stateClass } from './control-class'
import { InputGroupContext, useFieldControl } from './field-context'

export type TextareaProps = Omit<ComponentProps<'textarea'>, 'className' | 'style'>

/** A text control of several lines that grows with what is typed. */
export function Textarea(props: TextareaProps) {
  const control = useFieldControl(props)
  return useContext(InputGroupContext) ? (
    <InputGroupTextarea {...props} {...control} />
  ) : (
    <KitTextarea {...props} {...control} className={stateClass} />
  )
}
