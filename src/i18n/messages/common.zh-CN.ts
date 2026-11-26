import type { Translation } from '../types'
import type en from './common.en'

const messages: Translation<typeof en> = {
  'app.name': 'Personal Agent',

  'action.close': '关闭',
  'action.cancel': '取消',
  'action.confirm': '确认',
  'action.save': '保存',
  'action.retry': '重试',
  'action.back': '返回',
  'status.loading': '加载中…',

  'notFound.title': '找不到这个页面',
  'notFound.body': '这个地址没有对应的页面。',
  'notFound.home': '回到起始页',

  'mode.autonomous.name': '自主',
  'mode.autonomous.meaning': '直接去做，做完再告诉你。',
  'mode.assisted.name': '协助',
  'mode.assisted.meaning': '先准备好，等你同意后执行。',
  'mode.deferred.name': '待确认',
  'mode.deferred.meaning': '放进通知，等你来决定。',

  'change.new': '新',
  'change.updated': '已更新',
  'change.removed': '已移除',
}

export default messages
