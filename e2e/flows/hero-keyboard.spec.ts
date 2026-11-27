// Flow `hero-keyboard` (B-27): the two evenings and the six stages, end to end, by keyboard alone —
// no pointer event anywhere. A control is reached with Tab (never focused by script) and worked
// with Enter, Space, the arrows and Escape. It walks each stage's key action; what the screens
// then show in full is asserted by `secondary` and `hero-0` … `hero-5`.
// Run by `npm run matrix -- --flows hero-keyboard`, at 1440 and 1024.
import { test, type Locator, type Page } from '@playwright/test'

import { bar, block, DURATION, expect, h1, heroPrompt, main, open, shot, widths } from './support.ts'

const flow = 'hero-keyboard'
const sidebar = (page: Page) => page.locator('[data-slot="sidebar"]')
const focused = (target: Locator) => target.evaluate((element) => element === document.activeElement).catch(() => false)

/** Tab until `target` has the focus; the walk wraps at the end of the document. */
async function tabTo(page: Page, target: Locator, what: string): Promise<void> {
  for (let step = 0; step < 300; step += 1) {
    if (await focused(target)) return
    await page.keyboard.press('Tab')
  }
  throw new Error(`hero-keyboard: Tab never reached ${what}`)
}

async function press(page: Page, target: Locator, what: string, key = 'Enter'): Promise<void> {
  await tabTo(page, target, what)
  await page.keyboard.press(key)
}

const goTo = (page: Page, name: string) =>
  press(page, sidebar(page).getByRole('link', name === '通知' ? { name: /^通知/ } : { name, exact: true }).first(), `the sidebar link ${name}`)

/** 原型控制 by keys: Enter opens the menu, the arrows reach the scene, Enter jumps, Escape closes. */
async function jump(page: Page, scene: string): Promise<void> {
  const device = page.getByRole('button', { name: /原型控制/ })
  await press(page, device, '原型控制')
  const item = page.getByRole('menuitemradio', { name: scene, exact: true })
  await expect(item).toBeVisible()
  for (let step = 0; step < 30 && !(await focused(item)); step += 1) await page.keyboard.press('ArrowDown')
  expect(await focused(item), `the arrows reach ${scene}`).toBe(true)
  await page.keyboard.press('Enter')
  await expect(device).toContainText(scene)
  await page.keyboard.press('Escape')
  await expect(page.getByRole('menu')).toBeHidden()
  await expect(device).toBeFocused()
}

const chip = (page: Page, name: string) => page.getByRole('list', { name: '可以这样问' }).getByRole('button', { name })

for (const width of widths) {
  test(`hero-keyboard — w${width}: two evenings and six stages without a pointer`, async ({ browser }) => {
    test.setTimeout(400_000)
    const { context, page } = await open(browser, width, '/m/notifications?scene=e1')
    try {
      // 第一晚: ask, read the answer in place, make it persistent.
      await goTo(page, '预约')
      await press(page, chip(page, '明天有哪些预约？帮我给顾客发确认。'), 'the suggestion')
      await expect(bar(page)).toContainText('明天的预约见下表')
      await press(page, bar(page).getByRole('switch', { name: /设为长期/ }), 'the switch 设为长期', 'Space')
      await press(page, bar(page).getByRole('button', { name: '创建', exact: true }), '创建')
      await expect(sidebar(page).getByRole('link', { name: '预约确认', exact: true })).toBeVisible()

      // 第二晚: the two customers who have not answered wait in 通知.
      await jump(page, '第二晚')
      await goTo(page, '通知')
      await expect(main(page).locator('[data-slot="block-proposal"]')).toHaveCount(2)

      // 今天 → 变成工作流: the sentence, 接受, the canvas; a node opens its inspector.
      await jump(page, '今天')
      await goTo(page, '预约')
      await press(page, chip(page, heroPrompt), 'the hero suggestion')
      await expect(bar(page)).toContainText('长毛大型 4 小时，短毛小型 2 小时，其他 3 小时')
      await press(page, bar(page).getByRole('button', { name: '接受' }), '接受 in the answer')
      await expect(page).toHaveURL(new RegExp(`${DURATION}/workflow$`))
      await press(page, page.locator('.react-flow__node[data-id="set-duration"]'), 'the node 设置预约时长')
      const inspector = page.getByRole('dialog', { name: /设置预约时长/ })
      await expect(inspector).toBeVisible()
      await shot(page, flow, 'inspector')
      await page.keyboard.press('Escape')
      await expect(inspector).toBeHidden()

      // 第 1–2 周: the memory view and its second table.
      await jump(page, '第 1–2 周')
      await goTo(page, '服务时长')
      await press(page, main(page).getByRole('link', { name: '记忆', exact: true }), 'the view 记忆')
      await expect(h1(page, '记忆')).toBeVisible()
      await tabTo(page, main(page).getByRole('tab', { name: '品种大致时长' }), 'the tab 品种大致时长')
      // The arrow moves to the next tab; Enter shows its table.
      await page.keyboard.press('ArrowRight')
      await page.keyboard.press('Enter')
      await expect(main(page).getByRole('tab', { name: '每只狗的实际耗时' })).toHaveAttribute('aria-selected', 'true')
      await expect(main(page).locator('[data-memory-row="doudou"]')).toContainText('3小时20分钟')

      // 第 3 周: both parts — after the first 接受 the focus is already on the second.
      await jump(page, '第 3 周')
      await goTo(page, '通知')
      const review = block(page, '每周复盘：金毛的时长和实际差得多')
      await press(page, review.getByRole('button', { name: '接受' }).first(), 'the first 接受')
      await expect(review.getByRole('button', { name: '接受' })).toBeFocused()
      await page.keyboard.press('Enter')
      await expect(review.getByText('已接受')).toHaveCount(2)
      await expect(review.getByText('全部已处理：接受 2 项，拒绝 0 项。')).toBeFocused()
      await goTo(page, '排班')
      await expect(block(page, '概况')).toContainText(/净空出时间\s*45分钟/)

      // 第 2 个月: from the proposal to the diff, 批准, the history.
      await jump(page, '第 2 个月')
      await goTo(page, '通知')
      await press(page, block(page, '每周复盘：建议修改工作流').getByRole('link', { name: '服务时长' }), 'the proposal’s link')
      await expect(main(page).locator('[data-mode="diff"]')).toBeVisible()
      await press(page, main(page).locator('[data-slot="workflow-proposal"]').getByRole('button', { name: '批准' }), '批准')
      await expect(main(page).getByText('版本 2（当前）')).toBeVisible()
      await expect(main(page).locator('[data-slot="workflow-decision"]')).toBeFocused()
      await press(page, main(page).getByRole('button', { name: '历史', exact: true }), '历史')
      const history = page.getByRole('dialog', { name: '版本历史' })
      await expect(history.locator('li[data-version]')).toHaveCount(2)
      await shot(page, flow, 'history')
      await page.keyboard.press('Escape')
      await expect(history).toBeHidden()

      // 回看: the topic.
      await jump(page, '回看')
      await goTo(page, '话题')
      await press(page, main(page).getByRole('link', { name: /服务时长规则/ }).first(), 'the topic 服务时长规则')
      await expect(h1(page, '服务时长规则')).toBeFocused()
    } finally {
      await context.close()
    }
  })
}
