import { FlaskConicalIcon } from 'lucide-react'
import { useState } from 'react'
import { Link, useLocation } from 'react-router'

import { Button } from '@/components/actions'
import { Breadcrumb, SidebarTrigger, type Crumb } from '@/components/navigation'
import { useLocale, useT } from '@/i18n'
import { useRuntimeState } from '@/runtime'

import { ancestorsOf } from './crumbs'
import { previewKey, useDevice } from './device'
import { TimeDevice } from './TimeDevice'

/**
 * The header (spec part 2 § Shell): sidebar trigger, breadcrumb, the
 * prototype controls and — while a state is forced — a line that says so,
 * with 恢复正常, so a forced state is never read as a defect.
 *
 * One row with room; when the three do not fit, the controls move under the
 * breadcrumb, and the preview line always takes a row of its own. `heading`
 * is the open page's `h1`: the breadcrumb's last level.
 */
export function ShellHeader({ heading }: { heading: string }) {
  const t = useT('shell')
  const common = useT('common')
  const { locale } = useLocale()
  const state = useRuntimeState()
  const { pathname } = useLocation()
  const [message, setMessage] = useState('')
  const device = useDevice(setMessage)

  const { ancestors, fallback } = ancestorsOf(pathname, state, locale, { topics: t('nav.topics'), settings: t('nav.settings') })
  const crumbs: Crumb[] = [
    ...ancestors.map(({ label, to }) => ({ label, render: <Link to={to} /> })),
    { label: heading || fallback || common('app.name') },
  ]

  return (
    <header className="flex flex-wrap items-center gap-x-2 gap-y-1 border-b px-2 py-1">
      <SidebarTrigger />
      <div className="flex min-w-0 grow basis-32">
        <Breadcrumb items={crumbs} />
      </div>
      <div className="ms-auto flex max-w-full min-w-0">
        <TimeDevice device={device} />
      </div>
      {device.preview !== 'normal' && (
        <div className="flex basis-full flex-wrap items-center gap-x-2 gap-y-1 px-2 text-sm" data-shell-preview="">
          <FlaskConicalIcon aria-hidden="true" className="size-4 shrink-0" />
          <p className="min-w-0 wrap-anywhere">{t('device.previewing', { state: t(previewKey[device.preview]) })}</p>
          <Button variant="secondary" size="sm" onClick={() => device.setPreview('normal')}>
            {t('device.restore')}
          </Button>
        </div>
      )}
      {/* What the controls just did, for a screen reader: politely, without moving focus. */}
      <p role="status" className="sr-only">
        {message}
      </p>
    </header>
  )
}
