import type { RouteObject } from 'react-router'

/**
 * One line of an area's `matrixRoutes`: a path the matrix harness walks
 * (`npm run matrix -- --all`), and the scenes and previews in which that
 * screen differs enough to be walked again (`?scene=&preview=`).
 */
export type MatrixRoute = {
  path: string
  scenes?: readonly string[]
  previews?: readonly string[]
}

/** What every `src/screens/<area>/routes.tsx` exports. */
export type AreaRoutes = {
  /** Top-level routes, as children of the root layout. Paths are absolute. */
  routes: RouteObject[]
  matrixRoutes: MatrixRoute[]
}

// The glob registry of top-level routes: a package adds its area's
// `routes.tsx`; nobody edits a central route table.
const areas = import.meta.glob<AreaRoutes>('/src/screens/*/routes.tsx', { eager: true })

const sorted = Object.entries(areas).sort(([a], [b]) => a.localeCompare(b))

export const areaRoutes: RouteObject[] = sorted.flatMap(([path, area]) => {
  if (!Array.isArray(area.routes) || !Array.isArray(area.matrixRoutes)) {
    throw new Error(`${path}: an area's routes.tsx exports \`routes\` and \`matrixRoutes\``)
  }
  return area.routes
})

/** Every area's matrix routes, in one list. */
export const matrixRoutes: MatrixRoute[] = sorted.flatMap(([, area]) => area.matrixRoutes)
