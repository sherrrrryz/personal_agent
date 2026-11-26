import { useLocation, useMatches } from 'react-router'

import { registeredSlots, type ShellSlots } from './slots'

/**
 * What a route may say about the shell, in its `handle`:
 * `{ path: '/dev/frame', element: …, handle: { shell: 'app' } satisfies ShellHandle }`.
 */
export type ShellHandle = {
  /**
   * `app`: sidebar, header and the bottom row around the screen. `bare`: the
   * `main` landmark alone. Without it the path decides (`chromeOf`).
   */
  shell?: ShellChrome
  /**
   * Stand-ins for the chat's slots, for a demo page. They show only in a slot
   * the chat itself does not fill (`src/chat/shell-slots.tsx` wins).
   */
  slots?: ShellSlots
}

export type ShellChrome = 'app' | 'bare'

// The children of `root` in the IA map. Onboarding comes before the shell and
// brings its own header; `/dev/*` is outside the IA map; an unknown path is
// the not-found screen. Those are bare unless their route asks for the shell.
const appAreas = ['m', 'topics', 'chat', 'settings']

/** Whether a path is shown inside the shell when its route does not say. */
export function chromeOf(pathname: string): ShellChrome {
  return appAreas.includes(pathname.split('/')[1] ?? '') ? 'app' : 'bare'
}

const isHandle = (value: unknown): value is ShellHandle => typeof value === 'object' && value !== null

/** The shell as the open route wants it: the deepest route that says so wins. */
export function useShellRoute(): { chrome: ShellChrome; slots: ShellSlots } {
  const { pathname } = useLocation()
  const handles = useMatches().map((match) => match.handle).filter(isHandle)
  const chrome = handles.findLast((handle) => handle.shell)?.shell ?? chromeOf(pathname)
  const standIns = handles.findLast((handle) => handle.slots)?.slots ?? {}
  return { chrome, slots: { ...standIns, ...registeredSlots } }
}
