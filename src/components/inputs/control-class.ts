import { focusRingOverInvalid } from '@/components/actions/focus-ring'

// The text controls are drawn as stock shadcn/ui draws them (D-43). The one
// deviation (docs/design/components/inputs.md § Deviations from stock): an
// invalid control keeps the kit's focus ring while it is focused.

/** A one-line control. */
export const controlClass = focusRingOverInvalid

/** A control of several lines. */
export const stateClass = focusRingOverInvalid

/** A one-line control inside an `InputGroup`: the group draws the border and the ring. */
export const groupedControlClass: string | undefined = undefined
