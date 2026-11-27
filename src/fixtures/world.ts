import type { Account, MemoryRow, MemoryTable, ModeSetting, Module, ModuleIcon, Run, Snapshot, WfEdge, WfNode, Workflow } from '@/runtime/model'
import { taskKinds } from '@/runtime/model'
import { tx, type Text } from '@/runtime/text'
import { addDays } from '@/runtime/time'

import { chain, col, row, table, wf } from './build'
import { agendaRows, deskTables } from './everyday'
import { accountId, appointmentStatus, basis, column, defaultEstimate, moduleId, tableId } from './keys'
import { stubWorkflow } from './templates'
import {
  appointmentStatusNames,
  basisNames,
  breeds,
  channels,
  coats,
  services,
  sizes,
  staff,
  swapStatusNames,
} from './vocabulary'

// The shop on the first evening (`e1`): what onboarding generated, before any
// conversation. Every later scene is this plus what happened since
// (`scenes.ts`).

/** 第一晚 — Monday evening, after closing. */
export const firstEvening = '2026-11-02T18:30'

const m = moduleId

// ── Modules and their workflows ─────────────────────────────────────────────

type ModuleSeed = {
  id: string
  kind: Module['kind']
  name: Text
  description: Text
  icon: ModuleIcon
  tables?: string[]
  /** Time of day of its scheduled run; a module with none runs on events. */
  runsAt?: string
  workflow?: { nodes: WfNode[]; edges: WfEdge[] }
}

const out = wf.output

const moduleSeeds: ModuleSeed[] = [
  {
    id: m.notifications,
    kind: 'base',
    name: tx('通知', 'Notifications'),
    description: tx('读取每个功能的内容，挑出最需要你看的事。', 'Reads every feature’s content and surfaces what most needs you.'),
    icon: 'bell',
    tables: [tableId.notices],
    workflow: {
      nodes: [
        wf.trigger('any-module', tx('任一功能更新', 'Any feature updates'), 'module'),
        wf.source('outputs', tx('所有功能的内容', 'Every feature’s content')),
        wf.step('rank', tx('挑出最重要的', 'Pick what matters most'), {
          detail: tx('待你确认的排最前，其次是今天要处理的。', 'What waits for your decision comes first, then what is due today.'),
        }),
        wf.memory('memory', tx('资料', 'Records'), [tableId.notices]),
        out('out-summary', 'block.summary', 'summary', tx('概况', 'At a glance')),
        out('out-proposals', 'block.proposal', 'proposals', tx('待你确认', 'Waiting for you')),
        out('out-list', 'block.list', 'important', tx('重要的事', 'Important')),
      ],
      edges: [...chain('any-module', 'outputs', 'rank', 'out-summary'), ...chain('rank', 'out-proposals'), ...chain('rank', 'out-list'), ...chain('rank', 'memory')],
    },
  },
  {
    id: m.messages,
    kind: 'base',
    name: tx('消息', 'Messages'),
    description: tx('汇总各渠道的顾客消息，并分到相关的功能。', 'Gathers customer messages from every channel and files each under the feature it concerns.'),
    icon: 'message-square',
    tables: [tableId.messages],
    workflow: {
      nodes: [
        wf.trigger('incoming', tx('微信收到消息', 'A WeChat message arrives'), 'event', {}, { account: accountId.wechat }),
        wf.source('wechat', tx('微信', 'WeChat'), { account: accountId.wechat }),
        wf.step('triage', tx('分到相关功能', 'File under the feature it concerns')),
        wf.action('file', tx('整理归档', 'File it'), 'autonomous', 'organise'),
        wf.memory('memory', tx('资料', 'Records'), [tableId.messages]),
        out('out-summary', 'block.summary', 'summary', tx('概况', 'At a glance')),
        out('out-list', 'block.list', 'messages', tx('顾客消息', 'Customer messages')),
      ],
      edges: [...chain('incoming', 'wechat', 'triage', 'file', 'out-summary'), ...chain('file', 'out-list'), ...chain('file', 'memory')],
    },
  },
  {
    id: m.calendar,
    kind: 'base',
    name: tx('日程', 'Calendar'),
    description: tx('你在各账号里的日程，加上「预约」写入的美容预约。', 'Your events across accounts, plus the grooming bookings Appointments writes in.'),
    icon: 'calendar',
    tables: [tableId.events],
    runsAt: '07:30',
    workflow: {
      nodes: [
        wf.trigger('morning', tx('每天 07:30', 'Every day at 07:30'), 'schedule', { time: '07:30' }),
        wf.source('calendar-account', tx('日历账号', 'Calendar account'), { account: accountId.calendar }),
        wf.source('bookings', tx('「预约」写入的预约', 'Bookings written by Appointments'), { targetModuleId: m.appointments, tables: [tableId.appointments] }),
        wf.step('merge', tx('合并成一张日程', 'Merge into one calendar')),
        wf.memory('memory', tx('资料', 'Records'), [tableId.events]),
        out('out-schedule', 'block.schedule', 'week', tx('本周', 'This week')),
        out('out-today', 'block.list', 'today', tx('今天', 'Today')),
      ],
      edges: [...chain('morning', 'calendar-account', 'merge', 'out-schedule'), ...chain('bookings', 'merge'), ...chain('merge', 'out-today'), ...chain('merge', 'memory')],
    },
  },
  {
    id: m.todo,
    kind: 'base',
    name: tx('待办', 'To-do'),
    description: tx('汇总 Slack 里交给你的事和各功能里要你做的事，按截止时间排好。', 'Gathers what Slack hands you and what each feature needs you to do, sorted by when it is due.'),
    icon: 'list-todo',
    tables: [tableId.tasks],
    runsAt: '07:00',
    workflow: {
      nodes: [
        wf.trigger('morning', tx('每天 07:00', 'Every day at 07:00'), 'schedule', { time: '07:00' }),
        wf.source('slack', tx('Slack 里交给你的事', 'What Slack hands you'), { account: accountId.slack }),
        wf.source('features', tx('各功能里要你做的事', 'What each feature needs you to do')),
        wf.step('sort', tx('按截止时间排好', 'Sort by when it is due'), {
          detail: tx('逾期的排最前，其次是今天到期的。', 'What is overdue comes first, then what is due today.'),
        }),
        wf.memory('memory', tx('资料', 'Records'), [tableId.tasks]),
        out('out-summary', 'block.summary', 'summary', tx('概况', 'At a glance')),
        out('out-open', 'block.list', 'open', tx('要做的事', 'To do')),
        out('out-done', 'block.list', 'done', tx('最近完成', 'Recently done')),
      ],
      edges: [...chain('morning', 'slack', 'sort', 'out-summary'), ...chain('features', 'sort'), ...chain('sort', 'out-open'), ...chain('sort', 'out-done'), ...chain('sort', 'memory')],
    },
  },
  {
    id: m.mail,
    kind: 'base',
    name: tx('邮件', 'Mail'),
    description: tx('整理 Google 邮箱里的邮件，挑出需要你回复的。', 'Sorts the mail in your Google mailbox and picks out what needs your reply.'),
    icon: 'mail',
    tables: [tableId.emails],
    workflow: {
      nodes: [
        wf.trigger('incoming', tx('收到新邮件', 'A new email arrives'), 'event', {}, { account: accountId.google }),
        wf.source('mailbox', tx('Google 邮箱', 'Google mailbox'), { account: accountId.google }),
        wf.step('pick', tx('挑出需要你回复的', 'Pick out what needs your reply'), {
          detail: tx('供应商、合作伙伴和顾客的来信排在前面。', 'Mail from suppliers, partners and customers comes first.'),
        }),
        wf.memory('memory', tx('资料', 'Records'), [tableId.emails]),
        out('out-summary', 'block.summary', 'summary', tx('概况', 'At a glance')),
        out('out-reply', 'block.list', 'reply', tx('需要回复', 'Needs a reply')),
        out('out-other', 'block.list', 'other', tx('其他邮件', 'Other mail')),
      ],
      edges: [...chain('incoming', 'mailbox', 'pick', 'out-summary'), ...chain('pick', 'out-reply'), ...chain('pick', 'out-other'), ...chain('pick', 'memory')],
    },
  },
  {
    id: m.files,
    kind: 'base',
    name: tx('文件', 'Files'),
    description: tx('列出 Google 云端硬盘里你最近用到的文件。', 'Lists the files in your Google Drive that you used lately.'),
    icon: 'folder',
    tables: [tableId.files],
    workflow: {
      nodes: [
        wf.trigger('changed', tx('网盘里的文件有变动', 'A file in the drive changes'), 'event', {}, { account: accountId.google }),
        wf.source('drive', tx('Google 云端硬盘', 'Google Drive'), { account: accountId.google }),
        wf.step('recent', tx('按最近修改排好', 'Sort by the latest change')),
        wf.memory('memory', tx('资料', 'Records'), [tableId.files]),
        out('out-summary', 'block.summary', 'summary', tx('概况', 'At a glance')),
        out('out-recent', 'block.table', 'recent', tx('最近的文件', 'Recent files')),
      ],
      edges: [...chain('changed', 'drive', 'recent', 'out-summary'), ...chain('recent', 'out-recent'), ...chain('recent', 'memory')],
    },
  },
  {
    id: m.appointments,
    kind: 'profession',
    name: tx('预约', 'Appointments'),
    description: tx('按天和美容师排好每个预约，并写进日程。', 'Lays out every booking by day and groomer, and writes it into the calendar.'),
    icon: 'calendar-clock',
    tables: [tableId.appointments],
    runsAt: '08:00',
    workflow: {
      nodes: [
        wf.trigger('platform', tx('预约平台有变动', 'The booking tool changes'), 'event', {}, { account: accountId.calendar }),
        wf.trigger('daily', tx('每天 08:00', 'Every day at 08:00'), 'schedule', { time: '08:00' }),
        wf.source('bookings', tx('预约记录', 'Booking records'), { account: accountId.calendar }),
        wf.step('assign', tx('排进美容师的时间', 'Fit into each groomer’s day'), {
          detail: tx('每个预约的时长：没有规则时默认 2 小时。', 'Each booking’s length: 2 hours by default when no rule applies.'),
        }),
        wf.action('write-calendar', tx('写入日程', 'Write into the calendar'), 'autonomous', 'change-appointments', { targetModuleId: m.calendar }),
        wf.memory('memory', tx('资料', 'Records'), [tableId.appointments]),
        out('out-summary', 'block.summary', 'summary', tx('概况', 'At a glance')),
        out('out-schedule', 'block.schedule', 'schedule', tx('今天的预约', 'Today’s bookings')),
        out('out-unplaced', 'block.list', 'unplaced', tx('待安排', 'To be placed')),
      ],
      edges: [
        ...chain('platform', 'bookings', 'assign', 'write-calendar', 'out-summary'),
        ...chain('daily', 'bookings'),
        ...chain('write-calendar', 'out-schedule'),
        ...chain('write-calendar', 'out-unplaced'),
        ...chain('assign', 'memory'),
      ],
    },
  },
  {
    id: m.clients,
    kind: 'profession',
    name: tx('顾客与宠物', 'Clients and pets'),
    description: tx('每只狗一份档案：主人、品种、性格备注和每次到店的记录。', 'One file per dog: owner, breed, temperament notes and a record of every visit.'),
    icon: 'paw-print',
    tables: [tableId.dogs, tableId.visits],
    workflow: {
      nodes: [
        wf.trigger('visit-done', tx('一次预约完成', 'A booking is finished'), 'module', {}, { targetModuleId: m.appointments }),
        wf.source('bookings', tx('预约记录', 'Booking records'), { targetModuleId: m.appointments, tables: [tableId.appointments] }),
        wf.step('update-file', tx('更新这只狗的档案', 'Update the dog’s file')),
        wf.memory('memory', tx('资料', 'Records'), [tableId.dogs, tableId.visits]),
        out('out-summary', 'block.summary', 'summary', tx('概况', 'At a glance')),
        out('out-dogs', 'block.list', 'dogs', tx('狗狗档案', 'Dog files')),
      ],
      edges: [...chain('visit-done', 'bookings', 'update-file', 'out-summary'), ...chain('update-file', 'out-dogs'), ...chain('update-file', 'memory')],
    },
  },
  {
    id: m.inventory,
    kind: 'profession',
    name: tx('商品与库存', 'Products and stock'),
    description: tx('跟踪库存和销售，低于安全库存时建议补货。', 'Tracks stock and sales, and suggests restocking below the safety level.'),
    icon: 'package',
    tables: [tableId.products],
    runsAt: '21:00',
    workflow: {
      nodes: [
        wf.trigger('nightly', tx('每天 21:00', 'Every day at 21:00'), 'schedule', { time: '21:00' }),
        wf.source('sales', tx('收款记录', 'Payment records'), { account: accountId.payments }),
        wf.step('count', tx('计算库存', 'Work out the stock')),
        wf.condition('low', tx('低于安全库存', 'Below the safety level')),
        wf.action('restock', tx('建议补货', 'Suggest a restock'), 'assisted', 'order-stock'),
        wf.memory('memory', tx('资料', 'Records'), [tableId.products]),
        out('out-summary', 'block.summary', 'summary', tx('概况', 'At a glance')),
        out('out-table', 'block.table', 'stock', tx('库存', 'Stock')),
        out('out-restock', 'block.list', 'restock', tx('补货建议', 'Restock suggestions')),
      ],
      edges: [...chain('nightly', 'sales', 'count', 'low', 'restock', 'out-restock'), ...chain('count', 'out-summary'), ...chain('count', 'out-table'), ...chain('count', 'memory')],
    },
  },
  {
    id: m.shifts,
    kind: 'profession',
    name: tx('排班', 'Shifts'),
    description: tx('按预约负载排每周的班，处理换班申请。', 'Plans the weekly rota against the booking load and handles swap requests.'),
    icon: 'users',
    tables: [tableId.shifts, tableId.swaps],
    runsAt: '20:00',
    workflow: {
      nodes: [
        wf.trigger('weekly', tx('每周日 20:00', 'Every Sunday at 20:00'), 'schedule', { weekday: 0, time: '20:00' }),
        wf.source('load', tx('预约负载', 'Booking load'), { targetModuleId: m.appointments, tables: [tableId.appointments] }),
        wf.step('plan', tx('排出下周的班', 'Plan next week’s rota')),
        wf.action('propose', tx('提议排班', 'Propose the rota'), 'assisted', 'adjust-shifts'),
        wf.memory('memory', tx('资料', 'Records'), [tableId.shifts, tableId.swaps]),
        out('out-summary', 'block.summary', 'summary', tx('概况', 'At a glance')),
        out('out-schedule', 'block.schedule', 'rota', tx('本周排班', 'This week’s rota')),
        out('out-proposal', 'block.proposal', 'proposal', tx('排班建议', 'Rota suggestion')),
        out('out-swaps', 'block.list', 'swaps', tx('换班申请', 'Swap requests')),
      ],
      edges: [
        ...chain('weekly', 'load', 'plan', 'propose', 'out-proposal'),
        ...chain('plan', 'out-summary'),
        ...chain('plan', 'out-schedule'),
        ...chain('plan', 'out-swaps'),
        ...chain('plan', 'memory'),
      ],
    },
  },
]

const generated = tx('由职业访谈生成', 'Generated from the profession interview')

function modulesAndWorkflows(now: string): { modules: Module[]; workflows: Workflow[]; runs: Run[] } {
  const modules: Module[] = []
  const workflows: Workflow[] = []
  const runs: Run[] = []
  moduleSeeds.forEach((seed, index) => {
    const workflowId = `wf:${seed.id}`
    const stub = stubWorkflow()
    modules.push({
      id: seed.id,
      kind: seed.kind,
      name: seed.name,
      description: seed.description,
      icon: seed.icon,
      workflowId,
      memoryTableIds: seed.tables ?? [],
      aliases: [],
      ...(seed.runsAt ? { nextRunAt: `${addDays(now.slice(0, 10), 1)}T${seed.runsAt}` } : {}),
    })
    workflows.push({
      id: workflowId,
      moduleId: seed.id,
      current: 1,
      versions: [
        {
          n: 1,
          at: '2026-11-01T20:00',
          author: 'ai',
          reason: seed.workflow ? generated : stub.reason,
          nodes: seed.workflow?.nodes ?? stub.nodes,
          edges: seed.workflow?.edges ?? stub.edges,
        },
      ],
    })
    // A module with a story has run once today; a stub has never run.
    if (seed.workflow) {
      runs.push({
        id: `run-seed-${index + 1}`,
        moduleId: seed.id,
        at: `${now.slice(0, 10)}T${seed.runsAt && seed.runsAt < now.slice(11) ? seed.runsAt : '08:00'}`,
        trigger: seed.runsAt ? 'schedule' : 'event',
        version: 1,
        result: 'ok',
        changes: { blocks: {} },
      })
    }
  })
  return { modules, workflows, runs }
}

// ── Memory ──────────────────────────────────────────────────────────────────

type DogSeed = [id: string, name: Text, breed: keyof typeof breeds, coat: keyof typeof coats, size: keyof typeof sizes, owner: Text, note: Text | null]

const dogSeeds: DogSeed[] = [
  ['doudou', tx('豆豆', 'Doudou'), 'golden', 'long', 'large', tx('林女士', 'Ms Lin'), tx('很配合，吹风时会打瞌睡。', 'Easy-going; dozes off under the dryer.')],
  ['dafu', tx('大福', 'Dafu'), 'golden', 'long', 'large', tx('王先生', 'Mr Wang'), null],
  ['maiya', tx('麦芽', 'Maiya'), 'golden', 'long', 'large', tx('陈小姐', 'Ms Chen'), null],
  ['naicha', tx('奶茶', 'Naicha'), 'golden', 'long', 'large', tx('赵先生', 'Mr Zhao'), null],
  ['lucky', tx('Lucky', 'Lucky'), 'golden', 'long', 'large', tx('刘女士', 'Ms Liu'), null],
  ['xueqiu', tx('雪球', 'Xueqiu'), 'bichon', 'long', 'small', tx('孙先生', 'Mr Sun'), tx('怕剪指甲，要先安抚。', 'Afraid of nail clipping; settle it first.')],
  ['max', tx('Max', 'Max'), 'collie', 'long', 'medium', tx('何女士', 'Ms He'), null],
  ['kele', tx('可乐', 'Kele'), 'alaskan', 'long', 'large', tx('吴先生', 'Mr Wu'), null],
  ['tudou', tx('土豆', 'Tudou'), 'corgi', 'short', 'small', tx('郑女士', 'Ms Zheng'), null],
  ['panghu', tx('胖虎', 'Panghu'), 'frenchie', 'short', 'small', tx('冯先生', 'Mr Feng'), null],
  ['nuomi', tx('糯米', 'Nuomi'), 'corgi', 'short', 'small', tx('许女士', 'Ms Xu'), null],
  ['pidan', tx('皮蛋', 'Pidan'), 'frenchie', 'short', 'small', tx('蒋先生', 'Mr Jiang'), null],
]

/** Dogs that become customers later in the story; a scene adds each with `newDog`. */
const newcomers: DogSeed[] = [
  ['buding', tx('布丁', 'Buding'), 'golden', 'long', 'large', tx('沈女士', 'Ms Shen'), null],
  ['niangao', tx('年糕', 'Niangao'), 'bichon', 'long', 'small', tx('韩先生', 'Mr Han'), null],
  ['yuanbao', tx('元宝', 'Yuanbao'), 'collie', 'long', 'medium', tx('曹女士', 'Ms Cao'), tx('第一次来，容易紧张。', 'First time here; gets nervous easily.')],
]

function dogRow([id, name, breed, coat, size, owner, note]: DogSeed): MemoryRow {
  const d = column.dogs
  return row(id, { [d.name]: name, [d.breed]: breed, [d.coat]: coat, [d.size]: size, [d.owner]: owner, [d.note]: note, [d.nextDue]: null })
}

/** The file of a dog that comes to the shop for the first time (布丁 in `s3`). */
export function newDog(id: string): MemoryRow {
  const seed = newcomers.find(([each]) => each === id)
  if (!seed) throw new Error(`No dog "${id}" in the story`)
  return dogRow(seed)
}

/** The owner of a dog, for scenes that write about customers. */
export function ownerOf(dog: string): Text {
  return [...dogSeeds, ...newcomers].find(([id]) => id === dog)?.[5] ?? tx('', '')
}

/** The name of a dog, for scenes that write about it. */
export function nameOf(dog: string): Text {
  return [...dogSeeds, ...newcomers].find(([id]) => id === dog)?.[1] ?? tx('', '')
}

/** A booking row: two hours by default, until a rule says otherwise. */
export function booking(dog: string, date: string, time: string, groomer: keyof typeof staff): MemoryRow {
  const c = column.appointments
  return row(`apt-${date.slice(5).replace('-', '')}-${dog}`, {
    [c.dog]: dog,
    [c.groomer]: groomer,
    [c.start]: `${date}T${time}`,
    [c.service]: 'full',
    [c.estimate]: defaultEstimate,
    [c.basis]: basis.default,
    [c.actual]: null,
    [c.status]: appointmentStatus.booked,
    [c.previous]: null,
    [c.extra]: null,
  })
}

/** 待安排 — a customer asked for a booking; no groomer and no time yet. */
export function requested(dog: string): MemoryRow {
  const c = column.appointments
  const cells = { ...booking(dog, '0000-00-00', '00:00', 'lan').cells, [c.groomer]: null, [c.start]: null, [c.status]: appointmentStatus.requested }
  return row(`apt-request-${dog}`, cells)
}

/** A booking that is over and was never timed — before 服务时长 existed nobody recorded durations. */
function over(appointment: MemoryRow): MemoryRow {
  appointment.cells[column.appointments.status] = appointmentStatus.done
  return appointment
}

/**
 * 下次到店 of every dog: the day of its next open booking, or none. A scene
 * calls this once it is built, so the pet files agree with the schedule.
 */
export function syncNextDue(snapshot: Pick<Snapshot, 'memory' | 'storyTime'>): void {
  const find = (id: string) => snapshot.memory.find((each) => each.id === id)
  const a = column.appointments
  const today = snapshot.storyTime.slice(0, 10)
  for (const dog of find(tableId.dogs)?.rows ?? []) {
    const days = (find(tableId.appointments)?.rows ?? [])
      .filter((each) => each.cells[a.dog] === dog.id && each.cells[a.status] === appointmentStatus.booked)
      .map((each) => String(each.cells[a.start]).slice(0, 10))
      .filter((day) => day >= today)
      .sort()
    dog.cells[column.dogs.nextDue] = days[0] ?? null
  }
}

/** The rest of the first evening's WeChat messages: [id, dog, text, filed under, time, unread]. */
const seedMessages: Array<[id: string, dog: string, text: Text, module: string, time: string, unread: boolean]> = [
  ['msg-jiang', 'pidan', tx('皮蛋下午剪完指甲一直舔爪子，正常吗？', 'Pidan keeps licking its paws since the nail clipping this afternoon — is that normal?'), m.clients, '17:50', true],
  ['msg-feng', 'panghu', tx('胖虎明天 16:30 的预约，我可能会晚到十分钟。', 'For Panghu’s booking at 16:30 tomorrow I may be ten minutes late.'), m.appointments, '18:10', true],
  ['msg-chen', 'maiya', tx('这周能给麦芽约一次洗剪吹吗？周三周四都可以。', 'Could Maiya have a full groom this week? Wednesday or Thursday both work.'), m.appointments, '14:40', false],
  ['msg-xu', 'nuomi', tx('糯米今天洗完特别香，那款香波能买一瓶带回家吗？', 'Nuomi smells lovely after today — could I buy a bottle of that shampoo to take home?'), m.inventory, '13:20', false],
  ['msg-liu', 'lucky', tx('Lucky 下次来想加一个刷牙，可以吗？', 'Could Lucky have teeth brushing added next time?'), m.appointments, '10:05', false],
  ['msg-wu', 'kele', tx('可乐开始换毛了，你们有没有去浮毛的套餐？', 'Kele has started moulting — do you have a deshedding package?'), m.appointments, '09:40', false],
  ['msg-lin-thanks', 'doudou', tx('豆豆上次剪得很好看，邻居都问是在哪家店剪的！', 'Doudou’s trim last time looked great — the neighbours all asked where we go!'), m.clients, '09:15', false],
]

function memory(now: string): MemoryTable[] {
  const today = now.slice(0, 10)
  const tomorrow = addDays(today, 1)
  const a = column.appointments
  const d = column.dogs
  const v = column.visits
  const breedOptions = { options: breeds }
  const staffOptions = { options: staff }
  const week = [0, 1, 2, 3, 4, 5].map((offset) => addDays(today, offset))

  return [
    table(
      tableId.notices,
      m.notifications,
      tx('重要的事', 'Important items'),
      [col('text', 'text', '内容', 'What'), col('source', 'module', '来自', 'From'), col('at', 'datetime', '时间', 'When')],
      [
        row('notice-tomorrow', { text: tx('明天有 4 个预约，都还没发确认。', 'Four bookings tomorrow, none confirmed yet.'), source: m.appointments, at: `${today}T18:00` }),
        row('notice-shampoo', { text: tx('低敏香波只剩 2 瓶，低于安全库存。', 'Hypoallergenic shampoo is down to 2 bottles, below the safety level.'), source: m.inventory, at: `${today}T17:40` }),
        row('notice-xueqiu', { text: tx('雪球明天 10:00 到店：它怕剪指甲，记得先安抚。', 'Xueqiu comes tomorrow at 10:00: it is afraid of nail clipping, so settle it first.'), source: m.clients, at: `${today}T18:05` }),
        row('notice-today-done', { text: tx('今天的 2 个预约都已完成：糯米和皮蛋。', 'Both of today’s bookings are done: Nuomi and Pidan.'), source: m.appointments, at: `${today}T16:00` }),
        row('notice-swap', { text: tx('阿杰申请和小陈对调周六的班，等你批准。', 'A-Jie asks to swap Saturday’s shift with Xiao Chen and waits for your approval.'), source: m.shifts, at: `${today}T16:10` }),
        row('notice-maiya', { text: tx('陈小姐想给麦芽约这周的洗剪吹，还没排时间。', 'Ms Chen wants a full groom for Maiya this week; no time is set yet.'), source: m.appointments, at: `${today}T14:45` }),
        row('notice-ear-cleaner', { text: tx('洁耳液剩 3 瓶，刚好在安全库存线上。', 'Ear cleaner is down to 3 bottles, right at the safety level.'), source: m.inventory, at: `${today}T17:40` }),
        row('notice-mail-vet', { text: tx('安心宠物医院来信，想续签合作协议，等你回复。', 'Anxin Pet Clinic wrote about renewing the partnership and waits for your reply.'), source: m.mail, at: `${today}T11:20` }),
      ],
    ),
    table(
      tableId.messages,
      m.messages,
      tx('顾客消息', 'Customer messages'),
      [
        col('from', 'text', '来自', 'From'),
        col('channel', 'code', '渠道', 'Channel', { options: channels }),
        col('text', 'text', '内容', 'Message'),
        col('module', 'module', '归到', 'Filed under'),
        col('at', 'datetime', '时间', 'When'),
        col('unread', 'flag', '未读', 'Unread'),
      ],
      [
        row('msg-sun', { from: ownerOf('xueqiu'), channel: 'wechat', text: tx('明天雪球能提前半小时到吗？', 'Could Xueqiu come half an hour early tomorrow?'), module: m.appointments, at: `${today}T17:20`, unread: true }),
        row('msg-he', { from: ownerOf('max'), channel: 'wechat', text: tx('上次那款护毛素还有货吗？', 'Is the conditioner from last time still in stock?'), module: m.inventory, at: `${today}T15:05`, unread: true }),
        row('msg-zheng', { from: ownerOf('tudou'), channel: 'wechat', text: tx('土豆最近掉毛厉害，洗的时候帮忙看看皮肤。', 'Tudou has been shedding a lot; please check the skin while washing.'), module: m.clients, at: `${today}T11:30`, unread: false }),
        ...seedMessages.map(([id, dog, text, module, time, unread]) => row(id, { from: ownerOf(dog), channel: 'wechat', text, module, at: `${today}T${time}`, unread })),
      ],
    ),
    table(
      tableId.events,
      m.calendar,
      tx('我的日程', 'My events'),
      [col('title', 'text', '事项', 'Event'), col('start', 'datetime', '开始', 'Start'), col('end', 'datetime', '结束', 'End')],
      agendaRows(now),
    ),
    ...deskTables(now),
    table(
      tableId.appointments,
      m.appointments,
      tx('预约', 'Bookings'),
      [
        col(a.dog, 'ref', '狗', 'Dog', { refTable: tableId.dogs }),
        col(a.groomer, 'code', '美容师', 'Groomer', staffOptions),
        col(a.start, 'datetime', '开始', 'Start'),
        col(a.service, 'code', '服务', 'Service', { options: services }),
        col(a.estimate, 'duration', '预计时长', 'Estimated time'),
        col(a.basis, 'code', '依据', 'Based on', { options: basisNames }),
        col(a.actual, 'duration', '实际耗时', 'Actual time'),
        col(a.status, 'code', '状态', 'Status', { options: appointmentStatusNames }),
        col(a.previous, 'duration', '调整前', 'Before the change'),
        col(a.extra, 'duration', '首次到店加时', 'First-visit extra'),
      ],
      [
        // Today's two are over; tomorrow's four are what the first conversation is about.
        over(booking('nuomi', today, '10:00', 'lan')),
        over(booking('pidan', today, '14:00', 'jie')),
        booking('xueqiu', tomorrow, '10:00', 'lan'),
        booking('max', tomorrow, '13:00', 'chen'),
        booking('tudou', tomorrow, '15:00', 'jie'),
        booking('panghu', tomorrow, '16:30', 'lan'),
        requested('maiya'),
      ],
      [m.calendar, m.shifts, m.clients, m.notifications],
    ),
    table(
      tableId.dogs,
      m.clients,
      tx('狗狗档案', 'Dog files'),
      [
        col(d.name, 'text', '名字', 'Name'),
        col(d.breed, 'code', '品种', 'Breed', breedOptions),
        col(d.coat, 'code', '毛长', 'Coat', { options: coats }),
        col(d.size, 'code', '体型', 'Size', { options: sizes }),
        col(d.owner, 'text', '主人', 'Owner'),
        col(d.note, 'text', '性格备注', 'Temperament notes'),
        col(d.nextDue, 'date', '下次到店', 'Next due'),
      ],
      dogSeeds.map(dogRow),
      [m.appointments],
    ),
    table(
      tableId.visits,
      m.clients,
      tx('每次到店', 'Every visit'),
      [
        col(v.dog, 'ref', '狗', 'Dog', { refTable: tableId.dogs }),
        col(v.date, 'date', '日期', 'Date'),
        col(v.estimate, 'duration', '预计', 'Estimated'),
        col(v.actual, 'duration', '实际', 'Actual'),
        col(v.groomer, 'code', '美容师', 'Groomer', staffOptions),
      ],
      [],
      [],
    ),
    table(
      tableId.products,
      m.inventory,
      tx('商品', 'Products'),
      [col('name', 'text', '商品', 'Product'), col('stock', 'number', '库存', 'In stock'), col('safety', 'number', '安全库存', 'Safety level'), col('sold', 'number', '本周销售', 'Sold this week')],
      [
        row('shampoo', { name: tx('低敏香波 500 ml', 'Hypoallergenic shampoo 500 ml'), stock: 2, safety: 4, sold: 5 }),
        row('conditioner', { name: tx('护毛素 300 ml', 'Conditioner 300 ml'), stock: 7, safety: 3, sold: 2 }),
        row('food', { name: tx('成犬粮 2 kg', 'Adult dog food 2 kg'), stock: 12, safety: 6, sold: 4 }),
        row('leash', { name: tx('牵引绳', 'Leash'), stock: 9, safety: 3, sold: 1 }),
        row('ear-cleaner', { name: tx('洁耳液', 'Ear cleaner'), stock: 3, safety: 3, sold: 2 }),
      ],
      [m.notifications],
    ),
    table(
      tableId.shifts,
      m.shifts,
      tx('排班', 'Rota'),
      [col('staff', 'code', '员工', 'Staff', staffOptions), col('start', 'datetime', '上班', 'Start'), col('end', 'datetime', '下班', 'End')],
      week.flatMap((day, index) =>
        (Object.keys(staff) as Array<keyof typeof staff>)
          // 周岚 works every day; each groomer has one day off in the week.
          .filter((person) => person === 'lan' || (person === 'chen' ? index !== 2 : index !== 4))
          .map((person) => row(`shift-${day.slice(5).replace('-', '')}-${person}`, { staff: person, start: `${day}T09:30`, end: `${day}T18:30` })),
      ),
      [m.appointments],
    ),
    table(
      tableId.swaps,
      m.shifts,
      tx('换班申请', 'Swap requests'),
      [col('from', 'code', '申请人', 'Asked by', staffOptions), col('with', 'code', '对调', 'Swap with', staffOptions), col('day', 'date', '日期', 'Day'), col('status', 'code', '状态', 'Status', { options: swapStatusNames })],
      [row('swap-1', { from: 'jie', with: 'chen', day: week[5], status: 'open' })],
      [],
    ),
  ]
}

// ── Accounts and modes ──────────────────────────────────────────────────────

const accounts: Account[] = [
  { id: accountId.calendar, name: tx('日历', 'Calendar'), group: 'primary', status: 'connected', feeds: [m.calendar, m.appointments] },
  { id: accountId.wechat, name: tx('微信', 'WeChat'), group: 'primary', status: 'connected', feeds: [m.messages] },
  { id: accountId.payments, name: tx('收款', 'Payments'), group: 'primary', status: 'connected', feeds: [m.inventory] },
  { id: accountId.google, name: tx('Google', 'Google'), group: 'more', status: 'connected', feeds: [m.mail, m.files] },
  { id: accountId.slack, name: tx('Slack', 'Slack'), group: 'more', status: 'connected', feeds: [m.todo] },
  { id: accountId.figma, name: tx('Figma', 'Figma'), group: 'more', status: 'disconnected', feeds: [] },
  { id: accountId.github, name: tx('GitHub', 'GitHub'), group: 'more', status: 'disconnected', feeds: [] },
]

/** Two kinds of task are set; for the rest the AI decides (D-22). */
const ceilings: Partial<Record<(typeof taskKinds)[number], ModeSetting['ceiling']>> = {
  'change-rules': 'deferred',
  'order-stock': 'assisted',
}

/** The shop as onboarding left it. A new object on every call. */
export function world(): Snapshot {
  const snapshot: Snapshot = {
    scene: 'e1',
    storyTime: firstEvening,
    ...modulesAndWorkflows(firstEvening),
    memory: memory(firstEvening),
    proposals: [],
    conversations: [],
    topics: [],
    accounts: structuredClone(accounts),
    modeSettings: taskKinds.map((taskKind) => ({ taskKind, ceiling: ceilings[taskKind] ?? null })),
    pendingChanges: {},
    removedModules: [],
    seq: 0,
  }
  syncNextDue(snapshot)
  return snapshot
}
