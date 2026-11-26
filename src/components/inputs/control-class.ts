import { focusRingOverInvalid } from '@/components/actions/focus-ring'

// What `wrapped` adds to a text control: the target minimum with height
// `auto`, the focus ring kept while invalid, and a read-only state that is
// told by a dashed edge as well as by its fill.
export const controlClass = `h-auto min-h-target ${focusRingOverInvalid} [&[readonly]]:border-dashed [&[readonly]]:bg-muted`

/** Inside an `InputGroup` the group draws the border and the ring. */
export const groupedControlClass = 'h-auto min-h-target'
