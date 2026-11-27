import type { Translation } from '../types'
import type en from './settings.en'

const messages: Translation<typeof en> = {
  'home.title': '设置',
  'home.pages': '设置页面',
  'home.accounts': '账号连接',
  'home.accounts.status': { other: '{count} 个已连接' },
  'home.accounts.none': '尚未连接账号',
  'home.modes': 'AI 行为模式',
  'home.modes.status': { other: '{count} 类任务已设置' },
  'home.modes.none': '尚未设置',
  'home.profession': '职业功能',
  'home.profession.status': { other: '{count} 个功能' },
  'home.status.error': '暂时读不到状态',
  'home.display': '显示',

  'accounts.title': '账号连接',
  'accounts.description': '这些是你的功能要用到的账号。断开某个账号后，用到它的功能会停止更新。',

  'modes.title': 'AI 行为模式',
  'modes.lead': '这里选的是每类任务的上限：AI 会根据具体情况，在上限以内选择模式。未设置的任务由 AI 决定，默认协助。',
  'modes.loading': '正在读取设置…',
  'modes.error.title': '暂时读不到设置',
  'modes.error.body': '下面是上次读到的内容。恢复读取之前，改动无法保存。',
  'modes.unset': '未设置',
  'modes.unset.meaning': '由 AI 决定，默认协助。',
  'modes.save.error': '保存失败，仍按之前的选择执行。请重试。',
  'modes.affected': '受此设置影响的动作',
  'modes.affected.none': '目前没有受此设置影响的动作。',
  'modes.affected.item': '{module} · {action}',
  'modes.capped': '受上限限制',
  'modes.showAll': { other: '展开全部（{count}）' },

  'profession.title': '职业功能',
  'profession.description': '为你的工作生成的功能。改动会立刻出现在侧边栏。',
  'profession.error.title': '暂时读不到功能',
  'profession.regenerate': '重新生成',
  'profession.regenerate.title': '重新生成功能？',
  'profession.regenerate.body': '功能会回到 AI 最初建议的那一组：你添加的功能会被移除，改过的名称会恢复。',
  'profession.regenerated': '已重新生成功能',
  'profession.interview': '重新进行职业访谈',
  'profession.interview.note': '会再次打开入门的三个步骤；可以取消并回到这里。',
  'profession.promotions': '升级建议',
  'profession.promotions.none': '暂无建议。',
  'profession.promoted': '已升级为顶层功能',
  'profession.promoted.open': '打开「{name}」',
}

export default messages
