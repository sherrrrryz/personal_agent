import { BlockAnchor } from '@/block-renderer/block-link'
import type { BlockComponentProps } from '@/blocks/types'
import { buttonClass } from '@/components/actions'
import { ChangeMarker } from '@/components/data-display'
import { DataState, Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyTitle, Skeleton } from '@/components/feedback'
import { useT } from '@/i18n'

import { emptyBlockItems } from './items'

/**
 * `block.empty` — what a workflow emits when its page has nothing: a
 * statement, why, and one next step. It *is* the empty state, so `empty`
 * shows the same as `ready`. (An empty collection inside another block is
 * that block's `DataState`, not this.)
 */
export function EmptyBlock({ props, changes, state }: BlockComponentProps<'block.empty'>) {
  const t = useT('blocks')
  return (
    <DataState
      state={state === 'empty' ? 'ready' : state}
      loading={
        <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed p-6">
          <Skeleton className="h-5 w-2/5" />
          <Skeleton className="h-4 w-3/5" />
        </div>
      }
      errorTitle={t('empty.error.title')}
      error={t('empty.error.reason')}
    >
      <Empty data-slot="block-empty" className="border">
        <EmptyHeader>
          <EmptyTitle className="wrap-break-word">{props.title}</EmptyTitle>
          <EmptyDescription className="wrap-break-word">{props.body}</EmptyDescription>
          {changes[emptyBlockItems.body] && <ChangeMarker kind={changes[emptyBlockItems.body]} />}
        </EmptyHeader>
        {props.action && (
          <EmptyContent>
            <BlockAnchor href={props.action.href} className={buttonClass({ variant: 'secondary' })}>
              {props.action.label}
            </BlockAnchor>
            {changes[emptyBlockItems.action] && <ChangeMarker kind={changes[emptyBlockItems.action]} />}
          </EmptyContent>
        )}
      </Empty>
    </DataState>
  )
}
