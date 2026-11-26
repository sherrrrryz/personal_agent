import { buttonVariants as kitButtonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'

import { focusRingOverInvalid, focusRingOverVariant } from './focus-ring'

export const buttonVariants = ['primary', 'secondary', 'ghost', 'danger', 'link'] as const
export type ButtonVariant = (typeof buttonVariants)[number]

export const buttonSizes = ['sm', 'md', 'icon'] as const
export type ButtonSize = (typeof buttonSizes)[number]

// Our variant names → the kit's. `secondary` is the kit's outlined button:
// in the all-grey placeholder theme the kit's filled `secondary` has no edge
// against the page, and a control needs a 3:1 boundary.
const kitVariant = {
  primary: 'default',
  secondary: 'outline',
  ghost: 'ghost',
  danger: 'destructive',
  link: 'link',
} as const

const kitSize = { sm: 'sm', md: 'default', icon: 'icon' } as const

// What `wrapped` adds (COMPONENTS.md § Conventions): the target token as the
// minimum block and inline size, height `auto`, text that wraps, and a
// control that shrinks with its container instead of pushing it wide.
const wrapped =
  'h-auto min-h-target min-w-target max-w-full shrink py-1.5 text-center whitespace-normal wrap-anywhere'

const variantClass: Record<ButtonVariant, string> = {
  primary: '',
  secondary: '',
  ghost: '',
  // The kit tints this ring with `destructive`; a focused control shows the same ring everywhere.
  danger: focusRingOverVariant,
  // A link is never told apart by colour alone: the underline is always there.
  link: 'underline',
}

const sizeClass: Record<ButtonSize, string> = {
  sm: '',
  md: '',
  // The kit's icon size is a fixed square; ours is the target minimum.
  icon: 'size-auto p-0',
}

type Look = { variant?: ButtonVariant; size?: ButtonSize }

/** What the wrapper hands the kit's button: the kit's own variant and size, and what `wrapped` adds on top. */
export function kitButtonProps({ variant = 'primary', size = 'md' }: Look = {}) {
  return {
    variant: kitVariant[variant],
    size: kitSize[size],
    className: cn(wrapped, focusRingOverInvalid, variantClass[variant], sizeClass[size]),
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
