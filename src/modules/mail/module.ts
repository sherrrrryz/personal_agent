import type { PageBlock } from '@/blocks/types'
import { moduleId, tableId } from '@/fixtures/keys'
import { formatDateTime, formatNumber, translate, type MessageKey, type MessageParams } from '@/i18n'
import { accountsPath } from '@/module/ModuleFrame/failure'
import { addDays, cellText, stringCell, tableOf, toDate, type ModuleDefinition } from '@/runtime'

// 邮件 (`mail`, D-51): how many need her reply and how many came this week,
// then the mail that needs a reply and the rest, the newest first — each with
// its sender, when it came and its first lines. With no mail the page is one
// `block.empty` pointing at the accounts.

const definition: ModuleDefinition = {
  id: moduleId.mail,

  page(view, _preview, { locale }) {
    const t = (key: MessageKey<'base-modules'>, params?: MessageParams) => translate(locale, 'base-modules', key, params)
    const table = tableOf(view, tableId.emails)
    const rows = table?.rows ?? []

    if (!table || rows.length === 0) {
      return {
        blocks: [
          {
            key: 'empty',
            block: 'block.empty',
            title: t('mail.empty.section'),
            span: 'full',
            props: { title: t('mail.empty.title'), body: t('mail.empty.body'), action: { label: t('mail.empty.action'), href: accountsPath } },
          },
        ],
      }
    }

    const at = (row: (typeof rows)[number]) => stringCell(row, 'at') ?? ''
    const sorted = [...rows].sort((one, other) => at(other).localeCompare(at(one)))
    const reply = sorted.filter((row) => row.cells.reply === true)
    const other = sorted.filter((row) => row.cells.reply !== true)
    const weekAgo = addDays(view.storyTime, -7)

    const item = (row: (typeof rows)[number]) => ({
      id: row.id,
      title: cellText(view, table, row, 'subject', locale) ?? '',
      meta: t('mail.item.meta', {
        from: cellText(view, table, row, 'from', locale) ?? '',
        when: at(row) ? formatDateTime(locale, toDate(at(row))) : '',
        preview: cellText(view, table, row, 'preview', locale) ?? '',
      }),
      badges: row.cells.reply === true ? [{ label: t('mail.item.reply') }] : [],
    })

    const blocks: PageBlock[] = [
      {
        key: 'summary',
        block: 'block.summary',
        title: t('mail.summary'),
        span: 'full',
        props: {
          items: [
            { id: 'reply', label: t('mail.summary.reply'), value: formatNumber(locale, reply.length) },
            { id: 'week', label: t('mail.summary.week'), value: formatNumber(locale, rows.filter((row) => at(row) >= weekAgo).length) },
          ],
        },
      },
      { key: 'reply', block: 'block.list', title: t('mail.reply'), span: 'full', props: { items: reply.map(item) } },
    ]
    if (other.length > 0) blocks.push({ key: 'other', block: 'block.list', title: t('mail.other'), span: 'full', props: { items: other.map(item) } })
    return { blocks }
  },
}

export default definition
