// @vitest-environment node
import { describe, expect, it } from 'vitest'

import { locales } from '@/i18n'
import {
  actionsOfKind,
  awaitingCount,
  conversationsOf,
  createRuntime,
  effectiveMode,
  findModule,
  latestRun,
  memoryChanges,
  openProposals,
  parseSceneRef,
  resourceKinds,
  rowOf,
  runsOf,
  sceneRefs,
  subModulesOf,
  tableOf,
  taskKinds,
  versionOf,
  workflowOf,
  type MemoryRow,
  type ResourceRef,
  type Snapshot,
} from '@/runtime'
import { runtimeIn, textsIn } from '@/runtime/test-support'
import { addMinutes, datePart, mondayOf, weekdayOf } from '@/runtime/time'

import {
  appointmentStatus,
  basis,
  basisNames,
  breedBasisNames,
  cappedTaskKind,
  chatScripts,
  column,
  emptyVariant,
  firstVisitParam,
  interview,
  interviewMessages,
  longInterview,
  longSizes,
  longVariant,
  moduleId,
  nodeId,
  previewErrors,
  proposalId,
  scene,
  scriptId,
  staff,
  tableId,
  taskKindNames,
} from '.'
import * as vocabulary from './vocabulary'

// R-04 — the story facts. Every fact named in part 3's Screens table
// (`docs/specs/lofi-prototype-screens.md` § Screens and flows) and in its
// criteria B-20…B-26 is listed below with the scene that shows it, and found
// in that scene's snapshot. Then: every fixture string exists in both
// locales, and the `long` and `empty` variants exist for every resource of
// every scene, at the sizes the Screens table names.
//
// A fact is something the *story* holds — a name, a number, a state of the
// data. The sentences a screen says about its own states (今天没有预约, 暂无记录,
// 摘要生成中 …) belong to that screen's messages, not to the fixtures.

const at = (ref: string): Snapshot => {
  const parsed = parseSceneRef(ref)!
  return scene(parsed.scene, parsed.half)
}

const a = column.appointments
const b = column.breeds
const d = column.dogDurations
const hours = (h: number, m = 0) => h * 60 + m

/** True when some text of the state contains `zh` — and its English pair is there too. */
function says(state: unknown, zh: string): boolean {
  return textsIn(state).some(({ text }) => text['zh-CN'].includes(zh) && text.en.trim() !== '')
}
const rows = (state: Snapshot, table: string): MemoryRow[] => tableOf(state, table)?.rows ?? []
const breed = (state: Snapshot, id: string) => rowOf(tableOf(state, tableId.breeds), id)!.cells
const record = (state: Snapshot, dog: string) => rowOf(tableOf(state, tableId.dogDurations), dog)!.cells
const open = (state: Snapshot, dog: string) =>
  rows(state, tableId.appointments).find((row) => row.cells[a.dog] === dog && row.cells[a.status] === appointmentStatus.booked)!.cells
const labels = (state: Snapshot, module: string, n?: number) => versionOf(workflowOf(state, module)!, n).nodes.map((node) => node.label['zh-CN'])
const node = (state: Snapshot, module: string, label: string) => versionOf(workflowOf(state, module)!).nodes.find((each) => each.label['zh-CN'] === label)!
const today = (state: Snapshot) => rows(state, tableId.appointments).filter((row) => String(row.cells[a.start]).startsWith(datePart(state.storyTime)))

type Fact = [source: string, fact: string, check: () => void]

const facts: Fact[] = [
  // ── Screens table ─────────────────────────────────────────────────────────
  [
    'onboarding.profession',
    'the AI asks four things in turn, her scripted answers, a closing summary; empty = the first question; long = 40 messages',
    () => {
      expect(interview.questions.map((each) => each.id)).toEqual(['work', 'organisation', 'recurring', 'records'])
      expect(interviewMessages(0).map((message) => message.author)).toEqual(['ai'])
      expect(interviewMessages(2).map((message) => message.author)).toEqual(['ai', 'user', 'ai', 'user', 'ai'])
      const whole = interviewMessages()
      expect(whole.map((message) => message.author)).toEqual(['ai', 'user', 'ai', 'user', 'ai', 'user', 'ai', 'user', 'ai'])
      expect(whole.at(-1)?.text).toBe(interview.summary)
      // The summary leads to the set step 2 proposes; her answers name the people and the tools.
      for (const name of ['预约', '顾客与宠物', '商品与库存', '排班']) expect(interview.summary['zh-CN']).toContain(name)
      for (const word of ['周岚', '小陈', '阿杰', '日历', '微信', '收款']) expect(says(interview, word), word).toBe(true)
      const long = longInterview()
      expect(long).toHaveLength(longSizes.interviewMessages)
      expect(new Set(long.map((message) => message.id)).size).toBe(long.length)
      expect(long.at(-1)?.text).toBe(interview.summary)
    },
  ],
  [
    'onboarding.modules · settings.profession',
    'the proposed set 预约 · 顾客与宠物 · 商品与库存 · 排班, each with one line on what its workflow will do',
    () => {
      const set = at('e1').modules.filter((module) => module.kind === 'profession')
      expect(set.map((module) => module.name['zh-CN'])).toEqual(['预约', '顾客与宠物', '商品与库存', '排班'])
      for (const module of set) for (const locale of locales) expect(module.description[locale].length, module.id).toBeGreaterThan(10)
    },
  ],
  [
    'onboarding.accounts · settings.accounts',
    '日历, 微信, 收款 first, then 更多 (Google, Slack, Figma, GitHub), each naming the modules it feeds; status as data',
    () => {
      const accounts = at('e1').accounts
      expect(accounts.map((account) => [account.name['zh-CN'], account.group])).toEqual([
        ['日历', 'primary'],
        ['微信', 'primary'],
        ['收款', 'primary'],
        ['Google', 'more'],
        ['Slack', 'more'],
        ['Figma', 'more'],
        ['GitHub', 'more'],
      ])
      for (const account of accounts.filter((each) => each.group === 'primary')) {
        expect(account.status).toBe('connected')
        expect(account.feeds.length, account.id).toBeGreaterThan(0)
        for (const id of account.feeds) expect(findModule(at('e1'), id), id).toBeDefined()
      }
      // From `e2` 微信 also feeds 预约确认 — the module that stops if it is disconnected.
      expect(at('e2').accounts.find((account) => account.id === 'wechat')?.feeds).toContain(moduleId.confirmations)
    },
  ],
  [
    'notifications',
    'one proposal per deferred item from any module, naming its source; important items with a source module; `source-failed` names the module',
    () => {
      for (const ref of sceneRefs) {
        const state = at(ref)
        for (const proposal of openProposals(state)) expect(findModule(state, proposal.moduleId), proposal.id).toBeDefined()
        const notices = rows(state, tableId.notices)
        expect(notices.length, ref).toBeGreaterThan(0)
        for (const notice of notices) expect(findModule(state, String(notice.cells.source)), `${ref} ${notice.id}`).toBeDefined()
        // 今天新增: something in the list is from the scene's own day.
        expect(notices.some((notice) => String(notice.cells.at).startsWith(datePart(state.storyTime))), ref).toBe(true)
      }
      expect(previewErrors.module(moduleId.notifications)).toEqual({ reason: { code: 'source-failed', moduleId: moduleId.shifts }, keeps: 'partial' })
    },
  ],
  [
    'messages',
    'customer messages triaged into modules, each with a channel; some unread; `account-expired` for 微信',
    () => {
      for (const ref of sceneRefs) {
        const state = at(ref)
        const messages = rows(state, tableId.messages)
        expect(messages.length, ref).toBeGreaterThanOrEqual(3)
        expect(new Set(messages.map((message) => message.cells.module)).size, ref).toBeGreaterThanOrEqual(3)
        for (const message of messages) expect(message.cells.channel).toBe('wechat')
        expect(messages.some((message) => message.cells.unread === true), ref).toBe(true)
      }
      expect(previewErrors.module(moduleId.messages).reason).toEqual({ code: 'account-expired', account: 'wechat' })
    },
  ],
  [
    'calendar',
    'her own events plus the bookings written by 预约; something today',
    () => {
      for (const ref of sceneRefs) {
        const state = at(ref)
        const week = mondayOf(state.storyTime)
        expect(rows(state, tableId.events).some((event) => String(event.cells.start) >= week), ref).toBe(true)
        expect(tableOf(state, tableId.appointments)?.readers, ref).toContain(moduleId.calendar)
      }
      // 第一晚 is after closing: today's two bookings are over, tomorrow's four are ahead.
      expect(today(at('e1')).map((row) => row.cells[a.status])).toEqual(['done', 'done'])
      expect(at('e1').storyTime).toBe('2026-11-02T18:30')
    },
  ],
  [
    'todo · mail · files',
    'filled with sample data in every scene (D-51): a table of its own read from Google or Slack, a workflow of its own that has run, to-dos open and done, mail that needs a reply, recent files',
    () => {
      for (const ref of sceneRefs) {
        const state = at(ref)
        const today = datePart(state.storyTime)
        for (const [id, table] of [
          [moduleId.todo, tableId.tasks],
          [moduleId.mail, tableId.emails],
          [moduleId.files, tableId.files],
        ] as const) {
          expect(findModule(state, id)?.memoryTableIds, `${ref} ${id}`).toEqual([table])
          expect(rows(state, table).length, `${ref} ${table}`).toBeGreaterThanOrEqual(8)
          expect(labels(state, id), `${ref} ${id}`).not.toContain('来源：未连接')
          expect(latestRun(state, id)?.result, `${ref} ${id}`).toBe('ok')
        }
        const tasks = rows(state, tableId.tasks)
        expect(tasks.some((task) => task.cells.done === true) && tasks.some((task) => task.cells.done === false), ref).toBe(true)
        expect(tasks.some((task) => task.cells.due === today && task.cells.done === false), ref).toBe(true)
        expect(new Set(tasks.map((task) => task.cells.source)).size, ref).toBeGreaterThanOrEqual(3)
        expect(rows(state, tableId.emails).filter((mail) => mail.cells.reply === true).length, ref).toBeGreaterThanOrEqual(3)
        for (const file of rows(state, tableId.files)) expect(String(file.cells.modified) <= state.storyTime, `${ref} ${file.id}`).toBe(true)
      }
      for (const account of ['google', 'slack']) expect(at('e1').accounts.find((each) => each.id === account)?.status, account).toBe('connected')
    },
  ],
  [
    'topics · topics.<topic>',
    'AI-given title, summary with its time, the conversations with their surface, last activity, the sub-module that grew from it',
    () => {
      const state = at('s1')
      // The two topics of the story, and the side conversations she had with the AI (D-51).
      expect(state.topics.map((topic) => topic.title['zh-CN'])).toEqual(['预约确认', '冬季护毛提醒', '美容师提成', '低敏香波换供应商', '服务时长规则'])
      for (const topic of state.topics) {
        expect(topic.summary?.['zh-CN'].length).toBeGreaterThan(20)
        expect(topic.summaryAt).toBeDefined()
        expect(topic.lastActivityAt).toBeDefined()
        const records = conversationsOf(state, topic.id)
        expect(records).toHaveLength(1)
        if (topic.id === 'confirmations' || topic.id === 'duration-rule') {
          expect(records[0]).toMatchObject({ surface: 'in-place', persistence: 'persistent' })
          expect(topic.moduleIds).toContain(records[0].subModuleId)
        } else {
          expect(records[0]).toMatchObject({ surface: 'thread', persistence: 'one-off' })
          expect(records[0].messages.length, topic.id).toBeGreaterThanOrEqual(2)
          expect(records[0].messages.at(-1)?.at, topic.id).toBe(topic.lastActivityAt)
        }
      }
      // By the end there are seven: one more side conversation in weeks 1–2, one in month 2.
      expect(at('s5').topics).toHaveLength(7)
      expect(previewErrors.topic).toEqual({ reason: { code: 'generation-failed' }, keeps: 'partial' })
    },
  ],
  [
    'profession.appointments',
    'by groomer 周岚 · 小陈 · 阿杰: dog, breed, service, 预计 and its basis in words 默认 / 按品种表 / 按它自己的记录; 待安排; stale on error',
    () => {
      expect(Object.values(staff).map((name) => name['zh-CN'])).toEqual(['周岚', '小陈', '阿杰'])
      expect(Object.values(basisNames).map((name) => name['zh-CN'])).toEqual(['默认', '按品种表', '按它自己的记录'])
      for (const ref of sceneRefs) {
        const state = at(ref)
        const dogs = tableOf(state, tableId.dogs)
        for (const row of rows(state, tableId.appointments)) {
          expect(rowOf(dogs, String(row.cells[a.dog]))?.cells[column.dogs.breed], row.id).toBeDefined()
          expect(row.cells[a.service], row.id).toBe('full')
          expect(row.cells[a.estimate], row.id).toEqual(expect.any(Number))
          expect(Object.keys(basisNames), row.id).toContain(row.cells[a.basis])
          if (row.cells[a.status] !== appointmentStatus.requested) expect(Object.keys(staff), row.id).toContain(row.cells[a.groomer])
        }
      }
      // 待安排: one request waits in every scene but the second evening, when it has just been placed.
      const requests = Object.fromEntries(sceneRefs.map((ref) => [ref, rows(at(ref), tableId.appointments).filter((row) => row.cells[a.status] === appointmentStatus.requested).length]))
      expect(requests).toEqual({ e1: 1, e2: 0, s0: 1, s1: 1, s2: 1, s3: 1, 's3-resolved': 1, s4: 1, 's4-resolved': 1, s5: 1 })
      expect(previewErrors.module(moduleId.appointments)).toEqual({ reason: { code: 'platform-unreachable' }, keeps: 'stale' })
    },
  ],
  [
    'profession.appointments (sheet)',
    '完成 → 实际耗时 → recordActualDuration: the visit joins the file and the observed columns move at once',
    () => {
      const runtime = runtimeIn('s2')
      const booking = rows(runtime.getState(), tableId.appointments).find((row) => row.id === 'apt-1121-doudou')!
      runtime.actions.recordActualDuration({ appointmentId: booking.id, minutes: 200 })
      const after = runtime.getState()
      expect(rowOf(tableOf(after, tableId.appointments), booking.id)?.cells).toMatchObject({ [a.actual]: 200, [a.status]: 'done' })
      expect(record(after, 'doudou')).toMatchObject({ [d.visits]: 3, [d.average]: 200, [d.applied]: null })
      expect(memoryChanges(after, tableOf(after, tableId.dogDurations)!)).toMatchObject({ doudou: 'updated' })
    },
  ],
  [
    'profession.clients · pet file',
    'per dog: name, breed, coat, size, owner, 适用时长 + basis, 下次到店, 性格备注; 每次到店 (日期 · 预计 · 实际 · 美容师); a file with no visit',
    () => {
      const state = at('s3-resolved')
      for (const dog of rows(state, tableId.dogs)) {
        for (const cell of [column.dogs.name, column.dogs.breed, column.dogs.coat, column.dogs.size, column.dogs.owner]) expect(dog.cells[cell], `${dog.id}.${cell}`).not.toBeNull()
      }
      // 下次到店 is the dog's next open booking.
      expect(rowOf(tableOf(state, tableId.dogs), 'buding')?.cells[column.dogs.nextDue]).toBe('2026-11-26')
      expect(rowOf(tableOf(state, tableId.dogs), 'tudou')?.cells[column.dogs.nextDue]).toBeNull()
      // 性格备注: 大福 不配合 — written into the file and carried by its record.
      expect(rowOf(tableOf(state, tableId.dogs), 'dafu')?.cells[column.dogs.note]).toMatchObject({ 'zh-CN': expect.stringContaining('不太配合') })
      expect(record(state, 'dafu')[d.note]).toEqual(rowOf(tableOf(state, tableId.dogs), 'dafu')?.cells[column.dogs.note])
      const visits = rows(state, tableId.visits).filter((visit) => visit.cells[column.visits.dog] === 'doudou')
      expect(visits.map((visit) => [visit.cells.date, visit.cells.estimate, visit.cells.actual, visit.cells.groomer])).toEqual([
        ['2026-11-05', 240, 205, 'lan'],
        ['2026-11-17', 240, 195, 'lan'],
        ['2026-11-21', 240, 200, 'lan'],
      ])
      // 布丁 has not been here yet: no visit, booked by the breed table.
      expect(rows(state, tableId.visits).some((visit) => visit.cells[column.visits.dog] === 'buding')).toBe(false)
      expect(open(state, 'buding')[a.basis]).toBe(basis.breed)
    },
  ],
  [
    'profession.inventory',
    '商品 · 库存 · 安全库存, something below the safety level, 本周销售',
    () => {
      const products = rows(at('e1'), tableId.products)
      expect(products.length).toBeGreaterThanOrEqual(5)
      expect(products.filter((product) => Number(product.cells.stock) < Number(product.cells.safety)).map((product) => product.id)).toEqual(['shampoo'])
      for (const product of products) expect(product.cells.sold).toEqual(expect.any(Number))
    },
  ],
  [
    'profession.shifts',
    'week × staff for the scene’s own week, 换班申请, the freed time and an assisted proposal when durations change',
    () => {
      for (const ref of sceneRefs.filter((each) => !['e1', 'e2', 's0', 's1'].includes(each))) {
        const state = at(ref)
        const monday = mondayOf(state.storyTime)
        const shifts = rows(state, tableId.shifts)
        expect(new Set(shifts.map((shift) => mondayOf(String(shift.cells.start)))), ref).toEqual(new Set([monday]))
        expect(new Set(shifts.map((shift) => shift.cells.staff)), ref).toEqual(new Set(Object.keys(staff)))
        expect(new Set(shifts.map((shift) => weekdayOf(String(shift.cells.start)))).size, ref).toBe(6)
        expect(rows(state, tableId.swaps).filter((swap) => swap.cells.status === 'open'), ref).toHaveLength(1)
      }
      expect(rows(at('e1'), tableId.swaps).map((swap) => swap.cells.status)).toEqual(['open'])
    },
  ],
  [
    '…sub.duration 服务时长',
    'empty in `s1` (暂无记录); 预计 vs 实际 per finished appointment; the rule in words and why',
    () => {
      expect(rows(at('s1'), tableId.dogDurations)).toEqual([])
      expect(rows(at('s1'), tableId.visits)).toEqual([])
      expect(rows(at('s2'), tableId.visits)).toHaveLength(10)
      expect(node(at('s2'), moduleId.duration, '估算时长').detail?.['zh-CN']).toBe('来过两次以上：用这只狗的记录；否则：用品种表的大致时长。')
    },
  ],
  [
    '…sub.confirmations 预约确认',
    'before its first run in `e1` (今晚 19:00 第一次更新); 已发 · 已回复 · 无回复 per customer',
    () => {
      // Turning the switch in `e1`: the module exists, has never run, and runs first at 19:00 tonight.
      const runtime = runtimeIn('e1')
      const conversation = runtime.actions.sendMessage({ text: chatScripts.find((script) => script.id === scriptId.confirmations)!.prompt['zh-CN'], context: { moduleId: moduleId.appointments, view: 'page' } })
      runtime.actions.createSubModule({ parentId: moduleId.appointments, conversationId: conversation!.conversationId })
      const created = runtime.getState()
      expect(findModule(created, moduleId.confirmations)?.nextRunAt).toBe('2026-11-02T19:00')
      expect(runsOf(created, moduleId.confirmations)).toEqual([])
      expect(rows(created, tableId.confirmations)).toEqual([])
      for (const ref of sceneRefs.filter((each) => each !== 'e1')) {
        const confirmations = rows(at(ref), tableId.confirmations)
        expect(confirmations.length, ref).toBeGreaterThan(0)
        for (const row of confirmations) expect(Object.keys(vocabulary.confirmationStatusNames), row.id).toContain(row.cells.status)
      }
    },
  ],
  [
    'settings',
    'live status lines: 5 个已连接 · 2 类任务已设置 · 4 个功能; a fresh workspace has none',
    () => {
      const state = at('e1')
      // 日历, 微信, 收款 — and Google and Slack, which 邮件 · 文件 · 待办 read (D-51).
      expect(state.accounts.filter((account) => account.status === 'connected')).toHaveLength(5)
      expect(state.modeSettings.filter((setting) => setting.ceiling !== null)).toHaveLength(2)
      expect(state.modules.filter((module) => module.kind === 'profession')).toHaveLength(4)
      const fresh = emptyVariant(state)
      expect(fresh.accounts.filter((account) => account.status === 'connected')).toHaveLength(0)
      expect(fresh.modeSettings.filter((setting) => setting.ceiling !== null)).toHaveLength(0)
    },
  ],
  [
    'settings.ai-modes',
    'one row per kind of task — 给顾客发消息 · 修改预约 · 调整排班 · 修改规则和流程 · 下单补货 · 整理归档 — each listing the actions it caps; a row capping nothing',
    () => {
      expect(taskKinds.map((kind) => taskKindNames[kind]['zh-CN'])).toEqual(['给顾客发消息', '修改预约', '调整排班', '修改规则和流程', '下单补货', '整理归档'])
      const state = at('s1')
      expect(state.modeSettings.map((setting) => setting.taskKind)).toEqual([...taskKinds])
      expect(actionsOfKind(state, 'change-rules').map(({ node: each }) => each.label['zh-CN'])).toEqual(['提议修改规则'])
      expect(actionsOfKind(state, 'order-stock').map(({ node: each }) => each.label['zh-CN'])).toEqual(['建议补货'])
      // In `e1` nothing changes rules yet: its row caps nothing.
      expect(actionsOfKind(at('e1'), 'change-rules')).toEqual([])
    },
  ],
  [
    'settings.profession',
    '升级建议: from `s4`, a proposal to promote 服务时长 to a top-level module (D-38); none before',
    () => {
      const promotions = (ref: string) => at(ref).proposals.filter((proposal) => proposal.onAccept.action === 'promoteSubModule')
      for (const ref of ['e1', 'e2', 's0', 's1', 's2', 's3', 's3-resolved']) expect(promotions(ref), ref).toEqual([])
      for (const ref of ['s4', 's4-resolved', 's5']) {
        expect(promotions(ref), ref).toMatchObject([{ id: proposalId.promote, mode: 'assisted', parts: [{ state: 'pending' }], onAccept: { input: { moduleId: moduleId.duration } } }])
      }
      // Accepting it promotes; the old address stays an alias.
      const runtime = runtimeIn('s4')
      expect(runtime.actions.resolveProposalPart({ proposalId: proposalId.promote, partId: 'promote', resolution: 'accepted' })).toBe('profession.duration')
      expect(findModule(runtime.getState(), 'profession.duration')).toMatchObject({ kind: 'profession', aliases: [moduleId.duration] })
    },
  ],
  [
    'memory view',
    '品种大致时长: 依据 你的经验 / n 只的平均, 尚无数据 rows; 每只狗的实际耗时; 谁在读这份资料',
    () => {
      expect(Object.values(breedBasisNames).map((name) => name['zh-CN'])).toEqual(['你的经验', '实测平均'])
      const state = at('s3-resolved')
      expect(breed(state, 'golden')).toMatchObject({ [b.basis]: 'average', [b.dogs]: 5 })
      expect(tableOf(state, tableId.breeds)?.columns.map((each) => each.label['zh-CN'])).toEqual(['品种', '类型', '适用时长', '依据', '实测平均', '只数', '最短', '最长', '更新时间'])
      expect(tableOf(state, tableId.dogDurations)?.columns.map((each) => each.label['zh-CN'])).toEqual(['狗', '品种', '到店次数', '平均实际耗时', '适用时长', '性格备注'])
      expect(tableOf(state, tableId.dogDurations)?.readers).toEqual([moduleId.appointments, moduleId.clients])
    },
  ],

  // ── B-20 … B-26 ───────────────────────────────────────────────────────────
  [
    'B-20 (s0)',
    '可乐（阿拉斯加）is booked for 2 h, basis 默认; the scripted sentence answers in place with the rule table 长毛大型 4 h · 短毛小型 2 h · 其他 3 h, the note that each dog is recorded by name, and a proposal to make it persistent',
    () => {
      const state = at('s0')
      expect(rowOf(tableOf(state, tableId.dogs), 'kele')?.cells).toMatchObject({ [column.dogs.name]: { 'zh-CN': '可乐' }, [column.dogs.breed]: 'alaskan' })
      expect(vocabulary.breeds.alaskan['zh-CN']).toBe('阿拉斯加')
      expect(open(state, 'kele')).toMatchObject({ [a.estimate]: hours(2), [a.basis]: basis.default })
      expect(String(open(state, 'kele')[a.start])).toBe('2026-11-05T14:00')

      const script = chatScripts.find((each) => each.id === scriptId.hero)!
      expect(script).toMatchObject({ scenes: ['s0'], surface: 'in-place', template: 'duration' })
      expect(script.prompt['zh-CN']).toBe('我给长毛大狗做一次要 4 小时，短毛小狗 2 小时左右。以后帮我按狗的品种和毛长估时间，预约和排班都按这个来。')
      expect(script.reply['zh-CN']).toContain('按名字记录每只狗的实际耗时')
      const table = script.attachments!(state)[0]
      expect(table.kind === 'table' && table.rows.map((row) => [(row.cells.type as { 'zh-CN': string })['zh-CN'], row.cells.minutes])).toEqual([
        ['长毛大型', hours(4)],
        ['短毛小型', hours(2)],
        ['其他', hours(3)],
      ])
      expect(script.proposal!(state, {})).toMatchObject({ onAccept: { action: 'createSubModule', input: { parentId: moduleId.appointments, template: 'duration' } } })
    },
  ],
  [
    'B-21 (s1)',
    '服务时长 under 预约; its canvas: 预约新建或修改 and 每周一复盘 → 顾客与宠物档案 → 估算时长 → 设置预约时长 (自主) → 建议排班调整 to 排班 (协助) → 记录实际耗时 → 偏差超过 30 分钟 → 提议修改规则 (待确认) → memory 品种大致时长 (seeded) and 每只狗的实际耗时 (暂无记录); 排班 reads the memory; 可乐 is booked for 4 h 按品种表',
    () => {
      const state = at('s1')
      expect(subModulesOf(state, moduleId.appointments).map((module) => module.name['zh-CN'])).toEqual(['预约确认', '服务时长'])
      expect(labels(state, moduleId.duration)).toEqual([
        '预约新建或修改',
        '每周一复盘',
        '顾客与宠物档案（品种、毛长、体型）',
        '估算时长',
        '设置预约时长',
        '建议排班调整',
        '记录实际耗时',
        '偏差超过 30 分钟',
        '提议修改规则',
        '资料',
        '学习概况',
        '预计与实际',
        '现在的规则',
      ])
      const modes = ['设置预约时长', '建议排班调整', '提议修改规则'].map((label) => [node(state, moduleId.duration, label).mode, effectiveMode(state, node(state, moduleId.duration, label))])
      expect(modes).toEqual([
        ['autonomous', 'autonomous'],
        ['assisted', 'assisted'],
        ['deferred', 'deferred'],
      ])
      expect(node(state, moduleId.duration, '建议排班调整').targetModuleId).toBe(moduleId.shifts)
      expect(node(state, moduleId.duration, '偏差超过 30 分钟').params).toEqual({ thresholdMinutes: 30 })
      expect(node(state, moduleId.duration, '资料').tables).toEqual([tableId.breeds, tableId.dogDurations])
      const edges = versionOf(workflowOf(state, moduleId.duration)!).edges.map((edge) => `${edge.from}>${edge.to}`)
      for (const edge of ['booking-changed>pet-files', 'pet-files>estimate', 'estimate>set-duration', 'set-duration>suggest-shifts', 'set-duration>record-actual', 'record-actual>deviation', 'deviation>propose-rule', 'review>deviation']) {
        expect(edges, edge).toContain(edge)
      }
      // The breed table is seeded from her rule; the per-dog table has nothing yet; 排班 reads the memory.
      expect(tableOf(state, tableId.breeds)?.name['zh-CN']).toBe('品种大致时长')
      expect(rows(state, tableId.breeds).map((row) => [row.id, row.cells[b.applied], row.cells[b.basis], row.cells[b.observed]])).toEqual([
        ['golden', hours(4), 'seed', null],
        ['alaskan', hours(4), 'seed', null],
        ['bichon', hours(3), 'seed', null],
        ['collie', hours(3), 'seed', null],
        ['corgi', hours(2), 'seed', null],
        ['frenchie', hours(2), 'seed', null],
      ])
      expect(tableOf(state, tableId.dogDurations)).toMatchObject({ name: { 'zh-CN': '每只狗的实际耗时' }, rows: [] })
      expect(tableOf(state, tableId.breeds)?.readers).toContain(moduleId.shifts)
      expect(open(state, 'kele')).toMatchObject({ [a.estimate]: hours(4), [a.basis]: basis.breed })
    },
  ],
  [
    'B-22 (s2)',
    '预计 vs 实际 per appointment with markers; 豆豆 3 h 20 · 大福 4 h 10 · 雪球 2 h 10 · Max 3 h 05 (麦芽 3 h 40 · 奶茶 3 h 50 · Lucky 3 h 45); 金毛 实测 约 3 h 45（5 只，3 h 20 – 4 h 10）with 适用 still 4 h（你的经验）, 比熊 约 2 h 10, 边牧 约 3 h 05; unseen breeds 尚无数据; bookings still on the breed rows; 更新记录 lists the two weeks’ runs',
    () => {
      const state = at('s2')
      expect(state.storyTime).toBe('2026-11-21T10:00')
      const averages = Object.fromEntries(rows(state, tableId.dogDurations).map((row) => [row.id, row.cells[d.average]]))
      expect(averages).toEqual({ doudou: hours(3, 20), dafu: hours(4, 10), xueqiu: hours(2, 10), max: hours(3, 5), maiya: hours(3, 40), naicha: hours(3, 50), lucky: hours(3, 45), kele: hours(4, 15) })
      expect(breed(state, 'golden')).toMatchObject({ [b.observed]: hours(3, 45), [b.dogs]: 5, [b.min]: hours(3, 20), [b.max]: hours(4, 10), [b.applied]: hours(4), [b.basis]: 'seed' })
      expect(breed(state, 'bichon')).toMatchObject({ [b.observed]: hours(2, 10), [b.applied]: hours(3) })
      expect(breed(state, 'collie')).toMatchObject({ [b.observed]: hours(3, 5), [b.applied]: hours(3) })
      for (const unseen of ['corgi', 'frenchie']) expect(breed(state, unseen)).toMatchObject({ [b.observed]: null, [b.dogs]: 0 })
      // Every finished appointment has its 预计 and 实际; the last run marks the one it added.
      const visits = rows(state, tableId.visits)
      expect(visits).toHaveLength(10)
      for (const visit of visits) expect([visit.cells.estimate, visit.cells.actual], visit.id).toEqual([expect.any(Number), expect.any(Number)])
      expect(latestRun(state, moduleId.duration)?.changes.blocks.records).toEqual({ 'apt-1118-dafu': 'new' })
      expect(memoryChanges(state, tableOf(state, tableId.dogDurations)!)).toEqual({ dafu: 'updated' })
      expect(memoryChanges(state, tableOf(state, tableId.breeds)!)).toEqual({ golden: 'updated' })
      // Still on the breed rows: 豆豆 and 大福 today, for 4 h.
      expect([open(state, 'doudou'), open(state, 'dafu')].map((cells) => [cells[a.estimate], cells[a.basis]])).toEqual([
        [hours(4), basis.breed],
        [hours(4), basis.breed],
      ])
      // 更新记录: a run after each of the ten visits, and the two Monday reviews.
      const runs = runsOf(state, moduleId.duration)
      expect(runs.map((run) => run.trigger)).toEqual(['module', 'module', 'module', 'module', 'module', 'schedule', 'module', 'module', 'module', 'schedule', 'module', 'module'])
      expect(runs.filter((run) => run.trigger === 'schedule').map((run) => run.at)).toEqual(['2026-11-09T18:00', '2026-11-16T18:00'])
      expect(runs[0].at >= '2026-11-05' && runs.at(-1)!.at <= '2026-11-19').toBe(true)
    },
  ],
  [
    'B-23 (s3)',
    '通知 holds one deferred proposal in two parts (金毛的大致时长改为 3 小时 45 分？ · 豆豆 3 小时 20 分，大福 4 小时 10 分？); after accepting both: both memory tables changed with markers, workflow still version 1, 豆豆 3 h 20 and 大福 4 h 10 按它自己的记录, 布丁 3 h 45 按品种表, pet files show the applied duration, 排班 shows the net freed time and an assisted proposal to open a slot',
    () => {
      const pending = at('s3')
      expect(awaitingCount(pending)).toBe(1)
      const [proposal] = openProposals(pending)
      expect(proposal).toMatchObject({ id: proposalId.review, mode: 'deferred', moduleId: moduleId.duration })
      expect(proposal.parts.map((part) => part.text['zh-CN'])).toEqual([
        '金毛的大致时长改为 3 小时 45 分（5 只的平均）？',
        '来过两次以上的狗按自己的记录排：豆豆 3 小时 20 分，大福 4 小时 10 分？',
      ])
      expect([record(pending, 'doudou')[d.visits], record(pending, 'dafu')[d.visits]]).toEqual([3, 3])
      // 布丁: a new Golden who has never been here.
      expect(rowOf(tableOf(pending, tableId.dogs), 'buding')?.cells).toMatchObject({ [column.dogs.name]: { 'zh-CN': '布丁' }, [column.dogs.breed]: 'golden' })
      expect(rowOf(tableOf(at('s2'), tableId.dogs), 'buding')).toBeUndefined()

      const state = at('s3-resolved')
      expect(awaitingCount(state)).toBe(0)
      expect(breed(state, 'golden')).toMatchObject({ [b.applied]: hours(3, 45), [b.basis]: 'average' })
      expect(memoryChanges(state, tableOf(state, tableId.breeds)!)).toEqual({ golden: 'updated' })
      expect(memoryChanges(state, tableOf(state, tableId.dogDurations)!)).toEqual({ doudou: 'updated', dafu: 'updated' })
      expect(workflowOf(state, moduleId.duration)?.current).toBe(1)
      expect(labels(state, moduleId.duration)).toEqual(labels(at('s1'), moduleId.duration))
      expect(open(state, 'doudou')).toMatchObject({ [a.estimate]: hours(3, 20), [a.basis]: basis.own })
      expect(open(state, 'dafu')).toMatchObject({ [a.estimate]: hours(4, 10), [a.basis]: basis.own })
      expect(open(state, 'buding')).toMatchObject({ [a.estimate]: hours(3, 45), [a.basis]: basis.breed })
      // The pet files: the record each file shows carries the applied duration.
      expect([record(state, 'doudou')[d.applied], record(state, 'dafu')[d.applied]]).toEqual([hours(3, 20), hours(4, 10)])
      // 排班: 净空出时间 is what the moved bookings were booked for minus what they are booked for now — 45 minutes.
      const freed = rows(state, tableId.appointments)
        .filter((row) => row.cells[a.status] === appointmentStatus.booked && row.cells[a.previous] !== null)
        .map((row) => [row.cells[a.dog], Number(row.cells[a.previous]) - Number(row.cells[a.estimate])])
      expect(freed).toEqual([
        ['buding', 15],
        ['doudou', 40],
        ['dafu', -10],
      ])
      const [suggestion] = openProposals(state, moduleId.shifts)
      expect(suggestion).toMatchObject({ mode: 'assisted', nodeId: nodeId.suggestShifts, parts: [{ id: 'open-slot', state: 'pending' }] })
      expect(suggestion.title['zh-CN']).toContain('净空出')
      expect(suggestion.title.en).toContain('45')
      expect(openProposals(pending, moduleId.shifts)).toEqual([])
    },
  ],
  [
    'B-24 (s4)',
    'a deferred proposal to add the condition 第一次来的狗 +30 分钟, with the new node and its edges; 批准 makes version 2 current; 历史 shows versions 1 and 2 with reasons; 更新记录 names the version per run; a first-visit dog’s appointment has its +30 分钟 and the node that decides it',
    () => {
      const pending = at('s4')
      expect(awaitingCount(pending)).toBe(1)
      const [proposal] = openProposals(pending).filter((each) => each.mode === 'deferred')
      expect(proposal).toMatchObject({ id: proposalId.firstVisit, moduleId: moduleId.duration, onAccept: { action: 'approveWorkflowChange' } })
      expect(proposal.parts[0].text['zh-CN']).toContain('第一次来的狗 +30 分钟')
      const draft = workflowOf(pending, moduleId.duration)!.proposed!
      expect(draft.nodes.at(-1)).toMatchObject({ id: nodeId.firstVisit, kind: 'condition', label: { 'zh-CN': '第一次来的狗 +30 分钟' }, params: { [firstVisitParam]: 30 } })
      // What the review saw: 布丁 and 年糕 each took 30 minutes longer the first time.
      for (const dog of ['buding', 'niangao']) {
        const [first, second] = rows(pending, tableId.visits).filter((visit) => visit.cells[column.visits.dog] === dog).map((visit) => Number(visit.cells.actual))
        expect(first - second, dog).toBe(30)
      }
      // 元宝 has never been here: booked by the breed table, no extra yet.
      expect(open(pending, 'yuanbao')).toMatchObject({ [a.estimate]: hours(3), [a.basis]: basis.breed, [a.extra]: null })

      const state = at('s4-resolved')
      const workflow = workflowOf(state, moduleId.duration)!
      expect(workflow.current).toBe(2)
      expect(workflow.versions.map((version) => [version.n, version.reason['zh-CN']])).toEqual([
        [1, '由对话「按品种和毛长估时间」创建'],
        [2, '复盘发现第一次来的狗平均多用 30 分钟，和品种无关，所以新增条件「第一次来的狗 +30 分钟」'],
      ])
      for (const version of workflow.versions) expect(version.reason.en.length).toBeGreaterThan(20)
      // Every run names its version; the first run after the approval names version 2 (`s5`).
      for (const run of state.runs) expect(run.version, run.id).toEqual(expect.any(Number))
      expect(latestRun(at('s5'), moduleId.duration)).toMatchObject({ version: 2, at: '2027-01-05T12:10' })
      expect(open(state, 'yuanbao')).toMatchObject({ [a.estimate]: hours(3, 30), [a.basis]: basis.breed, [a.extra]: 30, [a.previous]: hours(3) })
      // A dog that has been here is not touched.
      expect(open(state, 'doudou')).toMatchObject({ [a.estimate]: hours(3, 20), [a.extra]: null })
    },
  ],
  [
    'B-25 (s5)',
    '话题 lists 服务时长规则; its summary tells the seed rule, the stage-3 memory change and the stage-4 workflow change; the original conversation is a record; a link to the sub-module',
    () => {
      const state = at('s5')
      const topic = state.topics.find((each) => each.title['zh-CN'] === '服务时长规则')!
      expect(topic.id).toBe('duration-rule')
      for (const told of ['长毛大型 4 小时，短毛小型 2 小时，其他 3 小时', '品种表改成了 3 小时 45 分', '豆豆和大福改按自己的记录排', '流程没有变', '第一次来的狗 +30 分钟', '版本 2']) {
        expect(topic.summary?.['zh-CN'], told).toContain(told)
      }
      expect(topic.summary?.en).toContain('version 2')
      expect(topic.summaryAt).toBe(state.storyTime)
      const records = conversationsOf(state, topic.id)
      expect(records).toHaveLength(1)
      expect(records[0].messages[0]).toMatchObject({ author: 'user', at: '2026-11-05T10:00' })
      expect(records[0].messages[0].text['zh-CN']).toContain('以后帮我按狗的品种和毛长估时间')
      expect(records[0].subModuleId).toBe(moduleId.duration)
      expect(topic.moduleIds).toContain(moduleId.duration)
    },
  ],
  [
    'B-26 (e1, e2)',
    '明天有哪些预约？帮我给顾客发确认。 answers in place with tomorrow’s list; the switch creates …sub.confirmations with trigger 每天 19:00, 发确认 (自主), 无回复则提醒我 (待确认); in `e2` its home is rewritten with markers and two no-reply items sit in 通知',
    () => {
      const script = chatScripts.find((each) => each.id === scriptId.confirmations)!
      expect(script).toMatchObject({ scenes: ['e1'], surface: 'in-place', template: 'confirmations', prompt: { 'zh-CN': '明天有哪些预约？帮我给顾客发确认。' } })
      const list = script.attachments!(at('e1'))[0]
      expect(list.kind === 'table' && list.rows.map((row) => row.cells[a.dog])).toEqual(['xueqiu', 'max', 'tudou', 'panghu'])

      const state = at('e2')
      expect(findModule(state, moduleId.confirmations)).toMatchObject({ kind: 'sub', parentId: moduleId.appointments })
      const trigger = versionOf(workflowOf(state, moduleId.confirmations)!).nodes.find((each) => each.kind === 'trigger')!
      expect(trigger).toMatchObject({ trigger: 'schedule', params: { time: '19:00' } })
      expect([node(state, moduleId.confirmations, '发确认').mode, node(state, moduleId.confirmations, '无回复则提醒我').mode]).toEqual(['autonomous', 'deferred'])
      // Rewritten with markers: last night's run reports the three customers it wrote to.
      expect(latestRun(state, moduleId.confirmations)).toMatchObject({ at: '2026-11-03T19:00', changes: { blocks: { customers: { 'confirm-apt-1104-maiya': 'new', 'confirm-apt-1104-naicha': 'new', 'confirm-apt-1104-lucky': 'new' } } } })
      expect(rows(state, tableId.confirmations).map((row) => row.cells.status)).toEqual(['replied', 'no-reply', 'no-reply'])
      expect(awaitingCount(state)).toBe(2)
    },
  ],
]

describe('story facts (R-04)', () => {
  it.each(facts)('%s — %s', (_source, _fact, check) => check())

  it('names every screen of the Screens table and every criterion B-20…B-26', () => {
    const sources = facts.map(([source]) => source).join(' ')
    for (const screen of ['onboarding.profession', 'onboarding.modules', 'onboarding.accounts', 'notifications', 'messages', 'calendar', 'todo', 'mail', 'files', 'topics', 'topics.<topic>']) expect(sources, screen).toContain(screen)
    for (const screen of ['profession.appointments', 'profession.clients', 'profession.inventory', 'profession.shifts', 'sub.duration', 'sub.confirmations', 'memory view']) expect(sources, screen).toContain(screen)
    for (const screen of ['settings', 'settings.accounts', 'settings.ai-modes', 'settings.profession']) expect(sources, screen).toContain(screen)
    for (const criterion of ['B-20', 'B-21', 'B-22', 'B-23', 'B-24', 'B-25', 'B-26']) expect(sources, criterion).toContain(criterion)
  })
})

describe('every fixture string exists in both locales (R-04)', () => {
  const whole = (value: unknown, where: string) => {
    const texts = textsIn(value)
    for (const { path, text } of texts) for (const locale of locales) expect(text[locale].trim(), `${where}${path} ${locale}`).not.toBe('')
    return texts.length
  }

  it.each(sceneRefs)('%s: the scene, its long variant and its empty variant', (ref) => {
    const state = at(ref)
    expect(whole(state, ref)).toBeGreaterThan(100)
    expect(whole(longVariant(state), `${ref} long`)).toBeGreaterThan(1000)
    expect(whole(emptyVariant(state), `${ref} empty`)).toBeGreaterThan(20)
  })

  it('the scripts, the interview and the vocabularies', () => {
    expect(whole(chatScripts, 'scripts')).toBeGreaterThan(10)
    for (const script of chatScripts) {
      for (const ref of sceneRefs) {
        whole(script.attachments?.(at(ref)), `${script.id} attachments`)
        whole(script.proposal?.(at(ref), { moduleId: moduleId.duration, view: 'workflow' }), `${script.id} proposal`)
      }
    }
    expect(whole(interview, 'interview')).toBe(9)
    expect(whole(longInterview(), 'long interview')).toBe(longSizes.interviewMessages)
    expect(whole(vocabulary, 'vocabulary')).toBeGreaterThan(40)
  })

  it('zh-CN story text is not English and en story text is not Chinese', () => {
    const han = /[一-鿿]/
    for (const ref of sceneRefs) {
      for (const { path, text } of textsIn(at(ref))) {
        expect(han.test(text.en), `${ref}${path}: ${text.en}`).toBe(false)
        // A name may be Latin in both (Max, Lucky, Google); a sentence may not.
        if (text['zh-CN'].length > 12) expect(han.test(text['zh-CN']), `${ref}${path}: ${text['zh-CN']}`).toBe(true)
      }
    }
  })
})

describe('the `long` and `empty` variants exist for every resource (R-04)', () => {
  /** A reference of each kind that the scene can answer; `null` when the scene has nothing of that kind yet. */
  function refOf(kind: (typeof resourceKinds)[number], state: Snapshot): ResourceRef | null {
    switch (kind) {
      case 'module':
      case 'workflow':
      case 'runs':
        return { kind, moduleId: moduleId.appointments }
      case 'memory':
        return { kind, moduleId: moduleId.clients }
      case 'conversation':
        return state.conversations[0] ? { kind, id: state.conversations[0].id } : null
      case 'topic':
        return state.topics[0] ? { kind, id: state.topics[0].id } : null
      default:
        return { kind }
    }
  }

  const read = async (ref: string, preview: 'long' | 'empty', resource: ResourceRef) =>
    createRuntime({ delay: 0, storage: null, search: `?scene=${ref}&preview=${preview}` }).read(resource)

  it.each(sceneRefs)('%s: every resource answers `long` and `empty` with data', async (ref) => {
    const state = at(ref)
    for (const kind of resourceKinds) {
      const resource = refOf(kind, state)
      if (!resource) {
        // Only the first evening has no conversation and no topic to open.
        expect(ref, kind).toBe('e1')
        continue
      }
      for (const preview of ['long', 'empty'] as const) {
        const answer = await read(ref, preview, resource)
        expect(answer.state, `${ref} ${kind} ${preview}`).toBe(preview)
        expect('data' in answer && answer.data, `${ref} ${kind} ${preview}`).toBeDefined()
      }
    }
  })

  it.each(sceneRefs)('%s long: the sizes part 3’s Screens table names', (ref) => {
    const state = at(ref)
    const long = longVariant(state)
    const size = (table: string) => rows(long, table).length

    // onboarding.modules, settings.profession: 12 modules, long names.
    expect(long.modules.filter((module) => module.kind === 'profession')).toHaveLength(longSizes.professionModules)
    // notifications: 30 items; a five-part proposal.
    expect(size(tableId.notices)).toBe(30)
    expect(Math.max(...long.proposals.map((proposal) => proposal.parts.length))).toBe(5)
    // messages: a 200-character message.
    for (const locale of locales) expect((rows(long, tableId.messages)[0].cells.text as Record<string, string>)[locale]).toHaveLength(200)
    // profession.appointments: 14 bookings a day; calendar: six of them overlap.
    const day = today(long)
    expect(day).toHaveLength(14)
    const overlapping = day.filter((row) => String(row.cells[a.start]) <= `${datePart(long.storyTime)}T11:30` && addMinutes(String(row.cells[a.start]), Number(row.cells[a.estimate])) > `${datePart(long.storyTime)}T11:30`)
    expect(overlapping.length).toBeGreaterThanOrEqual(longSizes.overlappingBookings)
    expect(size(tableId.appointments)).toBeGreaterThanOrEqual(longSizes.rows)
    // profession.clients: long dog and owner names, a 300-character note, 30 visits in one file.
    const dog = rows(long, tableId.dogs)[0]
    for (const locale of locales) {
      expect((dog.cells[column.dogs.note] as Record<string, string>)[locale]).toHaveLength(300)
      expect((dog.cells[column.dogs.name] as Record<string, string>)[locale].length).toBeGreaterThan(40)
      expect((dog.cells[column.dogs.owner] as Record<string, string>)[locale].length).toBeGreaterThan(40)
    }
    expect(rows(long, tableId.visits).filter((visit) => visit.cells[column.visits.dog] === dog.id)).toHaveLength(30)
    // profession.inventory: 30 rows. 预约确认: 20 customers. 服务时长: 30 rows. The memory view: 40 rows.
    expect(size(tableId.products)).toBe(30)
    if (tableOf(state, tableId.confirmations)) expect(size(tableId.confirmations)).toBe(20)
    expect(size(tableId.visits)).toBeGreaterThanOrEqual(30)
    expect(size(tableId.dogs)).toBe(40)
    if (rows(state, tableId.dogDurations).length > 0) expect([size(tableId.breeds), size(tableId.dogDurations)]).toEqual([40, 40])
    // topics: 40 topics; topics.<topic>: 20 conversations and a 60-message record; a 2000-character message.
    expect(long.topics).toHaveLength(40)
    for (const topic of long.topics) expect(conversationsOf(long, topic.id).length, topic.id).toBeGreaterThanOrEqual(1)
    const talked = (state.topics.length > 0 ? state.topics : long.topics.slice(0, 1)).map((topic) => topic.id)
    for (const id of talked) expect(conversationsOf(long, id), id).toHaveLength(20)
    for (const conversation of long.conversations) expect(conversation.messages.length, conversation.id).toBe(60)
    expect(long.conversations[0].messages.at(-1)?.text.en).toHaveLength(2000)
    expect(new Set(long.conversations.map((conversation) => conversation.id)).size).toBe(long.conversations.length)
    // The workflow editor: a 25-node workflow. 更新记录: 30 runs.
    for (const workflow of long.workflows) expect(versionOf(workflow).nodes.length, workflow.id).toBeGreaterThanOrEqual(25)
    expect(runsOf(long, moduleId.appointments)).toHaveLength(30)
    // settings.accounts: a connector feeding eight modules. settings.ai-modes: a row capping 12 actions.
    expect(Math.max(...long.accounts.map((account) => account.feeds.length))).toBe(8)
    expect(actionsOfKind(long, cappedTaskKind)).toHaveLength(longSizes.cappedActions)
    // Ids stay unique in every table.
    for (const table of long.memory) expect(new Set(table.rows.map((row) => row.id)).size, table.id).toBe(table.rows.length)
  })

  it.each(sceneRefs)('%s empty: nothing but the modules and their placeholder workflows', (ref) => {
    const empty = emptyVariant(at(ref))
    for (const table of empty.memory) expect(table.rows, table.id).toEqual([])
    expect([empty.runs, empty.proposals, empty.conversations, empty.topics]).toEqual([[], [], [], []])
    expect(empty.modules.map((module) => module.id)).toEqual(at(ref).modules.map((module) => module.id))
    for (const workflow of empty.workflows) expect(versionOf(workflow).nodes.map((each) => each.label['zh-CN']), workflow.id).toEqual(['手动开始', '来源：未连接', '内容'])
    for (const kind of taskKinds) expect(actionsOfKind(empty, kind), kind).toEqual([])
  })
})
