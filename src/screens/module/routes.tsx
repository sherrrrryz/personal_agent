import type { RouteObject } from 'react-router'

import { NotFound } from '@/app/NotFound'
import type { AreaRoutes } from '@/app/routes'
import { moduleDefinitions, type ModuleChildRoute, type ModuleDefinitions } from '@/module'
import type { ShellHandle } from '@/shell'

import { moduleChildRoutes } from './child-routes'
import { FrameDemo, FrameDemoPage, FrameDemoView } from './FrameDemo'
import { ModuleChild, ModuleIndex, ModuleRoute } from './ModuleRoute'

/**
 * The routes of every module: `/m/:moduleId` with the `page` view as its
 * index, the child routes the areas contribute, and not-found for any other
 * path under a module. A test passes its own definitions and child routes.
 */
export function moduleRoutes({
  definitions = moduleDefinitions,
  childRoutes = moduleChildRoutes,
}: { definitions?: ModuleDefinitions; childRoutes?: ModuleChildRoute[] } = {}): RouteObject[] {
  const byPath = new Map<string, ModuleChildRoute[]>()
  for (const route of childRoutes) byPath.set(route.path, [...(byPath.get(route.path) ?? []), route])
  return [
    {
      path: '/m/:moduleId',
      element: <ModuleRoute definitions={definitions} />,
      children: [
        { index: true, element: <ModuleIndex /> },
        ...[...byPath].map(([path, candidates]) => ({ path, element: <ModuleChild candidates={candidates} /> })),
        { path: '*', element: <NotFound /> },
      ],
    },
  ]
}

// `/dev/*` is bare by default (`src/shell/route.ts`); the frame's demo asks
// for the shell, because the frame is only ever seen inside it — under the
// header's breadcrumb, above the chat bar.
const inShell: ShellHandle = { shell: 'app' }

// Area `module` — the frame's routes and its demo, `/dev/frame`.
export const routes: AreaRoutes['routes'] = [
  ...moduleRoutes(),
  {
    path: '/dev/frame',
    element: <FrameDemo />,
    handle: inShell,
    children: [
      { index: true, element: <FrameDemoPage /> },
      { path: 'workflow', element: <FrameDemoView view="workflow" /> },
      { path: 'memory', element: <FrameDemoView view="memory" /> },
      { path: 'pets/demo', element: <FrameDemoView view="child" /> },
    ],
  },
]

// `s2` first: the scene the shell around the demo has its usual sidebar in.
// The demo's own content is the same in every scene; the previews are what
// change it (never-run · running · failed · long content).
export const matrixRoutes: AreaRoutes['matrixRoutes'] = [
  { path: '/dev/frame', scenes: ['s2'], previews: ['empty', 'loading', 'error', 'long'] },
  { path: '/dev/frame/workflow', scenes: ['s2'] },
]
