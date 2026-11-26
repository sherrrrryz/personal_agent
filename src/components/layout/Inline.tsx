import type { HTMLAttributes } from 'react'

import { cn } from '@/lib/utils'

import { gapClass, type Gap } from './gap'

const alignClass = {
  start: 'items-start',
  center: 'items-center',
  end: 'items-end',
  baseline: 'items-baseline',
  stretch: 'items-stretch',
} as const

const justifyClass = {
  start: 'justify-start',
  center: 'justify-center',
  end: 'justify-end',
  between: 'justify-between',
} as const

type InlineElement = 'div' | 'ul' | 'ol' | 'header' | 'footer' | 'span'

export type InlineProps = Omit<HTMLAttributes<HTMLElement>, 'className' | 'style'> & {
  as?: InlineElement
  /** Space between the children, in both directions once they wrap. */
  gap?: Gap
  align?: keyof typeof alignClass
  justify?: keyof typeof justifyClass
}

/** A cluster: children side by side, wrapping onto new lines when room runs out. */
export function Inline({ as: Element = 'div', gap = 'sm', align = 'center', justify = 'start', ...rest }: InlineProps) {
  return (
    <Element
      className={cn('flex min-w-0 flex-wrap', gapClass[gap], alignClass[align], justifyClass[justify])}
      {...rest}
    />
  )
}
