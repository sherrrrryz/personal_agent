import { focusRing } from '@/components/actions/focus-ring'

/** A text link inside the frame: always underlined, at least the target size. */
export const linkClass = `inline-flex min-h-target min-w-target items-center rounded-md underline underline-offset-4 ${focusRing}`

/**
 * One of the three view links. The open one is told apart by weight, border
 * and underline together — never by colour.
 */
export const viewLinkClass = `inline-flex min-h-target min-w-target items-center justify-center rounded-md border px-3 text-center underline-offset-4 hover:underline aria-[current=page]:border-foreground aria-[current=page]:font-semibold aria-[current=page]:underline ${focusRing}`
