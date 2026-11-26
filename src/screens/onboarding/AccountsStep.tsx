import { useNavigate } from 'react-router'

import { Button } from '@/components/actions'
import { Inline, Page } from '@/components/layout'
import { useT } from '@/i18n'
import { useActions } from '@/runtime'

import { ConnectorList } from './ConnectorList'
import { afterOnboarding, onboardingPaths, settingsPaths, useReentry } from './paths'

/**
 * `onboarding.accounts` — step 3 (D-30): the accounts the confirmed modules
 * draw on. Connecting is optional (稍后再连): 完成 is always there and opens
 * the shell on 通知 — or, in re-entry mode, returns to `settings.profession`.
 */
export function AccountsStep() {
  const t = useT('onboarding')
  const navigate = useNavigate()
  const actions = useActions()
  const { reentry, to } = useReentry()

  function finish() {
    // Step 2 has confirmed the set already; this keeps a visit that began here from looping back.
    actions.confirmModuleSet()
    navigate(reentry ? settingsPaths.profession : afterOnboarding)
  }

  return (
    <Page title={t('accounts.title')} description={t('accounts.description')} width="prose">
      <ConnectorList variant="onboarding" />
      <Inline gap="sm">
        <Button onClick={finish}>{t('accounts.finish')}</Button>
        <Button variant="secondary" onClick={() => navigate(to(onboardingPaths.modules))}>
          {t('action.back')}
        </Button>
      </Inline>
    </Page>
  )
}
