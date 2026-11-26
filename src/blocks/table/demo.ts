import { formatDuration, formatNumber, translate, type Locale } from '@/i18n'

import { demoNames } from '../list/demo'
import type { BlockDemo, TableBlockProps } from '../types'

/**
 * Sample content of `block.table`: seven columns — the risky width — over
 * three breeds; the long variant has forty dogs, the first with a long name
 * and a long note.
 */
export function tableDemo(locale: Locale): BlockDemo<'block.table'> {
  const t = (key: Parameters<typeof translate<'data-blocks'>>[2], params?: Record<string, string | number>) =>
    translate(locale, 'data-blocks', key, params)
  const breeds = demoNames(locale, 'demo.breeds')
  const sizes = demoNames(locale, 'demo.sizes')
  const dogs = demoNames(locale, 'demo.dogs')

  const columns: TableBlockProps['columns'] = [
    { id: 'breed', label: t('table.demo.col.breed') },
    { id: 'size', label: t('table.demo.col.size') },
    { id: 'rule', label: t('table.demo.col.rule'), align: 'end' },
    { id: 'measured', label: t('table.demo.col.measured'), align: 'end' },
    { id: 'diff', label: t('table.demo.col.diff'), align: 'end' },
    { id: 'visits', label: t('table.demo.col.visits'), align: 'end' },
    { id: 'basis', label: t('table.demo.col.basis') },
  ]

  const difference = (rule: number, measured: number) => {
    if (measured === rule) return t('table.demo.diff.none')
    const duration = formatDuration(locale, Math.abs(measured - rule))
    return measured > rule ? t('table.demo.diff.over', { duration }) : t('table.demo.diff.under', { duration })
  }
  const row = (
    id: string,
    name: TableBlockProps['rows'][number]['cells'][string],
    size: string,
    rule: number,
    measured: number,
    visits: number,
    note?: string,
  ): TableBlockProps['rows'][number] => ({
    id,
    cells: {
      breed: name,
      size,
      rule: formatDuration(locale, rule),
      measured: formatDuration(locale, measured),
      diff: difference(rule, measured),
      visits: formatNumber(locale, visits),
      basis:
        visits >= 2
          ? { text: t('table.demo.basis.record'), note: note ?? t('table.demo.basis.note', { n: visits }) }
          : t('table.demo.basis.rule'),
    },
  })

  const rows = [
    row('golden', { text: breeds[0], href: '/m/duration' }, sizes[0], 210, 225, 4),
    row('poodle', breeds[1], sizes[1], 120, 120, 1),
    row('corgi', breeds[2], sizes[2], 90, 80, 3),
  ]
  const long = Array.from({ length: 40 }, (_, index) =>
    row(
      `dog-${index + 1}`,
      index === 0 ? { text: t('demo.longName'), href: '/m/clients' } : `${dogs[index % dogs.length]} · ${breeds[index % breeds.length]}`,
      sizes[index % sizes.length],
      90 + (index % 5) * 30,
      85 + (index % 7) * 25,
      index === 0 ? 30 : index % 4,
      index === 0 ? t('demo.longNote').repeat(3) : undefined,
    ),
  )
  return {
    title: t('table.demo.title'),
    props: { caption: t('table.demo.caption'), columns, rows },
    long: { caption: t('table.demo.long.caption'), columns, rows: long },
    changes: { golden: 'updated', corgi: 'new' },
  }
}
