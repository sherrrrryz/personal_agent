import { createContext, useContext } from 'react'

import { useSidebar as useKitSidebar } from '@/components/ui/sidebar'

/**
 * Where a sidebar sits. `viewport`: the app's sidebar — fixed to the inline
 * start of the window, a sheet off the canvas in the compact size class.
 * `inline`: in the flow of a page (the gallery), as tall as its content.
 */
export type SidebarPlacement = 'viewport' | 'inline'

export const SidebarPlacementContext = createContext<SidebarPlacement>('viewport')

/**
 * What the sidebar looks like right now. `open`: labels beside icons.
 * `rail`: icons only, each with a tooltip and its name. `sheet`: off the
 * canvas, opened by `SidebarTrigger` (compact size class, `viewport` only).
 */
export type SidebarMode = 'open' | 'rail' | 'sheet'

/** The state of the sidebar a component sits in or beside; needs a `SidebarProvider` above. */
export function useSidebar() {
  const kit = useKitSidebar()
  const placement = useContext(SidebarPlacementContext)
  const mode: SidebarMode = placement === 'viewport' && kit.isMobile ? 'sheet' : kit.state === 'collapsed' ? 'rail' : 'open'
  return {
    placement,
    mode,
    /** Open with labels (`true`) or folded into the rail (`false`). Not the sheet. */
    open: kit.open,
    setOpen: kit.setOpen,
    /** Whether the compact sheet is showing. */
    sheetOpen: kit.openMobile,
    setSheetOpen: kit.setOpenMobile,
    /** What `SidebarTrigger` does: the sheet in the compact class, open ↔ rail otherwise. */
    toggle: kit.toggleSidebar,
  }
}
