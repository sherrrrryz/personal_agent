import type { PageBlock } from '@/blocks/types'
import { appointmentStatus, blockKey, column, moduleId, tableId } from '@/fixtures/keys'
import { addDays, addMinutes, datePart, numberCell, stringCell, tableOf, type ModuleDefinition } from '@/runtime'
import { appointmentPath, minutesBetween, pageTools } from '@/screens/profession/page-tools'

// `profession.appointments` 预约 (spec part 3 § Screens and flows): the week
// ahead by groomer, every slot with its 预计 duration and what the estimate
// rests on, and 待安排. A slot opens the appointment sheet
// (`src/screens/profession/AppointmentSheet.tsx`), where 开始 and 完成 are.

const a = column.appointments
const daysShown = 7

const definition: ModuleDefinition = {
  id: moduleId.appointments,
  page(view, _preview, { locale }) {
    const tools = pageTools(view, locale)
    const { t, cell, duration } = tools
    const table = tableOf(view, tableId.appointments)
    const rows = table?.rows ?? []
    const today = datePart(view.storyTime)
    const lastDay = addDays(today, daysShown - 1)

    const placed = rows.filter((row) => row.cells[a.status] !== appointmentStatus.requested && stringCell(row, a.start) !== null)
    const unplaced = rows.filter((row) => row.cells[a.status] === appointmentStatus.requested)
    const inRange = placed.filter((row) => {
      const day = datePart(stringCell(row, a.start) ?? '')
      return day >= today && day <= lastDay
    })

    if (inRange.length === 0 && unplaced.length === 0) {
      const next = placed
        .map((row) => stringCell(row, a.start) ?? '')
        .filter((start) => datePart(start) > lastDay)
        .sort()[0]
      const body = next ? t('appointments.empty.next', { date: tools.date(next) }) : t('appointments.empty.body')
      return { blocks: [tools.empty('appointments.empty.section', t('appointments.empty.title'), body)] }
    }

    const basisOf = (row: (typeof rows)[number]) => {
      const extra = numberCell(row, a.extra)
      const words = tools.basisWords(stringCell(row, a.basis))
      return extra ? t('basis.withExtra', { basis: words, extra: t('estimate.extra', { duration: duration(extra) }) }) : words
    }
    const spent = (row: (typeof rows)[number]) => numberCell(row, a.actual) ?? numberCell(row, a.estimate) ?? 0

    // 待确认: open bookings whose customer has not answered a confirmation.
    const replied = new Set(
      (tableOf(view, tableId.confirmations)?.rows ?? []).filter((row) => row.cells.status === 'replied').map((row) => String(row.cells.appointment)),
    )
    const toConfirm = placed.filter(
      (row) => row.cells[a.status] === appointmentStatus.booked && (stringCell(row, a.start) ?? '') >= view.storyTime && !replied.has(row.id),
    )
    // 空档: the hours on shift today that no booking takes.
    const todays = placed.filter((row) => datePart(stringCell(row, a.start) ?? '') === today)
    const onShift = (tableOf(view, tableId.shifts)?.rows ?? [])
      .filter((row) => datePart(String(row.cells.start)) === today)
      .reduce((sum, row) => sum + minutesBetween(String(row.cells.start), String(row.cells.end)), 0)
    const free = Math.max(0, onShift - todays.reduce((sum, row) => sum + spent(row), 0))

    const groomers = table?.columns.find((each) => each.id === a.groomer)?.options ?? {}
    const blocks: PageBlock[] = [
      {
        key: 'summary',
        block: 'block.summary',
        title: t('summary.title'),
        span: 'full',
        props: {
          items: [
            { id: 'today', label: t('appointments.summary.today'), value: t('count.items', { count: todays.length }) },
            { id: 'to-confirm', label: t('appointments.summary.toConfirm'), value: t('count.items', { count: toConfirm.length }) },
            { id: 'free', label: t('appointments.summary.free'), value: duration(free) },
          ],
        },
      },
      {
        key: blockKey.appointments.schedule,
        block: 'block.schedule',
        title: t('appointments.schedule.title'),
        span: 'full',
        props: {
          range: { kind: 'week', start: today, days: daysShown },
          resources: Object.entries(groomers).map(([id, name]) => ({ id, label: name[locale] })),
          slots: inRange.map((row) => {
            const start = stringCell(row, a.start) ?? today
            const estimate = numberCell(row, a.estimate) ?? 0
            const actual = numberCell(row, a.actual)
            const done = row.cells[a.status] === appointmentStatus.done
            const meta = t('appointments.slot.meta', { service: cell(table, row, a.service), duration: duration(estimate), basis: basisOf(row) })
            return {
              id: row.id,
              resourceId: stringCell(row, a.groomer) ?? '',
              start,
              end: addMinutes(start, spent(row)),
              title: tools.dogLabel(stringCell(row, a.dog) ?? ''),
              meta: actual !== null ? `${meta} · ${t('appointments.slot.done', { duration: duration(actual) })}` : meta,
              badges: done ? [{ label: t('appointments.status.done') }] : [],
              href: appointmentPath(row.id),
            }
          }),
        },
      },
    ]
    if (unplaced.length > 0) {
      const dogs = tableOf(view, tableId.dogs)
      blocks.push({
        key: blockKey.appointments.unplaced,
        block: 'block.list',
        title: t('appointments.unplaced.title'),
        span: 'full',
        props: {
          items: unplaced.map((row) => {
            const dog = stringCell(row, a.dog) ?? ''
            return {
              id: row.id,
              title: tools.dogLabel(dog),
              meta: t('appointments.unplaced.meta', {
                owner: cell(dogs, dogs?.rows.find((each) => each.id === dog), column.dogs.owner),
                service: cell(table, row, a.service),
                duration: duration(numberCell(row, a.estimate) ?? 0),
                basis: basisOf(row),
              }),
              badges: [{ label: t('appointments.status.requested') }],
              href: appointmentPath(row.id),
            }
          }),
        },
      })
    }
    return { blocks }
  },
}

export default definition
