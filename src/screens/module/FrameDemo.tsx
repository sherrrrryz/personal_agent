import { useEffect, useState } from 'react'
import { Link, Outlet, useOutletContext } from 'react-router'

import { ToggleGroup, ToggleGroupItem } from '@/components/actions'
import { DemoGroup } from '@/components/actions/demo-parts'
import { useT } from '@/i18n'
import { ModuleFrame } from '@/module'
import { demoDefinition, demoFailures, demoSnapshot, type DemoLastRun } from '@/module/demo-module'
import { linkClass } from '@/module/ModuleFrame/link-class'
import { createRuntime, RuntimeContext, useRuntimeState, type PreviewId, type Runtime } from '@/runtime'

import { ModulePage } from './ModulePage'

/** Where the demo's three view links start from. */
export const frameDemoPath = '/dev/frame'

type Control = { last: DemoLastRun; setLast: (last: DemoLastRun) => void }

// The demo's own runtime: one made-up module, so the page is the same in
// every scene. Its pins go to `localStorage` like every module's (`pa.pins`).
const makeRuntime = (last: DemoLastRun, preview: PreviewId): Runtime =>
  createRuntime({ initial: demoSnapshot(last), search: `?preview=${preview}` })

/**
 * `/dev/frame` — the module frame on its own, outside the IA map: a made-up
 * module whose page holds all seven blocks, with two changes waiting for its
 * next run and two proposals waiting for her. The frame reads a runtime of
 * the demo's own; 状态预览 of the shell's device (and `?preview=`) reaches
 * it, so the four run states and the long content are one menu away.
 */
export function FrameDemo() {
  const preview = useRuntimeState((state) => state.preview)
  const [last, setLast] = useState<DemoLastRun>('ok')
  const [made, setMade] = useState(() => ({ last, runtime: makeRuntime(last, preview) }))
  if (made.last !== last) setMade({ last, runtime: makeRuntime(last, preview) })

  useEffect(() => {
    if (made.runtime.getState().preview !== preview) made.runtime.actions.setPreview(preview)
  }, [made, preview])

  return (
    <RuntimeContext value={made.runtime}>
      <Outlet context={{ last, setLast } satisfies Control} />
    </RuntimeContext>
  )
}

const lastRuns = ['ok', ...demoFailures] as const

/** The `page` view of the demo: the frame, the control of the last run, the seven blocks. */
export function FrameDemoPage() {
  const t = useT('module')
  const { last, setLast } = useOutletContext<Control>()
  const module = useRuntimeState((state) => state.modules[0])
  return (
    <ModulePage module={module} definition={demoDefinition} basePath={frameDemoPath}>
      <DemoGroup caption={t('demo.control.caption')}>
        <ToggleGroup aria-label={t('demo.control.label')} required value={last} onValueChange={(next) => next && setLast(next)}>
          {lastRuns.map((value) => (
            <ToggleGroupItem key={value} value={value}>
              {t(value === 'ok' ? 'demo.control.story' : `demo.control.${value}`)}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </DemoGroup>
    </ModulePage>
  )
}

/** One of the frame's three other views, with a line of text where the view's content goes. */
export function FrameDemoView({ view }: { view: 'workflow' | 'memory' | 'child' }) {
  const t = useT('module')
  const module = useRuntimeState((state) => state.modules[0])
  return (
    <ModuleFrame module={module} view={view} title={t(`demo.view.${view}.title`)} basePath={frameDemoPath}>
      <p>{t(`demo.view.${view}.body`)}</p>
      <p>
        <Link to={frameDemoPath} className={linkClass}>
          {t('demo.view.back')}
        </Link>
      </p>
    </ModuleFrame>
  )
}
