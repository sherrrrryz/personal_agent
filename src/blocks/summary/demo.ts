import { formatDuration, translate, type Locale } from '@/i18n'

import type { BlockDemo, SummaryBlockProps } from '../types'

/** Sample content of `block.summary`: four figures of a day; the long variant has eight with long labels. */
export function summaryDemo(locale: Locale): BlockDemo<'block.summary'> {
  const t = (key: Parameters<typeof translate<'data-blocks'>>[2], params?: Record<string, string | number>) =>
    translate(locale, 'data-blocks', key, params)
  const items: SummaryBlockProps['items'] = [
    {
      id: 'bookings',
      label: t('summary.demo.bookings.label'),
      value: t('summary.demo.bookings.value'),
      delta: t('summary.demo.bookings.delta'),
    },
    { id: 'unplaced', label: t('summary.demo.unplaced.label'), value: t('summary.demo.unplaced.value') },
    {
      id: 'hours',
      label: t('summary.demo.hours.label'),
      value: formatDuration(locale, 570),
      delta: t('summary.demo.hours.delta'),
    },
    { id: 'gap', label: t('summary.demo.gap.label'), value: t('summary.demo.gap.value') },
  ]
  const long: SummaryBlockProps['items'] = Array.from({ length: 8 }, (_, index) => {
    const n = index + 1
    return {
      id: `figure-${n}`,
      label: t('summary.demo.long.label', { n }),
      value: index % 2 === 0 ? t('summary.demo.long.value', { n: n * 12 }) : formatDuration(locale, n * 95),
      delta: index % 3 === 0 ? undefined : t('summary.demo.long.delta', { n }),
    }
  })
  return {
    title: t('summary.demo.title'),
    props: { items },
    long: { items: long },
    changes: { bookings: 'updated', unplaced: 'new' },
  }
}
