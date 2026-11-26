import { Page } from '@/components/layout'
import { useT } from '@/i18n'
import { ConnectorList } from '@/screens/onboarding/ConnectorList'

/**
 * `settings.accounts` — the connector list of onboarding's step 3, here with
 * 断开: an `AlertDialog` names the modules that will stop, and afterwards
 * their frames show the failure with a link back to this page.
 */
export function AccountsPage() {
  const t = useT('settings')
  return (
    <Page title={t('accounts.title')} description={t('accounts.description')} width="prose">
      <ConnectorList variant="settings" />
    </Page>
  )
}
