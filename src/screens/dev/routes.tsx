import type { AreaRoutes } from '@/app/routes'

import { ComponentGallery } from './ComponentGallery'

// Area `dev` — tools outside the IA map. `/dev/shell` and `/dev/frame`
// (part 2) are registered by their own areas.
export const routes: AreaRoutes['routes'] = [{ path: '/dev/components', element: <ComponentGallery /> }]

// The whole gallery is one matrix route; one family is walked by naming it:
// `npm run matrix -- '/dev/components?family=layout'`.
export const matrixRoutes: AreaRoutes['matrixRoutes'] = [{ path: '/dev/components' }]
