import type { HTMLAttributes } from 'react'

import { cn } from '@/lib/utils'

import { gapClass, type Gap } from './gap'

// Columns by container query: the grid asks how wide *it* is, never the
// viewport, so the same grid is one column in a narrow panel and four on a
// wide page. `min` is the least width an item should have, named after
// Tailwind's shipped container steps; a column is added at the first step
// where one more item of that width fits (the gap comes out of the items).
const columnsClass = {
  /** About 16rem: small cards, stats. */
  '3xs': 'grid-cols-1 @lg:grid-cols-2 @3xl:grid-cols-3 @5xl:grid-cols-4 @7xl:grid-cols-5',
  /** About 20rem: cards with a few lines of text. */
  xs: 'grid-cols-1 @2xl:grid-cols-2 @5xl:grid-cols-3 @7xl:grid-cols-4',
  /** About 24rem: blocks, forms. */
  sm: 'grid-cols-1 @3xl:grid-cols-2 @6xl:grid-cols-3',
  /** About 32rem: two wide halves at most. */
  lg: 'grid-cols-1 @5xl:grid-cols-2',
} as const

export type GridMin = keyof typeof columnsClass

export type GridProps = Omit<HTMLAttributes<HTMLDivElement>, 'className' | 'style'> & {
  /** The least width of an item; decides how many columns fit. */
  min?: GridMin
  /** Space between items, a name of the spacing scale. */
  gap?: Gap
}

/** Equal columns, as many as fit the grid's own width; one column when narrow. */
export function Grid({ min = 'xs', gap = 'md', children, ...rest }: GridProps) {
  return (
    <div className="@container min-w-0" {...rest}>
      <div className={cn('grid', columnsClass[min], gapClass[gap])}>{children}</div>
    </div>
  )
}

export type GridItemProps = Omit<HTMLAttributes<HTMLDivElement>, 'className' | 'style'> & {
  /** `full` takes the whole row whatever the column count. */
  span?: 'auto' | 'full'
}

/** A child of `Grid` that needs more than one column. Plain children need no wrapper. */
export function GridItem({ span = 'auto', ...rest }: GridItemProps) {
  return <div className={cn('min-w-0', span === 'full' && 'col-span-full')} {...rest} />
}
