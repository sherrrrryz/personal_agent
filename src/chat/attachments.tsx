import { useNavigate } from 'react-router'

import { BlockRenderer } from '@/block-renderer'
import type { BlockActionEvent, PageBlock } from '@/blocks/types'
import type { SectionLevel } from '@/components/layout'
import { useLocale, useT, type Locale } from '@/i18n'
import {
  cellText,
  resolveModule,
  useActions,
  useRuntimeState,
  type MessageAttachment,
  type RuntimeState,
} from '@/runtime'
import { modulePath } from '@/shell'

import { workflowPath } from './paths'

/** One attachment as a block of the registry (D-12): a proposal, or a table the answer carries. */
function blockOf(
  attachment: MessageAttachment,
  key: string,
  state: RuntimeState,
  locale: Locale,
  words: { noData: string; caption: (name: string, count: number) => string },
): PageBlock | null {
  if (attachment.kind === 'table') {
    const title = attachment.name[locale]
    return {
      key,
      block: 'block.table',
      title,
      span: 'full',
      props: {
        // The block is a region named by its title; the table inside needs a name of its own.
        caption: words.caption(title, attachment.rows.length),
        columns: attachment.columns.map((column) => ({ id: column.id, label: column.label[locale] })),
        rows: attachment.rows.map((row) => ({
          id: row.id,
          cells: Object.fromEntries(
            attachment.columns.map((column) => [column.id, cellText(state, attachment, row, column.id, locale) ?? words.noData]),
          ),
        })),
      },
    }
  }
  const proposal = state.proposals.find((each) => each.id === attachment.proposalId)
  if (!proposal) return null
  const source = resolveModule(state, proposal.moduleId)?.module
  return {
    key: proposal.id,
    block: 'block.proposal',
    title: proposal.title[locale],
    span: 'full',
    props: {
      mode: proposal.mode,
      summary: proposal.summary?.[locale],
      parts: proposal.parts.map((part) => ({ id: part.id, text: part.text[locale], state: part.state })),
      source: { label: source?.name[locale] ?? proposal.moduleId, href: source ? modulePath(source.id) : undefined },
    },
  }
}

/**
 * What a message carries, drawn by the block renderer. A proposal's 接受 /
 * 拒绝 go to the runtime; when accepting creates a module (the AI's offer to
 * keep a conversation, D-08) the screen moves to that module's workflow.
 */
export function MessageAttachmentBlock({
  attachment,
  messageId,
  index,
  level,
}: {
  attachment: MessageAttachment
  messageId: string
  index: number
  /** The heading level of the block's title: one under the surface's own heading. */
  level: SectionLevel
}) {
  const t = useT('chat')
  const { locale } = useLocale()
  const state = useRuntimeState()
  const actions = useActions()
  const navigate = useNavigate()
  const block = blockOf(attachment, `${messageId}:${index}`, state, locale, {
    noData: t('attachment.noData'),
    caption: (name, count) => t('attachment.caption', { name, count }),
  })
  if (!block) return null

  function onAction(event: BlockActionEvent) {
    if (attachment.kind !== 'proposal') return
    const proposal = state.proposals.find((each) => each.id === attachment.proposalId)
    const created = actions.resolveProposalPart({
      proposalId: attachment.proposalId,
      partId: event.itemId,
      resolution: event.actionId === 'accept' ? 'accepted' : 'rejected',
    })
    // Only a conversation that became a module moves the screen; any other effect shows where she is.
    if (created && proposal?.onAccept.action === 'createSubModule') void navigate(workflowPath(created))
  }

  return <BlockRenderer page={{ blocks: [block] }} level={level} onAction={onAction} />
}
