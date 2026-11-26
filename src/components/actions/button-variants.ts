import { buttonVariants as kitButtonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export const buttonVariants = ['primary', 'secondary', 'ghost', 'danger', 'link'] as const
export type ButtonVariant = (typeof buttonVariants)[number]

export const buttonSizes = ['sm', 'md', 'icon'] as const
export type ButtonSize = (typeof buttonSizes)[number]

// The one deviation from stock (docs/design/components/actions.md § Deviations
// from stock): the kit's button is one unbreakable line at a fixed height, so
// a long label pushes a 320 px page sideways. Ours keeps the kit's height as
// a minimum and lets the label wrap. A label that fits is drawn exactly as stock.
const wraps = 'h-auto max-w-full shrink py-1 text-center whitespace-normal wrap-anywhere'
const sizeClass: Record<ButtonSize, string | undefined> = {
  sm: `min-h-7 ${wraps}`,
  md: `min-h-8 ${wraps}`,
  // No label, nothing to wrap: the kit's square.
  icon: undefined,
}

// Our variant names → the kit's. `secondary` is the kit's outlined button,
// the stock look of a second action beside a primary one.
const kitVariant = {
  primary: 'default',
  secondary: 'outline',
  ghost: 'ghost',
  danger: 'destructive',
  link: 'link',
} as const

const kitSize = { sm: 'sm', md: 'default', icon: 'icon' } as const

type Look = { variant?: ButtonVariant; size?: ButtonSize }

/**
 * What the wrapper hands the kit's button: the kit's own variant and size —
 * the button is drawn as stock shadcn/ui draws it (D-43) — and the wrapping
 * of a label that does not fit.
 */
export function kitButtonProps({ variant = 'primary', size = 'md' }: Look = {}) {
  return {
    variant: kitVariant[variant],
    size: kitSize[size],
    className: sizeClass[size],
  }
}

/**
 * The classes of a `Button`, for the rare element that must look like one
 * without being one — a router link shown as a button. Use `Button` itself
 * for anything that acts.
 */
export function buttonClass(look: Look = {}) {
  const { variant, size, className } = kitButtonProps(look)
  return cn(kitButtonVariants({ variant, size }), className)
}
