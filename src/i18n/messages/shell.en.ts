import type { Messages } from '../types'

// Namespace `shell` — the app shell (`src/shell/`): sidebar, header, the
// 时间推进 device with 状态预览, and the `/dev/shell` demo page. One writer
// (package S7).
const messages = {
  skip: 'Skip to main content',

  'nav.label': 'Module navigation',
  'nav.base': 'Base',
  'nav.profession': 'My shop · Pet grooming',
  'nav.topics': 'Topics',
  'nav.footer': 'Settings and preferences',
  'nav.settings': 'Settings',
  'nav.awaiting': { one: '{count} item waiting for you', other: '{count} items waiting for you' },

  'prefs.label': 'Preferences',

  'device.label': 'Prototype controls · Time travel: {scene}',
  'device.prev': 'Previous scene',
  'device.next': 'Next scene',
  'device.restart': 'Start over (back to first use)',
  'device.preview': 'State preview',
  'device.previewing': 'Prototype controls: previewing the “{state}” state',
  'device.restore': 'Back to normal',
  'device.jumped': 'Now in the scene “{scene}”',
  'device.restarted': 'Started over: back to first use',
  'device.restored': 'Preview ended: screens show their own state again',

  'preview.normal': 'Normal',
  'preview.empty': 'Empty',
  'preview.loading': 'Loading',
  'preview.error': 'Error',
  'preview.long': 'Very long content',

  'demo.title': 'Shell demo',
  'demo.description': 'The app shell on its own: sidebar, header, the prototype controls, and the chat bar in the bottom row.',
  'demo.parts.title': 'What to look at',
  'demo.parts.sidebar': 'The sidebar is open when the window is wide, an icon rail at medium widths, and a sheet off the canvas when it is narrow. The button at the start of the header switches it.',
  'demo.parts.device': 'The prototype controls at the end of the header jump between scenes and force a state on every screen. A forced state shows a line under the header until you go back to normal.',
  'demo.parts.bar': 'The row under this area is where the chat bar goes. It is a row of the layout, so it never covers the page: this area scrolls on its own.',
  'demo.modules.title': 'Change the modules',
  'demo.modules.note': 'Each button calls a runtime action. The sidebar shows the change at once.',
  'demo.modules.rename': 'Rename Appointments',
  'demo.modules.renamed': 'Bookings and walk-in visits (renamed)',
  'demo.modules.add': 'Add a module',
  'demo.modules.added': 'Members',
  'demo.modules.remove': 'Remove Shifts',
  'demo.modules.sub': 'Add a sub-module under Appointments',
  'demo.modules.subName': 'Birthday reminders for regular customers',
  'demo.route.title': 'Move between pages',
  'demo.route.note': 'Following a link moves focus to the heading of the page that opens and updates the title of the tab.',
  'demo.route.next': 'Open the second page',
  'demo.route.back': 'Back to the shell demo',
  'demo.second.title': 'Second page',
  'demo.second.description': 'Focus is on this heading after the link was followed.',
  'demo.filler.title': 'Long content',
  'demo.filler.text': 'This paragraph is here to make the page longer than the window, so the area scrolls while the header and the bottom row stay where they are. Paragraph {count}.',
} satisfies Messages

export default messages

declare module '@/i18n/types' {
  interface MessageNamespaces {
    shell: typeof messages
  }
}
