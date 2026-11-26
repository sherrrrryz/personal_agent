import { configureAxe } from 'vitest-axe'

/**
 * axe-core for component tests: `expect(await axe(container)).toHaveNoViolations()`.
 *
 * Two rules are off because jsdom cannot answer them, not because they do
 * not matter: `color-contrast` needs real rendering (the allowed pairs are
 * computed in docs/design/TOKENS.md § Contrast pairs and the matrix runs axe
 * in a browser), and `region` asks for page landmarks that a component
 * rendered on its own does not have.
 */
export const axe = configureAxe({
  rules: {
    'color-contrast': { enabled: false },
    region: { enabled: false },
  },
})
