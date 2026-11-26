import { Outlet } from 'react-router'

import { Sonner } from '@/components/feedback'

/**
 * The element of the root route: what surrounds every screen. Until the app
 * shell exists (part 2, package S7) that is the `main` landmark alone; S7
 * replaces the layout line below with the shell, which renders `main` itself.
 *
 * The toaster is mounted here, once, and stays the last element of the root —
 * after `main` and whatever the shell adds (the chat bar) — so that Tab reaches
 * an open toast after the page, never in the middle of it. `toast(…)` from
 * `@/components/feedback` raises one from any screen.
 */
export function RootLayout() {
  return (
    <>
      <main>
        <Outlet />
      </main>
      <Sonner />
    </>
  )
}
