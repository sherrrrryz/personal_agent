import { formatDuration, translate, type Locale } from '@/i18n'
import { addDays, addMinutes } from '@/runtime'

import { demoNames } from '../list/demo'
import type { BlockDemo, ScheduleBlockProps } from '../types'

/**
 * Sample content of `block.schedule`: one day, three groomers, five bookings;
 * the long variant is a week with fourteen, the first with a long name and note.
 */
export function scheduleDemo(locale: Locale): BlockDemo<'block.schedule'> {
  const t = (key: Parameters<typeof translate<'data-blocks'>>[2], params?: Record<string, string | number>) =>
    translate(locale, 'data-blocks', key, params)
  const dogs = demoNames(locale, 'demo.dogs')
  const breeds = demoNames(locale, 'demo.breeds')
  const resources = demoNames(locale, 'demo.groomers').map((label, index) => ({ id: `groomer-${index + 1}`, label }))
  const day = '2026-11-05'

  const slot = (
    id: string,
    resource: number,
    start: string,
    minutes: number,
    dog: number,
    service: 'full' | 'bath',
    rest: Partial<ScheduleBlockProps['slots'][number]> = {},
  ): ScheduleBlockProps['slots'][number] => ({
    id,
    resourceId: resources[resource].id,
    start,
    end: addMinutes(start, minutes),
    title: t('schedule.demo.slot.title', { dog: dogs[dog % dogs.length], service: t(`schedule.demo.service.${service}`) }),
    meta: t('schedule.demo.slot.meta', { breed: breeds[dog % breeds.length], duration: formatDuration(locale, minutes) }),
    ...rest,
  })
  const start = { id: 'start', label: t('schedule.demo.start'), primary: true }
  const move = { id: 'move', label: t('schedule.demo.move') }

  const slots = [
    slot('zl-1', 0, `${day}T09:30`, 225, 0, 'full', {
      badges: [{ label: t('schedule.demo.badge.first') }],
      actions: [start, move],
      href: '/m/appointments',
    }),
    slot('zl-2', 0, `${day}T14:00`, 120, 2, 'full', { actions: [start, move] }),
    slot('ch-1', 1, `${day}T10:00`, 60, 1, 'bath', { href: '/m/appointments' }),
    slot('ch-2', 1, `${day}T13:00`, 120, 3, 'full', {
      badges: [{ label: t('schedule.demo.badge.deferred'), mode: 'deferred' }],
      actions: [move],
    }),
    slot('aj-1', 2, `${day}T11:00`, 90, 4, 'bath'),
  ]

  const monday = '2026-11-02'
  const long = Array.from({ length: 14 }, (_, index) =>
    slot(
      `week-${index + 1}`,
      index % 3,
      `${addDays(monday, index % 7)}T${index < 7 ? '09:30' : '14:00'}`,
      60 + (index % 4) * 45,
      index,
      index % 2 === 0 ? 'full' : 'bath',
      {
        ...(index === 0 ? { title: t('demo.longName'), meta: t('demo.longNote').repeat(3) } : {}),
        actions: index % 2 === 0 ? [start, move] : undefined,
      },
    ),
  )

  return {
    title: t('schedule.demo.title'),
    props: { range: { kind: 'day', start: day, days: 1 }, resources, slots },
    long: { range: { kind: 'week', start: monday, days: 7 }, resources, slots: long },
    changes: { 'zl-2': 'updated', 'ch-2': 'new' },
  }
}
