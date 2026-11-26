// One Playwright test per planned cell or pass. The plan comes from
// scripts/matrix.mjs; each test writes its result as data for report.json and
// fails when an assertion found something.
import { mkdirSync, writeFileSync } from 'node:fs'
import path from 'node:path'

import { expect, test } from '@playwright/test'

import {
  type CheckResult,
  checkCell,
  forcedColorsPass,
  keyboardPass,
  notFoundFailure,
  onNotFound,
  openCell,
  readPlan,
  reducedMotionPass,
  textSpacingPass,
} from './harness.ts'

const plan = readPlan()

test.describe('matrix', () => {
  test.skip(plan === null, 'run through `npm run matrix`')

  for (const planned of plan?.tests ?? []) {
    test(planned.id, async ({ browser }) => {
      const outDir = plan!.outDir
      const screenshot = path.join(outDir, planned.screenshot)
      mkdirSync(path.dirname(screenshot), { recursive: true })
      const started = Date.now()
      let result: CheckResult = { failures: [], waived: [], notes: {} }
      let error: string | null = null
      try {
        const { context, page } = await openCell(browser, planned.cell, planned.url, {
          reducedMotion: planned.pass === 'reduced-motion',
          forcedColors: planned.pass === 'forced-colors',
          waitForIdle: planned.preview !== 'loading',
          // Reported below as a failure of its own, with the screenshot, not as an error.
          allowNotFound: true,
        })
        try {
          if (!plan!.options?.allowNotFound && (await onNotFound(page))) {
            await page.screenshot({ path: screenshot, fullPage: true })
            result.failures.push(notFoundFailure(planned.route))
          } else if (planned.pass === 'keyboard') result = await keyboardPass(page, screenshot)
          else if (planned.pass === 'reduced-motion') result = await reducedMotionPass(page, screenshot)
          else if (planned.pass === 'forced-colors') result = await forcedColorsPass(page, screenshot)
          else if (planned.pass === 'text-spacing') result = await textSpacingPass(page, screenshot)
          else result = await checkCell(page, { screenshot, axe: planned.axe })
        } finally {
          await context.close()
        }
      } catch (caught) {
        error = caught instanceof Error ? caught.message : String(caught)
      }
      const file = path.join(outDir, 'results', `${planned.id}.json`)
      mkdirSync(path.dirname(file), { recursive: true })
      writeFileSync(file, JSON.stringify({ id: planned.id, ms: Date.now() - started, error, ...result }, null, 2))
      expect(error, 'the cell could not be checked').toBeNull()
      expect(
        result.failures.map((failure) => failure.message),
        `${planned.route} — ${planned.cell.id}${planned.pass ? ` — ${planned.pass}` : ''}`,
      ).toEqual([])
    })
  }
})
