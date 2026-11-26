import { useContext } from 'react'
import { matchRoutes, Navigate, UNSAFE_DataRouterContext } from 'react-router'

import { useRuntimeState } from '@/runtime'

import { startFallback, startPaths } from './start'

/**
 * The start page: `/` goes to the profession interview until onboarding is
 * done, then to 通知. While the route it should open is not registered — the
 * prototype is built package by package — it opens the gallery instead of the
 * not-found screen.
 */
export function StartRedirect() {
  const onboarded = useRuntimeState((state) => state.onboarded)
  const routes = useContext(UNSAFE_DataRouterContext)?.router.routes ?? []
  const target = onboarded ? startPaths.home : startPaths.onboarding
  const leaf = matchRoutes(routes, target)?.at(-1)?.route
  const registered = leaf !== undefined && leaf.path !== '*'
  return <Navigate to={registered ? target : startFallback} replace />
}
