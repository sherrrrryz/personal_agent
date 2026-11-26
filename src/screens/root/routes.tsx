import type { AreaRoutes } from '@/app/routes'
import type { ShellHandle } from '@/shell'

import { ShellDemo, ShellDemoSecond } from './ShellDemo'
import { StartRedirect } from './StartRedirect'

// Area `root` — the start page and the shell's own demo. `/dev/*` is bare by
// default (`src/shell/route.ts`); the demo asks for the shell. The chat's two
// slots are filled by the chat itself (`src/chat/shell-slots.tsx`).
const demo: ShellHandle = { shell: 'app' }

export const routes: AreaRoutes['routes'] = [
  { index: true, element: <StartRedirect /> },
  { path: '/dev/shell', element: <ShellDemo />, handle: demo },
  { path: '/dev/shell/second', element: <ShellDemoSecond />, handle: demo },
]

// `s2`: the first scene whose sidebar has both sub-modules under 预约.
export const matrixRoutes: AreaRoutes['matrixRoutes'] = [{ path: '/dev/shell', scenes: ['s2'] }]
