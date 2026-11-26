import { CalendarDays } from 'lucide-react'
import { useState } from 'react'

import { ToggleGroup, ToggleGroupItem } from '@/components/actions'
import { DemoGroup } from '@/components/actions/demo-parts'
import { Stack } from '@/components/layout'
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'
import { Skeleton } from '@/components/ui/skeleton'
import { useT } from '@/i18n'

import { DataState } from './DataState'
import { dataStates, type DataStateValue } from './data-states'

/**
 * The state the demo opens in: `ready`, or the one named by `?preview=` —
 * the parameter the matrix adds with `--preview` — so each state can be run
 * through the cells. `loading` keeps the page busy; the harness then waits
 * its eight seconds in every cell, so that run uses `--cells smoke`.
 */
function initialState(): DataStateValue {
  const preview = new URLSearchParams(window.location.search).get('preview')
  return dataStates.find((state) => state === preview) ?? 'ready'
}

export default function DataStateDemo() {
  const t = useT('feedback')
  const [state, setState] = useState<DataStateValue>(initialState)
  return (
    <Stack gap="lg">
      <ToggleGroup
        aria-label={t('dataState.demo.pick')}
        required
        value={state}
        onValueChange={(next) => next && setState(next)}
      >
        {dataStates.map((value) => (
          <ToggleGroupItem key={value} value={value}>
            {t(`dataState.demo.${value}`)}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
      <p className="text-sm text-muted-foreground">{t('dataState.demo.note')}</p>
      <DataState
        state={state}
        onRetry={() => setState('loading')}
        loading={
          <div className="flex flex-col gap-3">
            <Skeleton className="h-5 w-full" />
            <Skeleton className="h-5 w-full" />
            <Skeleton className="h-5 w-3/4" />
          </div>
        }
        empty={
          <Empty className="border">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <CalendarDays aria-hidden="true" />
              </EmptyMedia>
              <EmptyTitle>{t('dataState.demo.emptyTitle')}</EmptyTitle>
              <EmptyDescription>{t('dataState.demo.emptyBody')}</EmptyDescription>
            </EmptyHeader>
          </Empty>
        }
        errorTitle={t('dataState.demo.errorTitle')}
        error={t('dataState.demo.errorReason')}
      >
        <ul className="flex list-disc flex-col gap-1 ps-5">
          <li>{t('dataState.demo.item1')}</li>
          <li>{t('dataState.demo.item2')}</li>
          <li>{t('dataState.demo.item3')}</li>
        </ul>
      </DataState>
      {state !== 'ready' && state !== 'loading' && (
        <DemoGroup caption={t('dataState.demo.defaults')}>
          <DataState state={state} />
        </DemoGroup>
      )}
    </Stack>
  )
}
