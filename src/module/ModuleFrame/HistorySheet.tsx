import { CircleAlertIcon, CircleCheckIcon } from 'lucide-react'
import { useState } from 'react'

import { countChanges } from '@/blocks/types'
import { Button } from '@/components/actions'
import { Sheet } from '@/components/containers'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/data-display'
import { DataState, Empty, EmptyDescription, EmptyHeader, EmptyTitle, Spinner } from '@/components/feedback'
import { useIsMobile } from '@/hooks/use-mobile'
import { useFormat, useLocale, useT } from '@/i18n'
import { toDate, useResource, useRuntimeState, type Module, type Run } from '@/runtime'

import { failureWords } from './failure'

const resultIcon = {
  ok: <CircleCheckIcon aria-hidden="true" className="size-4 shrink-0" />,
  failed: <CircleAlertIcon aria-hidden="true" className="size-4 shrink-0" />,
  running: <Spinner role={undefined} aria-hidden="true" className="shrink-0" />,
} as const

/** 运行记录 — one row per run in a sheet: time, what started it, result, changes, workflow version. */
export function HistorySheet({ module, name }: { module: Module; name: string }) {
  const t = useT('module')
  const compact = useIsMobile()
  const [open, setOpen] = useState(false)
  return (
    <Sheet
      open={open}
      onOpenChange={setOpen}
      side={compact ? 'bottom' : 'end'}
      title={t('history.title')}
      description={t('history.description', { module: name })}
      trigger={<Button variant="secondary">{t('history.open')}</Button>}
    >
      {open && <History moduleId={module.id} />}
    </Sheet>
  )
}

function History({ moduleId }: { moduleId: string }) {
  const t = useT('module')
  const format = useFormat()
  const { locale } = useLocale()
  const state = useRuntimeState()
  const answer = useResource({ kind: 'runs', moduleId })
  const runs: Run[] = 'data' in answer && answer.data ? [...answer.data].reverse() : []
  const shown = answer.state === 'long' ? 'ready' : answer.state

  return (
    <DataState
      state={shown}
      errorTitle={t('history.error.title')}
      error={answer.state === 'error' ? failureWords(answer.reason, state, locale, t).text : t('history.error.reason')}
      empty={
        <Empty>
          <EmptyHeader>
            <EmptyTitle>{t('history.empty.title')}</EmptyTitle>
            <EmptyDescription>{t('history.empty.body')}</EmptyDescription>
          </EmptyHeader>
        </Empty>
      }
    >
      <Table caption={t('history.caption')}>
        <TableHeader>
          <TableRow>
            <TableHead>{t('history.column.time')}</TableHead>
            <TableHead>{t('history.column.trigger')}</TableHead>
            <TableHead>{t('history.column.result')}</TableHead>
            <TableHead>{t('history.column.changes')}</TableHead>
            <TableHead>{t('history.column.version')}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {runs.map((run) => {
            const changed = countChanges(run.changes)
            return (
              <TableRow key={run.id} data-run={run.id} data-result={run.result}>
                <TableHead scope="row">{format.dateTime(toDate(run.at))}</TableHead>
                <TableCell>{t(`history.trigger.${run.trigger}`)}</TableCell>
                <TableCell>
                  <span className="flex items-center gap-2">
                    {resultIcon[run.result]}
                    {t(`history.result.${run.result}`)}
                  </span>
                  {run.result === 'failed' && (
                    <span className="block text-sm text-muted-foreground">
                      {failureWords(run.reason, state, locale, t).text}
                    </span>
                  )}
                </TableCell>
                <TableCell>{changed > 0 ? t('history.changes', { count: changed }) : t('history.changes.none')}</TableCell>
                <TableCell>{t('history.version', { n: run.version })}</TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </DataState>
  )
}
