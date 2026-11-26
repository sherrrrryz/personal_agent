import { Link } from 'react-router'

import { Page } from '@/components/layout'
import { useT } from '@/i18n'

/**
 * Shown for a path no area registers. `data-route-not-found` is how the matrix
 * harness knows a route it was given does not exist (e2e/matrix/harness.ts).
 */
export function NotFound() {
  const t = useT('common')
  return (
    <Page title={t('notFound.title')} width="prose" data-route-not-found="">
      <p>{t('notFound.body')}</p>
      <p>
        <Link to="/" className="inline-flex items-center underline underline-offset-4">
          {t('notFound.home')}
        </Link>
      </p>
    </Page>
  )
}
