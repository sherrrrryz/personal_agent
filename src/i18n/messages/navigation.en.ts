import type { Messages } from '../types'

// Namespace `navigation` — the built-in names of the navigation and container
// components (families `navigation` and `containers`, package S4), and the
// text of their demos on `/dev/components`.
const messages = {
  // Names the wrappers give the kit's parts (COMPONENTS.md § Kit patches).
  'sidebar.toggle': 'Show or hide the sidebar',
  'sidebar.close': 'Close the sidebar',
  'breadcrumb.label': 'You are here',
  'breadcrumb.path': 'Show the full path',
  'overlay.close': 'Close',
  'overlay.cancel': 'Cancel',

  'theme.label': 'Appearance',
  'theme.system': 'Follow the system',
  'theme.light': 'Light',
  'theme.dark': 'Dark',
  'locale.label': 'Language',

  // Demos.
  'demo.sidebar.nameOpen': 'Main navigation, open',
  'demo.sidebar.nameRail': 'Main navigation, icon rail',
  'demo.sidebar.nameSheet': 'Main navigation, narrow screen',
  'demo.sidebar.open': 'Open, with a button that folds it into the icon rail',
  'demo.sidebar.rail': 'Icon rail',
  'demo.sidebar.sheet': 'On a narrow screen: off the canvas, opened by its button',
  'demo.sidebar.sheetWide': 'On a narrow screen the sidebar is a sheet opened by a button. Narrow the window to see it here.',
  'demo.sidebar.brand': 'Paws and Bubbles',
  'demo.sidebar.base': 'Everyday',
  'demo.sidebar.shop': 'My shop · pet grooming',
  'demo.sidebar.recent': 'Recent conversations',
  'demo.sidebar.notifications': 'Notifications',
  'demo.sidebar.waiting': '{count} waiting for you',
  'demo.sidebar.messages': 'Messages',
  'demo.sidebar.schedule': 'Schedule',
  'demo.sidebar.bookings': 'Bookings and reminders for regular customers',
  'demo.sidebar.duration': 'Grooming time by breed',
  'demo.sidebar.reminders': 'Day-before reminders',
  'demo.sidebar.stock': 'Stock (not connected yet)',
  'demo.sidebar.settings': 'Settings',
  'demo.sidebar.talk1': 'Moving Saturday bookings',
  'demo.sidebar.talk2': 'Shampoo order for next month',

  'demo.breadcrumb.wide': 'With room: the whole path',
  'demo.breadcrumb.narrow': 'Without room: the path behind one button, the current page cut short',
  'demo.breadcrumb.single': 'A single level',
  'demo.breadcrumb.shop': 'My shop',
  'demo.breadcrumb.bookings': 'Bookings and reminders for regular customers',
  'demo.breadcrumb.duration': 'Grooming time by breed and coat type',

  'demo.tabs.name': 'Tables of the records',
  'demo.tabs.breeds': 'Usual time by breed',
  'demo.tabs.dogs': 'Actual time for each dog',
  'demo.tabs.archive': 'Archive (empty)',
  'demo.tabs.breedsBody': 'One row per breed: the time you allow, and what it is based on.',
  'demo.tabs.dogsBody': 'One row per visit: how long it really took.',

  'demo.menu.open': 'Booking actions',
  'demo.menu.edit': 'Change the time',
  'demo.menu.message': 'Send the owner a message about this booking',
  'demo.menu.export': 'Export (not available)',
  'demo.menu.cancel': 'Cancel the booking',
  'demo.menu.view': 'Calendar view',
  'demo.menu.day': 'Day',
  'demo.menu.week': 'Week',
  'demo.menu.more': 'More',
  'demo.menu.chosen': 'Last chosen: {item}',
  'demo.menu.none': 'Nothing chosen yet.',

  'demo.theme.current': 'On screen now: {mode}',
  'demo.locale.note': 'Each language is written in its own words.',

  'demo.dialog.open': 'Connect the calendar',
  'demo.dialog.title': 'Connect your calendar',
  'demo.dialog.description': 'Prototype: the authorisation is simulated. Nothing leaves this page.',
  'demo.dialog.body': 'Bookings, the schedule and the day-before reminders read your calendar. You can disconnect at any time in the settings.',
  'demo.dialog.field': 'Name of the calendar',
  'demo.dialog.confirm': 'Connect',
  'demo.dialog.later': 'Later',
  'demo.dialog.long': 'A long text',
  'demo.dialog.longTitle': 'What connecting changes, in full',
  'demo.dialog.paragraph': 'When the calendar is connected, a new booking appears in it within a minute, a change in either place is copied to the other, and a cancelled booking is removed from both.',

  'demo.alert.open': 'Disconnect the calendar',
  'demo.alert.title': 'Disconnect the calendar?',
  'demo.alert.description': 'Bookings, the schedule and the day-before reminders will stop updating until you connect it again.',
  'demo.alert.confirm': 'Disconnect',
  'demo.alert.result': 'Disconnected {count} times.',

  'demo.sheet.end': 'Update history (at the side)',
  'demo.sheet.bottom': 'Update history (from below)',
  'demo.sheet.title': 'Update history',
  'demo.sheet.description': 'One row for every update of this process.',
  'demo.sheet.row1': 'Today 09:00 · on schedule · three reminders sent',
  'demo.sheet.row2': 'Yesterday 09:00 · on schedule · nothing to send',
  'demo.sheet.row3': 'Monday 14:20 · update by you · one reminder sent, one waiting for you',
  'demo.sheet.done': 'Done',

  'demo.collapsible.trigger': 'Conversation of 12 March',
  'demo.collapsible.body': 'You asked to move the Saturday bookings to Sunday; three owners agreed and one is still to answer.',
  'demo.collapsible.open': 'Starts open',

  'demo.tooltip.add': 'Add a booking',
  'demo.tooltip.addHint': 'Opens an empty booking for today',
  'demo.tooltip.run': 'Refresh',
  'demo.tooltip.runHint': 'Updates the process once, outside its schedule',

  'demo.card.title': 'Tomorrow',
  'demo.card.description': 'Six bookings, the first at nine.',
  'demo.card.body': 'Two long-coat dogs in the morning, so the afternoon starts half an hour later than usual.',
  'demo.card.action': 'Open the schedule',
  'demo.card.small': 'Stock',
  'demo.card.smallBody': 'Shampoo for sensitive skin: two bottles left.',

  'demo.separator.above': 'Morning',
  'demo.separator.below': 'Afternoon',
  'demo.separator.start': 'Bookings',
  'demo.separator.end': 'Reminders',
} satisfies Messages

export default messages

declare module '@/i18n/types' {
  interface MessageNamespaces {
    navigation: typeof messages
  }
}
