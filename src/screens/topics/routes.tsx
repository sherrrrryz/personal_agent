import type { AreaRoutes } from '@/app/routes'

import { TopicPage } from './TopicPage'
import { TopicsPage } from './TopicsPage'

// Area `topics` — the topics list and a topic's home. Both are inside the
// shell (`/topics` is one of its areas), so the chat bar and 最近对话 are there
// by themselves.
export const routes: AreaRoutes['routes'] = [
  { path: '/topics', element: <TopicsPage /> },
  { path: '/topics/:topicId', element: <TopicPage /> },
]

const previews = ['empty', 'loading', 'error', 'long'] as const

// `duration-rule` is the topic of the hero conversation: there from `s1`, with
// the summary that tells the whole story in `s5`. `s2` first: the scene with
// the usual content.
//
// The base modules' pages (`src/modules/{notifications,messages,calendar,todo}/`)
// have no routes file of their own — `/m/:moduleId` is the frame's — so the
// package that builds them lists their addresses here. `s3` is where 通知 holds
// the review's two-part proposal, `e2` the two no-reply items.
export const matrixRoutes: AreaRoutes['matrixRoutes'] = [
  { path: '/topics', scenes: ['s2', 's5'], previews },
  { path: '/topics/duration-rule', scenes: ['s2', 's5'], previews },
  { path: '/m/notifications', scenes: ['s3', 'e2'], previews },
  { path: '/m/messages', scenes: ['s2'], previews },
  { path: '/m/calendar', scenes: ['s2'], previews },
  { path: '/m/todo', scenes: ['s2'], previews },
]
