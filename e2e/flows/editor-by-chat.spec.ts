// Flow `editor-by-chat` (B-28): in the workflow editor the scripted prompt is answered in place with
// a proposal; accepting it shows the new version and its reason.
// Run by `npm run matrix -- --flows editor-by-chat`, at 1440 and 1024.
import { test } from '@playwright/test'

import { bar, expect, main, nav, open, shot, view, widths } from './support.ts'

const flow = 'editor-by-chat'
const reason = 'AI 按你的要求把复盘时间改为周一 09:00'

for (const width of widths) {
  test(`editor-by-chat — w${width}: the weekly review moves to Monday 09:00 as version 2`, async ({ browser }) => {
    const { context, page } = await open(browser, width, '/m/notifications?scene=s2')
    try {
      await nav(page, '服务时长')
      await view(page, '工作流')
      await expect(main(page).getByText('版本 1（当前）')).toBeVisible()
      const review = page.locator('.react-flow__node[data-id="review"]')
      await expect(review).toContainText('每周一 18:00')

      await page.getByRole('list', { name: '可以这样问' }).getByRole('button', { name: '把每周复盘改到周一早上 9 点' }).click()
      const answer = bar(page)
      await expect(answer).toContainText('从 18:00 改为 09:00')
      await expect(answer.getByText('把「每周一复盘」改为周一 09:00？')).toBeVisible()
      await expect(page).toHaveURL(/\/workflow$/)
      await shot(page, flow, 'answer')
      await answer.getByRole('button', { name: '接受' }).click()

      // The canvas behind the panel is the new version already; the history gives the reason.
      await expect(main(page).getByText('版本 2（当前）')).toBeVisible()
      await expect(review).toContainText('每周一 09:00')
      await main(page).getByRole('button', { name: '历史', exact: true }).click()
      const history = page.getByRole('dialog', { name: '版本历史' })
      await expect(history.locator('li[data-version]').first()).toContainText(reason)
      await shot(page, flow, 'history')
    } finally {
      await context.close()
    }
  })
}
