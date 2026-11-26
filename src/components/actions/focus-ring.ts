// The focus ring of every wrapped control, as classes.
//
// The kit draws it on `:focus-visible` as a ring of `ring` at half opacity,
// three pixels wide, plus a border in `ring`. That ring, composited over
// `background`, `card` and `sidebar`, measures at least 3:1 in both modes
// (`focus-ring.test.tsx`; the pairs are in `docs/design/components/actions.md`).
//
// Two kit states swap it for a fainter one — a `destructive` button
// (20% / 40% of `destructive`) and an invalid field (the same tint, which
// outranks `:focus-visible`). A focused control must show the same ring in
// every state, so the wrappers restate it for those two. Under forced colours
// the global outline rule of `src/index.css` takes over.

/** The ring as the kit draws it. Kit controls already carry it; a control we lay out ourselves adds it. */
export const focusRing = 'outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50'

/** The kit's ring restated where a kit variant replaces its colour (the `destructive` button). */
export const focusRingOverVariant =
  'focus-visible:border-ring focus-visible:ring-ring/50 dark:focus-visible:ring-ring/50'

/** The ring restated for an invalid control: focus outranks the invalid tint while the control is focused. */
export const focusRingOverInvalid =
  'aria-invalid:focus-visible:border-ring aria-invalid:focus-visible:ring-ring/50 dark:aria-invalid:focus-visible:border-ring dark:aria-invalid:focus-visible:ring-ring/50'
