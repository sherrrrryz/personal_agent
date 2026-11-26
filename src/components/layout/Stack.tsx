import type { HTMLAttributes } from 'react'

import { cn } from '@/lib/utils'

import { gapClass, type Gap } from './gap'

const alignClass = {
  stretch: 'items-stretch',
  start: 'items-start',
  center: 'items-center',
  end: 'items-end',
} as const

type StackElement = 'div' | 'ul' | 'ol' | 'header' | 'footer' | 'article' | 'aside' | 'form'

export type StackProps = Omit<HTMLAttributes<HTMLElement>, 'className' | 'style'> & {
  /** The element to render; a list of items is a `ul` or `ol` of `li`. */
  as?: StackElement
  /** Space between the children, a name of the spacing scale. */
  gap?: Gap
  /** Cross-axis alignment; `stretch` makes every child as wide as the stack. */
  align?: keyof typeof alignClass
}

/** Children one under the other, separated by one gap. */
export function Stack({ as: Element = 'div', gap = 'md', align = 'stretch', ...rest }: StackProps) {
  return <Element className={cn('flex min-w-0 flex-col', gapClass[gap], alignClass[align])} {...rest} />
}
