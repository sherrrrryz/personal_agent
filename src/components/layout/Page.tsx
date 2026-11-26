import type { HTMLAttributes, ReactNode } from 'react'

import { cn } from '@/lib/utils'

const widthClass = {
  /** A reading measure: running text, forms, settings. */
  prose: 'max-w-prose',
  /** Lists, grids of blocks, tables. */
  wide: 'max-w-7xl',
  /** Everything the main area has: the canvas, a schedule. */
  full: 'max-w-none',
} as const

export type PageWidth = keyof typeof widthClass

export type PageProps = Omit<HTMLAttributes<HTMLDivElement>, 'className' | 'style' | 'title'> & {
  /** The page's one `h1`. */
  title: ReactNode
  /** One line under the title saying what the page is for. */
  description?: ReactNode
  /** Controls that act on the whole page; they wrap under the title when room runs out. */
  actions?: ReactNode
  width?: PageWidth
}

/**
 * The content of `main`. The only place page padding is set and — with the
 * shell — the only one that reads the viewport: the padding steps up at the
 * `md` and `lg` breakpoint tokens. Everything inside answers to its container.
 */
export function Page({ title, description, actions, width = 'wide', children, ...rest }: PageProps) {
  return (
    <div className="px-4 py-6 md:px-6 md:py-8 lg:px-8" {...rest}>
      <div className={cn('mx-auto flex w-full min-w-0 flex-col gap-6', widthClass[width])}>
        <header className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
          <div className="flex min-w-0 flex-col gap-1">
            <h1 className="text-2xl font-semibold wrap-break-word">{title}</h1>
            {description ? <p className="text-muted-foreground">{description}</p> : null}
          </div>
          {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
        </header>
        {children}
      </div>
    </div>
  )
}
