import { moduleId, tableId } from '@/fixtures/keys'
import { formatDateTime, formatNumber, translate, type MessageKey, type MessageParams } from '@/i18n'
import { accountsPath } from '@/module/ModuleFrame/failure'
import { addDays, cellText, stringCell, tableOf, toDate, type ModuleDefinition } from '@/runtime'

// 文件 (`files`, D-51): how many files and how many changed this week, then
// the files as a table, the latest change first — kind, when, by whom and
// size. With no file the page is one `block.empty` pointing at the accounts.

const definition: ModuleDefinition = {
  id: moduleId.files,

  page(view, _preview, { locale }) {
    const t = (key: MessageKey<'base-modules'>, params?: MessageParams) => translate(locale, 'base-modules', key, params)
    const table = tableOf(view, tableId.files)
    const rows = table?.rows ?? []

    if (!table || rows.length === 0) {
      return {
        blocks: [
          {
            key: 'empty',
            block: 'block.empty',
            title: t('files.empty.section'),
            span: 'full',
            props: { title: t('files.empty.title'), body: t('files.empty.body'), action: { label: t('files.empty.action'), href: accountsPath } },
          },
        ],
      }
    }

    const modified = (row: (typeof rows)[number]) => stringCell(row, 'modified') ?? ''
    const sorted = [...rows].sort((one, other) => modified(other).localeCompare(modified(one)))
    const weekAgo = addDays(view.storyTime, -7)
    const text = (row: (typeof rows)[number], column: string) => cellText(view, table, row, column, locale) ?? ''

    return {
      blocks: [
        {
          key: 'summary',
          block: 'block.summary',
          title: t('files.summary'),
          span: 'full',
          props: {
            items: [
              { id: 'total', label: t('files.summary.total'), value: formatNumber(locale, rows.length) },
              { id: 'week', label: t('files.summary.week'), value: formatNumber(locale, rows.filter((row) => modified(row) >= weekAgo).length) },
            ],
          },
        },
        {
          key: 'recent',
          block: 'block.table',
          title: t('files.recent'),
          span: 'full',
          props: {
            caption: t('files.recent.caption'),
            columns: [
              { id: 'name', label: t('files.col.name') },
              { id: 'kind', label: t('files.col.kind') },
              { id: 'modified', label: t('files.col.modified') },
              { id: 'by', label: t('files.col.by') },
              { id: 'size', label: t('files.col.size'), align: 'end' },
            ],
            rows: sorted.map((row) => ({
              id: row.id,
              cells: {
                name: text(row, 'name'),
                kind: text(row, 'kind'),
                modified: modified(row) ? formatDateTime(locale, toDate(modified(row))) : '',
                by: text(row, 'by'),
                size: text(row, 'size'),
              },
            })),
          },
        },
      ],
    }
  },
}

export default definition
