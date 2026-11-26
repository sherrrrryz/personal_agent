import { createBrowserRouter, Navigate } from 'react-router'
import type { RouteObject } from 'react-router'

import { NotFound } from './NotFound'
import { RootLayout } from './RootLayout'
import { areaRoutes } from './routes'

/** Where `/` goes while no area claims it: the component gallery. */
export const fallbackStart = '/dev/components'

function claimsStart(route: RouteObject): boolean {
  return route.index === true || route.path === '/' || route.path === ''
}

/**
 * The route tree: the root layout, every area's routes under it, and a
 * not-found screen for the rest. `/` belongs to the area that registers it
 * (part 2: onboarding or notifications); until one does, it opens the gallery.
 */
export function buildRoutes(areas: RouteObject[] = areaRoutes): RouteObject[] {
  const start: RouteObject[] = areas.some(claimsStart)
    ? []
    : [{ index: true, element: <Navigate to={fallbackStart} replace /> }]
  return [
    {
      path: '/',
      element: <RootLayout />,
      children: [...start, ...areas, { path: '*', element: <NotFound /> }],
    },
  ]
}

export function createAppRouter() {
  return createBrowserRouter(buildRoutes())
}
