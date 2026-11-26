// The ids the story is wired with. The runtime's actions, the scenes and
// part 3's page builders all name modules, memory tables, columns and blocks
// through these constants, so a renamed id cannot leave one of them behind.
// This file imports nothing.

/** Module ids — the IA ids of `docs/design/IA-MAP.md` § Nodes. */
export const moduleId = {
  notifications: 'notifications',
  messages: 'messages',
  calendar: 'calendar',
  todo: 'todo',
  mail: 'mail',
  files: 'files',
  appointments: 'profession.appointments',
  clients: 'profession.clients',
  inventory: 'profession.inventory',
  shifts: 'profession.shifts',
  confirmations: 'profession.appointments.sub.confirmations',
  duration: 'profession.appointments.sub.duration',
} as const

/** Memory table ids. A table keeps its id when its module is promoted. */
export const tableId = {
  notices: 'notices',
  messages: 'customer-messages',
  events: 'events',
  appointments: 'appointments',
  dogs: 'dogs',
  visits: 'visits',
  products: 'products',
  shifts: 'shifts',
  swaps: 'swaps',
  confirmations: 'confirmations',
  /** 品种大致时长 — the breed tier of the hero flow's memory. A row's id is the breed's code. */
  breeds: 'breed-durations',
  /** 每只狗的实际耗时 — the per-dog tier. A row's id is the dog's id. */
  dogDurations: 'dog-durations',
} as const

/** Column ids of the tables the runtime itself reads and writes. */
export const column = {
  appointments: {
    dog: 'dog',
    groomer: 'groomer',
    start: 'start',
    service: 'service',
    estimate: 'estimate',
    basis: 'basis',
    actual: 'actual',
    status: 'status',
    /** 调整前 — the estimate a rule change replaced; `null` when no change has moved this booking. */
    previous: 'previous',
    /** 首次到店加时 — the minutes the first-visit condition adds (`s4`); `null` when it adds none. */
    extra: 'extra',
  },
  dogs: { name: 'name', breed: 'breed', coat: 'coat', size: 'size', owner: 'owner', note: 'note', nextDue: 'nextDue' },
  visits: { dog: 'dog', date: 'date', estimate: 'estimate', actual: 'actual', groomer: 'groomer' },
  breeds: {
    breed: 'breed',
    type: 'type',
    /** 适用时长 — what bookings use. Changes only when a review's proposal is accepted. */
    applied: 'applied',
    /** 依据: `seed` 你的经验 · `average` n 只的平均. */
    basis: 'basis',
    /** 实测平均 — the mean of the breed's dogs' own averages; `null` = 尚无数据. */
    observed: 'observed',
    dogs: 'dogs',
    min: 'min',
    max: 'max',
    updatedAt: 'updatedAt',
  },
  dogDurations: {
    dog: 'dog',
    breed: 'breed',
    visits: 'visits',
    /** 平均实际耗时 — updated at once by every recorded duration. */
    average: 'average',
    /** 适用时长 — `null` until a review's proposal puts the dog on its own record. */
    applied: 'applied',
    note: 'note',
  },
} as const

/** What an estimate rests on: 默认 · 按品种表 · 按它自己的记录. */
export const basis = { default: 'default', breed: 'breed', own: 'own' } as const

/** `requested` 待安排: a customer asked, no groomer or time yet — `groomer` and `start` are `null`. */
export const appointmentStatus = { requested: 'requested', booked: 'booked', started: 'started', done: 'done' } as const

/** Minutes a booking gets when no rule applies — the two hours 可乐 is booked for in `s0`. */
export const defaultEstimate = 120

/** The param of the `s4` condition node (第一次来的狗 +30 分钟); the estimate reads it. */
export const firstVisitParam = 'firstVisitExtraMinutes'

/** Workflow node ids other code points at. */
export const nodeId = {
  review: 'review',
  estimate: 'estimate',
  setDuration: 'set-duration',
  /** 建议排班调整 — raises the suggestion on 排班 when a rule change moves open bookings. */
  suggestShifts: 'suggest-shifts',
  /** The condition `s4` adds: 第一次来的狗 +30 分钟. */
  firstVisit: 'first-visit',
} as const

/** Ids of the proposals the story itself raises (a chat proposal's id comes from the counter). */
export const proposalId = {
  /** `s3`: the Monday review's two parts — the breed row, and the dogs with their own record. */
  review: 'proposal-duration-review',
  /** Between `s3` and `s4`: more dogs reach two visits. */
  moreDogs: 'proposal-duration-more-dogs',
  /** `s4`: add the first-visit condition to the workflow. */
  firstVisit: 'proposal-first-visit',
  /** From `s4`: promote 服务时长 to a top-level module (D-38), shown in `settings.profession`. */
  promote: 'proposal-promote-duration',
} as const

/**
 * The key under which a module's change set names the rows of one of its
 * memory tables: `changes.blocks['memory:breed-durations'].golden`. Rows changed
 * by a recorded visit or an accepted proposal are marked there
 * (`memoryChanges` in `@/runtime` reads them).
 */
export const memoryBlock = (table: string) => `memory:${table}`

/**
 * Block keys of the pages whose items the runtime marks as changed. A page
 * builder (part 3) gives these keys to the blocks that show the same rows.
 */
export const blockKey = {
  appointments: { schedule: 'schedule', unplaced: 'unplaced' },
  clients: { dogs: 'dogs', visits: 'visits' },
  duration: { records: 'records' },
} as const

/** Ids of the accounts. */
export const accountId = {
  calendar: 'calendar',
  wechat: 'wechat',
  payments: 'payments',
  google: 'google',
  slack: 'slack',
  figma: 'figma',
  github: 'github',
} as const
