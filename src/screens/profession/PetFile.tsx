import { BlockRenderer } from '@/block-renderer'
import { noChanges, type PageBlock, type PageDescription } from '@/blocks/types'
import { blockKey, column, tableId } from '@/fixtures/keys'
import { useLocale, useT, type Locale } from '@/i18n'
import { ModuleFrame } from '@/module'
import { numberCell, rowOf, stringCell, tableOf, useActions, useResource, useRunState, useRuntimeState, type Module, type Snapshot } from '@/runtime'

import { appliedFor, pageTools } from './page-tools'

const d = column.dogs
const v = column.visits

/**
 * The pet file's page: 档案 (品种 · 毛长 · 体型 · 主人 · 适用时长 with its
 * basis · 下次到店), 性格备注, and 每次到店 with every visit's 预计 and 实际.
 * `view` is what the page is built from — the long or the empty variant under
 * those previews; the dog itself comes from `state` when `view` holds no dog.
 */
export function petFilePage(view: Snapshot, state: Snapshot, dogId: string, locale: Locale): PageDescription {
  const from = rowOf(tableOf(view, tableId.dogs), dogId) ? view : state
  const tools = pageTools(from, locale)
  const { t, cell, duration } = tools
  const dogs = tableOf(from, tableId.dogs)
  const dog = rowOf(dogs, dogId)
  if (!dog) return { blocks: [] }
  const applied = appliedFor(from, dogId)
  const nextDue = stringCell(dog, d.nextDue)
  const visitsTable = tableOf(view, tableId.visits)
  const visits = (visitsTable?.rows ?? [])
    .filter((row) => row.cells[v.dog] === dogId)
    .sort((one, other) => String(other.cells[v.date]).localeCompare(String(one.cells[v.date])))

  const blocks: PageBlock[] = [
    {
      key: 'summary',
      block: 'block.summary',
      title: t('pet.summary.title'),
      span: 'full',
      props: {
        items: [
          { id: 'breed', label: t('pet.breed'), value: cell(dogs, dog, d.breed) },
          { id: 'coat', label: t('pet.coat'), value: cell(dogs, dog, d.coat) },
          { id: 'size', label: t('pet.size'), value: cell(dogs, dog, d.size) },
          { id: 'owner', label: t('pet.owner'), value: cell(dogs, dog, d.owner) },
          {
            id: 'applied',
            label: t('pet.applied'),
            value: t('value.withBasis', { duration: duration(applied.minutes), basis: tools.basisWords(applied.basis) }),
          },
          { id: 'next-due', label: t('pet.nextDue'), value: nextDue ? tools.date(nextDue) : t('none.date') },
        ],
      },
    },
    { key: 'note', block: 'block.text', title: t('pet.note.title'), span: 'full', props: { body: cell(dogs, dog, d.note) || t('pet.note.none') } },
  ]
  if (visits.length === 0) {
    blocks.push({
      key: blockKey.clients.visits,
      block: 'block.empty',
      title: t('pet.visits.title'),
      span: 'full',
      props: { title: t('pet.visits.empty.title'), body: t('pet.visits.empty.body') },
    })
  } else {
    blocks.push({
      key: blockKey.clients.visits,
      block: 'block.table',
      title: t('pet.visits.title'),
      span: 'full',
      props: {
        caption: t('pet.visits.caption'),
        columns: [
          { id: 'date', label: t('pet.visits.date') },
          { id: 'estimate', label: t('pet.visits.estimate'), align: 'end' },
          { id: 'actual', label: t('pet.visits.actual'), align: 'end' },
          { id: 'diff', label: t('pet.visits.diff'), align: 'end' },
          { id: 'groomer', label: t('pet.visits.groomer') },
        ],
        rows: visits.map((row) => {
          const estimate = numberCell(row, v.estimate)
          const actual = numberCell(row, v.actual)
          return {
            id: row.id,
            cells: {
              date: cell(visitsTable, row, v.date),
              estimate: estimate === null ? t('cell.none') : duration(estimate),
              actual: actual === null ? t('cell.none') : duration(actual),
              diff: estimate === null || actual === null ? t('cell.none') : tools.diff(estimate, actual),
              groomer: cell(visitsTable, row, v.groomer),
            },
          }
        }),
      },
    })
  }
  return { blocks }
}

/**
 * The pet file, `/m/profession.clients/pets/<id>` (`ModuleFrame view: child`),
 * from existing blocks. Its four states follow the `module` resource of 顾客与宠物:
 * a failure that kept the last good data still shows the file.
 */
export function PetFile({ module, dogId }: { module: Module; dogId: string }) {
  const t = useT('profession')
  const { locale } = useLocale()
  const state = useRuntimeState()
  const actions = useActions()
  const run = useRunState(module.id)
  const answer = useResource({ kind: 'module', moduleId: module.id })
  const view = 'data' in answer ? answer.data?.view : undefined
  const name = pageTools(state, locale).dogName(dogId)

  return (
    <ModuleFrame module={module} view="child" title={name}>
      <BlockRenderer
        page={view ? petFilePage(view, state, dogId, locale) : { blocks: [] }}
        state={answer.state === 'loading' ? 'loading' : answer.state === 'error' && !view ? 'error' : 'ready'}
        changes={run.last?.changes ?? noChanges}
        errorTitle={t('pet.error.title')}
        error={t('pet.error.body')}
        onRetry={() => void actions.runModule(module.id)}
      />
    </ModuleFrame>
  )
}
