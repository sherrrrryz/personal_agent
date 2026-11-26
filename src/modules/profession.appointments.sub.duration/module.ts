import type { PageBlock } from '@/blocks/types'
import { appointmentStatus, basis, blockKey, column, defaultEstimate, moduleId, tableId } from '@/fixtures/keys'
import { numberCell, stringCell, tableOf, type ModuleDefinition } from '@/runtime'
import { durationModuleId, pageTools, petPath } from '@/screens/profession/page-tools'
import { modulePath } from '@/shell'

// `profession.appointments.sub.duration` 服务时长 (spec part 3 § Screens and
// flows): how many dogs it has learned and how far the estimates were off,
// 预计 against 实际 for every finished booking, and the rule in words. The
// definition is found by alias too, so a promoted 服务时长 keeps this page.

const a = column.appointments

const definition: ModuleDefinition = {
  id: moduleId.duration,
  page(view, _preview, { locale }) {
    const tools = pageTools(view, locale)
    const { t, duration } = tools
    const appointments = tableOf(view, tableId.appointments)
    const breeds = tableOf(view, tableId.breeds)?.rows ?? []
    const records = tableOf(view, tableId.dogDurations)?.rows ?? []
    const finished = (appointments?.rows ?? [])
      .filter((row) => row.cells[a.status] === appointmentStatus.done && numberCell(row, a.actual) !== null && numberCell(row, a.estimate) !== null)
      .sort((one, other) => String(other.cells[a.start]).localeCompare(String(one.cells[a.start])))
    const own = `${modulePath(durationModuleId(view) ?? moduleId.duration)}`

    const rule: PageBlock = {
      key: 'rule',
      block: 'block.text',
      title: t('duration.rule.title'),
      span: 'full',
      props: {
        body: t('duration.rule.body', {
          own: records.filter((row) => numberCell(row, column.dogDurations.applied) !== null).length,
          breeds: breeds.length,
          fallback: duration(defaultEstimate),
        }),
        links: [
          { label: t('duration.rule.workflow'), href: `${own}/workflow` },
          { label: t('duration.rule.memory'), href: `${own}/memory` },
        ],
      },
    }
    if (finished.length === 0) {
      const empty = tools.empty('duration.empty.section', t('duration.empty.title'), t('duration.empty.body'))
      return { blocks: breeds.length > 0 ? [empty, rule] : [empty] }
    }

    const off = finished.map((row) => Math.abs((numberCell(row, a.actual) ?? 0) - (numberCell(row, a.estimate) ?? 0)))
    return {
      blocks: [
        {
          key: 'summary',
          block: 'block.summary',
          title: t('summary.title'),
          span: 'full',
          props: {
            items: [
              { id: 'dogs', label: t('duration.summary.dogs'), value: tools.number(records.length) },
              { id: 'deviation', label: t('duration.summary.deviation'), value: duration(off.reduce((sum, each) => sum + each, 0) / off.length) },
            ],
          },
        },
        {
          key: blockKey.duration.records,
          block: 'block.table',
          title: t('duration.records.title'),
          span: 'full',
          props: {
            caption: t('duration.records.caption'),
            columns: [
              { id: 'dog', label: t('duration.col.dog') },
              { id: 'date', label: t('duration.col.date') },
              { id: 'estimate', label: t('duration.col.estimate'), align: 'end' },
              { id: 'actual', label: t('duration.col.actual'), align: 'end' },
              { id: 'diff', label: t('duration.col.diff'), align: 'end' },
            ],
            rows: finished.map((row) => {
              const dog = stringCell(row, a.dog) ?? ''
              const estimate = numberCell(row, a.estimate) ?? 0
              const actual = numberCell(row, a.actual) ?? 0
              return {
                id: row.id,
                cells: {
                  dog: { text: tools.dogLabel(dog), href: petPath(dog), note: tools.basisWords(stringCell(row, a.basis) ?? basis.default) },
                  date: tools.date(stringCell(row, a.start) ?? view.storyTime),
                  estimate: duration(estimate),
                  actual: duration(actual),
                  diff: tools.diff(estimate, actual),
                },
              }
            }),
          },
        },
        rule,
      ],
    }
  },
}

export default definition
