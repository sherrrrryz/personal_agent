// Self-test only: a route registry in the shape `--all` reads from
// src/screens/<area>/routes.tsx — `matrixRoutes`, each entry a path, the
// scenes in which the screen differs and the previews it has.
export const matrixRoutes = [
  { path: '/e2e/matrix/fixtures/pass.html', scenes: ['e1', 's3'], previews: ['empty', 'long'] },
  { path: '/e2e/matrix/fixtures/blank.html' },
]
