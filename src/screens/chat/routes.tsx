import type { AreaRoutes } from '@/app/routes'
import type { ShellHandle } from '@/shell'

import { ChatDemo } from './ChatDemo'
import { ThreadPage } from './ThreadPage'

// Area `chat` — `chat.thread`, and the chat's own demo page. The chat bar and
// `chat.recent` are not routes: the shell draws them in its two slots, which
// `src/chat/shell-slots.tsx` registers for every screen inside the shell.
const demo: ShellHandle = { shell: 'app' }

export const routes: AreaRoutes['routes'] = [
  { path: '/chat/:id', element: <ThreadPage /> },
  { path: '/dev/chat', element: <ChatDemo />, handle: demo },
]

// `conv-1` is the first conversation of the story (明天的预约确认), there from
// `e2` on; `s2` shows it as the sub-module it became. `/dev/chat` in `s0`: the
// scene whose prompts open the panel, and a dedicated chat.
export const matrixRoutes: AreaRoutes['matrixRoutes'] = [
  { path: '/chat/conv-1', scenes: ['s2'], previews: ['empty', 'loading', 'error', 'long'] },
  { path: '/dev/chat', scenes: ['s0'] },
]
