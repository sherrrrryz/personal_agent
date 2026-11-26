import { useState, type MouseEvent } from 'react'
import { Outlet } from 'react-router'

import { focusRing } from '@/components/actions/focus-ring'
import { SidebarProvider } from '@/components/navigation'
import { useT } from '@/i18n'

import { AppSidebar } from './AppSidebar'
import { useShellRoute } from './route'
import { ShellHeader } from './ShellHeader'
import type { ShellSlots } from './slots'
import { expandedQuery, useMediaQuery } from './use-media'
import { usePageHeading } from './use-page-heading'

// Hidden until it takes focus, then drawn over the corner of the page.
const skipClass = `sr-only focus:not-sr-only focus:fixed focus:start-2 focus:top-2 focus:z-50 focus:inline-flex focus:items-center focus:rounded-md focus:border focus:bg-background focus:px-3 focus:underline focus:underline-offset-4 ${focusRing}`

/**
 * What surrounds every screen (spec part 2 § Shell). Inside the shell: a skip
 * link, the sidebar at the inline start, then a column of header, `main` and
 * the bottom row. `main` is the one part that scrolls; the bottom row is a
 * row of the layout, never an overlay, so it cannot cover the page or the
 * focused element. A bare route (onboarding, `/dev/*`, not-found) gets `main`
 * alone — `route.ts` says which is which.
 *
 * Size classes (spec part 1 § Responsive): expanded — sidebar open; medium —
 * icon rail; compact — the kit's sheet, opened from the header. The trigger
 * switches open and rail; that choice lasts until the size class changes.
 *
 * `slots` replaces what the route and the chat provide — for a test.
 */
export function Shell({ slots }: { slots?: ShellSlots }) {
  const t = useT('shell')
  const route = useShellRoute()
  const { main, heading } = usePageHeading()

  const expanded = useMediaQuery(expandedQuery)
  const [choice, setChoice] = useState<{ expanded: boolean; open: boolean } | null>(null)
  // A choice made in one size class is forgotten when the class changes.
  if (choice && choice.expanded !== expanded) setChoice(null)
  const open = choice && choice.expanded === expanded ? choice.open : expanded

  if (route.chrome === 'bare') {
    return (
      <main id="main" ref={main} tabIndex={-1}>
        <Outlet />
      </main>
    )
  }

  const { chatBar: ChatBar, sidebarRecent } = slots ?? route.slots
  const skip = (event: MouseEvent) => {
    // Focus moves; the address keeps no `#main` for the router to carry along.
    event.preventDefault()
    main.current?.focus()
  }

  return (
    <>
      <a href="#main" className={skipClass} onClick={skip}>
        {t('skip')}
      </a>
      <SidebarProvider open={open} onOpenChange={(next) => setChoice({ expanded, open: next })}>
        <AppSidebar recent={sidebarRecent} />
        <div className="flex h-svh min-w-0 flex-1 flex-col overflow-x-clip overflow-y-auto" data-shell="">
          <ShellHeader heading={heading} />
          {/*
            Sideways the page is cut, not scrolled: a screen that is too wide
            then fails the matrix as clipped text instead of passing with a
            scroll bar nobody looked for. The minimum keeps `main` reachable
            in a short window; the column scrolls as a whole when even that
            does not fit.
          */}
          <main id="main" ref={main} tabIndex={-1} className="relative min-h-48 flex-1 overflow-x-clip overflow-y-auto">
            <Outlet />
          </main>
          {ChatBar && (
            <div className="border-t" data-shell-bar="">
              <ChatBar />
            </div>
          )}
        </div>
      </SidebarProvider>
    </>
  )
}
