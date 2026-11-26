import type { ModuleChildRoute } from '@/module'

// The glob registry of a module's child routes (spec part 2 § Module frame,
// "Routes"): every `src/screens/<area>/module-routes.tsx` exports
// `moduleRoutes: ModuleChildRoute[]`. Part 3 contributes `workflow`, `memory`
// and `pets/:petId`; nobody edits a central table.

type ChildRouteFile = { moduleRoutes?: unknown }

const isChildRoute = (value: unknown): value is ModuleChildRoute =>
  typeof value === 'object' &&
  value !== null &&
  typeof (value as ModuleChildRoute).path === 'string' &&
  !(value as ModuleChildRoute).path.startsWith('/') &&
  'element' in value

/** Every area's child routes, in the order of the areas' names; throws at start-up on a malformed file. */
export function collectChildRoutes(files: Record<string, unknown>): ModuleChildRoute[] {
  return Object.entries(files)
    .sort(([a], [b]) => a.localeCompare(b))
    .flatMap(([path, file]) => {
      const routes = (file as ChildRouteFile | null)?.moduleRoutes
      if (!Array.isArray(routes) || !routes.every(isChildRoute)) {
        throw new Error(`${path}: a module-routes.tsx exports \`moduleRoutes\`: { path (relative), match?, element }[]`)
      }
      return routes
    })
}

export const moduleChildRoutes: ModuleChildRoute[] = collectChildRoutes(
  import.meta.glob('/src/screens/*/module-routes.tsx', { eager: true }),
)
