import { focusRingOverInvalid } from '@/components/actions/focus-ring'

// What `wrapped` adds to a text control: the focus ring kept while invalid,
// and a read-only state told by a dashed edge as well as by its fill.
export const stateClass = `${focusRingOverInvalid} [&[readonly]]:border-dashed [&[readonly]]:bg-muted`

/** A one-line control: the target minimum with height `auto`, plus the states. */
export const controlClass = `h-auto min-h-target ${stateClass}`

/** Inside an `InputGroup` the group draws the border and the ring. */
export const groupedControlClass = 'h-auto min-h-target'
