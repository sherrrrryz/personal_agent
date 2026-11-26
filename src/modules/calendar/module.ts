import type { BlockBadge, ListBlockProps, PageBlock, ScheduleBlockProps } from '@/blocks/types'
import { appointmentStatus, column, moduleId, tableId } from '@/fixtures/keys'
import { formatTime, translate, type MessageKey, type MessageParams } from '@/i18n'
import {
  addDays,
  addMinutes,
  cellText,
  datePart,
  numberCell,
  resolveModule,
  stringCell,
  tableOf,
  toDate,
  type ModuleDefinition,
} from '@/runtime'
import { mondayOf } from '@/runtime/time'
import { modulePath } from '@/shell'

// 日程 (`calendar`, spec part 3 § Screens and flows): the week — her own
// events beside the bookings 预约 writes in, each saying where it comes from
// — and today as a list. The week is always drawn; a day with nothing says
// so, and so does today.

type Slot = ScheduleBlockProps['slots'][number]

const DAYS = 7
const own = 'own'
const bookings = 'bookings'

const definition: ModuleDefinition = {
  id: moduleId.calendar,

  page(view, _preview, { locale }) {
    const t = (key: MessageKey<'base-modules'>, params?: MessageParams) => translate(locale, 'base-modules', key, params)
    const today = datePart(view.storyTime)
    const start = mondayOf(view.storyTime)
    const end = addDays(start, DAYS)
    const inWeek = (at: string) => datePart(at) >= start && datePart(at) < end

    const slots: Slot[] = []

    const events = tableOf(view, tableId.events)
    const ownBadge: BlockBadge = { label: t('calendar.source.own') }
    for (const row of events?.rows ?? []) {
      const from = stringCell(row, 'start')
      const to = stringCell(row, 'end')
      if (!events || !from || !to || !inWeek(from)) continue
      slots.push({
        id: row.id,
        resourceId: own,
        start: from,
        end: to,
        title: cellText(view, events, row, 'title', locale) ?? '',
        meta: t('calendar.event.meta'),
        badges: [ownBadge],
      })
    }

    // The bookings 预约 wrote in: everything with a time (待安排 has none yet).
    const a = column.appointments
    const appointments = tableOf(view, tableId.appointments)
    const source = resolveModule(view, moduleId.appointments)?.module
    const bookingBadge: BlockBadge = { label: source?.name[locale] ?? moduleId.appointments }
    for (const row of appointments?.rows ?? []) {
      const from = stringCell(row, a.start)
      if (!appointments || !from || row.cells[a.status] === appointmentStatus.requested || !inWeek(from)) continue
      slots.push({
        id: row.id,
        resourceId: bookings,
        start: from,
        end: addMinutes(from, numberCell(row, a.estimate) ?? 0),
        title: t('calendar.booking.title', {
          dog: cellText(view, appointments, row, a.dog, locale) ?? '',
          service: cellText(view, appointments, row, a.service, locale) ?? '',
        }),
        meta: t('calendar.booking.meta', { groomer: cellText(view, appointments, row, a.groomer, locale) ?? '' }),
        badges: [bookingBadge],
        href: source ? modulePath(source.id) : undefined,
      })
    }

    const todays = slots.filter((slot) => datePart(slot.start) === today).sort((x, y) => x.start.localeCompare(y.start))
    const items: ListBlockProps['items'] = todays.map((slot) => ({
      id: slot.id,
      title: slot.title,
      meta: t('calendar.today.meta', {
        start: formatTime(locale, toDate(slot.start)),
        end: formatTime(locale, toDate(slot.end)),
      }),
      badges: slot.badges ?? [],
      href: slot.href,
    }))

    const week: PageBlock = {
      key: 'week',
      block: 'block.schedule',
      title: t('calendar.week'),
      span: 'full',
      props: {
        range: { kind: 'week', start, days: DAYS },
        resources: [
          { id: own, label: t('calendar.resource.own') },
          { id: bookings, label: t('calendar.resource.bookings') },
        ],
        slots,
      },
    }
    const todayBlock: PageBlock =
      items.length > 0
        ? { key: 'today', block: 'block.list', title: t('calendar.today'), span: 'full', props: { items } }
        : {
            key: 'today',
            block: 'block.empty',
            title: t('calendar.today'),
            span: 'full',
            props: { title: t('calendar.today.empty.title'), body: t('calendar.today.empty.body') },
          }
    return { blocks: [week, todayBlock] }
  },
}

export default definition
