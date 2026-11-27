import type { PageBlock } from '@/blocks/types'
import { moduleId, tableId } from '@/fixtures/keys'
import { formatDate, formatNumber, translate, type MessageKey, type MessageParams } from '@/i18n'
import { accountsPath } from '@/module/ModuleFrame/failure'
import { cellText, datePart, resolveModule, stringCell, tableOf, toDate, type ModuleDefinition } from '@/runtime'
import { modulePath } from '@/shell'

// 待办 (`todo`, D-51): how many are open, due today and overdue, then what is
// still to do — overdue first, then by due date, each with the feature it
// comes from — and what was done lately. With no to-do the page is one
// `block.empty` pointing at the accounts.

const definition: ModuleDefinition = {
  id: moduleId.todo,

  page(view, _preview, { locale }) {
    const t = (key: MessageKey<'base-modules'>, params?: MessageParams) => translate(locale, 'base-modules', key, params)
    const table = tableOf(view, tableId.tasks)
    const rows = table?.rows ?? []

    if (!table || rows.length === 0) {
      return {
        blocks: [
          {
            key: 'empty',
            block: 'block.empty',
            title: t('todo.empty.section'),
            span: 'full',
            props: { title: t('todo.empty.title'), body: t('todo.empty.body'), action: { label: t('todo.empty.action'), href: accountsPath } },
          },
        ],
      }
    }

    const today = datePart(view.storyTime)
    const due = (row: (typeof rows)[number]) => stringCell(row, 'due') ?? ''
    const byDue = (one: (typeof rows)[number], other: (typeof rows)[number]) => due(one).localeCompare(due(other))
    const open = rows.filter((row) => row.cells.done !== true).sort(byDue)
    const done = rows.filter((row) => row.cells.done === true).sort((one, other) => byDue(other, one))
    const overdue = open.filter((row) => due(row) < today)
    const dueToday = open.filter((row) => due(row) === today)

    const item = (row: (typeof rows)[number]) => {
      const source = resolveModule(view, stringCell(row, 'source') ?? '')?.module
      const date = due(row) ? formatDate(locale, toDate(due(row))) : ''
      const late = row.cells.done !== true && due(row) < today
      return {
        id: row.id,
        title: cellText(view, table, row, 'title', locale) ?? '',
        meta: row.cells.done === true ? t('todo.item.due', { date }) : late ? t('todo.item.overdue', { date }) : due(row) === today ? t('todo.item.today') : t('todo.item.due', { date }),
        badges: [
          { label: source ? source.name[locale] : t('todo.item.own') },
          ...(late ? [{ label: t('todo.item.late') }] : []),
          ...(row.cells.done === true ? [{ label: t('todo.item.done') }] : []),
        ],
        href: source && !source.archived ? modulePath(source.id) : undefined,
      }
    }

    const blocks: PageBlock[] = [
      {
        key: 'summary',
        block: 'block.summary',
        title: t('todo.summary'),
        span: 'full',
        props: {
          items: [
            { id: 'open', label: t('todo.summary.open'), value: formatNumber(locale, open.length) },
            { id: 'today', label: t('todo.summary.today'), value: formatNumber(locale, dueToday.length) },
            { id: 'overdue', label: t('todo.summary.overdue'), value: formatNumber(locale, overdue.length) },
          ],
        },
      },
      { key: 'open', block: 'block.list', title: t('todo.open'), span: 'full', props: { items: open.map(item) } },
    ]
    if (done.length > 0) blocks.push({ key: 'done', block: 'block.list', title: t('todo.done'), span: 'full', props: { items: done.map(item) } })
    return { blocks }
  },
}

export default definition
