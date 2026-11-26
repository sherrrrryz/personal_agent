import { useRef } from 'react'

import { Toaster } from '@/components/ui/sonner'
import { useT } from '@/i18n'
import { useTheme } from '@/theme'

import type { SonnerPosition } from './toast'
import { toastClassNames } from './toast-class'

export type SonnerProps = {
  /** Where toasts appear. Default `bottom-right`; under the narrow breakpoint of the library a toast spans the width. */
  position?: SonnerPosition
  /**
   * Set only for a second toaster on the same page: it then shows the toasts
   * raised with this `toasterId` and no others.
   */
  id?: string
}

/**
 * The toaster: mounted once, near the root, it shows what `toast(…)` raises.
 * The kit's toaster, wrapped — the mode comes from our `ThemeProvider`, the
 * region and the close control are named from the messages, every toast has a
 * close control, and toasts are listed in full instead of stacked behind one
 * another.
 */
export function Sonner({ position = 'bottom-right', id }: SonnerProps) {
  const t = useT('feedback')
  const { resolvedTheme } = useTheme()

  // Where focus was before it entered the toasts. The library keeps this too,
  // and sends focus back there whenever it leaves the list — so Tab can never
  // go on past an open toast. Its bookkeeping is kept from running (the focus
  // event stops here); Tab then follows the page, and focus goes back only
  // when the user is done with a toast: a button in it was pressed, or Escape.
  const from = useRef<HTMLElement | null>(null)
  function back() {
    const target = from.current
    from.current = null
    if (target?.isConnected) target.focus({ preventScroll: true })
  }

  return (
    <div
      data-slot="sonner"
      className="contents"
      onFocusCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) {
          from.current = event.relatedTarget instanceof HTMLElement ? event.relatedTarget : null
        }
        event.stopPropagation()
      }}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) from.current = null
      }}
      onClick={(event) => {
        if (event.target instanceof Element && event.target.closest('button')) back()
      }}
      onKeyDown={(event) => {
        if (event.key === 'Escape') back()
      }}
    >
      <Toaster
        id={id}
        position={position}
        theme={resolvedTheme}
        containerAriaLabel={t('sonner.region')}
        closeButton
        expand
        toastOptions={{
          unstyled: true,
          closeButtonAriaLabel: t('sonner.close'),
          classNames: toastClassNames,
        }}
      />
    </div>
  )
}
