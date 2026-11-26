import type { ReactNode } from 'react'

import { Button } from '@/components/actions'
import {
  AlertDialog as KitAlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { useT } from '@/i18n'

import { overlaySurface, rootProps, type OverlayControl } from './overlay-control'

export type AlertDialogProps = OverlayControl & {
  /** The question; it names the dialog. */
  title: ReactNode
  /** What will happen if the user confirms. */
  description: ReactNode
  /** The words of the confirming button: the action itself, not "OK". */
  confirmLabel: ReactNode
  /** `danger` for an action that removes or stops something. */
  confirmVariant?: 'primary' | 'danger'
  onConfirm: () => void
  /** "Cancel" in the user's language unless set. */
  cancelLabel?: ReactNode
}

/**
 * A question that must be answered before going on. Focus starts on the
 * cancelling button; a press outside does not close it, Escape cancels.
 */
export function AlertDialog({
  trigger,
  title,
  description,
  confirmLabel,
  confirmVariant = 'primary',
  onConfirm,
  cancelLabel,
  ...control
}: AlertDialogProps) {
  const t = useT('navigation')
  const cancel = cancelLabel ?? t('overlay.cancel')
  return (
    <KitAlertDialog {...rootProps(control)}>
      {trigger && <AlertDialogTrigger render={trigger} />}
      <AlertDialogContent className={overlaySurface}>
        <AlertDialogHeader>
          <AlertDialogTitle className="wrap-anywhere">{title}</AlertDialogTitle>
          <AlertDialogDescription className="wrap-anywhere">{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex-wrap">
          {/* Both buttons close the dialog, so both are the kit's closing part, rendered as our `Button`. */}
          <AlertDialogCancel render={<Button variant="secondary">{cancel}</Button>} />
          <AlertDialogCancel
            render={
              <Button variant={confirmVariant} onClick={onConfirm}>
                {confirmLabel}
              </Button>
            }
          />
        </AlertDialogFooter>
      </AlertDialogContent>
    </KitAlertDialog>
  )
}
