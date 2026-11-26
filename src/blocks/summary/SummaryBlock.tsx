import { ChangeMarker } from '@/components/data-display'
import { DataState, Skeleton } from '@/components/feedback'
import { useT } from '@/i18n'

import { BlockEmpty } from '../list/parts'
import type { BlockComponentProps } from '../types'

/**
 * `block.summary` — a row of key figures that wraps: each figure is a term
 * (its label) with its value and, when it has one, a line saying how it moved.
 * A figure keeps a readable width and the row wraps before one narrows further.
 */
export function SummaryBlock({ props, changes, state }: BlockComponentProps<'block.summary'>) {
  const t = useT('data-blocks')
  const { items } = props
  return (
    <DataState
      state={state === 'ready' && items.length === 0 ? 'empty' : state}
      empty={<BlockEmpty title={t('summary.empty')} />}
      loading={
        <div className="flex flex-wrap gap-4">
          <Skeleton className="h-16 min-w-32 flex-1" />
          <Skeleton className="h-16 min-w-32 flex-1" />
          <Skeleton className="h-16 min-w-32 flex-1" />
        </div>
      }
    >
      <dl className="flex flex-wrap gap-4">
        {items.map((item) => (
          <div key={item.id} data-item={item.id} className="flex min-w-32 flex-1 flex-col gap-1 border-s ps-4">
            <dt className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              {item.label}
              {changes[item.id] && <ChangeMarker kind={changes[item.id]} />}
            </dt>
            <dd className="text-2xl font-semibold wrap-anywhere">{item.value}</dd>
            {item.delta !== undefined && <dd className="text-sm text-muted-foreground">{item.delta}</dd>}
          </div>
        ))}
      </dl>
    </DataState>
  )
}
