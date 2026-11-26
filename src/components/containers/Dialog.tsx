import type { ReactNode } from 'react'

import {
  Dialog as KitDialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'

import { overlaySurface, rootProps, type OverlayControl } from './overlay-control'
import { CloseButton } from './overlay-parts'

export type DialogProps = OverlayControl & {
  /** The heading; it names the dialog. */
  title: ReactNode
  /** One or two sentences under the title; the dialog's description. */
  description?: ReactNode
  /** The actions: our `Button`s. They wrap beneath the content. */
  footer?: ReactNode
  children?: ReactNode
}

/**
 * A task that interrupts the page: focus moves in, stays in, and returns to
 * the trigger; Escape, the close button or a press outside closes it.
 */
export function Dialog({ trigger, title, description, footer, children, ...control }: DialogProps) {
  return (
    <KitDialog {...rootProps(control)}>
      {trigger && <DialogTrigger render={trigger} />}
      <DialogContent showCloseButton={false} className={overlaySurface}>
        <div className="flex items-start gap-2">
          <DialogHeader className="min-w-0 flex-1 py-2">
            <DialogTitle className="leading-snug wrap-anywhere">{title}</DialogTitle>
            {description != null && <DialogDescription className="wrap-anywhere">{description}</DialogDescription>}
          </DialogHeader>
          <DialogClose render={<CloseButton />} />
        </div>
        {children != null && <div className="min-w-0 wrap-anywhere">{children}</div>}
        {footer != null && <DialogFooter className="flex-wrap">{footer}</DialogFooter>}
      </DialogContent>
    </KitDialog>
  )
}
