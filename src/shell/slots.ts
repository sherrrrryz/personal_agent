import type { ComponentType } from 'react'

/**
 * The two places the shell leaves for the chat (spec part 2 § Shell,
 * "Slots"): `chatBar` is the bottom row under `main`, `sidebarRecent` a group
 * of the sidebar between the modules and the footer. Each is a component
 * without props. Absent, the row and the group are not rendered.
 */
export type ShellSlots = {
  chatBar?: ComponentType
  sidebarRecent?: ComponentType
}

// Found by glob, so the chat package (S12) edits no shell file: it adds
// `src/chat/shell-slots.tsx` exporting `chatBar` and / or `sidebarRecent`.
const found = import.meta.glob<ShellSlots>('/src/chat/shell-slots.tsx', { eager: true })

/** What `src/chat/shell-slots.tsx` exports; empty until that file exists. */
export const registeredSlots: ShellSlots = Object.values(found)[0] ?? {}
