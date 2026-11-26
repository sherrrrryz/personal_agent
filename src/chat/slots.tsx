import type { ShellSlots } from '@/shell'

import { ChatBar } from './ChatBar'
import { RecentGroup } from './RecentGroup'

/**
 * What the chat gives the shell (spec part 2 § Shell, "Slots"): the bottom row
 * and the sidebar's recent group, each a component without props.
 *
 * The shell finds `src/chat/shell-slots.tsx` by glob: that file re-exports
 * these two and so registers them for every screen inside the shell.
 */
export const chatBar = ChatBar
export const sidebarRecent = RecentGroup

/** Both slots, for a test's `<Shell slots={…} />`. */
export const chatSlots: ShellSlots = { chatBar, sidebarRecent }
