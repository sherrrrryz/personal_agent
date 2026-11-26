import type { Snapshot } from '@/runtime/model'
import { resolveProposalPart } from '@/runtime/reduce'
import { rowOf, tableOf, versionOf, workflowOf } from '@/runtime/selectors'
import { tx } from '@/runtime/text'

import { column, moduleId, nodeId, proposalId, tableId } from './keys'
import { firstVisitDraft, firstVisitProposal, moreDogsProposal, promoteProposal, reviewProposal } from './proposals'
import { acceptOpen, book, confirmNextDay, customerWrote, finish, request, review, routine, setAgenda, setNotices, setRota } from './scene-tools'
import { booking, nameOf, newDog } from './world'

// The main story after 服务时长 exists: `s2`…`s5` (IA-MAP § Prototype flows,
// stages 2–5; spec part 2 "Story data" and "When a learned value applies").
// Every visit is timed through the runtime's own `recordActualDuration`, so
// the averages in memory are computed, never typed:
//
//   金毛  豆豆 205·195·200 → 3 h 20   大福 245·255·250 → 4 h 10
//         麦芽 3 h 40 · 奶茶 3 h 50 · Lucky 3 h 45      → 品种 3 h 45（5 只）
//   比熊  雪球 2 h 10     边牧 Max 3 h 05     阿拉斯加 可乐 4 h 15
//   柯基、法斗: never timed — their rows stay 尚无数据.
//
// Until the third Monday review nobody but 豆豆 and 大福 comes twice, so its
// proposal (`s3`) names exactly those two.

const duration = moduleId.duration
const agenda = { supplier: tx('供应商来访', 'Supplier visit'), stocktake: tx('月度盘点', 'Monthly stocktake') }
const shampoo = tx('低敏香波只剩 2 瓶，低于安全库存。', 'Hypoallergenic shampoo is down to 2 bottles, below the safety level.')

/** The end of a scene: last night's confirmations, this week's rota and calendar, the runs that happened by themselves. */
function settle(draft: Snapshot, unanswered: string[] = []): void {
  confirmNextDay(draft, unanswered)
  setRota(draft)
  setAgenda(draft, agenda)
  routine(draft)
}

/** `s2` 第 1–2 周 — Saturday of the second week: ten timed visits, two reviews, nothing applied yet. */
export function learning(draft: Snapshot): void {
  finish(draft, 'apt-1105-doudou', 205)
  finish(draft, 'apt-1105-kele', 255)
  // 大福 does not cooperate; the groomer writes it into the file before the time is recorded.
  const dafu = rowOf(tableOf(draft, tableId.dogs), 'dafu')
  if (dafu) dafu.cells[column.dogs.note] = tx('不太配合：吹风和剪指甲要两个人，时间会比别的金毛长。', 'Not cooperative: drying and nail clipping take two people, so it takes longer than other Goldens.')
  finish(draft, 'apt-1106-dafu', 245)
  finish(draft, 'apt-1107-xueqiu', 130)
  finish(draft, 'apt-1107-max', 185)
  review(draft, '2026-11-09')

  book(
    draft,
    booking('maiya', '2026-11-10', '10:00', 'chen'),
    booking('naicha', '2026-11-11', '10:00', 'jie'),
    booking('lucky', '2026-11-13', '10:00', 'lan'),
    booking('doudou', '2026-11-17', '10:00', 'lan'),
    booking('dafu', '2026-11-18', '10:00', 'jie'),
  )
  finish(draft, 'apt-1110-maiya', 220)
  finish(draft, 'apt-1111-naicha', 230)
  finish(draft, 'apt-1113-lucky', 225)
  review(draft, '2026-11-16')
  finish(draft, 'apt-1117-doudou', 195)
  finish(draft, 'apt-1118-dafu', 255)

  draft.storyTime = '2026-11-21T10:00'
  book(
    draft,
    booking('doudou', '2026-11-21', '10:00', 'lan'),
    booking('dafu', '2026-11-21', '14:00', 'jie'),
    booking('xueqiu', '2026-11-24', '10:00', 'lan'),
    booking('max', '2026-11-25', '13:00', 'chen'),
  )
  request(draft, 'panghu')
  customerWrote(draft, 'msg-lin', 'doudou', tx('豆豆十点到，这次麻烦把脚底毛修短一点。', 'Doudou will be there at ten; please trim the paw fur a bit shorter this time.'), moduleId.appointments, '2026-11-21T08:40')
  setNotices(draft, [
    [
      'notice-learning',
      tx('「服务时长」两周记录了 10 次到店：金毛实测平均 3 小时 45 分，预约仍按你的 4 小时排。', 'Service duration timed 10 visits in two weeks: Golden Retrievers average 3 h 45 min; bookings still use your 4 hours.'),
      duration,
    ],
    ['notice-shampoo', shampoo, moduleId.inventory, '2026-11-20T21:00'],
  ])
  settle(draft)
}

/** `s3` 第 3 周, pending — Monday evening: the review has put one item with two parts into 通知. */
export function firstChange(draft: Snapshot): void {
  finish(draft, 'apt-1121-doudou', 200)
  finish(draft, 'apt-1121-dafu', 250)
  // A new Golden: 布丁 has never been here.
  tableOf(draft, tableId.dogs)?.rows.push(newDog('buding'))
  book(draft, booking('buding', '2026-11-26', '10:00', 'chen'), booking('doudou', '2026-11-28', '10:00', 'lan'), booking('dafu', '2026-11-28', '14:00', 'jie'))

  draft.storyTime = '2026-11-23T18:00'
  draft.proposals.push({ ...reviewProposal(duration, draft.storyTime), at: draft.storyTime })
  review(draft, '2026-11-23')

  draft.storyTime = '2026-11-23T19:05'
  request(draft, 'tudou')
  customerWrote(draft, 'msg-shen', 'buding', tx('朋友介绍来的，布丁周四第一次去你们店，要准备什么吗？', 'A friend recommended you. Buding comes for the first time on Thursday — anything we should prepare?'), moduleId.clients, '2026-11-23T16:20')
  setNotices(draft, [
    ['notice-review', tx('每周复盘：金毛的时长有两条修改建议，等你确认。', 'Weekly review: two suggested changes to the Golden Retriever times wait for you.'), duration, '2026-11-23T18:00'],
    ['notice-buding', tx('新顾客：布丁（金毛）周四 10:00 第一次到店。', 'New customer: Buding (Golden Retriever) comes for the first time on Thursday at 10:00.'), moduleId.clients, '2026-11-23T16:25'],
    ['notice-shampoo', shampoo, moduleId.inventory, '2026-11-22T21:00'],
  ])
  settle(draft, ['xueqiu'])
}

/** `s3` resolved — she accepts both parts: memory changes at both tiers, the workflow does not. */
export function acceptReview(draft: Snapshot): void {
  for (const part of ['breed', 'dogs']) resolveProposalPart(draft, { proposalId: proposalId.review, partId: part, resolution: 'accepted' })
}

/** `s4` 第 2 个月, pending — the first Monday of January: the review proposes to change the workflow itself. */
export function workflowChanges(draft: Snapshot): void {
  // She took the slot 排班 offered, and the weeks went by.
  acceptOpen(draft)
  finish(draft, 'apt-1124-xueqiu', 130)
  finish(draft, 'apt-1125-max', 185)
  finish(draft, 'apt-1126-buding', 255)
  finish(draft, 'apt-1128-doudou', 200)
  finish(draft, 'apt-1128-dafu', 250)
  review(draft, '2026-11-30')

  tableOf(draft, tableId.dogs)?.rows.push(newDog('niangao'))
  book(draft, booking('niangao', '2026-12-03', '10:00', 'lan'), booking('buding', '2026-12-17', '10:00', 'chen'), booking('niangao', '2026-12-22', '10:00', 'lan'))
  finish(draft, 'apt-1203-niangao', 165)
  for (const monday of ['2026-12-07', '2026-12-14']) review(draft, monday)
  finish(draft, 'apt-1217-buding', 225)
  review(draft, '2026-12-21')
  finish(draft, 'apt-1222-niangao', 135)

  // The last review of December: four more dogs have come twice. She accepts that evening.
  draft.storyTime = '2026-12-28T18:00'
  const records = tableOf(draft, tableId.dogDurations)
  const twice = ['xueqiu', 'max', 'buding', 'niangao'].map((dog) => ({ dog, name: nameOf(dog), minutes: Number(rowOf(records, dog)?.cells[column.dogDurations.average]) }))
  draft.proposals.push({ ...moreDogsProposal(duration, twice), at: draft.storyTime })
  review(draft, '2026-12-28')
  draft.storyTime = '2026-12-28T18:40'
  acceptOpen(draft, (proposal) => proposal.id === proposalId.moreDogs)

  tableOf(draft, tableId.dogs)?.rows.push(newDog('yuanbao'))
  book(
    draft,
    booking('max', '2027-01-04', '10:00', 'chen'),
    booking('xueqiu', '2027-01-05', '10:00', 'lan'),
    booking('doudou', '2027-01-06', '10:00', 'lan'),
    booking('yuanbao', '2027-01-07', '10:00', 'chen'),
    booking('dafu', '2027-01-08', '14:00', 'jie'),
  )
  finish(draft, 'apt-0104-max', 185)

  // Monday's review: a first visit runs long whatever the breed — that takes a rule, not a record.
  draft.storyTime = '2027-01-04T18:00'
  const workflow = workflowOf(draft, duration)
  if (workflow) {
    workflow.proposed = firstVisitDraft(versionOf(workflow))
    draft.proposals.push({ ...firstVisitProposal(duration, workflow.id), at: draft.storyTime })
  }
  draft.proposals.push({ ...promoteProposal(duration), at: draft.storyTime })
  review(draft, '2027-01-04')

  draft.storyTime = '2027-01-04T18:05'
  request(draft, 'naicha')
  customerWrote(draft, 'msg-cao', 'yuanbao', tx('元宝周四第一次去，它有点怕生，可以先让它熟悉一下环境吗？', 'Yuanbao comes for the first time on Thursday. It is shy with strangers — could it get used to the place first?'), moduleId.clients, '2027-01-04T15:10')
  setNotices(draft, [
    ['notice-first-visit', tx('每周复盘：建议给「服务时长」的工作流新增一个条件，等你确认。', 'Weekly review: a new condition is suggested for the Service duration workflow and waits for you.'), duration, '2027-01-04T18:00'],
    ['notice-yuanbao', tx('新顾客：元宝（边牧）周四 10:00 第一次到店。', 'New customer: Yuanbao (Border Collie) comes for the first time on Thursday at 10:00.'), moduleId.clients, '2027-01-04T15:15'],
    ['notice-shampoo', shampoo, moduleId.inventory, '2027-01-03T21:00'],
  ])
  settle(draft)
}

/** `s4` resolved — she approves: version 2, and a first visit now gets its 30 minutes. */
export function approveFirstVisit(draft: Snapshot): void {
  resolveProposalPart(draft, { proposalId: proposalId.firstVisit, partId: 'add', resolution: 'accepted' })
}

/** `s5` 回看 — two days later she opens 话题: the AI has rewritten the summary of two months. */
export function lookingBack(draft: Snapshot): void {
  // The longer first visit costs 排班 half an hour; she agreed to the extension.
  acceptOpen(draft, (proposal) => proposal.nodeId === nodeId.suggestShifts)
  finish(draft, 'apt-0105-xueqiu', 130)
  draft.storyTime = '2027-01-06T10:00'
  book(draft, booking('buding', '2027-01-09', '10:00', 'chen'))

  const topic = draft.topics.find((each) => each.id === 'duration-rule')
  if (topic) {
    topic.summary = tx(
      '11 月初，你给了一条估时规则：长毛大型 4 小时，短毛小型 2 小时，其他 3 小时。它成为长期模块「服务时长」，并开始记录每只狗的实际耗时。第 3 周，复盘发现金毛实测平均是 3 小时 45 分：品种表改成了 3 小时 45 分，豆豆和大福改按自己的记录排（3 小时 20 分、4 小时 10 分）——改的是记忆，工作流没有变。第 2 个月，复盘发现第一次来的狗要多用约 30 分钟，工作流新增了条件「第一次来的狗 +30 分钟」，成为版本 2。',
      'In early November you gave a rule for estimating time: long-haired large dogs 4 hours, short-haired small dogs 2 hours, others 3 hours. It became the standing module “Service duration”, which began timing every dog. In week 3 the review found that Golden Retrievers average 3 h 45 min: the breed table changed to 3 h 45 min, and Doudou and Dafu moved to their own records (3 h 20 min and 4 h 10 min) — memory changed, the workflow did not. In month 2 the review found that a first visit takes about 30 minutes longer, and the workflow gained the condition “First visit: +30 minutes”, becoming version 2.',
    )
    topic.summaryAt = draft.storyTime
  }
  setNotices(draft, [
    ['notice-yuanbao-first', tx('元宝明天第一次到店：已按 3 小时 30 分安排，其中 30 分钟是第一次来的加时。', 'Yuanbao comes for the first time tomorrow: booked for 3 h 30 min, 30 minutes of it the first-visit extra.'), moduleId.appointments],
    ['notice-version-2', tx('「服务时长」现在按版本 2 运行：第一次来的狗多排 30 分钟。', 'Service duration now runs on version 2: a first visit is booked 30 minutes longer.'), duration, '2027-01-05T12:10'],
    ['notice-shampoo', shampoo, moduleId.inventory, '2027-01-05T21:00'],
  ])
  settle(draft)
}
