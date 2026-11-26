import {
  ChangeMarker,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/data-display'
import { DataState, Skeleton } from '@/components/feedback'
import { useT } from '@/i18n'
import type { ChangeKind } from '@/lib/vocab'

import { BlockEmpty, BlockItemLink } from '../list/parts'
import type { BlockComponentProps, TableBlockCell } from '../types'

/** A cell: its text or its link, the row's change marker in the first column, a note under it. */
function CellContent({ cell, change }: { cell: TableBlockCell | undefined; change?: ChangeKind }) {
  if (cell === undefined) return null
  const { text, href, note }: Exclude<TableBlockCell, string> = typeof cell === 'string' ? { text: cell } : cell
  const main = href !== undefined ? <BlockItemLink href={href}>{text}</BlockItemLink> : text
  const marked = change ? (
    <span className="inline-flex flex-wrap items-center gap-2">
      {main}
      <ChangeMarker kind={change} />
    </span>
  ) : (
    main
  )
  if (note === undefined) return marked
  // A cell with a note holds sentences: it keeps twice the width of a plain column, so a long note stays readable.
  return (
    <span className="block min-w-48">
      {marked}
      <span className="block text-sm font-normal text-muted-foreground">{note}</span>
    </span>
  )
}

/**
 * `block.table` — columns × rows in the `Table` of the data-display family:
 * its scroller is a region named by the caption and a tab stop, so the table
 * scrolls sideways inside itself and never moves the page. The first column
 * names the row; a changed row is marked there.
 */
export function TableBlock({ props, changes, state }: BlockComponentProps<'block.table'>) {
  const t = useT('data-blocks')
  const { caption, columns, rows } = props
  return (
    <DataState
      state={state === 'ready' && rows.length === 0 ? 'empty' : state}
      empty={<BlockEmpty title={t('table.empty')} />}
      loading={
        <div className="flex flex-col gap-2">
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
        </div>
      }
    >
      <Table caption={caption}>
        <TableHeader>
          <TableRow>
            {columns.map((column) => (
              <TableHead key={column.id} align={column.align}>
                {column.label}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.id} data-item={row.id}>
              {columns.map((column, index) =>
                index === 0 ? (
                  <TableHead key={column.id} scope="row" align={column.align}>
                    <CellContent cell={row.cells[column.id]} change={changes[row.id]} />
                  </TableHead>
                ) : (
                  <TableCell key={column.id} align={column.align}>
                    <CellContent cell={row.cells[column.id]} />
                  </TableCell>
                ),
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </DataState>
  )
}
