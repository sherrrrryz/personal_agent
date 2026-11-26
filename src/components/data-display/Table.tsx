import { useId, type ComponentProps, type ReactNode } from 'react'

import { focusRing } from '@/components/actions/focus-ring'
import {
  Table as KitTable,
  TableCaption,
  TableCell as KitTableCell,
  TableHead as KitTableHead,
} from '@/components/ui/table'

import type { TableAlign } from './table-align'

export { TableBody, TableFooter, TableHeader, TableRow } from '@/components/ui/table'

type Bare<Props> = Omit<Props, 'className' | 'style'>

const alignClass = { start: 'text-start', end: 'text-end' } as const

// A cell's text wraps, and a column keeps a readable width: below it the
// table scrolls sideways inside its own region instead of squeezing a CJK
// column down to one character per line.
const cellClass = 'min-w-24 whitespace-normal'

export type TableProps = Bare<ComponentProps<'table'>> & {
  /** What the table holds. Shown under it; also the name of its scrolling region. */
  caption: ReactNode
}

/**
 * A table of records in its own sideways scroller. The scroller is a named
 * region and a tab stop, so the columns that do not fit are reachable with
 * the arrow keys. The kit's own scroller, which has no name and no focus, is
 * switched off.
 */
export function Table({ caption, children, ...rest }: TableProps) {
  const captionId = useId()
  return (
    <div
      role="region"
      aria-labelledby={captionId}
      tabIndex={0}
      data-slot="table-scroller"
      className={`overflow-x-auto rounded-md border *:overflow-visible ${focusRing}`}
    >
      <KitTable {...rest}>
        <TableCaption id={captionId} className="px-2 pb-2 text-start">
          {caption}
        </TableCaption>
        {children}
      </KitTable>
    </div>
  )
}

export type TableHeadProps = Omit<Bare<ComponentProps<'th'>>, 'align'> & {
  /** `end` for a column of numbers. */
  align?: TableAlign
}

/** A header cell: of its column unless `scope="row"`. */
export function TableHead({ align = 'start', scope = 'col', ...rest }: TableHeadProps) {
  return <KitTableHead {...rest} scope={scope} className={`h-auto py-2 ${cellClass} ${alignClass[align]}`} />
}

export type TableCellProps = Omit<Bare<ComponentProps<'td'>>, 'align'> & {
  /** `end` for a number. */
  align?: TableAlign
}

export function TableCell({ align = 'start', ...rest }: TableCellProps) {
  return <KitTableCell {...rest} className={`${cellClass} ${alignClass[align]}`} />
}
