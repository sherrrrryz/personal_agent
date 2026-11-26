export const toggleVariants = ['outline', 'ghost'] as const
export type ToggleVariant = (typeof toggleVariants)[number]

export const toggleSizes = ['sm', 'md'] as const
export type ToggleSize = (typeof toggleSizes)[number]

/** Our names → the kit's. */
export const kitToggleVariant = { outline: 'outline', ghost: 'default' } as const
export const kitToggleSize = { sm: 'sm', md: 'default' } as const

// The one deviation from stock for a toggle (docs/design/components/actions.md
// § Deviations from stock): the kit's toggle is one unbreakable line at a
// fixed height; ours keeps the kit's height as a minimum and lets a label
// that does not fit wrap. A label that fits, and the pressed state, are drawn
// exactly as stock (D-43).
const wraps = 'h-auto max-w-full shrink py-1 text-center whitespace-normal wrap-anywhere'

/** A `Toggle`, by our size. */
export const toggleClass: Record<ToggleSize, string> = { sm: `min-h-7 ${wraps}`, md: `min-h-8 ${wraps}` }

/** An item of a `ToggleGroup`: the kit writes the group's size on it as `data-size`. */
export const toggleItemClass = `min-h-7 data-[size=default]:min-h-8 ${wraps}`
