import { moduleId, tableId } from '@/fixtures/keys'
import { formatDateTime, formatNumber, translate, type MessageKey, type MessageParams } from '@/i18n'
import { accountsPath } from '@/module/ModuleFrame/failure'
import { cellText, resolveModule, stringCell, tableOf, toDate, type ModuleDefinition } from '@/runtime'
import { modulePath } from '@/shell'

// 消息 (`messages`, spec part 3 § Screens and flows): how many are unread, then
// the customers' messages — kept together by the module each was filed under,
// with its channel as a badge and a link to that module. With no message the
// page is one `block.empty` pointing at the accounts.

const definition: ModuleDefinition = {
  id: moduleId.messages,

  page(view, _preview, { locale }) {
    const t = (key: MessageKey<'base-modules'>, params?: MessageParams) => translate(locale, 'base-modules', key, params)
    const table = tableOf(view, tableId.messages)
    const rows = table?.rows ?? []

    if (!table || rows.length === 0) {
      return {
        blocks: [
          {
            key: 'empty',
            block: 'block.empty',
            title: t('messages.empty.section'),
            span: 'full',
            props: {
              title: t('messages.empty.title'),
              body: t('messages.empty.body'),
              action: { label: t('messages.empty.action'), href: accountsPath },
            },
          },
        ],
      }
    }

    // Grouped by the module a message was filed under, in navigation order; the newest first inside a group.
    const order = view.modules.map((module) => module.id)
    const place = (id: string | null) => {
      const index = order.indexOf(resolveModule(view, id ?? '')?.module.id ?? '')
      return index === -1 ? order.length : index
    }
    const sorted = [...rows].sort(
      (a, b) =>
        place(stringCell(a, 'module')) - place(stringCell(b, 'module')) ||
        (stringCell(b, 'at') ?? '').localeCompare(stringCell(a, 'at') ?? ''),
    )
    const unread = rows.filter((row) => row.cells.unread === true).length

    return {
      blocks: [
        {
          key: 'summary',
          block: 'block.summary',
          title: t('messages.summary'),
          span: 'full',
          props: {
            items: [
              { id: 'unread', label: t('messages.summary.unread'), value: formatNumber(locale, unread) },
              { id: 'total', label: t('messages.summary.total'), value: formatNumber(locale, rows.length) },
            ],
          },
        },
        {
          key: 'messages',
          block: 'block.list',
          title: t('messages.list'),
          span: 'full',
          props: {
            items: sorted.map((row) => {
              const filed = resolveModule(view, stringCell(row, 'module') ?? '')?.module
              const at = stringCell(row, 'at')
              const when = at ? formatDateTime(locale, toDate(at)) : ''
              const channel = cellText(view, table, row, 'channel', locale)
              return {
                id: row.id,
                title: t('messages.item.title', {
                  from: cellText(view, table, row, 'from', locale) ?? '',
                  text: cellText(view, table, row, 'text', locale) ?? '',
                }),
                meta: filed ? t('messages.item.meta', { when, module: filed.name[locale] }) : t('messages.item.metaPlain', { when }),
                badges: [
                  ...(channel ? [{ label: channel }] : []),
                  ...(row.cells.unread === true ? [{ label: t('messages.item.unread') }] : []),
                ],
                href: filed && !filed.archived ? modulePath(filed.id) : undefined,
              }
            }),
          },
        },
      ],
    }
  },
}

export default definition
