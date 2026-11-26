import { useMemo } from 'react'
import { Navigate, Outlet, useLocation, useParams } from 'react-router'

import { NotFound } from '@/app/NotFound'
import {
  definitionOf,
  moduleDefinitions,
  RouteModuleContext,
  useRouteModule,
  type ModuleChildRoute,
  type ModuleDefinitions,
  type RouteModule,
} from '@/module'
import { resolveModule, useRuntimeState } from '@/runtime'
import { modulePath } from '@/shell'

import { ModulePage } from './ModulePage'

/**
 * The route `/m/:moduleId` (spec part 2 § Module frame, "Routes"): finds the
 * module the address means in the current scene and hands it to the view
 * below. An alias — a promoted sub-module's old address — redirects to the
 * module's own, keeping the rest of the path; an id nothing answers to is the
 * not-found screen.
 *
 * The module is read from the state as it is, never through a forced
 * preview: the address must open whatever is being previewed.
 */
export function ModuleRoute({ definitions = moduleDefinitions }: { definitions?: ModuleDefinitions }) {
  const { moduleId = '' } = useParams()
  const { pathname, search, hash } = useLocation()
  const found = useRuntimeState((state) => resolveModule(state, moduleId)?.module)
  const redirected = found !== undefined && found.id !== moduleId

  const value = useMemo<RouteModule | null>(
    () => (found ? { module: found, ...definitionOf(found, definitions), basePath: modulePath(found.id) } : null),
    [found, definitions],
  )

  if (!value) return <NotFound />
  if (redirected) {
    // `/m/<alias>/workflow` → `/m/<id>/workflow`: everything after the id is kept.
    const rest = pathname.split('/').slice(3).join('/')
    return <Navigate to={`${value.basePath}${rest ? `/${rest}` : ''}${search}${hash}`} replace />
  }
  return (
    <RouteModuleContext value={value}>
      <Outlet />
    </RouteModuleContext>
  )
}

/** The index of `/m/:moduleId`: the `page` view. */
export function ModuleIndex() {
  const { module, definition, basePath } = useRouteModule()
  return <ModulePage module={module} definition={definition} basePath={basePath} />
}

/**
 * One child path of a module. Several areas may register the same path for
 * different modules: the first whose `match` accepts the module renders;
 * when none does, the address is not found for this module.
 */
export function ModuleChild({ candidates }: { candidates: ModuleChildRoute[] }) {
  const { module } = useRouteModule()
  const route = candidates.find((candidate) => candidate.match?.(module) ?? true)
  return route ? route.element : <NotFound />
}
