import { Check, Hourglass, X } from 'lucide-react'
import { useId, useRef } from 'react'

import { BlockAnchor } from '@/block-renderer/block-link'
import type { BlockComponentProps, ProposalPartState } from '@/blocks/types'
import { Button } from '@/components/actions'
import { Card, CardContent } from '@/components/containers'
import { BehaviourModeBadge, ChangeMarker } from '@/components/data-display'
import { DataState, Empty, EmptyHeader, EmptyTitle, Skeleton } from '@/components/feedback'
import { useT } from '@/i18n'

import { proposalActions } from './actions'

const stateIcon = { accepted: Check, rejected: X, pending: Hourglass } as const
const stateKey = {
  accepted: 'proposal.state.accepted',
  rejected: 'proposal.state.rejected',
  pending: 'proposal.state.pending',
} as const satisfies Record<ProposalPartState, string>

/**
 * `block.proposal` — something the AI proposes, in parts she accepts or
 * rejects one by one (D-22: nothing is applied before she decides). Each
 * part is a group named by its text; a decided part says so in words; after
 * a decision focus goes to the next part still waiting, or to the line that
 * says everything is decided. Without `onAction` it is read only.
 */
export function ProposalCard({ props, changes, state, onAction }: BlockComponentProps<'block.proposal'>) {
  const t = useT('blocks')
  const id = useId()
  const accepts = useRef(new Map<string, HTMLButtonElement>())
  const status = useRef<HTMLParagraphElement>(null)

  const { parts } = props
  const waiting = parts.filter((part) => part.state === 'pending').length
  const accepted = parts.filter((part) => part.state === 'accepted').length

  function decide(actionId: string, partId: string) {
    // Focus first: the button that was pressed is about to leave the page.
    const index = parts.findIndex((part) => part.id === partId)
    const next = [...parts.slice(index + 1), ...parts.slice(0, index)].find((part) => part.state === 'pending')
    const target = next ? accepts.current.get(next.id) : status.current
    target?.focus()
    onAction?.(actionId, partId)
  }

  return (
    <DataState
      state={state === 'ready' && parts.length === 0 ? 'empty' : state}
      loading={
        <div className="flex flex-col gap-3 rounded-xl border p-4">
          <Skeleton className="h-5 w-1/3" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-4/5" />
        </div>
      }
      empty={
        <Empty>
          <EmptyHeader>
            <EmptyTitle>{t('proposal.empty.title')}</EmptyTitle>
          </EmptyHeader>
        </Empty>
      }
      errorTitle={t('proposal.error.title')}
      error={t('proposal.error.reason')}
    >
      <Card data-slot="block-proposal">
        <CardContent className="flex min-w-0 flex-col gap-4">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <BehaviourModeBadge mode={props.mode} />
            <p className="flex min-w-0 flex-wrap items-center gap-x-1 text-muted-foreground">
              <span>{t('proposal.from')}</span>
              {props.source.href ? (
                <BlockAnchor href={props.source.href}>{props.source.label}</BlockAnchor>
              ) : (
                <span className="wrap-break-word">{props.source.label}</span>
              )}
            </p>
          </div>
          {props.summary && <p className="wrap-break-word">{props.summary}</p>}
          <ul aria-label={t('proposal.parts')} className="flex flex-col">
            {parts.map((part) => {
              const textId = `${id}-${part.id}`
              const Icon = stateIcon[part.state]
              return (
                <li key={part.id} className="border-t py-3">
                  <div role="group" aria-labelledby={textId} data-part={part.id} data-state={part.state} className="flex min-w-0 flex-col gap-2">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                      <p id={textId} className="min-w-0 font-medium wrap-break-word">
                        {part.text}
                      </p>
                      {changes[part.id] && <ChangeMarker kind={changes[part.id]} />}
                    </div>
                    {part.state === 'pending' && onAction ? (
                      <div className="flex flex-wrap gap-2">
                        <Button
                          size="sm"
                          aria-describedby={textId}
                          ref={(node) => {
                            if (node) accepts.current.set(part.id, node)
                            else accepts.current.delete(part.id)
                          }}
                          onClick={() => decide(proposalActions.accept, part.id)}
                        >
                          {t('proposal.accept')}
                        </Button>
                        <Button
                          size="sm"
                          variant="secondary"
                          aria-describedby={textId}
                          onClick={() => decide(proposalActions.reject, part.id)}
                        >
                          {t('proposal.reject')}
                        </Button>
                      </div>
                    ) : (
                      <p className="flex items-center gap-1.5 text-muted-foreground">
                        <Icon aria-hidden="true" className="size-4 shrink-0" />
                        {t(stateKey[part.state])}
                      </p>
                    )}
                  </div>
                </li>
              )
            })}
          </ul>
          {/* Says how much is left after every decision, and takes focus when nothing is. */}
          <p
            ref={status}
            role="status"
            tabIndex={-1}
            className="rounded-sm text-muted-foreground outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            {waiting > 0
              ? t('proposal.remaining', { count: waiting })
              : t('proposal.done', { accepted, rejected: parts.length - accepted })}
          </p>
        </CardContent>
      </Card>
    </DataState>
  )
}
