import { BlockStatesDemo } from '@/block-renderer/block-demo'
import type { ProposalBlockProps } from '@/blocks/types'

import { definition, proposalActions } from './index'

/** What the module's handler would do through `resolveProposalPart`: the part takes the decision. */
function decided(props: ProposalBlockProps, acted: Record<string, string>): ProposalBlockProps {
  return {
    ...props,
    parts: props.parts.map((part) =>
      part.id in acted ? { ...part, state: acted[part.id] === proposalActions.accept ? 'accepted' : 'rejected' } : part,
    ),
  }
}

export default function ProposalCardDemo() {
  return <BlockStatesDemo definition={definition} apply={decided} />
}
