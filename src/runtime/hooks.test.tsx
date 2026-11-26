import { act, render, screen } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { moduleId } from '@/fixtures'

import {
  createRuntime,
  RuntimeContext,
  SIMULATED_DELAY,
  useResource,
  useRunState,
  useRuntimeState,
  type ResourceRef,
  type Runtime,
} from '.'

// The hooks a screen reads the runtime with — and R-02's "survives
// navigation": the preview lives in the store, not in the address.

function Probe({ of }: { of: ResourceRef }) {
  const answer = useResource(of)
  const preview = useRuntimeState((state) => state.preview)
  const run = useRunState(moduleId.appointments)
  const reason = answer.state === 'error' ? `:${answer.reason.code}` : ''
  return <p data-testid="probe">{`${of.kind} ${answer.state}${reason} preview=${preview} run=${run.status}`}</p>
}

const probe = () => screen.getByTestId('probe').textContent
const settle = () => act(() => vi.advanceTimersByTimeAsync(SIMULATED_DELAY))

describe('useResource', () => {
  let runtime: Runtime

  beforeEach(() => {
    vi.useFakeTimers()
    runtime = createRuntime({ storage: null, search: '?scene=s1' })
  })
  afterEach(() => vi.useRealTimers())

  const show = (ui: React.ReactNode) => render(<RuntimeContext value={runtime}>{ui}</RuntimeContext>)

  it('is loading for the simulated delay, then follows the state at once', async () => {
    show(<Probe of={{ kind: 'proposals', moduleId: moduleId.confirmations }} />)
    expect(probe()).toBe('proposals loading preview=normal run=ok')
    await settle()
    expect(probe()).toBe('proposals ready preview=normal run=ok')
    // An action shows without a second loading state.
    act(() => runtime.actions.archiveSubModule(moduleId.confirmations))
    expect(probe()).toBe('proposals ready preview=normal run=ok')
  })

  it('loads again when the preview changes, and when the scene jumps', async () => {
    show(<Probe of={{ kind: 'topics' }} />)
    await settle()
    act(() => runtime.actions.setPreview('error'))
    expect(probe()).toBe('topics loading preview=error run=failed')
    await settle()
    expect(probe()).toBe('topics error:platform-unreachable preview=error run=failed')
    act(() => runtime.actions.jumpToScene('e1'))
    expect(probe()).toBe('topics loading preview=normal run=ok')
    await settle()
    expect(probe()).toBe('topics empty preview=normal run=ok')
  })

  it('stays loading under the loading preview', async () => {
    act(() => runtime.actions.setPreview('loading'))
    show(<Probe of={{ kind: 'accounts' }} />)
    await settle()
    await settle()
    expect(probe()).toBe('accounts loading preview=loading run=running')
  })

  it('a forced preview survives navigation and resets on a scene jump', async () => {
    const router = createMemoryRouter(
      [
        { path: '/topics', element: <Probe of={{ kind: 'topics' }} /> },
        { path: '/m/:id', element: <Probe of={{ kind: 'module', moduleId: moduleId.messages }} /> },
      ],
      { initialEntries: ['/topics'] },
    )
    show(<RouterProvider router={router} />)
    await settle()
    act(() => runtime.actions.setPreview('error'))
    await settle()
    expect(probe()).toBe('topics error:platform-unreachable preview=error run=failed')

    await act(() => router.navigate(`/m/${moduleId.messages}`))
    await settle()
    expect(probe()).toBe('module error:account-expired preview=error run=failed')
    await act(() => router.navigate('/topics'))
    await settle()
    expect(probe()).toBe('topics error:platform-unreachable preview=error run=failed')

    act(() => runtime.actions.jumpToScene('s1'))
    await settle()
    expect(probe()).toBe('topics ready preview=normal run=ok')
  })
})
