import { createContext, useContext, useEffect, useMemo, useState, useSyncExternalStore } from 'react'

import { answerOf, resourceKey, runStateOf, type AnswerOf, type ResourceKind, type ResourceRef, type RunState } from './facade'
import type { RuntimeState } from './model'
import { getRuntime, type Runtime, type RuntimeActions } from './store'

/**
 * Overrides the app's runtime for a subtree: `<RuntimeContext value={runtime}>`.
 * Without it every hook uses `getRuntime()`. A test or a demo page that wants
 * its own state provides one.
 */
export const RuntimeContext = createContext<Runtime | null>(null)

export function useRuntime(): Runtime {
  return useContext(RuntimeContext) ?? getRuntime()
}

/** The runtime actions. Stable for the life of the runtime. */
export function useActions(): RuntimeActions {
  return useRuntime().actions
}

/**
 * The state, as it is — never forced by 状态预览. For what must stay usable
 * under a forced preview (navigation, the device, the breadcrumb) and for
 * `state.preview` itself. `select` must return a part of the state or a
 * primitive, not a new object: `useRuntimeState((state) => state.modules)`.
 */
export function useRuntimeState(): RuntimeState
export function useRuntimeState<Selected>(select: (state: RuntimeState) => Selected): Selected
export function useRuntimeState<Selected>(select?: (state: RuntimeState) => Selected): Selected | RuntimeState {
  const runtime = useRuntime()
  const read = () => (select ? select(runtime.getState()) : runtime.getState())
  return useSyncExternalStore(runtime.subscribe, read, read)
}

const loading = { state: 'loading' } as const

/**
 * A resource through the facade. The first read of a resource — and the first
 * after the preview changes or the scene jumps — answers `loading` for the
 * simulated delay; after that the answer follows the state at once, so what
 * an action changes shows without a flash of loading.
 */
export function useResource<Kind extends ResourceKind>(ref: ResourceRef<Kind>): AnswerOf<Kind> {
  const runtime = useRuntime()
  const state = useRuntimeState()
  const key = resourceKey(ref)
  const token = `${key}|${state.preview}|${state.epoch}`
  const [arrived, setArrived] = useState<{ runtime: Runtime; token: string } | null>(null)

  useEffect(() => {
    let current = true
    // `token` holds `ref` as a string, so the effect runs again exactly when the resource does change —
    // `ref` itself is a new object on every render and must not be a dependency.
    void runtime.read(ref).then(() => {
      if (current) setArrived({ runtime, token })
    })
    return () => {
      current = false
    }
    // oxlint-disable-next-line react-hooks/exhaustive-deps
  }, [runtime, token])

  if (arrived?.runtime !== runtime || arrived.token !== token) return loading
  return answerOf(state, ref)
}

/** A module's run state for the frame; follows 状态预览. */
export function useRunState(moduleId: string): RunState {
  const state = useRuntimeState()
  return useMemo(() => runStateOf(state, moduleId), [state, moduleId])
}
