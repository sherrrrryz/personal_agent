import type { Conversation, MemoryRow, MemoryTable, Topic } from '@/runtime/model'
import { tx, type Text } from '@/runtime/text'
import { addDays, addMinutes, datePart, mondayOf } from '@/runtime/time'

import { col, row, table } from './build'
import { moduleId, tableId } from './keys'
import { fileKinds, staff } from './vocabulary'

// The shop's everyday life around the main story (D-51): her own week in the
// calendar, her to-dos, her mail, the files she works on, and the side
// conversations she had with the AI. None of it moves the story; it is there
// so that every base feature looks lived-in in every scene. Times are worked
// out from the scene's story time, so each scene shows its own week.

const m = moduleId

// ── 日程: her own week ──────────────────────────────────────────────────────

type AgendaSeed = [id: string, title: Text, weekday: number, start: string, end: string]

/** The same week every week: Monday is 0. */
const weekly: AgendaSeed[] = [
  ['event-meeting', tx('每周例会（小陈、阿杰）', 'Weekly team meeting (Xiao Chen, A-Jie)'), 0, '08:45', '09:15'],
  ['event-vet-call', tx('和安心宠物医院李医生通电话', 'Call with Dr Li at Anxin Pet Clinic'), 1, '14:30', '15:00'],
  ['event-delivery', tx('狗粮和零食到货', 'Dog food and treats delivered'), 2, '11:00', '11:30'],
  ['event-training', tx('线上培训：剪刀手法进阶', 'Online training: advanced scissor work'), 3, '19:30', '21:00'],
  ['event-stocktake', tx('库存盘点', 'Stocktake'), 4, '18:30', '19:30'],
  ['event-cleaning', tx('店面消毒和设备检查', 'Disinfect the shop and check the equipment'), 5, '18:45', '19:30'],
  ['event-bookkeeping', tx('和会计对账', 'Go through the accounts with the bookkeeper'), 6, '15:00', '16:00'],
]

/** Her own events in the week of `now`, and the supplier's visit tomorrow morning. */
export function agendaRows(now: string): MemoryRow[] {
  const monday = mondayOf(now)
  const tomorrow = addDays(datePart(now), 1)
  return [
    ...weekly.map(([id, title, weekday, start, end]) => {
      const day = addDays(monday, weekday)
      return row(id, { title, start: `${day}T${start}`, end: `${day}T${end}` })
    }),
    row('event-supplier', { title: tx('供应商来访', 'Supplier visit'), start: `${tomorrow}T09:00`, end: `${tomorrow}T09:30` }),
  ]
}

// ── 待办 ────────────────────────────────────────────────────────────────────

/** [id, task, the feature it comes from (`null`: her own), due in days from today, done]. */
type TaskSeed = [id: string, title: Text, source: string | null, due: number, done: boolean]

const taskSeeds: TaskSeed[] = [
  ['task-order-shampoo', tx('从宠沐供应链订 12 瓶低敏香波', 'Order 12 bottles of hypoallergenic shampoo from Chongmu Supply'), m.inventory, 0, false],
  ['task-call-sun', tx('给孙先生回电话，说雪球剪指甲的安排', 'Call Mr Sun back about Xueqiu’s nail clipping'), m.clients, 0, false],
  ['task-dryer-filter', tx('清洗烘干机的滤网', 'Clean the dryer’s filter'), null, -1, false],
  ['task-swap', tx('回复这周的换班申请', 'Answer this week’s swap request'), m.shifts, 1, false],
  ['task-price-list', tx('更新价目表：加上冬季护毛套餐', 'Update the price list with the winter coat-care package'), null, 2, false],
  ['task-print-rota', tx('打印下周排班表，贴在后台', 'Print next week’s rota for the back room'), m.shifts, 2, false],
  ['task-rent', tx('交店面房租', 'Pay the shop’s rent'), null, 3, false],
  ['task-vet-agreement', tx('续签安心宠物医院的合作协议', 'Renew the partnership agreement with Anxin Pet Clinic'), null, 6, false],
  ['task-first-visit-notes', tx('给新顾客发到店须知', 'Send new customers the first-visit notes'), m.clients, -1, true],
  ['task-reconcile', tx('核对上周的收款记录', 'Check last week’s payment records'), m.inventory, -2, true],
  ['task-supplies', tx('订剪刀和梳子等美容耗材', 'Order grooming supplies: scissors, combs'), m.inventory, -3, true],
]

export function taskRows(now: string): MemoryRow[] {
  const today = datePart(now)
  return taskSeeds.map(([id, title, source, due, done]) => row(id, { title, source, due: addDays(today, due), done }))
}

// ── 邮件 ────────────────────────────────────────────────────────────────────

/** [id, from, subject, the first lines, received this many hours ago, needs her reply]. */
type EmailSeed = [id: string, from: Text, subject: Text, preview: Text, hoursAgo: number, reply: boolean]

const emailSeeds: EmailSeed[] = [
  [
    'mail-quote',
    tx('宠沐供应链', 'Chongmu Supply'),
    tx('报价单：低敏香波和护毛素', 'Quote: hypoallergenic shampoo and conditioner'),
    tx('附上最新报价，订 12 瓶以上打九折，周五前确认当周就能发货。', 'Our latest prices are attached: 10% off from 12 bottles, and confirming by Friday ships this week.'),
    2,
    true,
  ],
  [
    'mail-vet',
    tx('安心宠物医院 李医生', 'Dr Li, Anxin Pet Clinic'),
    tx('合作协议续签', 'Renewing our partnership'),
    tx('协议月底到期，附件是新版本，转介顾客的优惠不变。这周方便通个电话吗？', 'The agreement ends this month; the new version is attached and the referral discount stays. Could we talk this week?'),
    20,
    true,
  ],
  [
    'mail-reviews',
    tx('点评平台商家助手', 'Review platform merchant desk'),
    tx('本周新增 3 条评价', '3 new reviews this week'),
    tx('其中一条说“剪得很细致”，另一条希望周末能多开放一些预约。', 'One says “a very careful trim”; another would like more weekend slots.'),
    26,
    false,
  ],
  [
    'mail-he',
    tx('何女士', 'Ms He'),
    tx('Max 的照片', 'Photos of Max'),
    tx('谢谢你们！附上 Max 剪完毛的照片，可以发在店里的朋友圈。', 'Thank you! Here are photos of Max after the trim — feel free to post them for the shop.'),
    30,
    true,
  ],
  [
    'mail-training',
    tx('宠物美容师协会', 'Pet Groomers’ Association'),
    tx('冬季培训报名', 'Winter training sign-up'),
    tx('剪刀手法进阶课还剩 6 个名额，报名下周一截止。', 'Six places are left on the advanced scissor course; sign-up closes next Monday.'),
    44,
    true,
  ],
  [
    'mail-leave',
    tx('小陈', 'Xiao Chen'),
    tx('下个月的请假申请', 'Leave request for next month'),
    tx('我想下个月中旬请两天假回老家，具体日期在附件里，看排班能不能调开。', 'I would like two days off in the middle of next month to visit home; the dates are attached — can the rota allow it?'),
    52,
    true,
  ],
  [
    'mail-water',
    tx('物业服务中心', 'Building management office'),
    tx('下周三上午停水两小时', 'Water off for two hours next Wednesday morning'),
    tx('因管道检修，下周三 8:00 到 10:00 停水，请提前做好准备。', 'Because of pipe repairs the water is off next Wednesday from 8:00 to 10:00; please plan ahead.'),
    70,
    false,
  ],
  [
    'mail-statement',
    tx('银行收单服务', 'Bank card payment service'),
    tx('上月收款对账单', 'Last month’s payment statement'),
    tx('上月共收款 312 笔，对账单见附件。', '312 payments last month; the statement is attached.'),
    96,
    false,
  ],
  [
    'mail-insurance',
    tx('保险公司客服', 'Insurance company'),
    tx('店铺财产险续保提醒', 'Shop insurance renewal reminder'),
    tx('你的店铺财产险将在下月到期，续保可沿用今年的保额。', 'Your shop insurance ends next month; you can renew with this year’s cover.'),
    120,
    false,
  ],
]

export function emailRows(now: string): MemoryRow[] {
  return emailSeeds.map(([id, from, subject, preview, hoursAgo, reply]) => row(id, { from, subject, preview, at: addMinutes(now, -hoursAgo * 60), reply }))
}

// ── 文件 ────────────────────────────────────────────────────────────────────

/** [id, name, kind, changed this many hours ago, by, size]. */
type FileSeed = [id: string, name: Text, kind: keyof typeof fileKinds, hoursAgo: number, by: keyof typeof staff, size: string]

const fileSeeds: FileSeed[] = [
  ['file-rota', tx('本月排班表.xlsx', 'Rota this month.xlsx'), 'sheet', 1, 'lan', '38 KB'],
  ['file-quotes', tx('供应商报价对比.xlsx', 'Supplier quotes compared.xlsx'), 'sheet', 18, 'lan', '24 KB'],
  ['file-price-list', tx('价目表（冬季版）.pdf', 'Price list (winter).pdf'), 'pdf', 27, 'lan', '410 KB'],
  ['file-photos', tx('美容前后对比照', 'Before and after photos'), 'images', 33, 'chen', '18 MB'],
  ['file-first-visit', tx('新顾客到店须知.docx', 'First-visit notes for new customers.docx'), 'doc', 50, 'chen', '56 KB'],
  ['file-vet-agreement', tx('宠物医院合作协议（新版）.pdf', 'Pet clinic partnership agreement (new).pdf'), 'pdf', 75, 'lan', '1.2 MB'],
  ['file-anniversary', tx('店庆活动方案草稿.docx', 'Shop anniversary plan (draft).docx'), 'doc', 98, 'lan', '72 KB'],
  ['file-stocktake', tx('库存盘点表.xlsx', 'Stocktake sheet.xlsx'), 'sheet', 140, 'jie', '31 KB'],
  ['file-handbook', tx('员工手册.docx', 'Staff handbook.docx'), 'doc', 480, 'lan', '210 KB'],
  ['file-licence', tx('营业执照扫描件.pdf', 'Business licence scan.pdf'), 'pdf', 1440, 'lan', '2.4 MB'],
]

export function fileRows(now: string): MemoryRow[] {
  return fileSeeds.map(([id, name, kind, hoursAgo, by, size]) => row(id, { name, kind, modified: addMinutes(now, -hoursAgo * 60), by, size }))
}

/** The three tables of 待办 · 邮件 · 文件 as `now` finds them. */
export function deskTables(now: string): MemoryTable[] {
  return [
    table(
      tableId.tasks,
      m.todo,
      tx('待办', 'To-dos'),
      [col('title', 'text', '事项', 'Task'), col('source', 'module', '来自', 'From'), col('due', 'date', '截止', 'Due'), col('done', 'flag', '已完成', 'Done')],
      taskRows(now),
      [m.notifications],
    ),
    table(
      tableId.emails,
      m.mail,
      tx('邮件', 'Mail'),
      [
        col('subject', 'text', '主题', 'Subject'),
        col('from', 'text', '发件人', 'From'),
        col('preview', 'text', '摘要', 'Preview'),
        col('at', 'datetime', '收到', 'Received'),
        col('reply', 'flag', '需回复', 'Needs a reply'),
      ],
      emailRows(now),
      [m.notifications],
    ),
    table(
      tableId.files,
      m.files,
      tx('最近的文件', 'Recent files'),
      [
        col('name', 'text', '名称', 'Name'),
        col('kind', 'code', '类型', 'Kind', { options: fileKinds }),
        col('modified', 'datetime', '修改时间', 'Changed'),
        col('by', 'code', '修改人', 'Changed by', { options: staff }),
        col('size', 'text', '大小', 'Size'),
      ],
      fileRows(now),
      [],
    ),
  ]
}

// ── 话题: the side conversations ────────────────────────────────────────────

type SideTalk = {
  topic: Omit<Topic, 'summaryAt' | 'lastActivityAt'>
  conversation: { id: string; title: Text; startedAt: string }
  /** She speaks first; then the AI and she take turns, a few minutes apart. */
  turns: Text[]
}

/** What she talked about with the AI besides the main story, by the scene it first shows in. */
export const sideTalks: Record<'s0' | 's2' | 's4', SideTalk[]> = {
  s0: [
    {
      topic: {
        id: 'winter-care',
        title: tx('冬季护毛提醒', 'Winter coat-care reminder'),
        summary: tx(
          '你想给老顾客发一条冬季护毛提醒，不要太像广告。AI 写了一条：洗完要吹透、在家每周梳两三次、打结的地方带来店里处理。你决定就用这一条。',
          'You wanted a winter coat-care reminder for regular customers that does not read like an ad. The AI wrote one: dry right through after a bath, brush two or three times a week at home, bring knots in to the shop. You chose to use it as it is.',
        ),
        moduleIds: [m.clients],
      },
      conversation: { id: 'conv-winter-care', title: tx('写一条冬季护毛提醒', 'Writing a winter coat-care reminder'), startedAt: '2026-11-03T21:30' },
      turns: [
        tx('天冷了，帮我写一条发给老顾客的冬季护毛提醒，别太像广告。', 'It is getting cold. Write a winter coat-care reminder for regular customers — not too much like an ad.'),
        tx(
          '可以这样写：“天冷了，狗狗洗完澡一定要吹透，长毛的孩子毛根潮湿容易长湿疹。在家每周梳两三次就好，打结的地方别硬拉，带来店里我们帮你处理。”要不要按长毛和短毛分成两个版本？',
          'Something like: “It is getting cold. After a bath, dry your dog right through — damp roots on a long coat can lead to eczema. Brushing two or three times a week at home is enough; do not tug at knots, bring them in and we will sort them out.” Shall I make one version for long coats and one for short?',
        ),
        tx('不用分，就用这一条。', 'No need — this one will do.'),
        tx('好的，已经存好了，下次给顾客发消息时可以直接用。', 'Done. It is saved, ready for the next time you message your customers.'),
      ],
    },
    {
      topic: {
        id: 'commission',
        title: tx('美容师提成', 'Groomers’ commission'),
        summary: tx(
          '你在考虑给小陈和阿杰定提成。AI 建议按金额而不是按单数算，常见是洗护收入的 15%–20%，按 18% 每人每月约 2,500 元。还没有定下来。',
          'You are thinking about a commission for Xiao Chen and A-Jie. The AI suggested paying on the amount rather than the number of grooms, commonly 15–20% of grooming income; at 18% that is about ¥2,500 each a month. Nothing is decided yet.',
        ),
        moduleIds: [m.shifts],
      },
      conversation: { id: 'conv-commission', title: tx('小陈和阿杰的提成怎么算', 'How to pay Xiao Chen and A-Jie a commission'), startedAt: '2026-11-04T12:40' },
      turns: [
        tx('想给小陈和阿杰定个提成，按做的单数算好，还是按金额算好？', 'I want to give Xiao Chen and A-Jie a commission. Is it better by the number of grooms or by the amount?'),
        tx(
          '按金额更公平：大狗一单的价钱和耗时都差不多是小狗的两倍，按单数算，接大狗的人会吃亏。常见的做法是底薪加洗护收入的 15%–20%。他们现在每人每月大约 80 单，按 18% 算，每人每月提成在 2,500 元上下。',
          'By the amount is fairer: a large dog costs and takes about twice as much as a small one, so counting grooms penalises whoever takes the big dogs. A common approach is base pay plus 15–20% of grooming income. Each of them does about 80 grooms a month; at 18% that comes to about ¥2,500 each a month.',
        ),
      ],
    },
    {
      topic: {
        id: 'shampoo-supplier',
        title: tx('低敏香波换供应商', 'Changing the shampoo supplier'),
        summary: tx(
          '低敏香波经常缺货。比较后，宠沐供应链每瓶便宜 6 元、两天到货，你决定先订 12 瓶试试，订单放在「待办」里等你确认。',
          'The hypoallergenic shampoo keeps running out. Compared side by side, Chongmu Supply is ¥6 cheaper a bottle and delivers in two days, so you decided to try 12 bottles first; the order waits in To-do for you to check.',
        ),
        moduleIds: [m.inventory],
      },
      conversation: { id: 'conv-shampoo-supplier', title: tx('比较两家香波供应商', 'Comparing two shampoo suppliers'), startedAt: '2026-11-04T21:10' },
      turns: [
        tx('低敏香波老是缺货，帮我比较一下现在这家和宠沐供应链的报价。', 'The hypoallergenic shampoo keeps running out. Compare our current supplier with Chongmu Supply’s quote.'),
        tx(
          '按 500 ml 一瓶算：现在这家 58 元，每次至少订 6 瓶，5 天到货；宠沐 52 元，订 12 瓶以上再打九折，2 天到货。你们每周大约用 5 瓶，换成宠沐每月能省 150 元左右，也不容易断货。',
          'Per 500 ml bottle: our current supplier charges ¥58, with at least 6 bottles an order and 5 days to arrive; Chongmu charges ¥52, 10% off from 12 bottles, and 2 days to arrive. You use about 5 bottles a week, so switching saves around ¥150 a month and makes running out less likely.',
        ),
        tx('那先从宠沐订 12 瓶试试。', 'Then let us try 12 bottles from Chongmu first.'),
        tx('好的，订单草稿已经放进「待办」，你确认后再发给他们。', 'All right. A draft order is in To-do; send it to them once you have checked it.'),
      ],
    },
  ],
  s2: [
    {
      topic: {
        id: 'christmas-style',
        title: tx('圣诞造型活动', 'Christmas styling offer'),
        summary: tx(
          '你想在圣诞前推出节日造型（小围巾和拍照）。AI 按现在的排班估算：12 月 14 日到 24 日大约能接 20 单，每单多 20–30 分钟，建议只接小型和中型犬。',
          'You would like to offer a holiday style before Christmas, with a little scarf and a photo. From the current rota the AI estimated about 20 bookings between 14 and 24 December, each 20–30 minutes longer, and suggested small and medium dogs only.',
        ),
        moduleIds: [m.appointments],
      },
      conversation: { id: 'conv-christmas-style', title: tx('圣诞节前的造型预约', 'Christmas styling bookings'), startedAt: '2026-11-18T21:15' },
      turns: [
        tx('圣诞前想推一个节日造型，加条小围巾再拍张照，大概能接多少单？', 'Before Christmas I would like to offer a holiday style, with a little scarf and a photo. How many could we take?'),
        tx(
          '按现在的排班，12 月 14 日到 24 日每天大约还有 2 个空档，三个人一共能接 20 单左右。节日造型每单多 20–30 分钟，建议只接小型和中型犬，大狗的时间排不开。',
          'With the current rota there are about two free slots a day between 14 and 24 December, around 20 in all for the three of you. A holiday style adds 20–30 minutes, so it is best kept to small and medium dogs; there is no room for the large ones.',
        ),
      ],
    },
  ],
  s4: [
    {
      topic: {
        id: 'new-year-hours',
        title: tx('元旦营业安排', 'Opening over New Year'),
        summary: tx(
          '你问元旦三天要不要照常开门。AI 看了预约，建议 1 号休息，2 号和 3 号照常营业，小陈和阿杰各轮休一天。你同意了，安排记在「排班」里。',
          'You asked whether to open as usual over the three New Year days. From the bookings the AI suggested closing on the 1st and opening on the 2nd and 3rd, with Xiao Chen and A-Jie each taking one day off. You agreed, and the plan is noted in Shifts.',
        ),
        moduleIds: [m.appointments, m.shifts],
      },
      conversation: { id: 'conv-new-year-hours', title: tx('元旦三天怎么开门', 'Opening over the New Year days'), startedAt: '2026-12-27T20:05' },
      turns: [
        tx('元旦三天要不要照常开门？', 'Should we open as usual over the three New Year days?'),
        tx(
          '1 月 1 日到 3 日目前有 7 个预约，大多在 2 号和 3 号上午。建议 1 号休息一天，2 号和 3 号照常营业，小陈和阿杰在这两天里各轮休一天。',
          'There are 7 bookings from 1 to 3 January so far, most of them on the mornings of the 2nd and 3rd. I suggest closing on the 1st and opening as usual on the 2nd and 3rd, with Xiao Chen and A-Jie each taking one of those days off.',
        ),
        tx('好，就这么定，帮我记到排班里。', 'Good, let us do that. Note it in the rota for me.'),
        tx('已经记在「排班」里了，小陈 2 号休息，阿杰 3 号休息。', 'Noted in Shifts: Xiao Chen is off on the 2nd, A-Jie on the 3rd.'),
      ],
    },
  ],
}

/** A side conversation as the state keeps it: the topic, and one dedicated chat in it. */
export function sideTalk(talk: SideTalk): { topic: Topic; conversation: Conversation } {
  const { id, title, startedAt } = talk.conversation
  const messages = talk.turns.map((text, index) => ({
    id: `${id}-${index + 1}`,
    author: index % 2 === 0 ? ('user' as const) : ('ai' as const),
    text,
    at: addMinutes(startedAt, index * 3),
    status: 'done' as const,
  }))
  const last = messages[messages.length - 1].at
  return {
    topic: { ...talk.topic, summaryAt: addMinutes(last, 1), lastActivityAt: last },
    conversation: { id, topicId: talk.topic.id, surface: 'thread', persistence: 'one-off', title, startedAt, messages },
  }
}
