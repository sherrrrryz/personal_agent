import type { ShellSlots } from '@/shell'

import { ChatBar } from './ChatBar'
import { RecentGroup } from './RecentGroup'

/**
 * What the chat gives the shell (spec part 2 § Shell, "Slots"): the bottom row
 * and the sidebar's recent group, each a component without props.
 *
 * The shell finds `src/chat/shell-slots.tsx` by glob. That file is the
 * integration leg's to add (one line: `export { chatBar, sidebarRecent } from
 * './slots'`), together with the shell package's tests that still expect the
 * stand-ins. Until then the chat's own routes hand these to the shell through
 * `handle.slots` (`src/screens/chat/routes.tsx`).
 */
export const chatBar = ChatBar
export const sidebarRecent = RecentGroup

/** Both slots, for a route's `handle` or a test's `<Shell slots={…} />`. */
export const chatSlots: ShellSlots = { chatBar, sidebarRecent }
