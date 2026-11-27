import { useState, type MouseEvent } from 'react'
import { Outlet } from 'react-router'

import { focusRing } from '@/components/actions/focus-ring'
import { SidebarProvider } from '@/components/navigation'
import { useT } from '@/i18n'

import { AppSidebar } from './AppSidebar'
import { useShellRoute } from './route'
import { ShellHeader } from './ShellHeader'
import type { ShellSlots } from './slots'
import { useBarSizes } from './use-bar-sizes'
import { expandedQuery, useMediaQuery } from './use-media'
import { usePageHeading } from './use-page-heading'

// Hidden until it takes focus, then drawn over the corner of the page.
const skipClass = `sr-only focus:not-sr-only focus:fixed focus:start-2 focus:top-2 focus:z-50 focus:inline-flex focus:items-center focus:rounded-md focus:border focus:bg-background focus:px-3 focus:underline focus:underline-offset-4 ${focusRing}`

/**
 * What surrounds every screen (spec part 2 § Shell). Inside the shell: a skip
 * link, the sidebar at the inline start, then a column of header, `main` and
 * the bottom row. All three stand in the one cell of a grid: `main` is the one
 * part that scrolls and fills the cell, the header is laid at its start and
 * the bottom row at its end — both frosted surfaces (D-47), so the page
 * scrolls beneath them. Neither is taken out of the flow. `main` keeps their
 * room as padding and as `scroll-padding` (`useBarSizes` measures both), so
 * the first and last content and the focused element are never left under a
 * bar.
 * A bare route (onboarding, `/dev/*`, not-found) gets `main` alone —
 * `route.ts` says which is which.
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

  const { chatBar: ChatBar, sidebarRecent } = slots ?? route.slots
  const shell = useBarSizes(route.chrome !== 'bare' && Boolean(ChatBar))

  if (route.chrome === 'bare') {
    return (
      <main id="main" ref={main} tabIndex={-1}>
        <Outlet />
      </main>
    )
  }

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
        <div
          ref={shell}
          className="grid h-svh min-w-0 flex-1 grid-cols-1 grid-rows-1 overflow-x-clip overflow-y-auto"
          data-shell=""
        >
          <ShellHeader heading={heading} />
          {/*
            Sideways the page is cut, not scrolled: a screen that is too wide
            then fails the matrix as clipped text instead of passing with a
            scroll bar nobody looked for. The minimum keeps `main` reachable
            in a short window; the column scrolls as a whole when even that
            does not fit. `isolate`: nothing a screen stacks rises over the
            two bars. The padding is the bars' room, the scroll padding keeps
            a focused control out from under them.
          */}
          <main
            id="main"
            ref={main}
            tabIndex={-1}
            className="relative isolate col-start-1 row-start-1 min-h-48 scroll-pt-(--shell-header-size) scroll-pb-(--shell-bar-size) overflow-x-clip overflow-y-auto pt-(--shell-header-size) pb-(--shell-bar-size)"
          >
            <Outlet />
          </main>
          {ChatBar && (
            <div className="surface-frosted z-10 col-start-1 row-start-1 self-end border-t bg-background" data-shell-bar="">
              <ChatBar />
            </div>
          )}
        </div>
      </SidebarProvider>
    </>
  )
}
