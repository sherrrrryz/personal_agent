// The matrix harness, Playwright side. `openCell` gives a page in one cell of
// the verification matrix; `checkCell` and the four passes run the assertions
// of docs/specs/lofi-prototype-system.md § Matrix harness and return what
// failed as data. The flows under e2e/flows/ import from here too.
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

import { AxeBuilder } from '@axe-core/playwright'
import type { Browser, BrowserContext, Page } from '@playwright/test'

import { FIXED_FONT_OFFSET, MIN_TARGET, makeCell } from './cells.mjs'

export { baseCells, cellsFor, fullCells, makeCell, smokeCells, stressCells } from './cells.mjs'

export interface Cell {
  id: string
  width: number
  text: '100' | 'zoom200' | 'root24'
  theme: 'light' | 'dark'
  locale: 'zh-CN' | 'en'
  viewport: { width: number; height: number }
  deviceScaleFactor: number
  rootFontSize: number
}

/** One thing an assertion found. `kind` is stable; `message` is for people. */
export interface Failure {
  kind: string
  message: string
  element?: string
  path?: string
  [detail: string]: unknown
}

export interface Waiver {
  kind: string
  element: string
  path: string
}

export interface CheckResult {
  failures: Failure[]
  waived: Waiver[]
  notes: Record<string, unknown>
}

export interface Plan {
  run: string
  baseURL: string
  outDir: string
  server: { root: string; port: number; pid: number }
  options?: { allowNotFound?: boolean }
  tests: PlannedTest[]
  flows: string[] | null
}

export interface PlannedTest {
  id: string
  route: string
  url: string
  scene: string | null
  preview: string | null
  cell: Cell
  pass: 'keyboard' | 'reduced-motion' | 'forced-colors' | 'text-spacing' | null
  axe: boolean
  screenshot: string
}

interface InPage {
  scan(): { failures: Failure[]; waived: Waiver[] }
  targets(minimum: number): {
    failures: Failure[]
    waived: Waiver[]
    notes: { measured: number; inlineLinks: number; covered: string[] }
  }
  keyboardStart(): { id: number; element: string; path: string }[]
  keyboardStep(): Promise<{
    id: number | null
    element?: string
    path?: string
    indicated?: boolean | null
    inView?: boolean
    covered?: boolean
  }>
  focusedSignature(): string
  restSignatureMatches(id: number, focused: string): boolean
  motionStart(): void
  motionSample(source: string): void
  motionReport(): Failure[]
  overlayTriggers(): { id: number; element: string }[]
  isOpen(id: number): boolean
  byId(id: number): Element | null
  applyTextSpacing(): void
  defaultFontSize(): number | null
  settle(): Promise<void>
  busy(): boolean
}

declare global {
  interface Window {
    __matrix: InPage
  }
}

const IN_PAGE = fileURLToPath(new URL('./in-page.js', import.meta.url))

/** The plan scripts/matrix.mjs wrote for this run (`MATRIX_PLAN`), or null outside a matrix run. */
export function readPlan(): Plan | null {
  const file = process.env.MATRIX_PLAN
  return file ? (JSON.parse(readFileSync(file, 'utf8')) as Plan) : null
}

export interface OpenOptions {
  reducedMotion?: boolean
  forcedColors?: boolean
  /** Wait for `aria-busy` regions to finish. Off for a forced loading preview. */
  waitForIdle?: boolean
  /** The app's not-found screen is what this cell is about. Default: the run's `--allow-not-found`. */
  allowNotFound?: boolean
}

/** The attribute `src/app/NotFound.tsx` puts on its root element. */
export const NOT_FOUND_MARKER = 'data-route-not-found'

/** True when the page shows the app's not-found screen. */
export function onNotFound(page: Page): Promise<boolean> {
  return page.evaluate((marker) => document.querySelector(`[${marker}]`) !== null, NOT_FOUND_MARKER)
}

/** The failure for a cell that was given a route the app does not have. */
export function notFoundFailure(route: string): Failure {
  return {
    kind: 'route-not-found',
    message: `${route} is not a route of the app — it opened the not-found screen (check the spelling; --allow-not-found when that screen is what you are checking)`,
    route,
  }
}

export interface OpenCell {
  context: BrowserContext
  page: Page
  cell: Cell
}

/**
 * A fresh context and page in one matrix cell, at `url`. The cell's theme and
 * locale go in as the `pa.theme` and `pa.locale` keys before the first script
 * runs, and as the browser's own colour scheme and language. For root 24 px
 * the browser's default font size is set — never a style on `html` — and the
 * call throws if the browser did not take it. It also throws when `url` opens
 * the app's not-found screen, unless that is allowed.
 */
export async function openCell(
  browser: Browser,
  cellOrSpec: Cell | { width: number; text?: Cell['text']; theme?: Cell['theme']; locale?: Cell['locale'] },
  url: string,
  options: OpenOptions = {},
): Promise<OpenCell> {
  const cell: Cell =
    'id' in cellOrSpec
      ? cellOrSpec
      : (makeCell(
          cellOrSpec.width,
          cellOrSpec.text ?? '100',
          cellOrSpec.theme ?? 'light',
          cellOrSpec.locale ?? 'zh-CN',
        ) as Cell)
  const plan = readPlan()
  const context = await browser.newContext({
    baseURL: plan?.baseURL,
    viewport: cell.viewport,
    deviceScaleFactor: cell.deviceScaleFactor,
    colorScheme: cell.theme,
    locale: cell.locale === 'en' ? 'en-US' : cell.locale,
    reducedMotion: options.reducedMotion ? 'reduce' : 'no-preference',
    forcedColors: options.forcedColors ? 'active' : 'none',
  })
  try {
    await context.addInitScript(
      ([theme, locale]) => {
        // Once per tab, so a flow that changes the theme and reloads keeps its change.
        if (sessionStorage.getItem('matrix.seeded')) return
        sessionStorage.setItem('matrix.seeded', '1')
        localStorage.setItem('pa.theme', theme)
        localStorage.setItem('pa.locale', locale)
      },
      [cell.theme, cell.locale],
    )
    await context.addInitScript({ path: IN_PAGE })
    const page = await context.newPage()
    const session = await context.newCDPSession(page)
    await session.send('Page.setFontSizes', {
      fontSizes: { standard: cell.rootFontSize, fixed: cell.rootFontSize - FIXED_FONT_OFFSET },
    })
    await page.goto(url, { waitUntil: 'load' })
    await settle(page, options.waitForIdle ?? true)
    const size = await page.evaluate(() => window.__matrix.defaultFontSize())
    if (size !== cell.rootFontSize) {
      throw new Error(
        `matrix environment: the browser's default font size is ${size} px, the cell needs ${cell.rootFontSize} px`,
      )
    }
    if (!(options.allowNotFound ?? plan?.options?.allowNotFound ?? false) && (await onNotFound(page))) {
      throw new Error(`route-not-found: ${notFoundFailure(url).message}`)
    }
    return { context, page, cell }
  } catch (error) {
    await context.close()
    throw error
  }
}

/** Fonts loaded, the network quiet, no region still `aria-busy`, two frames painted. */
export async function settle(page: Page, waitForIdle = true): Promise<void> {
  await page.waitForLoadState('networkidle', { timeout: 10_000 }).catch(() => {})
  if (waitForIdle) {
    await page.waitForFunction(() => !window.__matrix.busy(), null, { timeout: 8_000 }).catch(() => {})
  }
  await page.evaluate(() => window.__matrix.settle())
}

function merge(result: CheckResult, part: { failures: Failure[]; waived?: Waiver[] }): void {
  result.failures.push(...part.failures)
  for (const waiver of part.waived ?? []) {
    if (!result.waived.some((known) => known.kind === waiver.kind && known.path === waiver.path)) {
      result.waived.push(waiver)
    }
  }
}

/**
 * What every cell asserts: no sideways page scroll, no clipped text, every
 * target at least 24 × 24 CSS px (WCAG 2.2 AA; D-43), a screenshot; `axe` where the plan says so.
 */
export async function checkCell(
  page: Page,
  options: { screenshot?: string; axe?: boolean } = {},
): Promise<CheckResult> {
  const result: CheckResult = { failures: [], waived: [], notes: {} }
  merge(result, await page.evaluate(() => window.__matrix.scan()))
  if (options.screenshot) await page.screenshot({ path: options.screenshot, fullPage: true })
  const targets = await page.evaluate((minimum) => window.__matrix.targets(minimum), MIN_TARGET)
  merge(result, targets)
  result.notes.targets = targets.notes
  if (options.axe) {
    const analysis = await new AxeBuilder({ page }).analyze()
    result.notes.axeRules = analysis.passes.length + analysis.violations.length
    for (const violation of analysis.violations) {
      result.failures.push({
        kind: 'axe',
        message: `axe ${violation.id} (${violation.impact ?? 'no impact given'}): ${violation.help} — ${violation.nodes.length} element(s)`,
        rule: violation.id,
        elements: violation.nodes.slice(0, 5).map((node) => node.target.join(' ')),
        helpUrl: violation.helpUrl,
      })
    }
  }
  return result
}

interface Walk {
  failures: Failure[]
  stops: number
  expected: number
}

/**
 * Tabs through the page from the top. Reports a focusable that Tab never
 * reaches, a stop with no visible change, a stop that is covered or out of
 * view, and a trap (Tab stays, or cycles without coming back to the start).
 */
async function walkFocus(page: Page, only?: 'indicator'): Promise<Walk> {
  const failures: Failure[] = []
  const expected = await page.evaluate(() => window.__matrix.keyboardStart())
  const seen: number[] = []
  const late: { id: number; signature: string; element: string; path: string }[] = []
  const limit = expected.length * 2 + 20
  let previous: number | null = null
  let left = 0
  for (let step = 0; step < limit; step++) {
    await page.keyboard.press('Tab')
    const stop = await page.evaluate(() => window.__matrix.keyboardStep())
    if (stop.id === null) {
      // Past the last stop focus leaves the document once before it wraps to
      // the top: a walk that began mid-page goes on from there.
      if (++left > 1) break
      continue
    }
    const where = { element: stop.element, path: stop.path }
    if (stop.id === previous) {
      failures.push({ kind: 'keyboard-trap', message: `Tab does not leave ${stop.element}`, ...where })
      break
    }
    if (seen.includes(stop.id)) {
      if (stop.id !== seen[0]) {
        failures.push({
          kind: 'keyboard-trap',
          message: `focus cycles back to ${stop.element} without returning to the start of the page`,
          ...where,
        })
      }
      break
    }
    seen.push(stop.id)
    previous = stop.id
    if (stop.indicated === false) {
      failures.push({ kind: 'focus-not-visible', message: `${stop.element} shows no visible change when it takes focus`, ...where })
    } else if (stop.indicated === null) {
      late.push({
        id: stop.id,
        signature: await page.evaluate(() => window.__matrix.focusedSignature()),
        element: stop.element ?? '',
        path: stop.path ?? '',
      })
    }
    if (stop.inView === false) {
      failures.push({ kind: 'focus-out-of-view', message: `${stop.element} takes focus outside the viewport`, ...where })
    } else if (stop.covered) {
      failures.push({ kind: 'focus-covered', message: `${stop.element} takes focus while fully covered by other content`, ...where })
    }
  }
  // Elements that appeared while tabbing had no look at rest on record: compare now that focus has left.
  await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur())
  for (const stop of late) {
    const same = await page.evaluate(([id, signature]) => window.__matrix.restSignatureMatches(id, signature), [
      stop.id,
      stop.signature,
    ] as const)
    if (same) {
      failures.push({
        kind: 'focus-not-visible',
        message: `${stop.element} shows no visible change when it takes focus`,
        element: stop.element,
        path: stop.path,
      })
    }
  }
  for (const item of expected) {
    if (!seen.includes(item.id)) {
      failures.push({
        kind: 'focus-unreached',
        message: `Tab never reaches ${item.element}`,
        element: item.element,
        path: item.path,
      })
    }
  }
  const kept = only === 'indicator' ? failures.filter((failure) => failure.kind === 'focus-not-visible') : failures
  return { failures: kept, stops: seen.length, expected: expected.length }
}

/** `--keyboard`: every focusable reached, focus visible, no trap. */
export async function keyboardPass(page: Page, screenshot?: string): Promise<CheckResult> {
  const walk = await walkFocus(page)
  if (screenshot) await page.screenshot({ path: screenshot, fullPage: true })
  return { failures: walk.failures, waived: [], notes: { stops: walk.stops, expected: walk.expected } }
}

/**
 * `--forced-colors`: the page under forced colours — nothing clipped, no
 * sideways scroll, and every focus stop still shows an indicator (a
 * box-shadow ring is removed there). The screenshot is for a person to judge
 * that selected, pressed and current states can still be told apart.
 */
export async function forcedColorsPass(page: Page, screenshot?: string): Promise<CheckResult> {
  const result: CheckResult = { failures: [], waived: [], notes: {} }
  merge(result, await page.evaluate(() => window.__matrix.scan()))
  const walk = await walkFocus(page, 'indicator')
  result.failures.push(...walk.failures)
  result.notes.stops = walk.stops
  // Taken with focus on the first stop, so the indicator is in the picture.
  await page.keyboard.press('Tab')
  if (screenshot) await page.screenshot({ path: screenshot, fullPage: true })
  return result
}

/**
 * `--reduced-motion` (the page was opened with reduced motion requested):
 * nothing animates for a non-zero time at load, after opening each overlay,
 * or while focus moves through the page.
 */
export async function reducedMotionPass(page: Page, screenshot?: string): Promise<CheckResult> {
  await page.evaluate(() => window.__matrix.motionStart())
  const triggers = await page.evaluate(() => window.__matrix.overlayTriggers())
  const sample = (source: string) => page.evaluate((from) => window.__matrix.motionSample(from), source)
  let opened = 0
  const unopened: string[] = []
  for (const trigger of triggers) {
    const handle = await page.evaluateHandle((id) => window.__matrix.byId(id), trigger.id)
    const element = handle.asElement()
    if (!element) continue
    try {
      await element.click({ timeout: 3_000 })
    } catch {
      unopened.push(trigger.element)
      continue
    }
    opened++
    for (const wait of [0, 60, 200]) {
      if (wait > 0) await page.waitForTimeout(wait)
      await sample(`open ${trigger.element}`)
    }
    await page.keyboard.press('Escape')
    await sample(`close ${trigger.element}`)
    await page.waitForTimeout(60)
    await sample(`close ${trigger.element}`)
    if (await page.evaluate((id) => window.__matrix.isOpen(id), trigger.id)) {
      await element.click({ timeout: 3_000 }).catch(() => {})
      await sample(`close ${trigger.element}`)
    }
  }
  const stops = await page.evaluate(() => window.__matrix.keyboardStart())
  for (let step = 0; step < Math.min(stops.length, 60); step++) {
    await page.keyboard.press('Tab')
    await sample('focus')
  }
  await page.waitForTimeout(100)
  await sample('focus')
  if (screenshot) await page.screenshot({ path: screenshot, fullPage: true })
  return {
    failures: await page.evaluate(() => window.__matrix.motionReport()),
    waived: [],
    notes: { overlaysOpened: opened, overlaysNotOpened: unopened },
  }
}

/** `--text-spacing`: the WCAG 1.4.12 overrides, then no clipped text and no sideways scroll. */
export async function textSpacingPass(page: Page, screenshot?: string): Promise<CheckResult> {
  await page.evaluate(() => window.__matrix.applyTextSpacing())
  await page.evaluate(() => window.__matrix.settle())
  const result: CheckResult = { failures: [], waived: [], notes: {} }
  merge(result, await page.evaluate(() => window.__matrix.scan()))
  if (screenshot) await page.screenshot({ path: screenshot, fullPage: true })
  return result
}
