import { FlaskConicalIcon } from 'lucide-react'
import { useState } from 'react'
import { Link, useLocation } from 'react-router'

import { Button } from '@/components/actions'
import { Breadcrumb, SidebarTrigger, type Crumb } from '@/components/navigation'
import { useLocale, useT } from '@/i18n'
import { useRuntimeState } from '@/runtime'

import { ancestorsOf } from './crumbs'
import { previewKey, useDevice } from './device'
import { shellPanelClass } from './panel'
import { TimeDevice } from './TimeDevice'

const panelClass = `${shellPanelClass} flex flex-wrap items-center gap-x-2 gap-y-1 px-2 py-1`

/**
 * The header (spec part 2 § Shell): sidebar trigger, breadcrumb, the
 * prototype controls and — while a state is forced — a line that says so,
 * with 恢复正常, so a forced state is never read as a defect. It is laid over
 * the start of `main` as a floating panel (D-50): the header is a transparent
 * row with room around the panel, the panel itself frosted (D-47), rounded on
 * every corner and ringed like a card. The transparent room lets clicks
 * through to the page. The classes that place it in the shell's grid cell are
 * here; the shell keeps its room in `main`.
 *
 * Beside the prototype controls is the slot the open screen fills with its own
 * controls (`useShellHeaderSlot`, D-50).
 *
 * One row with room; when the three do not fit, the controls move under the
 * breadcrumb, and the preview line always takes a row of its own. `heading`
 * is the open page's `h1`: the breadcrumb's last level.
 */
export function ShellHeader({ heading, slot }: { heading: string; slot?: (element: HTMLDivElement | null) => void }) {
  const t = useT('shell')
  const common = useT('common')
  const { locale } = useLocale()
  const state = useRuntimeState()
  const { pathname } = useLocation()
  const [message, setMessage] = useState('')
  const device = useDevice(setMessage)

  const { ancestors, fallback } = ancestorsOf(pathname, state, locale, {
    topics: t('nav.topics'),
    settings: t('nav.settings'),
  })
  const crumbs: Crumb[] = [
    ...ancestors.map(({ label, to }) => ({ label, render: <Link to={to} /> })),
    { label: heading || fallback || common('app.name') },
  ]

  return (
    <header className="pointer-events-none z-10 col-start-1 row-start-1 self-start p-2">
      <div className={panelClass} data-shell-panel="">
        <SidebarTrigger />
        <div className="flex min-w-0 grow basis-32">
          <Breadcrumb items={crumbs} />
        </div>
        <div className="ms-auto flex max-w-full min-w-0 flex-wrap items-center gap-2">
          {/* The open screen's own controls (D-50: a module's 模块设置 and 立即运行), through a portal. */}
          <div ref={slot} className="flex flex-wrap items-center gap-2 empty:hidden" data-shell-slot="" />
          <TimeDevice device={device} />
        </div>
        {device.preview !== 'normal' && (
          <div className="flex basis-full flex-wrap items-center gap-x-2 gap-y-1 px-2 text-sm" data-shell-preview="">
            <div className="flex min-w-0 items-center gap-2">
              <FlaskConicalIcon aria-hidden="true" className="size-4 shrink-0" />
              <p className="min-w-0 wrap-anywhere">
                {t('device.previewing', {
                  state: t(previewKey[device.preview]),
                })}
              </p>
            </div>
            <Button variant="secondary" size="sm" onClick={() => device.setPreview('normal')}>
              {t('device.restore')}
            </Button>
          </div>
        )}
      </div>
      {/* What the controls just did, for a screen reader: politely, without moving focus. */}
      <p role="status" className="sr-only">
        {message}
      </p>
    </header>
  )
}
