// Flow `canvas-keyboard` (B-09, B-11 of docs/specs/lofi-prototype-screens.md,
// narrowed by D-44 to desktop widths): the workflow canvas by keyboard in a
// real browser. Tab goes through the nodes in flow order, then to the zoom
// buttons and out; Enter opens the inspector, Escape gives the focus back to
// the node; `?node=` selects a node and brings it into view; no two nodes
// overlap and no node's text is cut off; 步骤列表 lists the same nodes in the
// same order. Run by `npm run matrix -- --flows canvas-keyboard`.
import { mkdirSync } from 'node:fs'
import path from 'node:path'

import { expect, test, type Page } from '@playwright/test'

import { checkCell, openCell, readPlan, settle } from '../matrix/harness.ts'

// 服务时长 in `s2`: thirteen nodes, all seven kinds.
const ROUTE = '/m/profession.appointments.sub.duration/workflow'
const SCENE = 's2'
const flowOrder = [
  'booking-changed',
  'review',
  'pet-files',
  'estimate',
  'set-duration',
  'out-rule',
  'suggest-shifts',
  'record-actual',
  'deviation',
  'memory',
  'out-summary',
  'out-records',
  'propose-rule',
]

// Desktop only (D-44). A cell is `{ width, text? }` — add one if a narrower window is asked for again.
const cells: { width: number }[] = [{ width: 1440 }, { width: 1024 }]

/** A box may differ from its neighbour by a rounding step, not by more. */
const SLACK = 1

async function shoot(page: Page, name: string) {
  const plan = readPlan()
  if (!plan) return
  const shot = path.join(plan.outDir, 'flows', `${name}.png`)
  mkdirSync(path.dirname(shot), { recursive: true })
  await page.screenshot({ path: shot })
}

/** The canvas once its nodes are measured and placed. */
async function laidOut(page: Page) {
  const view = page.locator('[data-slot="workflow-canvas-view"]')
  await expect(view).toBeVisible()
  await expect(page.locator('.react-flow__node').first()).toBeVisible()
  await settle(page)
  return view
}

/** What is wrong with the nodes as drawn: pairs that overlap, cards whose content is cut off, nodes outside the view. */
function measure(page: Page) {
  return page.evaluate((slack) => {
    const view = document.querySelector('[data-slot="workflow-canvas-view"]')!.getBoundingClientRect()
    const nodes = [...document.querySelectorAll<HTMLElement>('.react-flow__node')].map((element) => ({
      id: element.dataset.id ?? '',
      box: element.getBoundingClientRect(),
      element,
    }))
    const overlaps: string[] = []
    for (const a of nodes) {
      for (const b of nodes) {
        if (a.id >= b.id) continue
        const apart =
          a.box.right <= b.box.left + slack ||
          b.box.right <= a.box.left + slack ||
          a.box.bottom <= b.box.top + slack ||
          b.box.bottom <= a.box.top + slack
        if (!apart) overlaps.push(`${a.id} × ${b.id}`)
      }
    }
    const clipped = nodes
      .filter(({ element }) =>
        [element, ...element.querySelectorAll<HTMLElement>('*')].some(
          (each) =>
            getComputedStyle(each).overflow !== 'visible' &&
            (each.scrollWidth > each.clientWidth + slack || each.scrollHeight > each.clientHeight + slack),
        ),
      )
      .map(({ id }) => id)
    const outside = nodes
      .filter(({ box }) => box.left < view.left - slack || box.right > view.right + slack || box.top < view.top - slack || box.bottom > view.bottom + slack)
      .map(({ id }) => id)
    return { ids: nodes.map(({ id }) => id), overlaps, clipped, outside }
  }, SLACK)
}

/** Where the focus is: a node of the canvas (or something inside it), a named control, or elsewhere. */
function focused(page: Page) {
  return page.evaluate(() => {
    const element = document.activeElement
    if (!(element instanceof HTMLElement) || element === document.body) return { node: null, name: '', inCanvas: false }
    return {
      node: element.closest<HTMLElement>('.react-flow__node')?.dataset.id ?? null,
      name: (element.getAttribute('aria-label') ?? element.textContent ?? '').trim(),
      inCanvas: element.closest('[data-slot="workflow-canvas"]') !== null,
    }
  })
}

for (const cell of cells) {
  const id = `w${cell.width}`

  test(`canvas-keyboard — ${id}: nodes apart and whole; Tab in flow order; Enter and Escape; 步骤列表`, async ({ browser }) => {
    const { context, page } = await openCell(browser, cell, `${ROUTE}?scene=${SCENE}`)
    try {
      await laidOut(page)

      // B-11: fitted to the view, nothing overlaps, nothing is cut off.
      const drawn = await measure(page)
      expect(drawn.ids, 'the nodes are in flow order').toEqual(flowOrder)
      expect(drawn.overlaps, 'nodes that overlap').toEqual([])
      expect(drawn.clipped, 'nodes with text cut off').toEqual([])
      expect(drawn.outside, 'nodes outside the view after fitting').toEqual([])
      for (const kind of ['触发', '来源', '步骤', '条件', '动作', '输出', '记忆']) {
        await expect(page.locator('[data-slot="workflow-node-kind"]', { hasText: kind }).first()).toBeVisible()
      }
      await shoot(page, `canvas-keyboard-${id}-canvas`)
      expect((await checkCell(page, { axe: true })).failures.map((failure) => failure.message), 'the canvas').toEqual([])

      // B-09: Tab from the first node visits every node once, in flow order, then the three zoom buttons, then leaves.
      await page.locator('.react-flow__node').first().focus()
      const visited: string[] = []
      const after: string[] = []
      let left = false
      for (let step = 0; step < 80 && !left; step += 1) {
        const stop = await focused(page)
        if (stop.node) {
          if (visited[visited.length - 1] !== stop.node) visited.push(stop.node)
        } else if (stop.inCanvas) {
          after.push(stop.name)
        } else {
          left = true
        }
        await page.keyboard.press('Tab')
      }
      expect(visited, 'Tab order = flow order').toEqual(flowOrder)
      // Between the nodes and the buttons sits the library's attribution link (kept: hiding it asks for a paid plan).
      expect(after.slice(-3), 'the zoom buttons follow the nodes').toEqual(['放大', '缩小', '适应画面'])
      expect(after.length, 'nothing else is a stop of the canvas but the attribution link').toBeLessThanOrEqual(4)
      expect(left, 'Tab leaves the canvas after the zoom buttons — no trap').toBe(true)

      // The zoom buttons work.
      const scaleOf = () => page.locator('.react-flow__viewport').evaluate((element) => new DOMMatrixReadOnly(getComputedStyle(element).transform).a)
      const before = await scaleOf()
      await page.getByRole('button', { name: '放大' }).click()
      await expect.poll(scaleOf, 'zooming in enlarges the view').toBeGreaterThan(before)
      await page.getByRole('button', { name: '适应画面' }).click()
      await expect.poll(scaleOf, 'fitting restores it').toBeCloseTo(before, 2)

      // Enter opens the inspector and moves the focus into it; Escape closes it and the node has the focus again.
      const review = page.locator('.react-flow__node[data-id="review"]')
      await review.focus()
      await page.keyboard.press('Enter')
      const sheet = page.getByRole('dialog', { name: '触发：每周一复盘' })
      await expect(sheet).toBeVisible()
      await expect.poll(() => sheet.evaluate((element) => element.contains(document.activeElement)), 'focus is inside the inspector').toBe(true)
      await settle(page)
      await shoot(page, `canvas-keyboard-${id}-inspector`)
      await page.keyboard.press('Escape')
      await expect(sheet).toBeHidden()
      await expect(review, 'the focus is back on the node').toBeFocused()

      // 步骤列表: the same nodes in the same order, each with a button that opens the same inspector.
      await page.getByRole('button', { name: '步骤列表' }).click()
      const list = page.getByRole('list', { name: '步骤列表' })
      await expect(list).toBeVisible()
      await expect(page.getByRole('button', { name: '步骤列表' })).toHaveAttribute('aria-pressed', 'true')
      await expect(page.getByRole('button', { name: '画布' })).toHaveAttribute('aria-pressed', 'false')
      // Off the switch, so the picture shows which view is pressed and not what the pointer is over.
      await page.mouse.move(0, 0)
      expect(await list.locator('> li').evaluateAll((items) => items.map((item) => (item as HTMLElement).dataset.step))).toEqual(flowOrder)
      await settle(page)
      await shoot(page, `canvas-keyboard-${id}-list`)
      expect((await checkCell(page, { axe: true })).failures.map((failure) => failure.message), '步骤列表').toEqual([])
      const open = list.getByRole('button', { name: '查看和调整：条件：偏差超过 30 分钟' })
      await open.focus()
      await page.keyboard.press('Enter')
      await expect(page.getByRole('dialog', { name: '条件：偏差超过 30 分钟' })).toBeVisible()
      await page.keyboard.press('Escape')
      await expect(open).toBeFocused()
    } finally {
      await context.close()
    }
  })

  test(`canvas-keyboard — ${id}: ?node= selects the node and brings it into view`, async ({ browser }) => {
    const { context, page } = await openCell(browser, cell, `${ROUTE}?scene=${SCENE}&node=propose-rule`)
    try {
      const view = await laidOut(page)
      const node = page.locator('.react-flow__node[data-id="propose-rule"]')
      await expect(node).toHaveAttribute('aria-current', 'true')
      await expect(page.locator('.react-flow__node[aria-current="true"]')).toHaveCount(1)
      const [nodeBox, viewBox] = [(await node.boundingBox())!, (await view.boundingBox())!]
      expect(nodeBox.x, 'inside the view').toBeGreaterThanOrEqual(viewBox.x - SLACK)
      expect(nodeBox.x + nodeBox.width, 'inside the view').toBeLessThanOrEqual(viewBox.x + viewBox.width + SLACK)
      expect(nodeBox.y, 'inside the view').toBeGreaterThanOrEqual(viewBox.y - SLACK)
      expect(nodeBox.y + nodeBox.height, 'inside the view').toBeLessThanOrEqual(viewBox.y + viewBox.height + SLACK)
      // Revealed at its own size, where its words can be read.
      expect(await page.locator('.react-flow__viewport').evaluate((element) => new DOMMatrixReadOnly(getComputedStyle(element).transform).a)).toBeCloseTo(1, 2)
    } finally {
      await context.close()
    }
  })
}
