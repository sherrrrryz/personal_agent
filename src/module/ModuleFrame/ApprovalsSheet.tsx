import { useState } from 'react'

import { BlockRenderer } from '@/block-renderer'
import type { BlockActionEvent, PageDescription } from '@/blocks/types'
import { Button } from '@/components/actions'
import { Sheet } from '@/components/containers'
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from '@/components/feedback'
import { useIsMobile } from '@/hooks/use-mobile'
import { useLocale, useT } from '@/i18n'
import { isResolved, useActions, useResource, type Module, type Proposal } from '@/runtime'

/** Waiting for her: a deferred proposal with a part still to decide. */
const awaits = (proposal: Proposal) => proposal.mode === 'deferred' && !isResolved(proposal)

/**
 * 待你确认 *n* — the module's deferred proposals in a sheet, each a
 * `block.proposal` with 接受 / 拒绝 per part. The count is on the button;
 * it follows what she decides in the sheet at once.
 */
export function ApprovalsSheet({ module, name }: { module: Module; name: string }) {
  const t = useT('module')
  const compact = useIsMobile()
  const [open, setOpen] = useState(false)
  // 通知 gathers every module's proposals on its page: its count is theirs too.
  const answer = useResource({ kind: 'proposals', moduleId: module.id === 'notifications' ? undefined : module.id })
  const proposals = 'data' in answer && answer.data ? answer.data : null
  const count = proposals?.filter(awaits).length

  return (
    <Sheet
      open={open}
      onOpenChange={setOpen}
      side={compact ? 'bottom' : 'end'}
      title={t('approvals.title')}
      description={t('approvals.description', { module: name })}
      trigger={
        <Button variant="secondary" data-approvals={count ?? ''}>
          {count === undefined ? t('approvals.title') : t('approvals.open', { count })}
        </Button>
      }
    >
      {open && <Approvals state={answer.state} proposals={proposals ?? []} name={name} />}
    </Sheet>
  )
}

function Approvals({ state, proposals, name }: { state: string; proposals: Proposal[]; name: string }) {
  const t = useT('module')
  const { locale } = useLocale()
  const { resolveProposalPart } = useActions()

  // A proposal she finishes here stays until the sheet closes: its card then
  // says what she decided, and focus has somewhere to be.
  const [seen, setSeen] = useState<string[]>([])
  const waiting = proposals.filter(awaits).map((proposal) => proposal.id)
  if (waiting.some((id) => !seen.includes(id))) setSeen([...new Set([...seen, ...waiting])])
  const shown = proposals.filter((proposal) => seen.includes(proposal.id) || waiting.includes(proposal.id))

  const page: PageDescription = {
    blocks: shown.map((proposal) => ({
      key: proposal.id,
      block: 'block.proposal',
      title: proposal.title[locale],
      span: 'full',
      props: {
        mode: proposal.mode,
        summary: proposal.summary?.[locale],
        parts: proposal.parts.map((part) => ({ id: part.id, text: part.text[locale], state: part.state })),
        source: { label: name },
      },
    })),
  }

  function decide({ blockKey, actionId, itemId }: BlockActionEvent) {
    resolveProposalPart({ proposalId: blockKey, partId: itemId, resolution: actionId === 'accept' ? 'accepted' : 'rejected' })
  }

  return (
    <BlockRenderer
      level={3}
      page={page}
      // A failure that still brought the other sources' proposals shows those.
      state={state === 'loading' ? 'loading' : state === 'error' && shown.length === 0 ? 'error' : 'ready'}
      onAction={decide}
      errorTitle={t('approvals.error.title')}
      error={t('approvals.error.reason')}
      empty={
        <Empty>
          <EmptyHeader>
            <EmptyTitle>{t('approvals.empty.title')}</EmptyTitle>
            <EmptyDescription>{t('approvals.empty.body')}</EmptyDescription>
          </EmptyHeader>
        </Empty>
      }
    />
  )
}
