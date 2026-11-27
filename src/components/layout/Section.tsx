import { useId } from 'react'
import type { HTMLAttributes, ReactNode } from 'react'

import { cn } from '@/lib/utils'

import { gapClass, type Gap } from './gap'

const headingClass = {
  2: 'text-xl font-semibold',
  3: 'text-lg font-semibold',
  4: 'text-base font-semibold',
} as const

export type SectionLevel = keyof typeof headingClass

export type SectionProps = Omit<HTMLAttributes<HTMLElement>, 'className' | 'style' | 'title'> & {
  /** The heading; it names the section. */
  title: ReactNode
  /** Heading level, by the section's place in the page outline (the page's `h1` is `Page`'s). */
  level?: SectionLevel
  /** Controls that act on the whole section; they wrap under the heading when room runs out. */
  actions?: ReactNode
  /** Space between the heading row and the body, and between direct children of the body. */
  gap?: Gap
  /**
   * One row (D-50): the heading, the body and the actions side by side, wrapping
   * only when they do not fit — for a short body such as a line of figures.
   */
  inline?: boolean
}

/** A titled part of a page: a `section` named by its heading, optional actions, then the body. */
export function Section({ title, level = 2, actions, gap = 'md', inline = false, children, ...rest }: SectionProps) {
  const headingId = useId()
  const Heading = `h${level}` as const
  if (inline) {
    return (
      <section aria-labelledby={headingId} className="flex min-w-0 flex-wrap items-center gap-x-6 gap-y-2" {...rest}>
        <Heading id={headingId} className={cn('min-w-0 wrap-break-word', headingClass[level])}>
          {title}
        </Heading>
        <div className="min-w-0 flex-1">{children}</div>
        {actions ? <div className="flex flex-none flex-wrap items-center gap-2">{actions}</div> : null}
      </section>
    )
  }
  return (
    <section aria-labelledby={headingId} className={cn('flex min-w-0 flex-col', gapClass[gap])} {...rest}>
      <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
        <Heading id={headingId} className={cn('min-w-0 wrap-break-word', headingClass[level])}>
          {title}
        </Heading>
        {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
      </div>
      {children}
    </section>
  )
}
