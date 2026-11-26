export const toggleVariants = ['outline', 'ghost'] as const
export type ToggleVariant = (typeof toggleVariants)[number]

export const toggleSizes = ['sm', 'md'] as const
export type ToggleSize = (typeof toggleSizes)[number]

/** Our names → the kit's. */
export const kitToggleVariant = { outline: 'outline', ghost: 'default' } as const
export const kitToggleSize = { sm: 'sm', md: 'default' } as const

// What `wrapped` adds to a toggle: the target minimum, height `auto`, text
// that wraps — and a pressed state that survives the grey theme and forced
// colours. The kit marks "pressed" with `muted` alone, which is invisible on
// `background` here and is discarded by forced colours (D-18). Ours fills the
// toggle with `primary` and draws a bar under its content; the bar is a
// border, so forced colours keep it.
export const toggleClass =
  'relative h-auto min-h-target min-w-target max-w-full shrink py-1.5 text-center whitespace-normal wrap-anywhere aria-pressed:border-primary aria-pressed:bg-primary aria-pressed:text-primary-foreground aria-pressed:hover:bg-primary aria-pressed:hover:text-primary-foreground after:absolute after:inset-x-2 after:bottom-1 after:hidden after:border-b-2 after:border-current aria-pressed:after:block'
