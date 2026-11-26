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
  'notifications.empty.body': 'When a module has something for you to decide or to look at, it appears here.',

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

  // 待办 · 邮件 · 文件
  'stub.section': 'Not connected yet',
  'stub.todo.title': 'Your to-dos will be gathered here',
  'stub.todo.body': 'Once a task tool is connected, this module collects what is due and what others are waiting on.',
  'stub.mail.title': 'The mail that needs you will be sorted here',
  'stub.mail.body': 'Once a mailbox is connected, this module picks out the mail that needs your reply.',
  'stub.files.title': 'The files you used lately will be listed here',
  'stub.files.body': 'Once a drive is connected, this module lists the files you opened and changed recently.',
  'stub.action': 'Connect an account',
} satisfies Messages

export default messages

declare module '@/i18n/types' {
  interface MessageNamespaces {
    'base-modules': typeof messages
  }
}
