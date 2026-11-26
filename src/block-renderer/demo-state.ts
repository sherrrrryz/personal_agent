import type { BlockDataState } from '@/blocks/types'

/** The five states a block is shown in (R-11, R-12): the four data states, and `ready` with the long content. */
export const demoStates = ['ready', 'loading', 'empty', 'error', 'long'] as const
export type DemoState = (typeof demoStates)[number]

/**
 * The state a demo opens in: `ready`, or the one named by `?preview=` — the
 * parameter the matrix adds with `--preview` — so each state can be run
 * through the cells. Never `loading` by default: a busy page costs the
 * harness eight seconds in every cell.
 */
export function initialDemoState(): DemoState {
  const preview = new URLSearchParams(window.location.search).get('preview')
  return demoStates.find((state) => state === preview) ?? 'ready'
}

export function dataStateOf(state: DemoState): BlockDataState {
  return state === 'long' ? 'ready' : state
}
