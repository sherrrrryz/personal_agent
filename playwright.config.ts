// Playwright runs only through `npm run matrix` (scripts/matrix.mjs), which
// starts this run's own dev server, writes the plan and passes its path in
// MATRIX_PLAN. There is deliberately no `webServer` here: a run never reuses
// a server (docs/specs/lofi-prototype-system.md § Matrix harness).
import { readFileSync } from 'node:fs'
import path from 'node:path'

import { defineConfig } from '@playwright/test'

const planFile = process.env.MATRIX_PLAN
const plan = planFile ? JSON.parse(readFileSync(planFile, 'utf8')) : null
const outDir: string = plan?.outDir ?? path.resolve('.matrix', 'unplanned')

export default defineConfig({
  outputDir: path.join(outDir, 'playwright'),
  fullyParallel: true,
  forbidOnly: true,
  retries: 0,
  timeout: 120_000,
  reporter: [['dot'], ['json', { outputFile: path.join(outDir, 'playwright.json') }]],
  use: {
    browserName: 'chromium',
    baseURL: plan?.baseURL,
    trace: 'off',
  },
  projects: [
    { name: 'environment', testDir: 'e2e/matrix', testMatch: 'environment.spec.ts' },
    { name: 'matrix', testDir: 'e2e/matrix', testMatch: 'matrix.spec.ts' },
    { name: 'flows', testDir: 'e2e/flows', testMatch: '**/*.spec.ts' },
  ],
})
