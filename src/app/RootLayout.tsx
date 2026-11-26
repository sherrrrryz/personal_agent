import { Outlet } from 'react-router'

/**
 * The element of the root route: what surrounds every screen. Until the app
 * shell exists (part 2, package S7) that is the `main` landmark alone; S7
 * replaces the layout line below with the shell, which renders `main` itself.
 */
export function RootLayout() {
  return (
    <main>
      <Outlet />
    </main>
  )
}
