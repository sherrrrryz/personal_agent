import { useState } from 'react'
import { Link } from 'react-router'

import { ProposalCard } from '@/blocks/proposal/ProposalCard'
import { Button } from '@/components/actions'
import { AlertDialog } from '@/components/containers'
import { DataState, toast } from '@/components/feedback'
import { Page, Section, Stack } from '@/components/layout'
import { useLocale, useT } from '@/i18n'
import { resolveModule, useActions, useResource, useRuntimeState, type Proposal } from '@/runtime'
import { ModuleSet } from '@/screens/onboarding/ModuleSet'
import { reentryPath } from '@/screens/onboarding/paths'
import { modulePath } from '@/shell'

const linkClass = 'underline underline-offset-4 wrap-anywhere'

/**
 * `settings.profession` — the module set as in onboarding's step 2, with a
 * confirmed removal, 重新生成 and the way back into the interview (D-36);
 * and 升级建议: from `s4` the AI proposes to make 服务时长 a top-level
 * profession module, and she confirms here (D-38).
 */
export function ProfessionPage() {
  const [attempt, setAttempt] = useState(0)
  return <Profession key={attempt} onRetry={() => setAttempt((count) => count + 1)} />
}

function Profession({ onRetry }: { onRetry: () => void }) {
  const t = useT('settings')
  const actions = useActions()
  const answer = useResource({ kind: 'modules' })
  const loaded = answer.state === 'ready' || answer.state === 'long' || answer.state === 'empty'
  const modules = loaded ? answer.data.filter((module) => module.kind === 'profession') : []

  return (
    <Page
      title={t('profession.title')}
      description={t('profession.description')}
      width="prose"
      actions={
        <AlertDialog
          trigger={<Button variant="secondary">{t('profession.regenerate')}</Button>}
          title={t('profession.regenerate.title')}
          description={t('profession.regenerate.body')}
          confirmLabel={t('profession.regenerate')}
          onConfirm={() => {
            actions.confirmModuleSet({ regenerate: true })
            toast(t('profession.regenerated'))
          }}
        />
      }
    >
      <DataState
        state={answer.state === 'loading' ? 'loading' : answer.state === 'error' ? 'error' : 'ready'}
        errorTitle={t('profession.error.title')}
        onRetry={onRetry}
      >
        <ModuleSet modules={modules} confirmRemoval />
      </DataState>
      <Stack gap="xs">
        <p>
          <Link to={reentryPath} className={linkClass}>
            {t('profession.interview')}
          </Link>
        </p>
        <p className="text-sm text-muted-foreground">{t('profession.interview.note')}</p>
      </Stack>
      <Promotions />
    </Page>
  )
}

const promotes = (proposal: Proposal) => proposal.onAccept.action === 'promoteSubModule'

/** 升级建议: the proposals that promote a sub-module, each as a `ProposalCard`. */
function Promotions() {
  const t = useT('settings')
  const { locale } = useLocale()
  const actions = useActions()
  const state = useRuntimeState()
  const answer = useResource({ kind: 'proposals' })
  const proposals = answer.state === 'loading' ? [] : (answer.data ?? []).filter(promotes)

  return (
    <Section title={t('profession.promotions')}>
      <DataState state={answer.state === 'loading' ? 'loading' : 'ready'}>
        {proposals.length === 0 ? (
          <p className="text-muted-foreground">{t('profession.promotions.none')}</p>
        ) : (
          <Stack gap="md">
            {proposals.map((proposal) => {
              // After the promotion the module answers to a new id; its old one is an alias.
              const source = resolveModule(state, proposal.moduleId)?.module
              return (
                <Stack key={proposal.id} gap="sm" data-proposal={proposal.id}>
                  <h3 className="text-lg font-semibold wrap-break-word">{proposal.title[locale]}</h3>
                  <ProposalCard
                    props={{
                      mode: proposal.mode,
                      summary: proposal.summary?.[locale],
                      parts: proposal.parts.map((part) => ({ id: part.id, text: part.text[locale], state: part.state })),
                      source: { label: source?.name[locale] ?? proposal.moduleId, href: source ? modulePath(source.id) : undefined },
                    }}
                    changes={{}}
                    state="ready"
                    onAction={(actionId, partId) =>
                      actions.resolveProposalPart({
                        proposalId: proposal.id,
                        partId,
                        resolution: actionId === 'accept' ? 'accepted' : 'rejected',
                      })
                    }
                  />
                  {proposal.applied && source && (
                    <p>
                      {t('profession.promoted')}{' '}
                      <Link to={modulePath(source.id)} className={linkClass}>
                        {t('profession.promoted.open', { name: source.name[locale] })}
                      </Link>
                    </p>
                  )}
                </Stack>
              )
            })}
          </Stack>
        )}
      </DataState>
    </Section>
  )
}
