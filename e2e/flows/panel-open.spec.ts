// Flow `panel-open` (R-20, spec part 2 § Chat): in the shell the chat bar
// follows `main` in the tab order and, with the in-place panel open, never
// covers content or the focused element. Run by
// `npm run matrix -- --flows panel-open`, at 1440 and at 320 × root 24 px.
//
// The flow opens `/dev/shell`. While that page still shows the shell
// package's stand-in bar (the chat's slots are registered for every screen by
// the integration leg), it runs on the chat's own demo page, `/dev/chat`,
// which is the same shell with the real bar.
import { mkdirSync } from 'node:fs'
import path from 'node:path'

import { expect, test, type Browser, type Page } from '@playwright/test'

import { checkCell, keyboardPass, openCell, readPlan, settle, type OpenCell } from '../matrix/harness.ts'

// Scene `s0`: its first suggestion is answered in place, with a table and a proposal.
const SCENE = 's0'
const heroPrompt = '我给长毛大狗做一次要 4 小时，短毛小狗 2 小时左右。以后帮我按狗的品种和毛长估时间，预约和排班都按这个来。'
const proposalTitle = '把这条规则设为长期'
const barLabel = '与 AI 对话'

const cells = [{ width: 1440 }, { width: 320, text: 'root24' }] as const

/** A box may differ from its neighbour by a rounding step, not by more. */
const SLACK = 1

async function openShell(browser: Browser, cell: (typeof cells)[number]): Promise<OpenCell & { route: string }> {
  for (const route of ['/dev/shell', '/dev/chat']) {
    const opened = await openCell(browser, cell, `${route}?scene=${SCENE}`)
    if ((await opened.page.locator('[data-shell-bar]').getByRole('region', { name: barLabel }).count()) > 0) {
      return { ...opened, route }
    }
    await opened.context.close()
  }
  throw new Error('panel-open: neither /dev/shell nor /dev/chat shows the chat bar')
}

interface Stop {
  name: string
  where: 'before' | 'main' | 'bar' | 'after'
  /** The focused element's box lies inside the window. */
  inWindow: boolean
  /** A stop inside `main` whose box the bar's row overlaps. */
  underBar: boolean
  /** What is drawn at the middle of the focused element is the element itself. */
  onTop: boolean
}

/** Tab from the top of the document to its end, describing every stop. */
async function tabThrough(page: Page): Promise<Stop[]> {
  // A click or a focused field leaves the browser's starting point for Tab mid-page:
  // walk off the end of the document first, so the recorded walk begins at its top.
  for (let step = 0; step < 200; step += 1) {
    await page.keyboard.press('Tab')
    if (await page.evaluate(() => document.activeElement === document.body)) break
  }
  const stops: Stop[] = []
  for (let step = 0; step < 200; step += 1) {
    await page.keyboard.press('Tab')
    const stop = await page.evaluate((slack) => {
      const element = document.activeElement
      if (!(element instanceof HTMLElement) || element === document.body) return null
      if (element.dataset.flowSeen) return null
      element.dataset.flowSeen = '1'
      const main = document.querySelector('main')
      const bar = document.querySelector('[data-shell-bar]')
      const box = element.getBoundingClientRect()
      const barBox = bar?.getBoundingClientRect()
      const inBar = bar?.contains(element) ?? false
      const top = document.elementFromPoint(box.left + box.width / 2, box.top + box.height / 2)
      const position = main ? main.compareDocumentPosition(element) : 0
      return {
        name: `${element.tagName.toLowerCase()} “${(element.getAttribute('aria-label') ?? element.textContent ?? '').trim().slice(0, 40)}”`,
        where: main?.contains(element)
          ? ('main' as const)
          : inBar
            ? ('bar' as const)
            : position & Node.DOCUMENT_POSITION_PRECEDING
              ? ('before' as const)
              : ('after' as const),
        inWindow:
          box.top >= -slack &&
          box.left >= -slack &&
          box.bottom <= window.innerHeight + slack &&
          box.right <= window.innerWidth + slack,
        underBar:
          (main?.contains(element) ?? false) &&
          barBox !== undefined &&
          box.bottom > barBox.top + slack &&
          box.top < barBox.bottom - slack &&
          box.right > barBox.left + slack &&
          box.left < barBox.right - slack,
        onTop: top !== null && (element.contains(top) || top.contains(element)),
      }
    }, SLACK)
    if (!stop) break
    stops.push(stop)
  }
  await page.evaluate(() => {
    for (const element of document.querySelectorAll<HTMLElement>('[data-flow-seen]')) delete element.dataset.flowSeen
  })
  return stops
}

/** `main`, then the bar: no stop of `main` after the first stop of the bar, and the bar reached straight from `main`. */
function expectBarAfterMain(stops: Stop[]): void {
  const order = stops.map((stop) => stop.where)
  const lastMain = order.lastIndexOf('main')
  const firstBar = order.indexOf('bar')
  expect(lastMain, 'the walk reaches main').toBeGreaterThanOrEqual(0)
  expect(firstBar, 'the walk reaches the chat bar').toBeGreaterThanOrEqual(0)
  expect(firstBar, `the bar's first stop follows main's last (${order.join(' ')})`).toBe(lastMain + 1)
  expect(order.slice(firstBar).filter((where) => where !== 'bar' && where !== 'after'), 'nothing of main after the bar').toEqual(
    [],
  )
}

for (const cell of cells) {
  const id = `w${cell.width}-${'text' in cell ? cell.text : '100'}`

  test(`panel-open — ${id}: the bar follows main, the open panel covers nothing`, async ({ browser }) => {
    const { context, page, route } = await openShell(browser, cell)
    try {
      const main = page.locator('main')
      const row = page.locator('[data-shell-bar]')
      const bar = row.getByRole('region', { name: barLabel })
      const composer = bar.getByRole('textbox')

      // Closed: the bar is the row after main, and Tab reaches it from main.
      expectBarAfterMain(await tabThrough(page))

      await bar.getByRole('button', { name: heroPrompt }).click()
      const panel = bar.locator('[data-chat-panel]')
      await expect(panel.getByText(proposalTitle)).toBeVisible()
      await settle(page)
      await expect(composer, 'focus stays in the composer when the panel opens').toBeFocused()

      const plan = readPlan()
      if (plan) {
        const shot = path.join(plan.outDir, 'flows', `panel-open-${id}.png`)
        mkdirSync(path.dirname(shot), { recursive: true })
        await page.screenshot({ path: shot })
      }

      // Nothing is laid over anything: the panel ends above the composer, the row begins where main ends,
      // the panel is at most half the shell, and main keeps room of its own.
      const box = async (locator: typeof main) => (await locator.boundingBox())!
      const [mainBox, rowBox, panelBox, composerBox, shellBox] = await Promise.all([
        box(main),
        box(row),
        box(panel),
        box(composer),
        box(page.locator('[data-shell]')),
      ])
      expect(panelBox.y + panelBox.height, 'the panel ends above the composer').toBeLessThanOrEqual(composerBox.y + SLACK)
      expect(rowBox.y, 'the bar begins where main ends').toBeGreaterThanOrEqual(mainBox.y + mainBox.height - SLACK)
      // What she asked is answered where she can see it: the answer's first line is inside the
      // panel, and the composer that keeps the focus is inside the window.
      const answerBox = await box(panel.locator('[data-author]:not([data-author="user"])').last())
      expect(answerBox.y, 'the answer begins inside the panel').toBeGreaterThanOrEqual(panelBox.y - SLACK)
      expect(answerBox.y, 'the answer begins inside the panel').toBeLessThan(panelBox.y + panelBox.height)
      expect(composerBox.y + composerBox.height, 'the composer is inside the window').toBeLessThanOrEqual(
        page.viewportSize()!.height + SLACK,
      )
      expect(panelBox.height, 'the panel is at most half the shell').toBeLessThanOrEqual(shellBox.height / 2 + SLACK)
      expect(mainBox.height, 'main keeps room of its own').toBeGreaterThan(0)
      expect(
        await page.evaluate(() => ['fixed', 'sticky', 'absolute'].includes(getComputedStyle(document.querySelector('[data-shell-bar]')!).position)),
        'the bar is in the flow, not laid over the page',
      ).toBe(false)

      // The screen behind stays in use: its first control takes a click.
      await main.getByRole('button').first().click({ trial: true })

      // Open: every stop is inside the window, drawn on top, and none of main sits under the bar.
      const stops = await tabThrough(page)
      expectBarAfterMain(stops)
      expect(stops.filter((stop) => !stop.inWindow).map((stop) => stop.name), 'focus stops outside the window').toEqual([])
      expect(stops.filter((stop) => stop.underBar).map((stop) => stop.name), 'focus stops under the chat bar').toEqual([])
      expect(stops.filter((stop) => !stop.onTop).map((stop) => stop.name), 'focus stops covered by something').toEqual([])
      expect(stops.filter((stop) => stop.where === 'bar').length, 'the open panel adds stops to the bar').toBeGreaterThan(2)

      // The harness's own checks, with the panel open.
      expect((await checkCell(page, { axe: true })).failures.map((failure) => failure.message), `${route} — open panel`).toEqual([])
      expect((await keyboardPass(page)).failures.map((failure) => failure.message), `${route} — keyboard`).toEqual([])
    } finally {
      await context.close()
    }
  })
}

// `chat.recent` is the last group of a sidebar whose middle scrolls: opened, its rows are brought
// into view (R-19 — "expands"; in a full sidebar they would open below the edge).
test('panel-open — w1440-100: the recent group opens its rows into view', async ({ browser }) => {
  const { context, page } = await openCell(browser, { width: 1440 }, '/chat/conv-1?scene=s2')
  try {
    await page.getByRole('button', { name: '最近对话' }).click()
    const all = page.getByRole('link', { name: '全部话题' })
    await expect(all).toBeInViewport({ ratio: 1 })
    await page.reload()
    await settle(page)
    await expect(page.getByRole('link', { name: '全部话题' }), 'the group stays open after a reload').toBeVisible()
  } finally {
    await context.close()
  }
})
