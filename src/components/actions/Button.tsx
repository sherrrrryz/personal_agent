import type { ComponentProps, ReactNode } from 'react'

import { Button as KitButton } from '@/components/ui/button'
import { Spinner } from '@/components/ui/spinner'

import { kitButtonProps, type ButtonSize, type ButtonVariant } from './button-variants'

type KitButtonProps = Omit<ComponentProps<typeof KitButton>, 'className' | 'style' | 'variant' | 'size' | 'children'>

type Common = KitButtonProps & {
  variant?: ButtonVariant
  /**
   * The action is running: the button stays focusable and keeps its label,
   * announces itself as busy, and does not act again until it ends.
   */
  loading?: boolean
}

type WithText = Common & {
  size?: Exclude<ButtonSize, 'icon'>
  /** The label; an icon beside it is decorative (`aria-hidden`). */
  children: ReactNode
}

type IconOnly = Common & {
  size: 'icon'
  /** An icon-only button has no visible label, so its name is required. */
  'aria-label': string
  /** The icon. */
  children: ReactNode
}

export type ButtonProps = WithText | IconOnly

/** The kit's button as stock shadcn/ui draws it (D-43). `type` is `button` unless set. */
export function Button({ variant = 'primary', size = 'md', loading = false, disabled, children, ...rest }: ButtonProps) {
  return (
    <KitButton
      type="button"
      {...rest}
      {...kitButtonProps({ variant, size })}
      disabled={disabled || loading}
      // A busy button keeps the focus it had; a disabled one leaves the tab order.
      focusableWhenDisabled={loading || rest.focusableWhenDisabled}
      aria-busy={loading || undefined}
    >
      {loading && <Spinner role={undefined} aria-hidden="true" />}
      {loading && size === 'icon' ? null : children}
    </KitButton>
  )
}
