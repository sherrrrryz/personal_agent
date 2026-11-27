/**
 * The floating panel of a shell bar — the header and the chat bar row (D-50):
 * frosted (D-47: the `surface-frosted` class, with `bg-background` as its
 * fallback), rounded on every corner and ringed like a card. The bar around it
 * is a transparent row with room on every side (`p-2`, `pointer-events-none`),
 * so the page shows, and is clicked, around the panel; the panel takes the
 * pointer back.
 */
export const shellPanelClass = 'surface-frosted pointer-events-auto rounded-xl bg-background ring-1 ring-foreground/10'
