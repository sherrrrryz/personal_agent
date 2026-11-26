import { translate, type Locale } from '@/i18n'

import type { BlockDemo, ListBlockProps } from '../types'

/** A list given in one message, separated by `|`: the demo's dogs, groomers, breeds. */
export function demoNames(locale: Locale, key: 'demo.dogs' | 'demo.groomers' | 'demo.breeds' | 'demo.sizes'): string[] {
  return translate(locale, 'data-blocks', key).split('|')
}

/** Sample content of `block.list`: three messages; the long variant has thirty and one very long item. */
export function listDemo(locale: Locale): BlockDemo<'block.list'> {
  const t = (key: Parameters<typeof translate<'data-blocks'>>[2], params?: Record<string, string | number>) =>
    translate(locale, 'data-blocks', key, params)
  const dogs = demoNames(locale, 'demo.dogs')
  const items: ListBlockProps['items'] = [
    {
      id: 'confirmed',
      title: t('list.demo.confirmed.title'),
      meta: t('list.demo.confirmed.meta'),
      badges: [{ label: t('list.demo.confirmed.badge') }],
      href: '/m/confirmations',
    },
    {
      id: 'remind',
      title: t('list.demo.remind.title'),
      meta: t('list.demo.remind.meta'),
      badges: [{ label: t('list.demo.remind.badge'), mode: 'deferred' }],
      actions: [
        { id: 'send', label: t('list.demo.remind.send'), primary: true },
        { id: 'skip', label: t('list.demo.remind.skip') },
      ],
    },
    {
      id: 'record',
      title: t('list.demo.record.title'),
      meta: t('list.demo.record.meta'),
      badges: [
        { label: t('list.demo.record.badge'), mode: 'autonomous' },
        { label: t('list.demo.record.second') },
      ],
      actions: [{ id: 'undo', label: t('list.demo.record.undo'), disabled: true }],
      href: '/m/duration',
    },
  ]
  const long: ListBlockProps['items'] = Array.from({ length: 30 }, (_, index) => {
    const n = index + 1
    return {
      id: `reminder-${n}`,
      title: index === 0 ? t('demo.longName') : t('list.demo.long.title', { n, dog: dogs[index % dogs.length] }),
      meta: index === 0 ? t('demo.longNote').repeat(3) : t('list.demo.long.meta', { n }),
      badges: [{ label: t('list.demo.long.badge') }],
      actions: index % 3 === 0 ? [{ id: 'open', label: t('list.demo.long.open') }] : undefined,
      href: index % 3 === 1 ? '/m/notifications' : undefined,
    }
  })
  return {
    title: t('list.demo.title'),
    props: { items },
    long: { items: long },
    changes: { remind: 'new', record: 'updated' },
  }
}
