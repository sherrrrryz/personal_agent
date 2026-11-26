import { createContext, useContext, type ReactNode } from 'react'

import type { Module, ModuleDefinition } from '@/runtime'

/** What the route `/m/:moduleId` found for its address. */
export type RouteModule = {
  /** The module of the current scene the address means. */
  module: Module
  /** Its output side; the stub's when the module has no `module.ts`. */
  definition: ModuleDefinition
  /** True when `definition` is the stub pattern. */
  stub: boolean
  /** Where the module's views start from: `/m/<ia-id>`. */
  basePath: string
}

export const RouteModuleContext = createContext<RouteModule | null>(null)

/**
 * The module of the open `/m/<ia-id>` route — for a child route's element
 * (`src/screens/<area>/module-routes.tsx`):
 *
 *     const { module } = useRouteModule()
 *     return <ModuleFrame module={module} view="workflow" title={…}>…</ModuleFrame>
 */
export function useRouteModule(): RouteModule {
  const value = useContext(RouteModuleContext)
  if (!value) throw new Error('useRouteModule is for an element under the /m/:moduleId route')
  return value
}

/**
 * One child route of a module, as `src/screens/<area>/module-routes.tsx`
 * exports them: `export const moduleRoutes: ModuleChildRoute[]`.
 */
export type ModuleChildRoute = {
  /** Relative to `/m/<ia-id>`: `workflow`, `memory`, `pets/:petId`. */
  path: string
  /** The modules the route exists for; without it, every module. Elsewhere the address is not found. */
  match?: (module: Module) => boolean
  /** Renders its own `ModuleFrame` (`view: workflow · memory · child`). */
  element: ReactNode
}
