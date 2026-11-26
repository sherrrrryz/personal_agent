import { ItemGroup } from '@/components/data-display'
import { DataState, Skeleton } from '@/components/feedback'
import { useT } from '@/i18n'

import type { BlockComponentProps } from '../types'

import { BlockEmpty, BlockEntry } from './parts'

/**
 * `block.list` — items with a title, a line of meta, badges and actions. An
 * item with a link and no action is one link; otherwise its title is the link
 * and its actions are buttons, under the text until the block reaches the `@md` container step.
 */
export function ListBlock({ props, changes, state, onAction }: BlockComponentProps<'block.list'>) {
  const t = useT('data-blocks')
  const { items } = props
  return (
    <DataState
      state={state === 'ready' && items.length === 0 ? 'empty' : state}
      empty={<BlockEmpty title={t('list.empty')} />}
      loading={
        <div className="flex flex-col gap-2">
          <Skeleton className="h-14 w-full" />
          <Skeleton className="h-14 w-full" />
          <Skeleton className="h-14 w-full" />
        </div>
      }
    >
      {/* The size container the entries' actions answer to. */}
      <div className="@container">
        <ItemGroup>
          {items.map((item) => (
            <BlockEntry key={item.id} {...item} change={changes[item.id]} onAction={onAction} />
          ))}
        </ItemGroup>
      </div>
    </DataState>
  )
}
