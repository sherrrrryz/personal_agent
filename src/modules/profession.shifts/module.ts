import type { PageBlock } from '@/blocks/types'
import { appointmentStatus, column, moduleId, nodeId, tableId } from '@/fixtures/keys'
import { formatNumber } from '@/i18n'
import { addDays, datePart, findModule, numberCell, stringCell, tableOf, type ModuleDefinition, type Snapshot } from '@/runtime'
import { mondayOf } from '@/runtime/time'
import { durationModuleId, minutesBetween, pageTools } from '@/screens/profession/page-tools'
import { modulePath } from '@/shell'

// `profession.shifts` 排班 (spec part 3 § Screens and flows): the week's hours,
// how much of them the bookings take, the time a change of durations frees —
// the sum of 调整前 − 预计 over the open bookings — the rota by person, the
// assisted suggestion 服务时长 raises when durations change, and 换班申请.

const a = column.appointments

/** 净空出时间 in minutes: what the open bookings gave back when their estimates moved. Negative: they take more. */
export function netFreed(view: Snapshot): number {
  return (tableOf(view, tableId.appointments)?.rows ?? [])
    .filter((row) => row.cells[a.status] === appointmentStatus.booked && numberCell(row, a.previous) !== null)
    .reduce((sum, row) => sum + (numberCell(row, a.previous) ?? 0) - (numberCell(row, a.estimate) ?? 0), 0)
}

const suggestion = (view: Snapshot) =>
  view.proposals.filter((proposal) => proposal.moduleId === moduleId.shifts && proposal.nodeId === nodeId.suggestShifts).at(-1)

const definition: ModuleDefinition = {
  id: moduleId.shifts,
  page(view, _preview, { locale }) {
    const tools = pageTools(view, locale)
    const { t, cell, duration } = tools
    const shifts = tableOf(view, tableId.shifts)
    const swaps = tableOf(view, tableId.swaps)
    const monday = mondayOf(view.storyTime)
    const sunday = addDays(monday, 6)
    const inWeek = (at: string | null) => at !== null && datePart(at) >= monday && datePart(at) <= sunday
    const rota = (shifts?.rows ?? []).filter((row) => inWeek(stringCell(row, 'start')))
    if (rota.length === 0) {
      return { blocks: [tools.empty('shifts.empty.section', t('shifts.empty.title'), t('shifts.empty.body'))] }
    }

    const bookings = (tableOf(view, tableId.appointments)?.rows ?? []).filter(
      (row) => row.cells[a.status] !== appointmentStatus.requested && inWeek(stringCell(row, a.start)),
    )
    const spent = (rows: typeof bookings) => rows.reduce((sum, row) => sum + (numberCell(row, a.actual) ?? numberCell(row, a.estimate) ?? 0), 0)
    const hours = rota.reduce((sum, row) => sum + minutesBetween(String(row.cells.start), String(row.cells.end)), 0)
    const net = netFreed(view)
    const staff = shifts?.columns.find((each) => each.id === 'staff')?.options ?? {}

    const blocks: PageBlock[] = [
      {
        key: 'summary',
        block: 'block.summary',
        title: t('summary.title'),
        span: 'full',
        props: {
          items: [
            { id: 'hours', label: t('shifts.summary.hours'), value: duration(hours) },
            {
              id: 'load',
              label: t('shifts.summary.load'),
              value: formatNumber(locale, hours > 0 ? spent(bookings) / hours : 0, { style: 'percent', maximumFractionDigits: 0 }),
            },
            { id: 'net', label: t('shifts.summary.net'), value: net >= 0 ? duration(net) : t('shifts.net.taken', { duration: duration(-net) }) },
          ],
        },
      },
      {
        key: 'rota',
        block: 'block.schedule',
        title: t('shifts.rota.title'),
        span: 'full',
        props: {
          range: { kind: 'week', start: monday, days: 7 },
          resources: Object.entries(staff).map(([id, name]) => ({ id, label: name[locale] })),
          slots: rota.map((row) => {
            const start = String(row.cells.start)
            const own = bookings.filter((each) => each.cells[a.groomer] === row.cells.staff && datePart(stringCell(each, a.start) ?? '') === datePart(start))
            return {
              id: row.id,
              resourceId: String(row.cells.staff),
              start,
              end: String(row.cells.end),
              title: t('shifts.slot.title'),
              meta: own.length > 0 ? t('shifts.slot.meta', { count: own.length, duration: duration(spent(own)) }) : t('shifts.slot.free'),
            }
          }),
        },
      },
    ]

    const proposal = suggestion(view)
    if (proposal) {
      const source = findModule(view, durationModuleId(view) ?? moduleId.duration)
      blocks.push({
        key: 'proposal',
        block: 'block.proposal',
        title: t('shifts.proposal.title'),
        span: 'full',
        props: {
          mode: proposal.mode,
          summary: proposal.summary?.[locale] ?? proposal.title[locale],
          parts: proposal.parts.map((part) => ({ id: part.id, text: part.text[locale], state: part.state })),
          source: { label: source?.name[locale] ?? '', href: source ? modulePath(source.id) : undefined },
        },
      })
    }
    blocks.push({
      key: 'swaps',
      block: 'block.list',
      title: t('shifts.swaps.title'),
      span: 'full',
      props: {
        items: (swaps?.rows ?? []).map((row) => ({
          id: row.id,
          title: t('shifts.swap.title', { from: cell(swaps, row, 'from'), with: cell(swaps, row, 'with') }),
          meta: cell(swaps, row, 'day'),
          badges: [{ label: cell(swaps, row, 'status') }],
        })),
      },
    })
    return { blocks }
  },
  onAction(event, actions, view) {
    const proposal = suggestion(view)
    if (event.blockKey !== 'proposal' || !proposal) return
    if (event.actionId !== 'accept' && event.actionId !== 'reject') return
    actions.resolveProposalPart({ proposalId: proposal.id, partId: event.itemId, resolution: event.actionId === 'accept' ? 'accepted' : 'rejected' })
  },
}

export default definition
