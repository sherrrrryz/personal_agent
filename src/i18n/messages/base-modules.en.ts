import type { Messages } from '../types'

// Namespace `base-modules` — the pages of the base modules
// (`src/modules/{notifications,messages,calendar,todo,mail,files}/`): block
// titles, figures' labels and the sentences of each page's own states. The
// story's facts stay in `src/fixtures/`. One writer (package C1).
const messages = {
  // 通知
  'notifications.summary': 'At a glance',
  'notifications.summary.awaiting': 'Waiting for you',
  'notifications.summary.today': 'New today',
  'notifications.important': 'Important',
  'notifications.empty.section': 'Nothing to handle',
  'notifications.empty.title': 'Nothing needs you right now',
  'notifications.empty.body': 'When a feature has something for you to decide or to look at, it appears here.',

  // 消息
  'messages.summary': 'At a glance',
  'messages.summary.unread': 'Unread',
  'messages.summary.total': 'Customer messages',
  'messages.list': 'Customer messages',
  'messages.item.title': '{from}: {text}',
  'messages.item.meta': '{when} · filed under “{module}”',
  'messages.item.metaPlain': '{when}',
  'messages.item.unread': 'Unread',
  'messages.empty.section': 'No messages',
  'messages.empty.title': 'No messages yet',
  'messages.empty.body': 'Once WeChat is connected, your customers’ messages appear here.',
  'messages.empty.action': 'Connect an account',

  // 日程
  'calendar.week': 'This week',
  'calendar.today': 'Today',
  'calendar.resource.own': 'My events',
  'calendar.resource.bookings': 'Grooming bookings',
  'calendar.source.own': 'My calendar',
  'calendar.booking.title': '{dog} · {service}',
  'calendar.booking.meta': 'Groomer: {groomer}',
  'calendar.event.meta': 'From your calendar account',
  'calendar.today.meta': '{start} – {end}',
  'calendar.today.empty.title': 'Nothing planned today',
  'calendar.today.empty.body': 'The rest of the week is in the calendar above.',

  // 待办
  'todo.summary': 'At a glance',
  'todo.summary.open': 'Open',
  'todo.summary.today': 'Due today',
  'todo.summary.overdue': 'Overdue',
  'todo.open': 'To do',
  'todo.done': 'Recently done',
  'todo.item.due': 'Due {date}',
  'todo.item.today': 'Due today',
  'todo.item.overdue': 'Was due {date}',
  'todo.item.own': 'Your own',
  'todo.item.late': 'Overdue',
  'todo.item.done': 'Done',
  'todo.empty.section': 'No to-dos',
  'todo.empty.title': 'Nothing to do',
  'todo.empty.body': 'Once Slack is connected, what is handed to you and what each feature needs you to do is gathered here.',
  'todo.empty.action': 'Connect an account',

  // 邮件
  'mail.summary': 'At a glance',
  'mail.summary.reply': 'Need a reply',
  'mail.summary.week': 'Received in 7 days',
  'mail.reply': 'Needs a reply',
  'mail.other': 'Other mail',
  'mail.item.meta': '{from} · {when} · {preview}',
  'mail.item.reply': 'Reply',
  'mail.empty.section': 'No mail',
  'mail.empty.title': 'No mail yet',
  'mail.empty.body': 'Once Google is connected, the mail that needs your reply is sorted here.',
  'mail.empty.action': 'Connect an account',

  // 文件
  'files.summary': 'At a glance',
  'files.summary.total': 'Files',
  'files.summary.week': 'Changed in 7 days',
  'files.recent': 'Recent files',
  'files.recent.caption': 'The files you used lately, the latest change first',
  'files.col.name': 'Name',
  'files.col.kind': 'Kind',
  'files.col.modified': 'Changed',
  'files.col.by': 'Changed by',
  'files.col.size': 'Size',
  'files.empty.section': 'No files',
  'files.empty.title': 'No files yet',
  'files.empty.body': 'Once Google is connected, the files you opened and changed lately are listed here.',
  'files.empty.action': 'Connect an account',
} satisfies Messages

export default messages

declare module '@/i18n/types' {
  interface MessageNamespaces {
    'base-modules': typeof messages
  }
}
