// What the flows of package C5 share (not a flow itself: no `.spec.ts`).
//
// The hero story is told once, as six stage functions — what she does in a
// stage and what the screens must then show (B-20 … B-25). `hero-0` … `hero-5`
// each open one scene and run its stage; `owner-route` runs all six in one
// tab, moving between scenes with 原型控制 only, the way the owner walks it.
// Everything is done with the pointer and by visible names; nothing types an
// address after the first.
import { mkdirSync } from 'node:fs'
import path from 'node:path'

import { expect as baseExpect, type Browser, type Locator, type Page } from '@playwright/test'

import { checkCell, openCell, readPlan, settle, type OpenCell } from '../matrix/harness.ts'

/** The fake runtime answers after a simulated delay: give every assertion room for it. */
export const expect = baseExpect.configure({ timeout: 10_000 })

/** Desktop only (D-44): every flow runs at both accepted widths, light, zh-CN. */
export const widths = [1440, 1024] as const

export const DURATION = '/m/profession.appointments.sub.duration'
export const heroPrompt = '我给长毛大狗做一次要 4 小时，短毛小狗 2 小时左右。以后帮我按狗的品种和毛长估时间，预约和排班都按这个来。'

const escapeRe = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

export function open(browser: Browser, width: number, url: string): Promise<OpenCell> {
  return openCell(browser, { width }, url)
}

/** A screenshot into the run's folder and into the package's evidence folder. */
export async function shot(page: Page, flow: string, name: string): Promise<void> {
  const plan = readPlan()
  if (!plan) return
  const width = page.viewportSize()?.width ?? 0
  await settle(page)
  for (const dir of [path.join(plan.outDir, 'flows'), path.join(process.cwd(), '.orchestration', 'evidence', 'C5')]) {
    mkdirSync(dir, { recursive: true })
    await page.screenshot({ path: path.join(dir, `${flow}-${name}-w${width}.png`) })
  }
}

/** The cell's own assertions on the screen as it is now: no sideways scroll, no clipped text, zero `axe` violations. */
export async function clean(page: Page, step: string): Promise<void> {
  await settle(page)
  expect((await checkCell(page, { axe: true })).failures.map((failure) => failure.message), step).toEqual([])
}

export const main = (page: Page) => page.getByRole('main')
export const bar = (page: Page) => page.locator('[data-shell-bar]')
/** A block of a module page: a `region` named by its title (a marker may follow the title). */
export const block = (page: Page, title: string) => main(page).getByRole('region', { name: new RegExp(`^${escapeRe(title)}`) })
export const h1 = (page: Page, name: string) => page.getByRole('heading', { level: 1, name, exact: true })

/** Open a screen from the sidebar. `name` is the link's visible name; 通知 may carry its count. */
export async function nav(page: Page, name: string, heading = name): Promise<void> {
  const links = page.locator('[data-slot="sidebar"]').getByRole('link', name === '通知' ? { name: /^通知/ } : { name, exact: true })
  await links.first().click()
  await expect(h1(page, heading)).toBeVisible()
}

/** One of the frame's three views: 页面 · 流程 · 资料. */
export async function view(page: Page, name: '页面' | '流程' | '资料'): Promise<void> {
  await main(page).getByRole('link', { name, exact: true }).click()
  if (name !== '页面') await expect(h1(page, name)).toBeVisible()
}

/** 原型控制 → 时间推进: choose a scene by its name, then close the menu (it stays open after a choice). */
export async function jump(page: Page, scene: string): Promise<void> {
  const device = page.getByRole('button', { name: /原型控制/ })
  await device.click()
  await page.getByRole('menuitemradio', { name: scene, exact: true }).click()
  await expect(device).toContainText(scene)
  await device.click()
  await expect(page.getByRole('menu')).toBeHidden()
  await settle(page)
}

/** A booking in 预约's week: the dog, then its line `洗剪吹 · 预计 <时长> · <依据>`. */
export async function booked(page: Page, dog: string, estimate: string): Promise<void> {
  await expect(block(page, '按美容师排的预约')).toContainText(new RegExp(`${escapeRe(dog)}[^·]{0,12}洗剪吹 · 预计 ${escapeRe(estimate)}`))
}

const node = (page: Page, id: string) => page.locator(`.react-flow__node[data-id="${id}"]`)
const memoryRow = (page: Page, id: string) => main(page).locator(`[data-memory-row="${id}"]`)

async function runRecords(page: Page, check: (dialog: Locator) => Promise<void>): Promise<void> {
  await main(page).getByRole('button', { name: '更新记录' }).click()
  const dialog = page.getByRole('dialog', { name: '更新记录' })
  await expect(dialog.getByRole('columnheader', { name: '流程版本' })).toBeVisible()
  await check(dialog)
  await dialog.getByRole('button', { name: '关闭' }).last().click()
  await expect(dialog).toBeHidden()
}

// ── Stage 0 · 今天 (B-20) ────────────────────────────────────────────────────

/** `s0`: 可乐 is booked for the default two hours; the scripted sentence is answered in place. */
export async function stage0(page: Page, flow: string): Promise<void> {
  await nav(page, '预约')
  await booked(page, '可乐（阿拉斯加）', '2小时 · 默认')

  const chip = page.getByRole('list', { name: '可以这样问' }).getByRole('button').first()
  await expect(chip).toHaveText(heroPrompt)
  await chip.click()

  const answer = bar(page)
  await expect(answer).toContainText('长毛大型 4 小时，短毛小型 2 小时，其他 3 小时')
  await expect(answer).toContainText('我还会按名字记录每只狗的实际耗时')
  const rule = answer.getByRole('table', { name: /按类型的大致时长/ })
  for (const row of [/长毛大型\s*4小时/, /短毛小型\s*2小时/, /其他\s*3小时/]) await expect(rule).toContainText(row)
  await expect(answer.getByText('把这条规则设为长期', { exact: true })).toBeVisible()
  await expect(answer.getByRole('button', { name: '接受' })).toBeVisible()
  // In place: the page she asked on is still the page.
  await expect(page).toHaveURL(/\/m\/profession\.appointments$/)
  await expect(h1(page, '预约')).toBeVisible()
  await clean(page, 'stage 0: the answer in place')
  await shot(page, flow, '0-answer-in-place')
}

// ── Stage 1 · 变成流程 (B-21) ──────────────────────────────────────────────

const canvasNodes = [
  '预约新建或修改',
  '每周一复盘',
  '顾客与宠物档案',
  '估算时长',
  '设置预约时长',
  '建议排班调整',
  '记录实际耗时',
  '偏差超过 30 分钟',
  '提议修改规则',
  '资料表：品种大致时长、每只狗的实际耗时',
]

/** She accepts (the answer of stage 0 is open): 服务时长 exists and opens on its canvas. */
export async function stage1(page: Page, flow: string): Promise<void> {
  await bar(page).getByRole('button', { name: '接受' }).click()
  await expect(page).toHaveURL(new RegExp(`${escapeRe(DURATION)}/workflow$`))
  await expect(page.locator('[data-slot="sidebar"]').getByRole('link', { name: '服务时长', exact: true })).toBeVisible()
  await expect(main(page).getByText('版本 1（当前）')).toBeVisible()
  for (const name of canvasNodes) await expect(page.locator('.react-flow__node').filter({ hasText: name }).first()).toBeVisible()
  await expect(node(page, 'set-duration')).toContainText('自主')
  await expect(node(page, 'suggest-shifts')).toContainText('作用于「排班」')
  await expect(node(page, 'suggest-shifts')).toHaveAttribute('aria-label', /协助/)
  await expect(node(page, 'propose-rule')).toHaveAttribute('aria-label', /待确认/)
  await shot(page, flow, '1-canvas')

  // A node opens its inspector; the same steps are there as a list.
  await node(page, 'set-duration').click()
  const inspector = page.getByRole('dialog', { name: /设置预约时长/ })
  await expect(inspector.getByRole('radio', { name: /自主/ })).toBeChecked()
  await shot(page, flow, '1-inspector')
  await inspector.getByRole('button', { name: '取消' }).click()
  await expect(inspector).toBeHidden()
  await main(page).getByRole('button', { name: '步骤列表', exact: true }).click()
  await expect(page.locator('[data-slot="workflow-step-list"]').getByRole('listitem').filter({ hasText: '估算时长' }).first()).toBeVisible()
  await shot(page, flow, '1-step-list')
  await main(page).getByRole('button', { name: '画布', exact: true }).click()
  await expect(node(page, 'set-duration')).toBeVisible()

  // Records: the breed table is seeded from her rule, no dog is timed yet, and 排班 reads it.
  await view(page, '资料')
  await expect(memoryRow(page, 'golden')).toContainText(/4小时\s*你的经验\s*尚无数据/)
  await expect(main(page).getByRole('region', { name: '谁在读这份资料' })).toContainText('排班')
  await main(page).getByRole('tab', { name: '每只狗的实际耗时' }).click()
  await expect(main(page)).toContainText('暂无记录')

  // 预约 has already been rewritten: 可乐 is on her breed's row.
  await nav(page, '预约')
  await booked(page, '可乐（阿拉斯加）', '4小时 · 按品种表')
  await nav(page, '服务时长')
  await view(page, '流程')
}

// ── Stage 2 · 第 1–2 周 (B-22) ───────────────────────────────────────────────

/** `s2`: two weeks of timed visits — the page is rewritten, both tables fill, nothing is applied yet. */
export async function stage2(page: Page, flow: string): Promise<void> {
  await nav(page, '服务时长')
  await view(page, '页面')
  const visits = block(page, '预计与实际')
  await expect(visits.getByRole('row')).toHaveCount(11)
  await expect(visits.getByRole('row').nth(1)).toContainText(/大福（金毛）\s*新/)
  await expect(visits.getByRole('row').nth(1)).toContainText(/4小时\s*4小时15分钟\s*\+15分钟/)
  await expect(visits).toContainText(/雪球（比熊）[\s\S]*3小时\s*2小时10分钟\s*−50分钟/)
  await clean(page, 'stage 2: the sub-module home')
  await shot(page, flow, '2-home')
  await runRecords(page, async (dialog) => {
    // Two Monday reviews and ten timed visits, every one on version 1.
    expect(await dialog.getByRole('row').filter({ hasText: '第 1 版' }).count()).toBeGreaterThanOrEqual(12)
    await expect(dialog.getByRole('row').filter({ hasText: '按计划' }).first()).toBeVisible()
  })

  await view(page, '资料')
  await expect(memoryRow(page, 'golden')).toContainText(/4小时\s*你的经验\s*约 3小时45分钟（5 只，3小时20分钟 – 4小时10分钟）/)
  const breeds = main(page)
  await expect(breeds).toContainText(/比熊[\s\S]*约 2小时10分钟/)
  await expect(breeds).toContainText(/边牧[\s\S]*约 3小时5分钟/)
  await expect(breeds).toContainText(/柯基\s*短毛小型\s*2小时\s*你的经验\s*尚无数据/)
  await shot(page, flow, '2-memory-breeds')
  await main(page).getByRole('tab', { name: '每只狗的实际耗时' }).click()
  for (const [dog, average] of [['doudou', '3小时20分钟'], ['dafu', '4小时10分钟'], ['xueqiu', '2小时10分钟'], ['max', '3小时5分钟']]) {
    await expect(memoryRow(page, dog)).toContainText(average)
    await expect(memoryRow(page, dog)).toContainText('按品种表')
  }
  await shot(page, flow, '2-memory-dogs')

  // Bookings are still on the breed rows.
  await nav(page, '预约')
  await booked(page, '豆豆（金毛）', '4小时 · 按品种表')
}

// ── Stage 3 · 第 3 周 (B-23) ─────────────────────────────────────────────────

/** `s3`: one deferred item in two parts; accepting both changes memory at both tiers and nothing in the workflow. */
export async function stage3(page: Page, flow: string): Promise<void> {
  await nav(page, '通知')
  const item = block(page, '每周复盘：金毛的时长和实际差得多')
  await expect(main(page).locator('[data-slot="block-proposal"]')).toHaveCount(1)
  await expect(item).toContainText('待确认')
  await expect(item.getByText('金毛的大致时长改为 3 小时 45 分（5 只的平均）？')).toBeVisible()
  await expect(item.getByText('来过两次以上的狗按自己的记录排：豆豆 3 小时 20 分，大福 4 小时 10 分？')).toBeVisible()
  await shot(page, flow, '3-notifications-before')

  await item.getByRole('button', { name: '接受' }).first().click()
  await expect(item.getByRole('button', { name: '接受' })).toHaveCount(1)
  await item.getByRole('button', { name: '接受' }).click()
  // The decided item stays for the day with its outcome; nothing still says that it waits.
  await expect(item.getByText('已接受')).toHaveCount(2)
  await expect(item).toContainText('全部已处理：接受 2 项，拒绝 0 项。')
  await expect(block(page, '概况')).toContainText(/待你确认\s*0/)
  await expect(block(page, '重要的事')).not.toContainText('等你确认')
  await clean(page, 'stage 3: 通知 after both parts')
  await shot(page, flow, '3-notifications-after')

  // Both memory tables carry the new 适用 values, marked.
  await nav(page, '服务时长')
  await view(page, '资料')
  await expect(memoryRow(page, 'golden')).toContainText(/3小时45分钟\s*5 只的平均/)
  await expect(memoryRow(page, 'golden').locator('[data-change]')).not.toHaveCount(0)
  await main(page).getByRole('tab', { name: '每只狗的实际耗时' }).click()
  for (const dog of ['doudou', 'dafu']) {
    await expect(memoryRow(page, dog)).not.toContainText('按品种表')
    await expect(memoryRow(page, dog).locator('[data-change]')).not.toHaveCount(0)
  }
  await shot(page, flow, '3-memory-dogs')
  // The workflow is still version 1, the canvas as it was.
  await view(page, '流程')
  await expect(main(page).getByText('版本 1（当前）')).toBeVisible()
  await expect(node(page, 'set-duration')).toBeVisible()
  await expect(node(page, 'first-visit')).toHaveCount(0)

  // 排班: the net freed time and an assisted proposal to open a slot.
  await nav(page, '排班')
  await expect(block(page, '概况')).toContainText(/净空出时间\s*45分钟/)
  const suggestion = block(page, '排班建议')
  await expect(suggestion).toContainText('协助')
  await expect(suggestion.getByText('用空出来的时间加开一个洗澡时段？')).toBeVisible()
  await expect(suggestion.getByRole('button', { name: '接受' })).toBeVisible()
  await shot(page, flow, '3-shifts')

  // 预约: the two regulars on their own records, the new Golden on the breed row.
  await nav(page, '预约')
  await booked(page, '豆豆（金毛）', '3小时20分钟 · 按它自己的记录')
  await booked(page, '大福（金毛）', '4小时10分钟 · 按它自己的记录')
  await booked(page, '布丁（金毛）', '3小时45分钟 · 按品种表')
  await shot(page, flow, '3-appointments')

  // Their files say which duration applies.
  for (const [dog, applied] of [['豆豆', '3小时20分钟（按它自己的记录）'], ['大福', '4小时10分钟（按它自己的记录）']]) {
    await nav(page, '顾客与宠物')
    await main(page).getByRole('link', { name: new RegExp(`^${dog}`) }).first().click()
    await expect(h1(page, dog)).toBeVisible()
    await expect(main(page)).toContainText(new RegExp(`适用时长\\s*${escapeRe(applied)}`))
  }
}

// ── Stage 4 · 第 2 个月 (B-24) ───────────────────────────────────────────────

const firstVisitReason = '复盘发现第一次来的狗平均多用 30 分钟，和品种无关，所以新增条件「第一次来的狗 +30 分钟」'

/** `s4`: the proposal opens the canvas on the change; 批准 makes version 2; history, run records and a first visit explain it. */
export async function stage4(page: Page, flow: string): Promise<void> {
  await nav(page, '通知')
  const item = block(page, '每周复盘：建议修改流程')
  await expect(item.getByText('在流程里新增条件「第一次来的狗 +30 分钟」？')).toBeVisible()
  // One click from the proposal to the diff.
  await item.getByRole('link', { name: '服务时长' }).click()
  await expect(page).toHaveURL(new RegExp(`${escapeRe(DURATION)}/workflow$`))
  await expect(main(page).locator('[data-slot="workflow-version"][data-version="proposed"]')).toBeVisible()
  await expect(main(page).locator('[data-mode="diff"]')).toBeVisible()
  const summary = main(page).getByRole('region', { name: '变更摘要' })
  for (const line of ['新增条件「第一次来的狗 +30 分钟」', '新增连接：估算时长 → 第一次来的狗 +30 分钟', '新增连接：第一次来的狗 +30 分钟 → 设置预约时长']) {
    await expect(summary.getByText(line, { exact: true })).toBeVisible()
  }
  await expect(node(page, 'first-visit').locator('[data-diff="added"]')).toBeVisible()
  await expect(page.locator('.react-flow__edge.workflow-edge-added')).toHaveCount(2)
  await clean(page, 'stage 4: the diff')
  await shot(page, flow, '4-diff')

  await main(page).locator('[data-slot="workflow-proposal"]').getByRole('button', { name: '批准' }).click()
  await expect(main(page).locator('[data-slot="workflow-decision"]')).toContainText('已批准。版本 2 现在生效。')
  await expect(main(page).getByText('版本 2（当前）')).toBeVisible()
  await expect(node(page, 'first-visit')).toBeVisible()
  await shot(page, flow, '4-version-2')

  await main(page).getByRole('button', { name: '历史', exact: true }).click()
  const history = page.getByRole('dialog', { name: '版本历史' })
  const versions = history.locator('[data-slot="workflow-history"] li[data-version]')
  await expect(versions).toHaveCount(2)
  await expect(versions.nth(0)).toContainText(/版本 2\s*当前/)
  await expect(versions.nth(0)).toContainText(firstVisitReason)
  await expect(versions.nth(1)).toContainText('版本 1')
  await expect(versions.nth(1)).toContainText('由对话「按品种和毛长估时间」创建')
  await shot(page, flow, '4-history')
  await history.getByRole('button', { name: '关闭' }).last().click()
  await expect(history).toBeHidden()

  // 更新记录 names the version of every run.
  await view(page, '页面')
  await runRecords(page, async (dialog) => {
    await expect(dialog.getByRole('row').nth(1)).toContainText(/第 \d 版/)
  })

  // A first visit explains its extra half hour and leads to the step that adds it.
  await nav(page, '预约')
  await booked(page, '元宝（边牧）', '3小时30分钟 · 按品种表，含首次到店加时 30分钟')
  await block(page, '按美容师排的预约').getByRole('link', { name: /元宝（边牧）/ }).click()
  const sheet = page.getByRole('dialog', { name: /元宝（边牧）/ })
  await expect(sheet).toContainText('含首次到店加时 30分钟')
  await shot(page, flow, '4-first-visit')
  await sheet.getByRole('link', { name: '查看决定这个时长的步骤' }).click()
  await expect(page).toHaveURL(new RegExp(`${escapeRe(DURATION)}/workflow\\?node=first-visit$`))
  await expect(node(page, 'first-visit').locator('[aria-current]').or(page.locator('.react-flow__node[data-id="first-visit"][aria-current]')).first()).toBeVisible()
}

// ── Stage 5 · 回看 (B-25) ────────────────────────────────────────────────────

/** `s5`: 话题 holds the rule's story — the seed, the memory change, the workflow change — the conversation and the way back. */
export async function stage5(page: Page, flow: string): Promise<void> {
  await nav(page, '话题')
  await main(page).getByRole('link', { name: /服务时长规则/ }).first().click()
  await expect(h1(page, '服务时长规则')).toBeVisible()
  const topic = main(page)
  for (const told of [
    '长毛大型 4 小时，短毛小型 2 小时，其他 3 小时',
    '品种表改成了 3 小时 45 分，豆豆和大福改按自己的记录排',
    '流程新增了条件「第一次来的狗 +30 分钟」，成为版本 2',
  ]) {
    await expect(topic).toContainText(told)
  }
  // The original conversation, as a record.
  await expect(topic).toContainText('按品种和毛长估时间')
  await expect(topic.getByText(heroPrompt)).toBeVisible()
  await clean(page, 'stage 5: the topic')
  await shot(page, flow, '5-topic')
  // And the way back to what it became.
  await topic.getByRole('link', { name: '服务时长', exact: true }).first().click()
  await expect(page).toHaveURL(new RegExp(`${escapeRe(DURATION)}$`))
  await expect(h1(page, '服务时长')).toBeVisible()
}
