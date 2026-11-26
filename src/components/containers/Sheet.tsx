import type { ReactNode } from 'react'

import {
  Sheet as KitSheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'

import { overlaySurface, rootProps, type OverlayControl } from './overlay-control'
import { CloseButton } from './overlay-parts'

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
  return (
    <KitSheet {...rootProps(control)}>
      {trigger && <SheetTrigger render={trigger} />}
      <SheetContent side={kitSide[side]} showCloseButton={false} className={`gap-0 ${overlaySurface}`}>
        <div className="flex items-start gap-2 p-2">
          <SheetHeader className="min-w-0 flex-1 p-2">
            <SheetTitle className="wrap-anywhere">{title}</SheetTitle>
            {description != null && <SheetDescription className="wrap-anywhere">{description}</SheetDescription>}
          </SheetHeader>
          <SheetClose render={<CloseButton />} />
        </div>
        {children != null && <div className="min-w-0 px-4 pb-4 wrap-anywhere">{children}</div>}
        {footer != null && <SheetFooter className="flex-row flex-wrap">{footer}</SheetFooter>}
      </SheetContent>
    </KitSheet>
  )
}
