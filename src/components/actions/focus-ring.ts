// The focus ring of a control we lay out ourselves, as classes.
//
// The kit draws it on `:focus-visible` as a ring of `ring` at half opacity,
// three pixels wide, plus a border in `ring`. Kit controls already carry it
// and are not restated (D-43) — with one exception, below. Under forced
// colours the global outline rule of `src/index.css` takes over.

/** The ring as the kit draws it. Kit controls already carry it; a control we lay out ourselves adds it. */
export const focusRing = 'outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50'

/**
 * The ring restated for an invalid control. The kit draws an invalid field
 * with a `destructive` border and ring that outrank `:focus-visible`, so a
 * focused invalid field looks exactly like an unfocused one — the focus is
 * lost (WCAG 2.4.7). This puts the kit's own ring back while the field is
 * focused; nothing changes in any other state.
 */
export const focusRingOverInvalid =
  'aria-invalid:focus-visible:border-ring aria-invalid:focus-visible:ring-ring/50 dark:aria-invalid:focus-visible:border-ring dark:aria-invalid:focus-visible:ring-ring/50'
