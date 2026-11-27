import { useState } from 'react'

import { BlockAnchor } from '@/block-renderer/block-link'
import { ChangeMarker, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/data-display'
import { DataState, Empty, EmptyDescription, EmptyHeader, EmptyTitle, Skeleton } from '@/components/feedback'
import { Section, Stack } from '@/components/layout'
import { Tabs } from '@/components/navigation'
import { useLocale, useT } from '@/i18n'
import { ModuleFrame, useRouteModule } from '@/module'
import { resolveModule, useResource, useRuntimeState, type MemoryTable, type Module, type Snapshot } from '@/runtime'
import { modulePath } from '@/shell'

import { memoryTableView, type MemoryTableView } from './table-view'

/**
 * `<module>.memory` — the memory view (spec part 3 § Memory view): a view of
 * the module frame in `main`, not an overlay, so the chat bar under it stays
 * usable. One tab per table the module owns, then who reads this memory.
 * Read-only, and with no sharing control: memory is shared by itself (D-28).
 */
export function MemoryView() {
  const { module } = useRouteModule()
  const t = useT('memory')
  const [attempt, setAttempt] = useState(0)
  return (
    <ModuleFrame module={module} view="memory" title={t('title')}>
      {/* Another module, or another try after a failure, reads afresh. */}
      <Memory key={`${module.id}:${attempt}`} module={module} onRetry={() => setAttempt((count) => count + 1)} />
    </ModuleFrame>
  )
}

function Memory({ module, onRetry }: { module: Module; onRetry: () => void }) {
  const t = useT('memory')
  const { locale } = useLocale()
  const state = useRuntimeState()
  const answer = useResource({ kind: 'memory', moduleId: module.id })
  // The page's own view of the state — the long or the empty variant under those previews — for what a cell refers to.
  const page = useResource({ kind: 'module', moduleId: module.id })
  const view: Snapshot = ('data' in page ? page.data?.view : undefined) ?? state
  const tables = answer.state === 'ready' || answer.state === 'long' ? answer.data.tables : []

  return (
    <DataState
      state={answer.state === 'loading' ? 'loading' : answer.state === 'error' ? 'error' : tables.length === 0 ? 'empty' : 'ready'}
      loadingLabel={t('loading')}
      loading={<Skeleton className="h-64 w-full" />}
      empty={
        <Empty>
          <EmptyHeader>
            <EmptyTitle>{t('empty.title')}</EmptyTitle>
            <EmptyDescription>{t('empty.body')}</EmptyDescription>
          </EmptyHeader>
        </Empty>
      }
      errorTitle={t('error.title')}
      error={t('error.body')}
      onRetry={onRetry}
    >
      <Stack gap="lg">
        <Tabs
          aria-label={t('tabs.label')}
          tabs={tables.map((table) => ({
            value: table.id,
            label: table.name[locale],
            content: <MemoryTableBody table={memoryTableView(table, { view, state, locale })} />,
          }))}
        />
        <Readers tables={tables} state={state} />
      </Stack>
    </DataState>
  )
}

function MemoryTableBody({ table }: { table: MemoryTableView }) {
  const t = useT('memory')
  if (table.rows.length === 0) return <p className="text-sm text-muted-foreground">{t('table.empty')}</p>
  return (
    <Table caption={table.name} data-memory-table={table.id}>
      <TableHeader>
        <TableRow>
          {table.columns.map((each) => (
            <TableHead key={each.id}>{each.label}</TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {table.rows.map((row) => (
          <TableRow key={row.id} data-memory-row={row.id}>
            {row.cells.map((cell, index) => {
              const content = cell.href ? <BlockAnchor href={cell.href}>{cell.text}</BlockAnchor> : cell.text
              return index === 0 ? (
                // The first column names the row; a row that changed lately says so beside its name.
                <TableHead key={table.columns[index].id} scope="row">
                  <span className="inline-flex items-center gap-2">
                    {content}
                    {row.change && <ChangeMarker kind={row.change} />}
                  </span>
                </TableHead>
              ) : (
                <TableCell key={table.columns[index].id}>{content}</TableCell>
              )
            })}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}

/** 谁在读这份记忆: every module that reads one of these tables, as a link, with the tables it reads. */
function Readers({ tables, state }: { tables: readonly MemoryTable[]; state: Snapshot }) {
  const t = useT('memory')
  const { locale } = useLocale()
  const ids = [...new Set(tables.flatMap((table) => table.readers))]
  const readers = ids.flatMap((id) => {
    const module = resolveModule(state, id)?.module
    const reads = tables.filter((table) => table.readers.includes(id)).map((table) => table.name[locale])
    return module ? [{ module, reads: reads.join(t('readers.separator')) }] : []
  })

  return (
    <Section title={t('readers.title')}>
      <p>{t('readers.shared')}</p>
      {readers.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t('readers.none')}</p>
      ) : (
        <Stack as="ul" gap="sm" data-slot="memory-readers">
          {readers.map(({ module, reads }) => (
            <li key={module.id} className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1">
              <BlockAnchor href={modulePath(module.id)}>{module.name[locale]}</BlockAnchor>
              <span className="text-sm text-muted-foreground">{t('readers.reads', { tables: reads })}</span>
            </li>
          ))}
        </Stack>
      )}
    </Section>
  )
}
