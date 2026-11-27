import { createContext, use } from 'react'

/**
 * The place in the shell's floating header where the open screen puts its own
 * controls (D-50: a module's 模块设置 and 立即运行). The shell holds the
 * element and the header draws it; a screen renders into it through a portal.
 * `null` outside the shell (a gallery, a test without it) and before the
 * header has mounted — a screen then draws its controls in place.
 */
export const ShellHeaderSlotContext = createContext<HTMLElement | null>(null)

/** The header's slot, or `null` where there is none. */
export function useShellHeaderSlot(): HTMLElement | null {
  return use(ShellHeaderSlotContext)
}
