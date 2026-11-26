import type { ReactNode } from 'react'

import {
  Dialog as KitDialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'

import { useT } from '@/i18n'

import { overlaySurface, rootProps, type OverlayControl } from './overlay-control'

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
  const t = useT('navigation')
  return (
    <KitDialog {...rootProps(control)}>
      {trigger && <DialogTrigger render={trigger} />}
      {/* The kit's own close button, named in the user's language. */}
      <DialogContent closeLabel={t('overlay.close')} className={overlaySurface}>
        <DialogHeader>
          <DialogTitle className="wrap-anywhere">{title}</DialogTitle>
          {description != null && <DialogDescription className="wrap-anywhere">{description}</DialogDescription>}
        </DialogHeader>
        {children != null && <div className="min-w-0 wrap-anywhere">{children}</div>}
        {footer != null && <DialogFooter>{footer}</DialogFooter>}
      </DialogContent>
    </KitDialog>
  )
}
