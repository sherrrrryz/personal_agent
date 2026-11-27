// Flow `ia-walk` (B-01): every page node of `IA-MAP.md` § Nodes is reached by navigation alone —
// the sidebar, the frame's three views and the links on the screens — in every scene where it
// exists, and each has exactly one `h1` and zero `axe` violations. One test per scene, opened at
// `/` (which leads to 通知 once onboarded); the first-run steps are a test of their own, entered
// with 原型控制 → 重新开始. Run by `npm run matrix -- --flows ia-walk`, at 1440 and 1024.
//
// Nodes per scene: the base modules, 话题 and every topic, the profession modules and their
// sub-modules — each with 页面 · 流程 · 资料 — one appointment and one pet file, the recent
// conversations, 设置 and its three pages. Not pages, so not walked: `root`, `profession`
// (a navigation heading), `chat.bar` and `chat.recent` (they are on every screen walked).
import { test, type Page } from '@playwright/test'

import { checkCell, settle } from '../matrix/harness.ts'
import { expect, main, open, widths } from './support.ts'

// The interview's four scripted answers (the same as flow `onboarding` clicks).
const answers = [
  '我开了一家宠物美容店，我是店长，叫周岚。',
  '连我三个人：我和两位美容师小陈、阿杰。顾客先预约，我按美容师排时间；店里也卖香波、狗粮这些商品。',
  '每天晚上给第二天的顾客发预约确认，每周排一次班，库存低了要补货。',
  '品种、毛长、体型、主人，还有性格和每次来做了多久。预约记在日历里，和顾客用微信联系，收款用收款码。',
]

const scenes = ['e1', 'e2', 's0', 's1', 's2', 's3', 's4', 's5'] as const

const sidebar = (page: Page) => page.locator('[data-slot="sidebar"]')

/** The hrefs of the links under `root`, in document order, each once. */
async function hrefs(page: Page, root: string, prefix = '/'): Promise<string[]> {
  return page.evaluate(
    ([selector, start]) => [
      ...new Set(
        [...document.querySelectorAll(`${selector} a[href]`)]
          .map((link) => link.getAttribute('href') ?? '')
          .filter((href) => href.startsWith(start)),
      ),
    ],
    [root, prefix],
  )
}

/** The node on screen now: loaded, one `h1`, the cell's own assertions and `axe` clean. */
async function check(page: Page, node: string, problems: string[]): Promise<void> {
  await settle(page)
  await page
    .waitForFunction(() => !/加载中…|正在载入/.test(document.querySelector('main')?.textContent ?? ''), null, { timeout: 8_000 })
    .catch(() => {})
  if (await page.locator('[data-route-not-found]').count()) return void problems.push(`${node}: the not-found screen`)
  const headings = await page.locator('h1').count()
  if (headings !== 1) problems.push(`${node}: ${headings} h1`)
  for (const failure of (await checkCell(page, { axe: true })).failures) problems.push(`${node}: ${failure.message}`)
}

async function go(page: Page, root: 'sidebar' | 'main', href: string): Promise<void> {
  const link = (root === 'sidebar' ? sidebar(page) : main(page)).locator(`a[href="${href}"]`).first()
  await link.click()
  await expect(page).toHaveURL((url) => url.pathname + url.search === href || url.pathname === href)
}

for (const width of widths) {
  for (const scene of scenes) {
    test(`ia-walk — w${width}: every node of scene ${scene}, by navigation from /`, async ({ browser }) => {
      test.setTimeout(480_000)
      const { context, page } = await open(browser, width, `/?scene=${scene}`)
      const problems: string[] = []
      let walked = 0
      const visit = async (node: string) => {
        walked += 1
        await check(page, `${scene} ${node}`, problems)
      }
      try {
        await expect(page).toHaveURL(/\/m\/notifications/)
        // 最近对话 is collapsed by default: open it, so its conversations are links like the rest.
        const recent = sidebar(page).getByRole('button', { name: '最近对话' })
        if ((await recent.getAttribute('aria-expanded')) === 'false') await recent.click()

        for (const href of await hrefs(page, '[data-slot="sidebar"]')) {
          await go(page, 'sidebar', href)
          await visit(href)

          if (href.startsWith('/m/')) {
            // The frame's other two views.
            for (const name of ['流程', '资料']) {
              await main(page).getByRole('link', { name, exact: true }).click()
              await expect(page.getByRole('heading', { level: 1, name, exact: true })).toBeVisible()
              await visit(`${href} › ${name}`)
            }
            await go(page, 'sidebar', href)
            // One child page where the module has them: an appointment, a pet file.
            for (const child of ['/appointments/', '/pets/']) {
              const first = (await hrefs(page, 'main', `${href}${child}`))[0]
              if (!first) continue
              await go(page, 'main', first)
              await visit(first)
              // An appointment opens as a sheet over 预约: close it before moving on.
              const sheet = page.getByRole('dialog')
              if (await sheet.count()) await sheet.getByRole('button', { name: '关闭' }).last().click()
              await go(page, 'sidebar', href)
            }
          } else {
            // 话题 → every topic; 设置 → its pages.
            for (const child of await hrefs(page, 'main', `${href}/`)) {
              await go(page, 'main', child)
              await visit(child)
              await go(page, 'sidebar', href)
            }
          }
        }
        expect(problems, `${walked} nodes walked in ${scene}`).toEqual([])
        expect(walked).toBeGreaterThan(30)
      } finally {
        await context.close()
      }
    })
  }

  test(`ia-walk — w${width}: the first-run steps, from 重新开始 to 通知`, async ({ browser }) => {
    const { context, page } = await open(browser, width, '/?scene=e1')
    const problems: string[] = []
    try {
      await page.getByRole('button', { name: /原型控制/ }).click()
      await page.getByRole('menuitem', { name: /重新开始/ }).click()
      await expect(page).toHaveURL(/\/onboarding\/profession$/)
      await check(page, 'onboarding.profession', problems)
      // Each scripted answer types itself into the composer (D-48); she sends it.
      for (const answer of answers) {
        await expect(page.getByRole('textbox', { name: '你的回答' })).toHaveValue(answer)
        await page.getByRole('button', { name: '发送', exact: true }).click()
      }
      await expect(page.getByText('我建议从四个功能开始：预约、顾客与宠物、商品与库存、排班。')).toBeVisible()
      await page.getByRole('button', { name: '继续' }).click()
      await expect(page.getByRole('heading', { level: 1, name: '你的功能' })).toBeVisible()
      await check(page, 'onboarding.modules', problems)
      await page.getByRole('button', { name: '确认并生成' }).click()
      await expect(page.getByRole('heading', { level: 1, name: '连接账号' })).toBeVisible()
      await check(page, 'onboarding.accounts', problems)
      await page.getByRole('button', { name: '完成' }).click()
      await expect(page).toHaveURL(/\/m\/notifications$/)
      await check(page, 'notifications after onboarding', problems)
      expect(problems).toEqual([])
    } finally {
      await context.close()
    }
  })
}
