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

// The overlay is drawn as stock shadcn/ui draws it — scrim, radius (D-43) —
// with two additions. It is never taller than the window, and what does not
// fit scrolls inside it (invisible at the default size). And it floats over
// the page, so it is a frosted surface (D-47): `surface-frosted` in
// `src/index.css` replaces the kit's background and shadow.
export const overlaySurface = 'surface-frosted max-h-full overflow-y-auto'
