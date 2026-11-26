import type { Messages } from '../types'

// Namespace `feedback` — the texts of the feedback and data-display families
// (package S5): what `DataState` and `Sonner` say by themselves, and the text
// of both families' demos. Shared words (`action.retry`, `status.loading`,
// the two vocabularies) stay in `common`.
const messages = {
  'dataState.loaded': 'Loaded.',
  'dataState.empty.title': 'Nothing here yet',
  'dataState.error.title': 'This could not be loaded',
  'dataState.error.reason': 'Something went wrong on the way. Nothing was changed; you can try again.',

  'sonner.region': 'Notifications',
  'sonner.close': 'Dismiss this notification',

  'demo.variants': 'Variants',
  'demo.sizes': 'Sizes',
  'demo.inUse': 'In use',
  'demo.wrapping': 'Long text',

  'badge.demo.default': 'Connected',
  'badge.demo.secondary': 'Draft',
  'badge.demo.outline': '3 dogs',
  'badge.demo.destructive': 'Expired',
  'badge.demo.withIcon': 'Confirmed',
  'badge.demo.inUseTitle': 'WeChat',

  'alert.demo.title': 'Two bookings overlap on Saturday',
  'alert.demo.body': 'Momo and Biscuit are both booked with Zhou Lan at 10:00. Move one of them before the day starts.',
  'alert.demo.dangerTitle': 'The calendar is no longer connected',
  'alert.demo.dangerBody': 'New bookings are not written to your calendar. Connect it again in Settings; nothing already saved is lost.',
  'alert.demo.plain': 'Reminders go out at 19:00 the evening before.',

  'sonner.demo.intro': 'A toast repeats something the screen already shows, or offers an undo. It is never the only place an error appears.',
  'sonner.demo.show': 'Show a notification',
  'sonner.demo.showUndo': 'Show one with an undo',
  'sonner.demo.showError': 'Show an error',
  'sonner.demo.keep': 'Show one that stays',
  'sonner.demo.saved': 'Saved as version 4',
  'sonner.demo.savedBody': 'You moved the weekly review to Monday 09:00.',
  'sonner.demo.removed': 'Removed “Stock and inventory”',
  'sonner.demo.undo': 'Undo',
  'sonner.demo.undone': 'Put back “Stock and inventory”',
  'sonner.demo.failed': 'The reminder was not sent',
  'sonner.demo.failedBody': 'WeChat did not answer. The booking page shows the same message and a way to send it again.',
  'sonner.demo.sticky': 'This one stays until you dismiss it',
  'sonner.demo.stickyBody': 'It has a long second line so that the text wraps beside the two controls at every width.',

  'skeleton.demo.note': 'Shapes only. In use they stand inside the busy region of a DataState, next to its status text.',
  'skeleton.demo.lines': 'Lines of text',
  'skeleton.demo.row': 'A row with an avatar',

  'spinner.demo.named': 'Named on its own',
  'spinner.demo.label': 'Sending the reminder',
  'spinner.demo.beside': 'Beside its status text',
  'spinner.demo.text': 'Sending the reminder…',

  'empty.demo.title': 'No bookings today',
  'empty.demo.body': 'Bookings made by your customers, or written in by you, appear here.',
  'empty.demo.action': 'Add a booking',
  'empty.demo.plainTitle': 'No messages yet',
  'empty.demo.plainBody': 'Connect WeChat and customer messages show up here.',

  'progress.demo.label': 'Step 2 of 3',
  'progress.demo.done': 'Learning from finished appointments',
  'progress.demo.indeterminate': 'Preparing the workflow',

  'dataState.demo.pick': 'State shown',
  'dataState.demo.ready': 'Ready',
  'dataState.demo.loading': 'Loading',
  'dataState.demo.empty': 'Empty',
  'dataState.demo.error': 'Error',
  'dataState.demo.note': 'Open this page with ?preview=loading, empty or error to start in that state.',
  'dataState.demo.item1': 'Momo — bath and trim, 10:00',
  'dataState.demo.item2': 'Biscuit — nail clipping, 11:30',
  'dataState.demo.item3': 'Tangyuan — full groom, 14:00',
  'dataState.demo.emptyTitle': 'No bookings today',
  'dataState.demo.emptyBody': 'Bookings appear here as soon as a customer makes one.',
  'dataState.demo.errorTitle': 'Today’s bookings could not be loaded',
  'dataState.demo.errorReason': 'The connection dropped. The week view still shows what was loaded earlier.',
  'dataState.demo.defaults': 'Nothing passed: the built-in texts',

  'modeBadge.demo.inUse': 'Send the evening reminder',
  'modeBadge.demo.narrow': 'In a narrow place',

  'changeMarker.demo.item': 'Rule: first-time dogs get 15 minutes more',

  'table.demo.caption': 'Estimated and actual duration of this week’s finished appointments',
  'table.demo.dog': 'Dog',
  'table.demo.service': 'Service',
  'table.demo.estimated': 'Estimated',
  'table.demo.actual': 'Actual',
  'table.demo.basis': 'Basis of the estimate',
  'table.demo.total': 'Total',
  'table.demo.row1.dog': 'Momo',
  'table.demo.row1.service': 'Bath and trim',
  'table.demo.row1.basis': 'Its own record: the average of its last five visits',
  'table.demo.row2.dog': 'Biscuit',
  'table.demo.row2.service': 'Nail clipping',
  'table.demo.row2.basis': 'Breed table',
  'table.demo.row3.dog': 'Tangyuan',
  'table.demo.row3.service': 'Full groom',
  'table.demo.row3.basis': 'Default for the service',
  'table.demo.minutes': '{count} min',

  'item.demo.title1': 'Connected accounts',
  'item.demo.body1': '3 connected',
  'item.demo.title2': 'How the AI acts',
  'item.demo.body2': '2 kinds of task set',
  'item.demo.title3': 'Your profession and modules',
  'item.demo.body3': '4 modules. A long status line shows that the description wraps onto further lines instead of being cut off after two.',
  'item.demo.links': 'As links',
  'item.demo.static': 'With media and an action',
  'item.demo.dog': 'Momo',
  'item.demo.dogBody': 'Poodle · owner Ms Lin · next visit Saturday 10:00',
  'item.demo.open': 'Open the file',

  'avatar.demo.name1': 'Zhou Lan',
  'avatar.demo.initial1': 'ZL',
  'avatar.demo.name2': 'Chen',
  'avatar.demo.initial2': 'C',
  'avatar.demo.name3': 'Ajie',
  'avatar.demo.initial3': 'A',
  'avatar.demo.more': 'and 2 more groomers',
} satisfies Messages

export default messages

declare module '@/i18n/types' {
  interface MessageNamespaces {
    feedback: typeof messages
  }
}
