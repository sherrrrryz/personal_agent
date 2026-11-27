import { useRef, useState } from 'react'

import { Button, Toggle } from '@/components/actions'
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/containers'
import { Section, Stack } from '@/components/layout'
import { useLocale, useT } from '@/i18n'
import { useActions, useRuntimeState } from '@/runtime'

import { shownCurrent, type EditorShown, type EditorSlotProps } from '../slots'

import { changesOf, comparisonOf, previousOf, shownNumber, showsProposal, type Change } from './compare'

/**
 * The comparison's controls in the version line: 与上一版对比 (a switch — on
 * while the shown version is compared with the one before it), 结束对比 for a
 * comparison the history started, and the way to and from the change that
 * waits for approval.
 */
export function DiffActions({ workflow, shown, onShownChange }: EditorSlotProps) {
  const t = useT('workflow-history')
  if (showsProposal(workflow, shown)) {
    return (
      <Button variant="secondary" size="sm" onClick={() => onShownChange(shownCurrent)}>
        {t('diff.proposed.back')}
      </Button>
    )
  }
  const previous = previousOf(workflow, shownNumber(workflow, shown))
  // A draft that is gone (approved or refused elsewhere) counts as the version in force.
  const base: EditorShown = { version: typeof shown.version === 'number' ? shown.version : null, compareTo: shown.compareTo }
  return (
    <>
      {previous !== null && (
        <Toggle size="sm" pressed={shown.compareTo === previous} onPressedChange={(pressed) => onShownChange({ ...base, compareTo: pressed ? previous : null })}>
          {t('diff.previous')}
        </Toggle>
      )}
      {shown.compareTo !== null && shown.compareTo !== previous && (
        <Button variant="secondary" size="sm" onClick={() => onShownChange({ ...base, compareTo: null })}>
          {t('diff.stop')}
        </Button>
      )}
      {workflow.proposed && (
        <Button variant="secondary" size="sm" onClick={() => onShownChange({ version: 'proposed', compareTo: null })}>
          {t('diff.proposed.open')}
        </Button>
      )}
    </>
  )
}

/**
 * Above the view, first in reading order: 变更摘要 — every difference of the
 * comparison in words — and, for the change that waits for approval, the
 * proposal with 批准 / 拒绝. 批准 makes the draft the version in force.
 */
export function DiffSummary({ workflow, shown, onShownChange }: EditorSlotProps) {
  const t = useT('workflow-history')
  const words = useT('workflow')
  const { locale } = useLocale()
  const actions = useActions()
  const status = useRef<HTMLParagraphElement>(null)
  const [said, setSaid] = useState<string | null>(null)

  const comparison = comparisonOf(workflow, shown)
  const draft = showsProposal(workflow, shown) ? workflow.proposed : undefined
  const proposal = useRuntimeState((state) => state.proposals.find((each) => each.id === draft?.proposalId))

  function decide(approve: boolean) {
    // The buttons are about to leave the page: focus goes to the line that says what happened.
    status.current?.focus()
    if (approve) {
      const n = Math.max(...workflow.versions.map((version) => version.n)) + 1
      if (actions.approveWorkflowChange({ workflowId: workflow.id })) setSaid(t('proposal.approved', { n }))
    } else if (proposal) {
      for (const part of proposal.parts) {
        if (part.state === 'pending') actions.resolveProposalPart({ proposalId: proposal.id, partId: part.id, resolution: 'rejected' })
      }
      setSaid(t('proposal.rejected', { n: workflow.current }))
    }
    onShownChange(shownCurrent)
  }

  const sentence = (change: Change): string => {
    if (change.what === 'node') {
      return t(`summary.node.${change.change}`, { kind: words(`kind.${change.node.kind}`), label: change.node.label[locale] })
    }
    return t(`summary.edge.${change.change}`, {
      from: change.from?.label[locale] ?? change.edge.from,
      to: change.to?.label[locale] ?? change.edge.to,
    })
  }
  const changes = comparison ? changesOf(comparison) : []

  return (
    <>
      <p ref={status} role="status" tabIndex={-1} data-slot="workflow-decision">
        {said}
      </p>
      {comparison && (
        <Section title={t('summary.title')} data-slot="workflow-diff-summary">
          <p className="text-sm text-muted-foreground">
            {comparison.target.n === 'proposed'
              ? t('summary.proposed', { from: comparison.base.n })
              : t('summary.versions', { to: comparison.target.n, from: comparison.base.n })}
          </p>
          {changes.length === 0 ? (
            <p>{t('summary.none')}</p>
          ) : (
            <Stack as="ul" gap="xs">
              {changes.map((change) => (
                <li key={`${change.what}:${change.what === 'node' ? change.node.id : change.edge.id}`} data-change-item={change.change}>
                  {sentence(change)}
                </li>
              ))}
            </Stack>
          )}
        </Section>
      )}
      {draft && (
        <Card size="sm" data-slot="workflow-proposal">
          <CardHeader>
            <CardTitle>{proposal?.title[locale] ?? t('proposal.title')}</CardTitle>
            <CardDescription>{draft.reason[locale]}</CardDescription>
          </CardHeader>
          <CardFooter className="flex flex-wrap gap-2">
            <Button onClick={() => decide(true)}>{t('proposal.approve')}</Button>
            {proposal && (
              <Button variant="secondary" onClick={() => decide(false)}>
                {t('proposal.reject')}
              </Button>
            )}
          </CardFooter>
        </Card>
      )}
    </>
  )
}
