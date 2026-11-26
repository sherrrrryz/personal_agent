import { configureAxe } from 'vitest-axe'

/**
 * axe-core for component tests: `expect(await axe(container)).toHaveNoViolations()`.
 *
 * Two rules are off: `color-contrast` (jsdom cannot answer it, and the
 * contrast requirement is withdrawn by D-43 — the matrix does not run it
 * either), and `region`, which asks for page landmarks that a component
 * rendered on its own does not have.
 */
export const axe = configureAxe({
  rules: {
    'color-contrast': { enabled: false },
    region: { enabled: false },
  },
})
