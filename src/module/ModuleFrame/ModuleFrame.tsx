import { PlayIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { Link } from 'react-router'

import { Button } from '@/components/actions'
import type { PageWidth } from '@/components/layout'
import { useLocale, useT } from '@/i18n'
import { useActions, useRunState, type Module } from '@/runtime'
import { moduleIconComponents, modulePath } from '@/shell'

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
 * The first row is the same in all four views: the module's name and the
 * three view links 页面 · 工作流 · 记忆. The breadcrumb above it is the
 * shell header's — the frame draws none. The `h1` is the module's name on the
 * `page` view and the view's own title on the others.
 *
 * It stands where `Page` stands — directly in `main` — and so brings the
 * page padding itself. It reads the runtime: the run state, the proposals
 * waiting for her and the runs, all of which obey 状态预览.
 */
export function ModuleFrame(props: ModuleFrameProps) {
  const { module, view, width = 'wide', basePath, children } = props
  const t = useT('module')
  const { locale } = useLocale()
  const name = module.name[locale]
  const Icon = moduleIconComponents[module.icon]
  const base = basePath ?? modulePath(module.id)
  const href = { page: base, workflow: `${base}/workflow`, memory: `${base}/memory` }
  const nameClass = 'min-w-0 text-2xl font-semibold wrap-break-word'

  return (
    <div className="px-4 py-6 md:px-6 md:py-8 lg:px-8" data-module-frame={module.id} data-view={view}>
      <div className={`mx-auto flex w-full min-w-0 flex-col gap-6 ${widthClass[width]}`}>
        <header className="flex min-w-0 flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2" data-slot="module-frame-row">
            <div className="flex min-w-0 items-center gap-2">
              <Icon aria-hidden="true" className="size-5 shrink-0" />
              {view === 'page' ? <h1 className={nameClass}>{name}</h1> : <p className={nameClass}>{name}</p>}
            </div>
            <nav aria-label={t('views.label')}>
              <ul className="flex flex-wrap gap-2">
                {viewLinks.map((each) => (
                  <li key={each}>
                    <Link to={href[each]} className={viewLinkClass} aria-current={each === view ? 'page' : undefined}>
                      {t(`view.${each}`)}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          </div>
          {props.view === 'page' ? (
            <PageControls module={module} name={name} />
          ) : (
            <h1 className="min-w-0 text-xl font-semibold wrap-break-word">{props.title}</h1>
          )}
        </header>
        {children}
      </div>
    </div>
  )
}

/** The second row of the `page` view: the run state, then the frame's three actions. */
function PageControls({ module, name }: { module: Module; name: string }) {
  const t = useT('module')
  const run = useRunState(module.id)
  const { runModule } = useActions()
  const start = () => void runModule(module.id)

  return (
    <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-3">
      <RunStatus run={run} onRetry={start} />
      <div className="flex flex-wrap items-center gap-2">
        <ApprovalsSheet module={module} name={name} />
        <HistorySheet module={module} name={name} />
        <Button loading={run.status === 'running'} onClick={start}>
          {/* While it runs the button's own spinner stands where the icon was. */}
          {run.status !== 'running' && <PlayIcon aria-hidden="true" />}
          {t('run.now')}
        </Button>
      </div>
    </div>
  )
}
