// Flow `secondary` (B-26, IA-MAP § Prototype flows, "Secondary flow"): the warm-up in two evenings.
// 第一晚: the scripted question is answered in place with tomorrow's list; turning 设为长期 on creates
// the sub-module 预约确认 with its workflow. 第二晚: its page is rewritten with markers and the two
// customers who have not answered wait in 通知. Run by `npm run matrix -- --flows secondary`, at 1440 and 1024.
import { test } from '@playwright/test'

import { bar, block, clean, expect, h1, jump, main, nav, open, shot, view, widths } from './support.ts'

const flow = 'secondary'
const prompt = '明天有哪些预约？帮我给顾客发确认。'

for (const width of widths) {
  test(`secondary — w${width}: 第一晚 the answer becomes 预约确认, 第二晚 it has run`, async ({ browser }) => {
    const { context, page } = await open(browser, width, '/m/notifications?scene=e1')
    try {
      // 第一晚: asked on 预约, answered in place.
      await nav(page, '预约')
      await page.getByRole('list', { name: '可以这样问' }).getByRole('button', { name: prompt }).click()
      const answer = bar(page)
      await expect(answer).toContainText('明天的预约见下表')
      const list = answer.getByRole('table', { name: /明天的预约/ })
      for (const dog of ['雪球', 'Max', '土豆', '胖虎']) await expect(list.getByRole('row').filter({ hasText: dog })).toHaveCount(1)
      await expect(page).toHaveURL(/\/m\/profession\.appointments$/)
      await shot(page, flow, 'e1-answer')

      // 设为长期: the name and the parent are confirmed first, then the sub-module exists.
      await answer.getByRole('switch', { name: /设为长期/ }).click()
      await answer.getByRole('button', { name: '创建', exact: true }).click()
      const created = page.locator('[data-slot="sidebar"]').getByRole('link', { name: '预约确认', exact: true })
      await expect(created).toBeVisible()
      await created.click()
      await expect(h1(page, '预约确认')).toBeVisible()
      await view(page, '流程')
      const node = (label: string) => page.locator(`.react-flow__node[aria-label*="${label}"]`)
      await expect(page.locator('.react-flow__node').filter({ hasText: '每天 19:00' })).toHaveCount(1)
      await expect(node('发确认')).toHaveAttribute('aria-label', /自主/)
      await expect(node('无回复则提醒我')).toHaveAttribute('aria-label', /待确认/)
      await clean(page, 'e1: the canvas of 预约确认')
      await shot(page, flow, 'e1-canvas')

      // 第二晚: last night's run rewrote the page; what it could not settle waits in 通知.
      await jump(page, '第二晚')
      await nav(page, '预约确认')
      await view(page, '页面')
      await expect(main(page)).toContainText('本次更新：3 处更新')
      const customers = block(page, '每位顾客')
      await expect(customers).toContainText(/陈小姐（麦芽）\s*新\s*已回复/)
      await expect(customers).toContainText(/赵先生（奶茶）\s*新\s*无回复/)
      await expect(customers).toContainText(/刘女士（Lucky）\s*新\s*无回复/)
      await shot(page, flow, 'e2-home')
      await nav(page, '通知')
      await expect(main(page).locator('[data-slot="block-proposal"]')).toHaveCount(2)
      for (const owner of ['刘女士', '赵先生']) {
        await expect(block(page, `${owner}还没有回复明天的预约确认`).getByRole('button', { name: '接受' })).toBeVisible()
      }
      await clean(page, 'e2: 通知')
      await shot(page, flow, 'e2-notifications')
    } finally {
      await context.close()
    }
  })
}
