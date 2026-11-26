import type { AreaRoutes } from '@/app/routes'

// Area `profession` — the pages of the profession modules are emitted by
// `src/modules/profession.*/module.ts` under the module route `/m/<ia-id>`,
// and this area's child routes are in `module-routes.tsx`; it adds no
// top-level route. Listed here is what the matrix walks.

const previews = ['empty', 'loading', 'error', 'long'] as const

// First the scene in which each screen has its usual content: the previews run in it.
export const routes: AreaRoutes['routes'] = []

export const matrixRoutes: AreaRoutes['matrixRoutes'] = [
  { path: '/m/profession.appointments', scenes: ['s2', 's0', 's3-resolved'], previews },
  { path: '/m/profession.appointments/appointments/apt-1121-dafu', scenes: ['s2'] },
  { path: '/m/profession.clients', scenes: ['s2'], previews },
  { path: '/m/profession.clients/pets/dafu', scenes: ['s2', 's3-resolved'], previews },
  { path: '/m/profession.inventory', scenes: ['s2'], previews },
  { path: '/m/profession.shifts', scenes: ['s3-resolved', 's2'], previews },
  { path: '/m/profession.appointments.sub.duration', scenes: ['s2', 's1'], previews },
  { path: '/m/profession.appointments.sub.confirmations', scenes: ['e2', 'e1'], previews },
]
