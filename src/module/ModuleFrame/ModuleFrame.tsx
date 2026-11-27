import { PlayIcon, Settings2Icon } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { Link, useLocation } from 'react-router'

import { Button } from '@/components/actions'
import { Dialog } from '@/components/containers'
import { Section } from '@/components/layout'
import type { PageWidth } from '@/components/layout'
import { useLocale, useT } from '@/i18n'
import { useActions, useRunState, type Module } from '@/runtime'
import { modulePath, useShellHeaderSlot } from '@/shell'

import { ApprovalsSheet } from './ApprovalsSheet'
import { HistorySheet } from './HistorySheet'
import { useModuleSettingsPanels } from '../settings-panels'
import { linkClass } from './link-class'
import { RunStatus } from './RunStatus'

// `Page`'s measures (`src/components/layout/Page.tsx`); the frame stands where `Page` stands.
const widthClass: Record<PageWidth, string> = { prose: 'max-w-prose', wide: 'max-w-7xl', full: 'max-w-none' }

type Common = {
  /** The module the frame is for, as the runtime holds it. */
  module: Module
  /** `wide` for a page of blocks and for tables; `full` for the canvas. */
  width?: PageWidth
  /**
   * Where the module's views start from (功能设置's links to 流程 and 资料).
   * Default: the module's own address (`/m/<ia-id>`). Only a demo page that
   * shows the frame elsewhere sets it.
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
 * (`useShellHeaderSlot`): 功能设置 — since D-52 a large window in the middle
 * of the screen with the update state, 待你确认, 更新记录 and 刷新, then 流程,
 * then 资料 — and, on the `page` view, 刷新. Outside the shell they stand at
 * the top of the frame.
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
  const slot = useShellHeaderSlot()
  const run = useRunState(module.id)
  const { runModule } = useActions()
  const start = () => void runModule(module.id)
  const controls = <ModuleControls module={module} name={name} view={view} base={base} />

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
  base: string
}

const parts = ['workflow', 'memory'] as const

/**
 * The module's controls in the shell header: 功能设置, and 刷新 on the `page` view.
 *
 * D-52: 功能设置 is a large window in the middle of the screen. At the top the
 * update state — when it last updated, when it updates next, a failure and its
 * fix — beside 待你确认, 更新记录 and 刷新; under it the module's 流程 (the
 * editor itself); under that its 资料 (the tables). Each part also opens as a
 * page of its own. Following a link inside closes the window.
 */
function ModuleControls({ module, name, view, base }: ControlsProps) {
  const t = useT('module')
  const { pathname } = useLocation()
  const panels = useModuleSettingsPanels()
  const run = useRunState(module.id)
  const { runModule } = useActions()
  const start = () => void runModule(module.id)
  // Open on the address it was opened at: a link followed inside closes it without an effect.
  const [openAt, setOpenAt] = useState<string | null>(null)
  const open = openAt === pathname
  const href = { workflow: `${base}/workflow`, memory: `${base}/memory` }
  const refresh = (
    <Button size="sm" loading={run.status === 'running'} onClick={start}>
      {/* While it runs the button's own spinner stands where the icon was. */}
      {run.status !== 'running' && <PlayIcon aria-hidden="true" />}
      {t('run.now')}
    </Button>
  )

  return (
    <>
      <Dialog
        size="wide"
        open={open}
        onOpenChange={(next) => setOpenAt(next ? pathname : null)}
        title={t('settings.title')}
        description={t('settings.description', { module: name })}
        trigger={
          <Button variant="secondary" size="sm">
            <Settings2Icon aria-hidden="true" />
            {t('settings.open')}
          </Button>
        }
      >
        <div className="flex flex-col gap-8 pb-2" data-slot="module-settings">
          <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-3" data-slot="module-settings-status">
            <RunStatus run={run} onRetry={start} announce={false} />
            <div className="flex flex-wrap items-center gap-2">
              <ApprovalsSheet module={module} name={name} />
              <HistorySheet module={module} name={name} />
              {refresh}
            </div>
          </div>
          {parts.map((part) => {
            const Panel = panels[part]
            const label = t(`view.${part}`)
            return (
              <Section
                key={part}
                level={3}
                title={label}
                data-settings-part={part}
                actions={
                  <Link
                    to={href[part]}
                    className={linkClass}
                    aria-label={t('settings.full.name', { part: label })}
                    aria-current={view === part ? 'page' : undefined}
                    onClick={() => setOpenAt(null)}
                  >
                    {t('settings.full')}
                  </Link>
                }
              >
                {Panel && <Panel module={module} basePath={base} />}
              </Section>
            )
          })}
        </div>
      </Dialog>
      {view === 'page' && refresh}
    </>
  )
}
