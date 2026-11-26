import type { ComponentProps, ReactNode } from 'react'

import { Toggle as KitToggle } from '@/components/ui/toggle'

import { kitToggleSize, kitToggleVariant, toggleClass, type ToggleSize, type ToggleVariant } from './toggle-class'

export type ToggleProps = Omit<ComponentProps<typeof KitToggle>, 'className' | 'style' | 'variant' | 'size' | 'children'> & {
  variant?: ToggleVariant
  size?: ToggleSize
  /** The label. A toggle showing only an icon needs `aria-label`; the icon is `aria-hidden`. */
  children: ReactNode
}

/** A button that stays pressed: one setting, on or off, shown where it is used. */
export function Toggle({ variant = 'outline', size = 'md', ...rest }: ToggleProps) {
  return <KitToggle {...rest} variant={kitToggleVariant[variant]} size={kitToggleSize[size]} className={toggleClass[size]} />
}
