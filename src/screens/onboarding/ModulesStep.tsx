import { useId, useState } from 'react'
import { useNavigate } from 'react-router'

import { Button } from '@/components/actions'
import { DataState, Skeleton } from '@/components/feedback'
import { Inline, Page, Stack } from '@/components/layout'
import { useT } from '@/i18n'
import { blockingAccount, useActions, useResource, useRuntime } from '@/runtime'

import { ModuleSet } from './ModuleSet'
import { onboardingPaths, settingsPaths, useReentry } from './paths'

/**
 * `onboarding.modules` — step 2 (D-30): the set the AI proposes, hers to
 * rename, trim and extend, then 确认并生成. In re-entry mode (D-36) confirming
 * applies the set and returns to `settings.profession`; step 3 follows only
 * when a module of the set draws on an account that is not connected.
 */
export function ModulesStep() {
  const [attempt, setAttempt] = useState(0)
  return <ModulesStepBody key={attempt} onRetry={() => setAttempt((count) => count + 1)} />
}

function ModulesStepBody({ onRetry }: { onRetry: () => void }) {
  const t = useT('onboarding')
  const navigate = useNavigate()
  const actions = useActions()
  const runtime = useRuntime()
  const { reentry, to } = useReentry()
  const reasonId = useId()
  const answer = useResource({ kind: 'modules' })

  const loaded = answer.state === 'ready' || answer.state === 'long' || answer.state === 'empty'
  const modules = loaded ? answer.data.filter((module) => module.kind === 'profession') : []
  const blocked = !loaded || modules.length === 0

  function confirm() {
    actions.confirmModuleSet()
    if (!reentry) {
      navigate(onboardingPaths.accounts)
      return
    }
    const state = runtime.getState()
    const needsAccount = state.modules.some((module) => module.kind === 'profession' && blockingAccount(state, module.id))
    navigate(needsAccount ? to(onboardingPaths.accounts) : settingsPaths.profession)
  }

  return (
    <Page
      title={t('modules.title')}
      description={t('modules.description')}
      width="prose"
      actions={
        reentry ? (
          <Button variant="secondary" onClick={() => navigate(settingsPaths.profession)}>
            {t('action.cancel')}
          </Button>
        ) : undefined
      }
    >
      <DataState
        state={answer.state === 'loading' ? 'loading' : answer.state === 'error' ? 'error' : 'ready'}
        loadingLabel={t('modules.loading')}
        loading={
          <Stack gap="sm">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </Stack>
        }
        errorTitle={t('modules.error.title')}
        error={t('modules.error.body')}
        onRetry={onRetry}
      >
        <ModuleSet modules={modules} rows="card" />
      </DataState>
      <Stack gap="sm">
        {/* The primary action first in the page's order; 上一步 follows it. */}
        <Inline gap="sm">
          <Button disabled={blocked} focusableWhenDisabled aria-describedby={loaded && blocked ? reasonId : undefined} onClick={confirm}>
            {t('modules.confirm')}
          </Button>
          <Button variant="secondary" onClick={() => navigate(to(onboardingPaths.profession))}>
            {t('action.back')}
          </Button>
        </Inline>
        {loaded && blocked && (
          <p id={reasonId} className="text-sm text-muted-foreground">
            {t('modules.confirm.blocked')}
          </p>
        )}
      </Stack>
    </Page>
  )
}
