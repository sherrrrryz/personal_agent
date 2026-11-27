import { Sonner } from '@/components/feedback'
import { ModuleSettingsPanelsContext } from '@/module'
import { Shell } from '@/shell'

import { settingsPanels } from './settings-panels'

/**
 * The element of the root route: what surrounds every screen. The layout line
 * is the shell (`src/shell/`), which renders `main` and the route's screen —
 * inside sidebar, header and bottom row, or bare, as the route calls for.
 *
 * The toaster is mounted here, once, and stays the last element of the root —
 * after `main` and whatever the shell adds (the chat bar) — so that Tab reaches
 * an open toast after the page, never in the middle of it. `toast(…)` from
 * `@/components/feedback` raises one from any screen.
 *
 * Toasts appear at the top, in the middle: the bottom of the window is the
 * chat bar's row in every size class, and a toast there would cover the
 * composer she is about to type in and its send button (spec part 2 § Chat:
 * closing the in-place panel returns focus to the composer and raises one).
 */
export function RootLayout() {
  return (
    <ModuleSettingsPanelsContext value={settingsPanels}>
      <Shell />
      <Sonner position="top-center" />
    </ModuleSettingsPanelsContext>
  )
}
