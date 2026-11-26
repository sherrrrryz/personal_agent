import { moduleId, tableId } from '@/fixtures/keys'
import { formatDateTime, formatNumber, translate, type MessageKey, type MessageParams } from '@/i18n'
import { datePart, openProposals, resolveModule, stringCell, tableOf, toDate, type ModuleDefinition } from '@/runtime'
import type { PageBlock } from '@/blocks/types'
import { modulePath } from '@/shell'

// 通知 (`notifications`, spec part 3 § Screens and flows): the figures, one
// `block.proposal` per deferred item of any module — each naming the module it
// comes from — and the important items the workflow ranked. The first
// unresolved proposal is the page's primary action. With nothing waiting and
// nothing ranked the page is one `block.empty`.

/** The key of a proposal's block is the proposal's id, so its 接受 / 拒绝 name it. */
const definition: ModuleDefinition = {
  id: moduleId.notifications,

  page(view, _preview, { locale }) {
    const t = (key: MessageKey<'base-modules'>, params?: MessageParams) => translate(locale, 'base-modules', key, params)
    const source = (id: string) => {
      const module = resolveModule(view, id)?.module
      return { label: module?.name[locale] ?? id, href: module && !module.archived ? modulePath(module.id) : undefined }
    }

    // Newest first; a deferred item waits here until every part is decided.
    const waiting = openProposals(view).filter((proposal) => proposal.mode === 'deferred')
    const notices = [...(tableOf(view, tableId.notices)?.rows ?? [])].sort((a, b) =>
      (stringCell(b, 'at') ?? '').localeCompare(stringCell(a, 'at') ?? ''),
    )

    if (waiting.length === 0 && notices.length === 0) {
      return {
        blocks: [
          {
            key: 'empty',
            block: 'block.empty',
            title: t('notifications.empty.section'),
            span: 'full',
            props: { title: t('notifications.empty.title'), body: t('notifications.empty.body') },
          },
        ],
      }
    }

    const today = datePart(view.storyTime)
    const newToday =
      waiting.filter((proposal) => datePart(proposal.at) === today).length +
      notices.filter((row) => datePart(stringCell(row, 'at') ?? '') === today).length

    const blocks: PageBlock[] = [
      {
        key: 'summary',
        block: 'block.summary',
        title: t('notifications.summary'),
        span: 'full',
        props: {
          items: [
            { id: 'awaiting', label: t('notifications.summary.awaiting'), value: formatNumber(locale, waiting.length) },
            { id: 'today', label: t('notifications.summary.today'), value: formatNumber(locale, newToday) },
          ],
        },
      },
      ...waiting.map(
        (proposal): PageBlock => ({
          key: proposal.id,
          block: 'block.proposal',
          title: proposal.title[locale],
          span: 'full',
          props: {
            mode: proposal.mode,
            summary: proposal.summary?.[locale],
            parts: proposal.parts.map((part) => ({ id: part.id, text: part.text[locale], state: part.state })),
            source: source(proposal.moduleId),
          },
        }),
      ),
    ]

    if (notices.length > 0) {
      blocks.push({
        key: 'important',
        block: 'block.list',
        title: t('notifications.important'),
        span: 'full',
        props: {
          items: notices.map((row) => {
            const from = source(stringCell(row, 'source') ?? '')
            const text = row.cells.text
            const at = stringCell(row, 'at')
            return {
              id: row.id,
              title: typeof text === 'object' && text !== null ? text[locale] : '',
              meta: at ? formatDateTime(locale, toDate(at)) : '',
              badges: [{ label: from.label }],
              href: from.href,
            }
          }),
        },
      })
    }
    return { blocks }
  },

  onAction({ blockKey, actionId, itemId }, actions, view) {
    if (actionId !== 'accept' && actionId !== 'reject') return
    if (!view.proposals.some((proposal) => proposal.id === blockKey)) return
    actions.resolveProposalPart({ proposalId: blockKey, partId: itemId, resolution: actionId === 'accept' ? 'accepted' : 'rejected' })
  },
}

export default definition
