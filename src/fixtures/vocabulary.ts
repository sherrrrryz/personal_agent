import type { TaskKind } from '@/runtime/model'
import { tx, type Text } from '@/runtime/text'

// The story's small closed vocabularies: the people, the breeds, the words a
// `code` column shows. Tables point at these so one breed has one name.

/** The manager 周岚 and her two groomers. */
export const staff = {
  lan: tx('周岚', 'Zhou Lan'),
  chen: tx('小陈', 'Xiao Chen'),
  jie: tx('阿杰', 'A-Jie'),
} satisfies Record<string, Text>

export const breeds = {
  golden: tx('金毛', 'Golden Retriever'),
  alaskan: tx('阿拉斯加', 'Alaskan Malamute'),
  bichon: tx('比熊', 'Bichon Frise'),
  collie: tx('边牧', 'Border Collie'),
  corgi: tx('柯基', 'Corgi'),
  frenchie: tx('法斗', 'French Bulldog'),
} satisfies Record<string, Text>

/** Her rule of thumb: 长毛大型 4 h · 短毛小型 2 h · 其他 3 h. */
export const breedTypes = {
  'long-large': { name: tx('长毛大型', 'Long-haired, large'), minutes: 240 },
  'short-small': { name: tx('短毛小型', 'Short-haired, small'), minutes: 120 },
  other: { name: tx('其他', 'Other'), minutes: 180 },
} as const

/** The type each breed falls under. */
export const breedType: Record<keyof typeof breeds, keyof typeof breedTypes> = {
  golden: 'long-large',
  alaskan: 'long-large',
  bichon: 'other',
  collie: 'other',
  corgi: 'short-small',
  frenchie: 'short-small',
}

export const coats = { long: tx('长毛', 'Long'), short: tx('短毛', 'Short') }
export const sizes = { large: tx('大型', 'Large'), medium: tx('中型', 'Medium'), small: tx('小型', 'Small') }
export const services = { full: tx('洗剪吹', 'Full groom'), bath: tx('洗澡', 'Bath') }

/** 预计时长的依据. */
export const basisNames = {
  default: tx('默认', 'Default'),
  breed: tx('按品种表', 'By the breed table'),
  own: tx('按它自己的记录', 'By its own record'),
}

/** 品种表「依据」列. */
export const breedBasisNames = {
  seed: tx('你的经验', 'Your rule of thumb'),
  average: tx('实测平均', 'Measured average'),
}

export const appointmentStatusNames = {
  booked: tx('已预约', 'Booked'),
  started: tx('已开始', 'Started'),
  done: tx('已完成', 'Done'),
}

export const confirmationStatusNames = {
  sent: tx('已发送', 'Sent'),
  replied: tx('已回复', 'Replied'),
  'no-reply': tx('无回复', 'No reply'),
  reminded: tx('已提醒', 'Reminded'),
}

export const channels = { wechat: tx('微信', 'WeChat') }

export const swapStatusNames = { open: tx('待处理', 'Open'), approved: tx('已同意', 'Approved') }

/** The kinds of task of `settings.ai-modes`. */
export const taskKindNames: Record<TaskKind, Text> = {
  'message-customers': tx('给顾客发消息', 'Message customers'),
  'change-appointments': tx('修改预约', 'Change appointments'),
  'adjust-shifts': tx('调整排班', 'Adjust shifts'),
  'change-rules': tx('修改规则和工作流', 'Change rules and workflows'),
  'order-stock': tx('下单补货', 'Order stock'),
  organise: tx('整理归档', 'Organise and file'),
}
