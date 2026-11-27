import type { SceneHalf, SceneId, Snapshot } from '@/runtime/model'
import { createSubModule, finishRun, replayScript, resolveProposalPart, startRun, updateMemory } from '@/runtime/reduce'
import { findModule, tableOf } from '@/runtime/selectors'
import { tx, type Text } from '@/runtime/text'
import { addDays, datePart, nextAt } from '@/runtime/time'

import { row } from './build'
import { column, moduleId, tableId } from './keys'
import { closeBookingsBefore, customersWrote, ranAt, request, setAgenda, setDesk, setNotices, talkedAbout } from './scene-tools'
import { scriptId } from './scripts'
import { acceptReview, approveFirstVisit, earCleaner, firstChange, learning, lookingBack, shampoo, workflowChanges } from './story'
import { booking, ownerOf, syncNextDue, world } from './world'

// The scenes of the story (spec part 2 § Fake workflow runtime, "Scenes").
// Each is built from the one before by the runtime's own reducers plus what
// time brought, so a scene's key action, done live, lands on the next scene's
// state: accepting the proposal in `s0` yields `s1`.
//
// The warm-up and the first two stages are below; `s2`…`s5` are in `story.ts`.
// A step is `(draft: Snapshot) => void`: it mutates the previous scene's
// snapshot — reducers for what she did, the helpers of `scene-tools.ts` for
// what time brought — and sets `draft.storyTime`. `s3` and `s4` have a second
// step in `resolved`: her key action, and nothing else, so that doing it live
// on the pending half gives the resolved one.

/** What the 时间推进 menu calls each scene. */
export const sceneNames: Record<SceneId, Text> = {
  e1: tx('第一晚', 'First evening'),
  e2: tx('第二晚', 'Second evening'),
  s0: tx('今天', 'Today'),
  s1: tx('变成流程', 'It becomes a process'),
  s2: tx('第 1–2 周', 'Weeks 1–2'),
  s3: tx('第 3 周', 'Week 3'),
  s4: tx('第 2 个月', 'Month 2'),
  s5: tx('回看', 'Looking back'),
}

export const sceneGroupNames = { warmup: tx('热身', 'Warm-up'), main: tx('主线', 'Main story') }

const a = column.appointments

/** `e2` 第二晚 — she made the confirmations persistent; tonight it ran for the first time. */
function secondEvening(draft: Snapshot): void {
  const conversation = replayScript(draft, scriptId.confirmations, { moduleId: moduleId.appointments, view: 'page' })
  // She turned the switch on that conversation: 设为长期.
  createSubModule(draft, { parentId: moduleId.appointments, conversationId: conversation })

  draft.storyTime = '2026-11-03T19:05'
  const today = datePart(draft.storyTime)
  const tomorrow = addDays(today, 1)
  closeBookingsBefore(draft, tomorrow)
  // 麦芽's request has been placed.
  request(draft, null)
  const bookings = [booking('maiya', tomorrow, '10:00', 'chen'), booking('naicha', tomorrow, '13:30', 'jie'), booking('lucky', tomorrow, '15:30', 'lan')]
  tableOf(draft, tableId.appointments)?.rows.push(...bookings)

  const sentAt = `${today}T19:00`
  const statuses = ['replied', 'no-reply', 'no-reply']
  updateMemory(
    draft,
    bookings.map((each, index) => ({
      tableId: tableId.confirmations,
      rowId: `confirm-${each.id}`,
      insert: true,
      cells: { customer: ownerOf(String(each.cells[a.dog])), dog: each.cells[a.dog], appointment: each.id, status: statuses[index], sentAt },
    })),
  )
  draft.pendingChanges[moduleId.confirmations] = {
    blocks: { customers: Object.fromEntries(bookings.map((each) => [`confirm-${each.id}`, 'new' as const])) },
  }
  ranAt(draft, moduleId.confirmations, sentAt)
  const confirmations = findModule(draft, moduleId.confirmations)
  if (confirmations) confirmations.nextRunAt = nextAt(draft.storyTime, '19:00')

  // 无回复则提醒我 is deferred: one item per customer who has not answered.
  for (const each of bookings.slice(1)) {
    const dog = String(each.cells[a.dog])
    const owner = ownerOf(dog)
    const name = tableOf(draft, tableId.dogs)?.rows.find((candidate) => candidate.id === dog)?.cells[column.dogs.name] as Text
    draft.proposals.push({
      id: `proposal-no-reply-${dog}`,
      moduleId: moduleId.confirmations,
      mode: 'deferred',
      title: tx(`${owner['zh-CN']}还没有回复明天的预约确认`, `${owner.en} has not answered tomorrow’s confirmation`),
      parts: [
        {
          id: 'remind',
          text: tx(
            `明早 9 点再提醒${owner['zh-CN']}一次（${name['zh-CN']}，明天 ${String(each.cells[a.start]).slice(11)}）？`,
            `Remind ${owner.en} again at 9 tomorrow morning (${name.en}, tomorrow ${String(each.cells[a.start]).slice(11)})?`,
          ),
          state: 'pending',
        },
      ],
      onAccept: {
        action: 'updateMemory',
        input: { patches: [{ tableId: tableId.confirmations, rowId: `confirm-${each.id}`, cells: { status: 'reminded' } }] },
      },
      at: `${today}T21:00`,
    })
  }
  setNotices(draft, [
    ['notice-confirmations', tx('预约确认已发出 3 条，2 位顾客还没回复。', 'Three confirmations sent; two customers have not answered.'), moduleId.confirmations],
    ['notice-today-done', tx('今天的 4 个预约都已完成：雪球、Max、土豆和胖虎。', 'All four of today’s bookings are done: Xueqiu, Max, Tudou and Panghu.'), moduleId.appointments, `${today}T18:30`],
    ['notice-tudou-skin', tx('给土豆洗澡时发现背上有一小块皮肤发红，已记进档案，建议告诉主人。', 'Bathing Tudou showed a small red patch on its back; it is in the file, and worth telling the owner.'), moduleId.clients, `${today}T15:50`],
    ['notice-mail-quote', tx('宠沐供应链发来香波报价：订 12 瓶以上打九折。', 'Chongmu Supply sent a shampoo quote: 10% off from 12 bottles.'), moduleId.mail, `${today}T10:40`],
    ['notice-swap', tx('阿杰申请和小陈对调周六的班，等你批准。', 'A-Jie asks to swap Saturday’s shift with Xiao Chen and waits for your approval.'), moduleId.shifts, '2026-11-02T16:10'],
    ['notice-shampoo', shampoo, moduleId.inventory, '2026-11-02T21:00'],
    ['notice-ear-cleaner', earCleaner, moduleId.inventory, '2026-11-02T21:00'],
  ])
  customersWrote(draft, [
    ['msg-chen-confirm', 'maiya', tx('收到确认，明天十点见！', 'Got the confirmation — see you at ten tomorrow!'), moduleId.confirmations, `${today}T19:02`],
    ['msg-zheng-skin', 'tudou', tx('谢谢提醒，土豆背上那块我们会带去医院看看。', 'Thanks for telling us — we will take Tudou to the vet about that patch.'), moduleId.clients, `${today}T18:40`],
    ['msg-wang', 'dafu', tx('大福下周想约一次洗剪吹，最好是周五上午。', 'Dafu would like a full groom next week, ideally on Friday morning.'), moduleId.appointments, `${today}T12:30`],
  ])
  setAgenda(draft)
  setDesk(draft)
}

/** `s0` 今天 — Thursday morning; 可乐 is booked for the default two hours. */
function today(draft: Snapshot): void {
  for (const proposal of [...draft.proposals]) {
    for (const part of proposal.parts) resolveProposalPart(draft, { proposalId: proposal.id, partId: part.id, resolution: 'accepted' })
  }
  draft.storyTime = '2026-11-05T10:00'
  const day = datePart(draft.storyTime)
  closeBookingsBefore(draft, day)
  const bookings = [
    booking('doudou', day, '10:00', 'lan'),
    booking('kele', day, '14:00', 'chen'),
    booking('dafu', addDays(day, 1), '10:00', 'jie'),
    booking('xueqiu', addDays(day, 2), '10:00', 'lan'),
    booking('max', addDays(day, 2), '13:00', 'chen'),
  ]
  const appointments = tableOf(draft, tableId.appointments)
  appointments?.rows.push(...bookings)
  request(draft, 'tudou')

  // Last night's run confirmed today's two bookings; both customers answered.
  const confirmations = tableOf(draft, tableId.confirmations)
  const sentAt = `${addDays(day, -1)}T19:00`
  if (confirmations) {
    confirmations.rows = bookings.slice(0, 2).map((each) =>
      row(`confirm-${each.id}`, { customer: ownerOf(String(each.cells[a.dog])), dog: each.cells[a.dog], appointment: each.id, status: 'replied', sentAt }),
    )
    confirmations.updatedAt = sentAt
  }
  ranAt(draft, moduleId.confirmations, sentAt)
  ranAt(draft, moduleId.appointments, `${day}T08:00`)
  for (const id of [moduleId.confirmations, moduleId.appointments]) {
    const module = findModule(draft, id)
    if (module?.nextRunAt) module.nextRunAt = nextAt(draft.storyTime, module.nextRunAt.slice(11))
  }
  setNotices(draft, [
    ['notice-kele', tx('可乐（阿拉斯加）今天 14:00 的预约按默认 2 小时安排。', 'Kele (Alaskan Malamute) is booked today at 14:00 for the default 2 hours.'), moduleId.appointments],
    ['notice-messages', tx('有 2 条顾客消息还没回复。', 'Two customer messages have not been answered yet.'), moduleId.messages, `${day}T09:58`],
    ['notice-tudou-request', tx('郑女士想给土豆约下周的洗剪吹，还没排时间。', 'Ms Zheng wants a full groom for Tudou next week; no time is set yet.'), moduleId.appointments, `${day}T09:20`],
    ['notice-week', tx('本周还有 5 个预约，周六有 2 个：雪球和 Max。', 'Five more bookings this week, two of them on Saturday: Xueqiu and Max.'), moduleId.appointments, `${day}T08:00`],
    ['notice-confirmed', tx('今天的 2 位顾客都已确认到店：林女士（豆豆）和吴先生（可乐）。', 'Both of today’s customers have confirmed: Ms Lin (Doudou) and Mr Wu (Kele).'), moduleId.confirmations, `${addDays(day, -1)}T19:40`],
    ['notice-mail-vet', tx('安心宠物医院的李医生来信：合作协议月底到期，想约时间通个电话。', 'Dr Li at Anxin Pet Clinic wrote: the partnership ends this month, and he would like to arrange a call.'), moduleId.mail, `${addDays(day, -1)}T16:30`],
    ['notice-swap', tx('阿杰申请和小陈对调周六的班，等你批准。', 'A-Jie asks to swap Saturday’s shift with Xiao Chen and waits for your approval.'), moduleId.shifts, '2026-11-02T16:10'],
    ['notice-shampoo', shampoo, moduleId.inventory, `${addDays(day, -1)}T21:00`],
  ])
  customersWrote(draft, [
    ['msg-lin-here', 'doudou', tx('我们到楼下了，豆豆今天特别兴奋。', 'We are downstairs — Doudou is very excited today.'), moduleId.appointments, `${day}T09:56`],
    ['msg-wu-kele', 'kele', tx('下午两点送可乐过去，它最近掉毛很多。', 'Bringing Kele over at two; it has been shedding a lot lately.'), moduleId.clients, `${day}T08:30`],
    ['msg-he-conditioner', 'max', tx('护毛素先帮我留一瓶，周六来的时候拿。', 'Please keep a bottle of conditioner for me; I will pick it up on Saturday.'), moduleId.inventory, `${addDays(day, -1)}T20:15`, false],
  ])
  setAgenda(draft)
  setDesk(draft)
  talkedAbout(draft, 's0')
}

/** `s1` 变成流程 — she accepted: 服务时长 exists and every open booking is on its breed's row. */
function becomesWorkflow(draft: Snapshot): void {
  replayScript(draft, scriptId.hero, { moduleId: moduleId.appointments, view: 'page' })
  const proposal = draft.proposals.at(-1)
  if (proposal) resolveProposalPart(draft, { proposalId: proposal.id, partId: proposal.parts[0].id, resolution: 'accepted' })
  draft.storyTime = '2026-11-05T10:05'
  // 设置预约时长 is autonomous: the bookings have already been rewritten.
  const run = startRun(draft, { moduleId: moduleId.appointments, trigger: 'module' })
  if (run) finishRun(draft, run)
}

type Step = (draft: Snapshot) => void

/** What turns each scene's predecessor into it; `e1` starts from `world()`. */
const steps: Record<SceneId, Step> = {
  e1: () => {},
  e2: secondEvening,
  s0: today,
  s1: becomesWorkflow,
  s2: learning,
  s3: firstChange,
  s4: workflowChanges,
  s5: lookingBack,
}

/** What her key action does in the scenes that have two halves: pending → resolved. */
const resolved: Partial<Record<SceneId, Step>> = {
  s3: acceptReview,
  s4: approveFirstVisit,
}

const order = Object.keys(steps) as SceneId[]
const built = new Map<string, Snapshot>()

function build(id: SceneId, half: SceneHalf): Snapshot {
  const key = `${id}:${half}`
  const cached = built.get(key)
  if (cached) return cached
  let draft: Snapshot
  if (half === 'resolved' && resolved[id]) {
    draft = structuredClone(build(id, 'pending'))
    resolved[id](draft)
    syncNextDue(draft)
  } else {
    const index = order.indexOf(id)
    // A scene follows the resolved half of the one before it.
    draft = index === 0 ? world() : structuredClone(build(order[index - 1], 'resolved'))
    steps[id](draft)
    draft.scene = id
    syncNextDue(draft)
  }
  built.set(key, draft)
  return draft
}

/**
 * The snapshot of a scene — the same on every call, and a copy the caller may
 * change. `half` matters for `s3` and `s4` only.
 */
export function scene(id: SceneId, half: SceneHalf = 'pending'): Snapshot {
  return structuredClone(build(id, half))
}
