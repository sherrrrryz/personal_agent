import { defineConfig, mergeConfig } from 'vitest/config'

import viteConfig from './vite.config.ts'

// `npm test` — component and token tests (docs/specs/lofi-prototype-system.md § Tooling).
// The matrix (`npm run matrix`, Playwright) is a separate runner under e2e/.
export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      environment: 'jsdom',
      include: ['src/**/*.test.{ts,tsx}'],
      setupFiles: ['./src/test/setup.ts'],
      restoreMocks: true,
    },
  }),
)
