// The gap names of the layout primitives. Each is a step of the spacing
// scale (Tailwind's, as shipped — TOKENS.md § Placeholder theme); a screen
// names a step and never writes a number.
export const gapClass = {
  none: 'gap-0',
  xs: 'gap-1',
  sm: 'gap-2',
  md: 'gap-4',
  lg: 'gap-6',
  xl: 'gap-8',
  '2xl': 'gap-12',
} as const

export type Gap = keyof typeof gapClass

/** Every gap name, smallest first. */
export const gaps = Object.keys(gapClass) as Gap[]
