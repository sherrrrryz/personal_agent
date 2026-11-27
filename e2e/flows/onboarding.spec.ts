// Flow `onboarding` (B-14, spec part 3 § Screens and flows): a first visit
// walks the three steps — the scripted interview, the proposed modules
// (rename, remove with undo, add), a simulated connection — and lands on 通知;
// after a reload `/` no longer shows onboarding. Run by
// `npm run matrix -- --flows onboarding`, at 1440.
import { mkdirSync } from 'node:fs'
import path from 'node:path'

import { expect, test, type Page } from '@playwright/test'

import { checkCell, openCell, readPlan, settle } from '../matrix/harness.ts'

const answers = [
  '我开了一家宠物美容店，我是店长，叫周岚。',
  '连我三个人：我和两位美容师小陈、阿杰。顾客先预约，我按美容师排时间；店里也卖香波、狗粮这些商品。',
  '每天晚上给第二天的顾客发预约确认，每周排一次班，库存低了要补货。',
  '品种、毛长、体型、主人，还有性格和每次来做了多久。预约记在日历里，和顾客用微信联系，收款用收款码。',
]
const proposed = ['预约', '顾客与宠物', '商品与库存', '排班']

async function shot(page: Page, name: string): Promise<void> {
  const plan = readPlan()
  if (!plan) return
  const file = path.join(plan.outDir, 'flows', `onboarding-${name}.png`)
  mkdirSync(path.dirname(file), { recursive: true })
  await page.screenshot({ path: file })
}

async function clean(page: Page, step: string): Promise<void> {
  await settle(page)
  expect((await checkCell(page, { axe: true })).failures.map((failure) => failure.message), step).toEqual([])
}

test('onboarding — w1440-100: the first run, from / to 通知, shown once', async ({ browser }) => {
  const { context, page } = await openCell(browser, { width: 1440 }, '/')
  try {
    // Step 1: `/` opens the interview.
    await expect(page).toHaveURL(/\/onboarding\/profession$/)
    await expect(page.getByRole('heading', { level: 1, name: '先聊聊你的工作' })).toBeVisible()
    await expect(page.getByText('第 1 步，共 3 步')).toBeVisible()
    await clean(page, 'step 1')
    // Each scripted answer types itself into the composer (D-48); she sends it.
    for (const answer of answers) {
      await expect(page.getByRole('textbox', { name: '你的回答' })).toHaveValue(answer)
      await page.getByRole('button', { name: '发送', exact: true }).click()
    }
    await expect(page.getByText('我建议从四个功能开始：预约、顾客与宠物、商品与库存、排班。')).toBeVisible()
    await shot(page, '1-profession')
    await page.getByRole('log', { name: '职业访谈' }).getByRole('button', { name: '下一步' }).click()

    // Step 2: the four proposed modules; rename, remove and undo, add.
    await expect(page.getByRole('heading', { level: 1, name: '你的功能' })).toBeFocused()
    const rows = page.getByRole('list', { name: '职业功能' }).getByRole('listitem')
    await expect(rows).toHaveCount(4)
    for (const [index, name] of proposed.entries()) await expect(rows.nth(index)).toContainText(name)

    await page.getByRole('button', { name: '重命名「排班」' }).click()
    const rename = page.getByRole('dialog', { name: '重命名功能' })
    await rename.getByRole('textbox', { name: '名称' }).fill('员工排班')
    await rename.getByRole('button', { name: '保存' }).click()
    await expect(rows.nth(3)).toContainText('员工排班')

    await page.getByRole('button', { name: '移除「商品与库存」' }).click()
    await expect(rows).toHaveCount(3)
    await page.getByRole('button', { name: '撤销' }).click()
    await expect(rows).toHaveCount(4)

    await page.getByRole('button', { name: '添加功能' }).click()
    const add = page.getByRole('dialog', { name: '添加功能' })
    await add.getByRole('textbox', { name: '名称' }).fill('寄养')
    await add.getByRole('textbox', { name: '它要做什么' }).fill('记录寄养的狗和天数。')
    await add.getByRole('button', { name: '保存' }).click()
    await expect(rows).toHaveCount(5)
    await clean(page, 'step 2')
    await shot(page, '2-modules')
    await page.getByRole('button', { name: '确认并生成' }).click()

    // Step 3: a simulated connection, said to be one.
    await expect(page.getByRole('heading', { level: 1, name: '连接账号' })).toBeFocused()
    await page.getByRole('button', { name: /更多/ }).click()
    await page.getByRole('button', { name: '连接「Figma」' }).click()
    const connect = page.getByRole('dialog', { name: '连接「Figma」' })
    await expect(connect).toContainText('原型：模拟授权')
    await connect.getByRole('button', { name: '模拟连接' }).click()
    await expect(page.locator('[data-account="figma"]')).toContainText('已连接')
    await clean(page, 'step 3')
    await shot(page, '3-accounts')
    await page.getByRole('button', { name: '完成' }).click()

    // The shell opens on 通知, with her set in the sidebar.
    await expect(page).toHaveURL(/\/m\/notifications$/)
    await expect(page.getByRole('link', { name: '员工排班' })).toBeVisible()
    await expect(page.getByRole('link', { name: '寄养' })).toBeVisible()
    await shot(page, '4-notifications')

    // Onboarding is shown once: after a reload `/` goes to 通知.
    await page.goto('/')
    await expect(page).toHaveURL(/\/m\/notifications$/)
    await page.reload()
    await expect(page).toHaveURL(/\/m\/notifications$/)
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  } finally {
    await context.close()
  }
})
