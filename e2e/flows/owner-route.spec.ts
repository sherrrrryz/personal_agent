// Flow `owner-route`: the route the owner walks by clicking alone (lead's note of 2026-11-26) —
// 原型控制 moves between the scenes, everything else is the sidebar, the frame's three views and
// the buttons on the screens. One tab, no typed address after the first, zh-CN. The six stages
// are the hero story's (B-20 … B-25, `support.ts`); between them only the device is used.
// Run by `npm run matrix -- --flows owner-route`, at 1440 and 1024.
import { test } from '@playwright/test'

import { jump, open, stage0, stage1, stage2, stage3, stage4, stage5, widths } from './support.ts'

for (const width of widths) {
  test(`owner-route — w${width}: 今天 → 变成流程 → 第 1–2 周 → 第 3 周 → 第 2 个月 → 回看, by clicks`, async ({ browser }) => {
    test.setTimeout(300_000)
    const { context, page } = await open(browser, width, '/m/notifications?scene=e1')
    const flow = 'owner-route'
    try {
      await jump(page, '今天')
      await stage0(page, flow)
      await stage1(page, flow)
      await jump(page, '第 1–2 周')
      await stage2(page, flow)
      await jump(page, '第 3 周')
      await stage3(page, flow)
      await jump(page, '第 2 个月')
      await stage4(page, flow)
      await jump(page, '回看')
      await stage5(page, flow)
    } finally {
      await context.close()
    }
  })
}
