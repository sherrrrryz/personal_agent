import type { BlockDefinition } from '@/blocks/types'
import { translate, type MessageKey } from '@/i18n'

import { ProposalCard } from './ProposalCard'

export { proposalActions } from './actions'
export { ProposalCard } from './ProposalCard'

/** `block.proposal` — registry row and contract: docs/design/components/blocks.md. */
export const definition: BlockDefinition<'block.proposal'> = {
  id: 'block.proposal',
  Component: ProposalCard,
  demo: (locale) => {
    const t = (key: MessageKey<'blocks'>) => translate(locale, 'blocks', key)
    const parts = [
      { id: 'move-doudou', text: t('demo.proposal.part1'), state: 'accepted' as const },
      { id: 'overtime-ajie', text: t('demo.proposal.part2'), state: 'pending' as const },
      { id: 'message-owner', text: t('demo.proposal.part3'), state: 'pending' as const },
    ]
    const source = { label: t('demo.proposal.source'), href: '/m/shifts' }
    return {
      title: t('demo.proposal.title'),
      props: { mode: 'deferred', summary: t('demo.proposal.summary'), parts, source },
      long: {
        mode: 'deferred',
        summary: t('demo.proposal.summary'),
        parts: [
          ...parts,
          { id: 'keep-free', text: t('demo.proposal.longPart4'), state: 'pending' },
          { id: 'move-xueqiu', text: t('demo.proposal.longPart5'), state: 'rejected' },
          { id: 'tell-owner', text: t('demo.proposal.longPart6'), state: 'pending' },
          { id: 'first-visit', text: t('demo.proposal.longPart7'), state: 'pending' },
          { id: 'order-shampoo', text: t('demo.proposal.longPart8'), state: 'pending' },
        ],
        source,
      },
      changes: { 'overtime-ajie': 'new', 'message-owner': 'updated' },
    }
  },
}
