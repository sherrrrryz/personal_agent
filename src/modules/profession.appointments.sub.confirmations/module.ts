import { moduleId, tableId } from '@/fixtures/keys'
import { formatTime } from '@/i18n'
import { findModule, rowOf, stringCell, tableOf, toDate, type ModuleDefinition } from '@/runtime'
import { pageTools } from '@/screens/profession/page-tools'
import { modulePath } from '@/shell'

// `profession.appointments.sub.confirmations` 预约确认 (spec part 3 § Screens
// and flows): how many confirmations went out and came back, one row per
// customer with the status as text, and what the workflow does.

const definition: ModuleDefinition = {
  id: moduleId.confirmations,
  page(view, _preview, { locale }) {
    const tools = pageTools(view, locale)
    const { t, cell } = tools
    const table = tableOf(view, tableId.confirmations)
    const rows = table?.rows ?? []
    const owner = findModule(view, table?.ownerModuleId ?? moduleId.confirmations)
    if (rows.length === 0) {
      const title = owner?.nextRunAt
        ? t('confirmations.empty.title', { time: formatTime(locale, toDate(owner.nextRunAt)) })
        : t('confirmations.empty.title.none')
      return { blocks: [tools.empty('confirmations.empty.section', title, t('confirmations.empty.body'))] }
    }
    const count = (status: string) => tools.number(rows.filter((row) => row.cells.status === status).length)
    const appointments = tableOf(view, tableId.appointments)
    return {
      blocks: [
        {
          key: 'summary',
          block: 'block.summary',
          title: t('summary.title'),
          span: 'full',
          props: {
            items: [
              { id: 'sent', label: t('confirmations.summary.sent'), value: tools.number(rows.length) },
              { id: 'replied', label: t('confirmations.summary.replied'), value: count('replied') },
              { id: 'no-reply', label: t('confirmations.summary.noReply'), value: count('no-reply') },
            ],
          },
        },
        {
          key: 'customers',
          block: 'block.list',
          title: t('confirmations.customers.title'),
          span: 'full',
          props: {
            items: rows.map((row) => {
              const booked = stringCell(rowOf(appointments, String(row.cells.appointment)), 'start')
              const sent = stringCell(row, 'sentAt')
              return {
                id: row.id,
                title: t('confirmations.customer.title', { customer: cell(table, row, 'customer'), dog: tools.dogName(String(row.cells.dog)) }),
                meta: t('confirmations.customer.meta', { booking: booked ? tools.dateTime(booked) : t('cell.none'), sent: sent ? tools.dateTime(sent) : t('cell.none') }),
                badges: [{ label: cell(table, row, 'status') }],
              }
            }),
          },
        },
        {
          key: 'note',
          block: 'block.text',
          title: t('confirmations.note.title'),
          span: 'full',
          props: {
            body: t('confirmations.note.body'),
            links: [{ label: t('confirmations.note.workflow'), href: `${modulePath(owner?.id ?? moduleId.confirmations)}/workflow` }],
          },
        },
      ],
    }
  },
}

export default definition
