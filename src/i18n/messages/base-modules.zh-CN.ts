import type { Translation } from '../types'
import type en from './base-modules.en'

const messages: Translation<typeof en> = {
  'notifications.summary': '概况',
  'notifications.summary.awaiting': '待你确认',
  'notifications.summary.today': '今天新增',
  'notifications.important': '重要的事',
  'notifications.empty.section': '没有待处理的事',
  'notifications.empty.title': '现在没有需要你处理的事',
  'notifications.empty.body': '有模块需要你决定或留意时，会出现在这里。',

  'messages.summary': '概况',
  'messages.summary.unread': '未读',
  'messages.summary.total': '顾客消息',
  'messages.list': '顾客消息',
  'messages.item.title': '{from}：{text}',
  'messages.item.meta': '{when} · 归到「{module}」',
  'messages.item.metaPlain': '{when}',
  'messages.item.unread': '未读',
  'messages.empty.section': '没有消息',
  'messages.empty.title': '还没有消息',
  'messages.empty.body': '连接微信后，顾客的消息会出现在这里。',
  'messages.empty.action': '去连接账号',

  'calendar.week': '本周',
  'calendar.today': '今天',
  'calendar.resource.own': '我的日程',
  'calendar.resource.bookings': '美容预约',
  'calendar.source.own': '我的日历',
  'calendar.booking.title': '{dog} · {service}',
  'calendar.booking.meta': '美容师：{groomer}',
  'calendar.event.meta': '来自你的日历账号',
  'calendar.today.meta': '{start} – {end}',
  'calendar.today.empty.title': '今天没有安排',
  'calendar.today.empty.body': '这一周其余的安排在上面的日程里。',

  'stub.section': '尚未连接',
  'stub.todo.title': '你的待办会汇总在这里',
  'stub.todo.body': '连接任务工具后，这个模块会整理到期的事和别人在等你处理的事。',
  'stub.mail.title': '需要你处理的邮件会整理在这里',
  'stub.mail.body': '连接邮箱后，这个模块会挑出需要你回复的邮件。',
  'stub.files.title': '最近用到的文件会列在这里',
  'stub.files.body': '连接网盘后，这个模块会列出你最近打开和修改过的文件。',
  'stub.action': '去连接账号',
}

export default messages
