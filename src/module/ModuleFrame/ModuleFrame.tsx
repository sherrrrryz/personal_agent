import { PlayIcon, Settings2Icon } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { Link } from 'react-router'

import { Button } from '@/components/actions'
import { Sheet } from '@/components/containers'
import { Section } from '@/components/layout'
import { useIsMobile } from '@/hooks/use-mobile'
import type { PageWidth } from '@/components/layout'
import { useLocale, useT } from '@/i18n'
import { useActions, useRunState, type Module } from '@/runtime'
import { modulePath, useShellHeaderSlot } from '@/shell'

import { ApprovalsSheet } from './ApprovalsSheet'
import { HistorySheet } from './HistorySheet'
import { viewLinkClass } from './link-class'
import { RunStatus } from './RunStatus'

const viewLinks = ['page', 'workflow', 'memory'] as const

// `Page`'s measures (`src/components/layout/Page.tsx`); the frame stands where `Page` stands.
const widthClass: Record<PageWidth, string> = { prose: 'max-w-prose', wide: 'max-w-7xl', full: 'max-w-none' }

type Common = {
  /** The module the frame is for, as the runtime holds it. */
  module: Module
  /** `wide` for a page of blocks and for tables; `full` for the canvas. */
  width?: PageWidth
  /**
   * Where the three view links start from. Default: the module's own address
   * (`/m/<ia-id>`). Only a demo page that shows the frame elsewhere sets it.
   */
  basePath?: string
  children?: ReactNode
}

export type ModuleFrameProps =
  | (Common & {
      /** The page the workflow emits: the frame adds the run state, 待你确认, 运行记录 and 立即运行. */
      view: 'page'
    })
  | (Common & {
      /** `workflow` and `memory` are the module's two other views; `child` is one of its own sub-pages. */
      view: 'workflow' | 'memory' | 'child'
      /** The view's own title — the screen's `h1`. */
      title: ReactNode
    })

/**
 * What every screen of a module sits in (D-12; spec part 2 § Module frame).
 *
 * D-50: the frame draws no visible title — the shell's floating header names
 * the screen in its breadcrumb. The `h1` stays, out of sight, for assistive
 * technology and for the breadcrumb's last level and the window title, which
 * read it: the module's name on the `page` view, the view's own title on the
 * others. The module's controls stand in the header, in its slot
 * (`useShellHeaderSlot`): 模块设置 — a sheet with the three views
 * 页面 · 工作流 · 记忆, the run state, 待你确认 and 运行记录 — and, on the
 * `page` view, 立即运行. Outside the shell they stand at the top of the frame.
 * A failed run stays on the page, where it cannot be missed.
 *
 * It stands where `Page` stands — directly in `main` — and so brings the
 * page padding itself. It reads the runtime: the run state, the proposals
 * waiting for her and the runs, all of which obey 状态预览.
 */
export function ModuleFrame(props: ModuleFrameProps) {
  const { module, view, width = 'wide', basePath, children } = props
  const { locale } = useLocale()
  const name = module.name[locale]
  const base = basePath ?? modulePath(module.id)
  const href = { page: base, workflow: `${base}/workflow`, memory: `${base}/memory` }
  const slot = useShellHeaderSlot()
  const run = useRunState(module.id)
  const { runModule } = useActions()
  const start = () => void runModule(module.id)
  const controls = <ModuleControls module={module} name={name} view={view} href={href} />

  return (
    <div className="px-4 py-6 md:px-6 md:py-8 lg:px-8" data-module-frame={module.id} data-view={view}>
      <div className={`mx-auto flex w-full min-w-0 flex-col gap-6 ${widthClass[width]}`}>
        <h1 className="sr-only">{view === 'page' ? name : props.title}</h1>
        {slot ? (
          createPortal(controls, slot)
        ) : (
          <div className="flex flex-wrap items-center justify-end gap-2" data-slot="module-frame-row">
            {controls}
          </div>
        )}
        {view === 'page' && <RunStatus run={run} onRetry={start} quiet />}
        {children}
      </div>
    </div>
  )
}

type ControlsProps = {
  module: Module
  name: string
  view: ModuleFrameProps['view']
  href: Record<(typeof viewLinks)[number], string>
}

/** The module's controls in the shell header (D-50): 模块设置, and 立即运行 on the `page` view. */
function ModuleControls({ module, name, view, href }: ControlsProps) {
  const t = useT('module')
  const compact = useIsMobile()
  const run = useRunState(module.id)
  const { runModule } = useActions()
  const start = () => void runModule(module.id)
  const [open, setOpen] = useState(false)

  return (
    <>
      <Sheet
        open={open}
        onOpenChange={setOpen}
        side={compact ? 'bottom' : 'end'}
        title={t('settings.title')}
        description={t('settings.description', { module: name })}
        trigger={
          <Button variant="secondary" size="sm">
            <Settings2Icon aria-hidden="true" />
            {t('settings.open')}
          </Button>
        }
      >
        <div className="flex flex-col gap-6 pb-4" data-slot="module-settings">
          <Section level={3} title={t('settings.views')}>
            <nav aria-label={t('views.label')}>
              <ul className="flex flex-wrap gap-2">
                {viewLinks.map((each) => (
                  <li key={each}>
                    <Link
                      to={href[each]}
                      className={viewLinkClass}
                      aria-current={each === view ? 'page' : undefined}
                      onClick={() => setOpen(false)}
                    >
                      {t(`view.${each}`)}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          </Section>
          <Section level={3} title={t('settings.run')}>
            <RunStatus run={run} onRetry={start} announce={false} />
            <div className="flex flex-wrap items-center gap-2">
              <ApprovalsSheet module={module} name={name} />
              <HistorySheet module={module} name={name} />
            </div>
          </Section>
        </div>
      </Sheet>
      {view === 'page' && (
        <Button size="sm" loading={run.status === 'running'} onClick={start}>
          {/* While it runs the button's own spinner stands where the icon was. */}
          {run.status !== 'running' && <PlayIcon aria-hidden="true" />}
          {t('run.now')}
        </Button>
      )}
    </>
  )
}
