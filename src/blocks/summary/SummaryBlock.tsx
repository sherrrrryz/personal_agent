import { ChangeMarker } from '@/components/data-display'
import { DataState, Skeleton } from '@/components/feedback'
import { useT } from '@/i18n'

import { BlockEmpty } from '../list/parts'
import type { BlockComponentProps } from '../types'

/**
 * `block.summary` — one compact line of key figures (D-50: nothing in it is
 * clickable, so it takes as little room as it can): each figure is a term (its
 * label) with its value beside it and, when it has one, how it moved. The line
 * wraps between figures, never inside one.
 */
export function SummaryBlock({ props, changes, state }: BlockComponentProps<'block.summary'>) {
  const t = useT('data-blocks')
  const { items } = props
  return (
    <DataState
      state={state === 'ready' && items.length === 0 ? 'empty' : state}
      empty={<BlockEmpty title={t('summary.empty')} />}
      loading={
        <div className="flex flex-wrap gap-6">
          <Skeleton className="h-6 min-w-24 flex-1" />
          <Skeleton className="h-6 min-w-24 flex-1" />
          <Skeleton className="h-6 min-w-24 flex-1" />
        </div>
      }
    >
      <dl className="flex flex-wrap items-baseline gap-x-6 gap-y-1">
        {items.map((item) => (
          <div key={item.id} data-item={item.id} className="flex min-w-0 flex-wrap items-baseline gap-x-2">
            <dt className="flex items-center gap-2 text-sm text-muted-foreground">
              {item.label}
              {changes[item.id] && <ChangeMarker kind={changes[item.id]} />}
            </dt>
            <dd className="text-base font-semibold wrap-anywhere">{item.value}</dd>
            {item.delta !== undefined && <dd className="text-sm text-muted-foreground">{item.delta}</dd>}
          </div>
        ))}
      </dl>
    </DataState>
  )
}
