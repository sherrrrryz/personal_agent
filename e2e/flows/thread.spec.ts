// Flow `thread` (B-28): in 今天 the 店庆 prompt opens a dedicated chat, which then appears in
// 最近对话 and in 话题. Run by `npm run matrix -- --flows thread`, at 1440 and 1024.
import { test } from '@playwright/test'

import { expect, h1, main, nav, open, shot, widths } from './support.ts'

const flow = 'thread'

for (const width of widths) {
  test(`thread — w${width}: the 店庆 prompt opens a chat of its own, listed in 最近对话 and 话题`, async ({ browser }) => {
    const { context, page } = await open(browser, width, '/m/notifications?scene=s0')
    try {
      await page.getByRole('list', { name: '可以这样问' }).getByRole('button', { name: '帮我想想下个月的店庆活动怎么做' }).click()
      await expect(page).toHaveURL(/\/chat\/[^/]+$/)
      await expect(h1(page, '店庆活动怎么做')).toBeVisible()
      await expect(main(page)).toContainText('可以从三个方向想')
      await expect(main(page)).toContainText('话题：店庆活动')
      await shot(page, flow, 'chat')

      // 最近对话 is collapsed by default (D-39): open it.
      const sidebar = page.locator('[data-slot="sidebar"]')
      const recent = sidebar.getByRole('link', { name: /店庆活动怎么做/ })
      if (!(await recent.isVisible())) await sidebar.getByRole('button', { name: '最近对话' }).click()
      await expect(recent).toBeVisible()
      await shot(page, flow, 'recent')

      await nav(page, '话题')
      await main(page).getByRole('link', { name: /店庆活动/ }).first().click()
      await expect(h1(page, '店庆活动')).toBeVisible()
      await expect(main(page)).toContainText('店庆活动怎么做')
      await shot(page, flow, 'topic')
      // The record leads back to the chat.
      await sidebar.getByRole('link', { name: /店庆活动怎么做/ }).click()
      await expect(page).toHaveURL(/\/chat\/[^/]+$/)
    } finally {
      await context.close()
    }
  })
}
