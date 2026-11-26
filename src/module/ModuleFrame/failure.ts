import type { Locale, Translate } from '@/i18n'
import { findAccount, resolveModule, type FailureReason, type RuntimeState } from '@/runtime'
import { modulePath } from '@/shell'

/** Where accounts are connected (`settings.accounts`, part 3). */
export const accountsPath = '/settings/accounts'

/** A failure in the frame's own words, and the way to fix it: somewhere to go, or running again. */
export type FailureWords = {
  text: string
  fix?: { label: string; to: string } | { label: string; retry: true }
}

/**
 * Turns the facade's typed reason into words (spec part 2 § Fake workflow
 * runtime: "the screen that shows a resource turns the reason into its own
 * words"). Names come from the state as it is, never from a forced preview.
 */
export function failureWords(
  reason: FailureReason | undefined,
  state: RuntimeState,
  locale: Locale,
  t: Translate<'module'>,
): FailureWords {
  const retry = { label: t('failure.fix.retry'), retry: true } as const
  if (!reason) return { text: t('failure.platform-unreachable'), fix: retry }
  switch (reason.code) {
    case 'account-expired':
    case 'account-missing': {
      const account = findAccount(state, reason.account)?.name[locale] ?? reason.account
      const label = t(reason.code === 'account-expired' ? 'failure.fix.accounts' : 'failure.fix.connect')
      return { text: t(`failure.${reason.code}`, { account }), fix: { label, to: accountsPath } }
    }
    case 'source-failed': {
      const source = resolveModule(state, reason.moduleId)?.module
      const module = source?.name[locale] ?? reason.moduleId
      return {
        text: t('failure.source-failed', { module }),
        fix: source && { label: t('failure.fix.source', { module }), to: modulePath(source.id) },
      }
    }
    case 'platform-unreachable':
    case 'generation-failed':
      return { text: t(`failure.${reason.code}`), fix: retry }
    case 'not-found':
      return { text: t('failure.not-found') }
  }
}
