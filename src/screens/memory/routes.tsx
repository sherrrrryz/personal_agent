import type { AreaRoutes } from '@/app/routes'

// Area `memory` — the memory view. It has no top-level route of its own: it
// is a child route of every module (`module-routes.tsx`).
export const routes: AreaRoutes['routes'] = []

// 服务时长, whose two tables the hero flow fills. `s2` first — the scene with
// its usual content (and the one in which 超长内容 has its 40 rows);
// `s3-resolved` shows the rows an accepted proposal changed, with their
// markers.
export const matrixRoutes: AreaRoutes['matrixRoutes'] = [
  { path: '/m/profession.appointments.sub.duration/memory', scenes: ['s2', 's3-resolved'], previews: ['empty', 'loading', 'error', 'long'] },
]
