// The harness's self-test of its own environment. It runs at the start of
// every matrix run and its measurements go into report.json, so each report
// carries the proof that "root 24 px" was the browser's default font size —
// not a style on `html` — and that 200% zoom was a half-size viewport.
import { mkdirSync, writeFileSync } from 'node:fs'
import path from 'node:path'

import { expect, test } from '@playwright/test'

import { makeCell, openCell, readPlan } from './harness.ts'

const plan = readPlan()
const BLANK = '/e2e/matrix/fixtures/blank.html'

test.describe('matrix environment', () => {
  test.skip(plan === null, 'run through `npm run matrix`')

  test('root 24 px is the default font size; 200% zoom is a half-size viewport', async ({ browser }) => {
    const measure = () => ({
      rootFontSize: getComputedStyle(document.documentElement).fontSize,
      htmlStyle: document.documentElement.getAttribute('style'),
      innerWidth: window.innerWidth,
      devicePixelRatio: window.devicePixelRatio,
      md: window.matchMedia('(min-width: 48rem)').matches,
      theme: localStorage.getItem('pa.theme'),
      locale: localStorage.getItem('pa.locale'),
    })

    const large = await openCell(browser, makeCell(1440, 'root24', 'dark', 'en'), BLANK)
    const at1440 = await large.page.evaluate(measure)
    await large.page.setViewportSize({ width: 1151, height: 800 })
    const at1151 = await large.page.evaluate(measure)
    await large.page.setViewportSize({ width: 1152, height: 800 })
    const at1152 = await large.page.evaluate(measure)
    await large.context.close()

    const normal = await openCell(browser, makeCell(1024, '100', 'light', 'zh-CN'), BLANK)
    const at1024 = await normal.page.evaluate(measure)
    await normal.page.setViewportSize({ width: 767, height: 800 })
    const at767 = await normal.page.evaluate(measure)
    await normal.page.setViewportSize({ width: 768, height: 800 })
    const at768 = await normal.page.evaluate(measure)
    await normal.context.close()

    const zoomed = await openCell(browser, makeCell(768, 'zoom200', 'light', 'en'), BLANK)
    const zoom = await zoomed.page.evaluate(measure)
    await zoomed.context.close()

    const environment = {
      browser: `${browser.browserType().name()} ${browser.version()}`,
      root24: {
        rootFontSize: at1440.rootFontSize,
        styleOnHtml: at1440.htmlStyle,
        mdAt1151: at1151.md,
        mdAt1152: at1152.md,
        theme: at1440.theme,
        locale: at1440.locale,
      },
      root16: { rootFontSize: at1024.rootFontSize, mdAt767: at767.md, mdAt768: at768.md },
      zoom200At768: { innerWidth: zoom.innerWidth, devicePixelRatio: zoom.devicePixelRatio, md: zoom.md },
    }
    mkdirSync(plan!.outDir, { recursive: true })
    writeFileSync(path.join(plan!.outDir, 'environment.json'), JSON.stringify(environment, null, 2))

    expect(environment).toEqual({
      browser: environment.browser,
      root24: {
        rootFontSize: '24px',
        styleOnHtml: null,
        mdAt1151: false,
        mdAt1152: true,
        theme: 'dark',
        locale: 'en',
      },
      root16: { rootFontSize: '16px', mdAt767: false, mdAt768: true },
      zoom200At768: { innerWidth: 384, devicePixelRatio: 2, md: false },
    })
  })
})
