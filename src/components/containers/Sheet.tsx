import type { ReactNode } from 'react'

import {
  Sheet as KitSheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'

import { useT } from '@/i18n'

import { overlaySurface, rootProps, type OverlayControl } from './overlay-control'

export type SheetProps = OverlayControl & {
  /** Where it slides in from: the inline end of the window, or the bottom (the compact size class). */
  side?: 'end' | 'bottom'
  /** The heading; it names the sheet. */
  title: ReactNode
  description?: ReactNode
  /** The actions: our `Button`s. */
  footer?: ReactNode
  children?: ReactNode
}

const kitSide = { end: 'right', bottom: 'bottom' } as const

/**
 * A panel beside the page for detail and history: focus moves in, stays in,
 * and returns to the trigger; Escape, the close button or a press outside closes it.
 */
export function Sheet({ trigger, side = 'end', title, description, footer, children, ...control }: SheetProps) {
  const t = useT('navigation')
  return (
    <KitSheet {...rootProps(control)}>
      {trigger && <SheetTrigger render={trigger} />}
      {/* The kit's own close button, named in the user's language. */}
      <SheetContent side={kitSide[side]} closeLabel={t('overlay.close')} className={overlaySurface}>
        <SheetHeader>
          <SheetTitle className="wrap-anywhere">{title}</SheetTitle>
          {description != null && <SheetDescription className="wrap-anywhere">{description}</SheetDescription>}
        </SheetHeader>
        {children != null && <div className="min-w-0 px-4 wrap-anywhere">{children}</div>}
        {footer != null && <SheetFooter>{footer}</SheetFooter>}
      </SheetContent>
    </KitSheet>
  )
}
