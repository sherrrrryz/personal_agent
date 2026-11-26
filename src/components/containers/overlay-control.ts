import type { ReactElement } from 'react'

// Shared by `Dialog`, `AlertDialog` and `Sheet` — not components of the system.

/** How an overlay is opened: by its `trigger`, by `open` from outside, or both. */
export type OverlayControl = {
  /** What opens it: our `Button`. Focus returns to it on close. */
  trigger?: ReactElement
  open?: boolean
  defaultOpen?: boolean
  onOpenChange?: (open: boolean) => void
}

/** The root props the kit takes, from ours. */
export function rootProps({ open, defaultOpen, onOpenChange }: OverlayControl) {
  return { open, defaultOpen, onOpenChange: onOpenChange ? (next: boolean) => onOpenChange(next) : undefined }
}

// No scrim and no shadow in the placeholder theme: an overlay separates from
// the page by its border. It is never taller than the window; what does not
// fit scrolls inside it.
export const overlaySurface = 'max-h-full overflow-y-auto border'
