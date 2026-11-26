import { Link } from 'react-router'

import { Page } from '@/components/layout'
import { useT } from '@/i18n'

/** Shown for a path no area registers. */
export function NotFound() {
  const t = useT('common')
  return (
    <Page title={t('notFound.title')} width="prose">
      <p>{t('notFound.body')}</p>
      <p>
        <Link to="/" className="inline-flex min-h-target min-w-target items-center underline underline-offset-4">
          {t('notFound.home')}
        </Link>
      </p>
    </Page>
  )
}
