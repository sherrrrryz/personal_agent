import type { AreaRoutes } from '@/app/routes'

// Area `workflow` — the workflow editor. It has no top-level route of its
// own: it is a child route of every module (`module-routes.tsx`).
export const routes: AreaRoutes['routes'] = []

// 服务时长, the hero flow's sub-module: its workflow holds all seven kinds of
// node. `s2` first — the scene with its usual content; the sub-module exists
// from `s1` on. 空 shows the placeholder workflow of three nodes, 超长内容 one
// of 25. In `s4` a change waits for approval, so the editor opens on the
// comparison (`mode: diff`, 变更摘要, 批准 / 拒绝); `?history=open` opens the
// version-history sheet, which has two versions from `s4-resolved` on.
export const matrixRoutes: AreaRoutes['matrixRoutes'] = [
  { path: '/m/profession.appointments.sub.duration/workflow', scenes: ['s2', 's4'], previews: ['empty', 'loading', 'error', 'long'] },
  { path: '/m/profession.appointments.sub.duration/workflow?history=open', scenes: ['s4-resolved'] },
]
