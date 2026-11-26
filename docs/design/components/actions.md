# Components — actions

> Status: evergreen — the registry rows and the accessibility contract of
> the controls that do something when pressed. Contract every component meets, conventions and the
> index of families: `../COMPONENTS.md`.

<!--
HOW TO BUILD THIS FILE
- Skeleton written by package S1b of task 1; the rows are written by package
  S3 (`docs/specs/lofi-prototype-system.md`, criteria A-13), in the same change
  that adds each component. One writer: nobody else edits this file.
- Admitted by the spec for this family: the action controls among `Button`, `Toggle`, `ToggleGroup`, `BehaviourModePicker` (S3 places each in this file or in `inputs.md`).
- A row here and the code must agree — `src/test/registry-parity.test.ts`
  fails otherwise (`../COMPONENTS.md` § Conventions, "One component, one row").
-->

Code: `src/components/actions/`.

## Registry

One row per component. The Component cell is the component's name in
backticks and nothing else. Source: `kit` · `wrapped` · `new` · `dependency`;
Status: `lofi` · `styled` · `deprecated → <replacement>` (`../COMPONENTS.md`
§ Registry).

| Component | Source | Variants | Status | Notes |
| --- | --- | --- | --- | --- |
| `Button` | `wrapped` | `variant: primary · secondary · ghost · danger · link` (default `primary`); `size: sm · md · icon` (default `md`); `loading` | `lofi` | The kit's button at the target minimum in both directions, height `auto`, label wraps. `secondary` is the kit's outlined button (a 3:1 edge in the grey theme); `link` is always underlined; `danger` is told by its label and icon, not by colour. `type` is `button` unless set. `buttonClass({ variant, size })` gives the same look to a router link — nothing else |
| `Toggle` | `wrapped` | `variant: outline · ghost` (default `outline`); `size: sm · md` (default `md`) | `lofi` | A button that stays pressed. Target minimum, height `auto`, label wraps. Pressed is a `primary` fill **and** a bar under the content drawn as a border, so the state survives the grey theme and forced colours (D-18) — the kit's `muted` fill alone does neither |
| `ToggleGroup` | `wrapped` | `multiple`; `required` (single choice: one item stays pressed); `variant`, `size` as `Toggle`; `orientation: horizontal · vertical`; sub-part `ToggleGroupItem` (`value`, `disabled`) | `lofi` | Single choice gives and takes one value or `null`; `multiple` an array. Items wrap onto new lines when the row runs out of room. Always named (`aria-label` or `aria-labelledby`, type-enforced) |

## Accessibility contract

One row per component of the registry above; the reviewer tests against it
(`../ACCESSIBILITY.md` § Per-component contract). Min target is 44 × 44 CSS px
through `size.target.min` for anything interactive.

| Component | Role | Name comes from | Keyboard | Focus | Min target | Announces |
| --- | --- | --- | --- | --- | --- | --- |
| `Button` | Native `button` | Its text; `size: icon` requires `aria-label` (type-enforced); an icon beside text is `aria-hidden` | Tab reaches it, Enter and Space press it; `disabled` leaves the tab order, `loading` stays in it | The focus ring below, in every variant and state | 44 × 44 CSS px, text or icon-only | `loading`: `aria-busy` and `aria-disabled`, the label stays, the spinner is hidden from assistive technology |
| `Toggle` | Native `button` with `aria-pressed` | Its text; an icon-only toggle needs `aria-label` | Tab reaches it; Enter and Space flip it | The focus ring below | 44 × 44 CSS px | `aria-pressed` |
| `ToggleGroup` | `group` of `button`s with `aria-pressed` | The group: `aria-label` / `aria-labelledby` (required). Each item: its text | One tab stop; arrow keys move between items (looping), Enter and Space press; Tab leaves | The ring on the focused item, drawn above its neighbours | Each item 44 × 44 CSS px | `aria-pressed` per item; a disabled item is `disabled` |

## The focus ring

Every wrapped control of the two families shows the same ring on
`:focus-visible`: the kit's — `ring` at half opacity, three pixels wide, with a
border in `ring` (`src/components/actions/focus-ring.ts`). Two kit states
replace it with a fainter tint (a `destructive` button; an invalid field,
whose tint outranks `:focus-visible`); the wrappers restate the ring for both,
so a focused control looks the same in every state. Under forced colours the
outline rule of `src/index.css` takes over.

## Pitfalls

### A wrapped kit control shows the kit's default look under another variant

**Rule:** pass the kit's own `variant` and `size` props to the kit component and add only our classes in `className` — never the whole class list (`button-variants.ts`, `kitButtonProps`).

The kit component always prepends the classes of its default variant. A
`ghost` class list has no fill of its own to replace the default's
`bg-primary`, so it survives the merge and every variant renders filled, with
no error. `Button.test.tsx` holds each variant to exactly `buttonClass`.

### A kit minimum survives beside `min-w-target` / `min-h-target`

**Rule:** do not rely on `cn` to drop a kit `min-w-8` or `min-h-16` when adding a `*-target` utility; check which one the stylesheet declares last.

`cn` does not know the `target` step, so both classes stay. Tailwind declares
numbered steps before named ones, so `min-w-target` wins over `min-w-8`
(`Toggle`) — and `min-h-target` would also win over the kit's taller
`min-h-16`, which is why `Textarea` does not add it. The matrix measures the
result.

### A class name assembled at run time produces no CSS

**Rule:** write every utility out in full in the source; share a set of classes as one string constant, never as pieces joined by a template.

Tailwind reads class names from the source text. `` `has-${selector}:ring-3` ``
compiles, renders the class on the element, and has no rule behind it.

### A test of a kit popup passes alone and fails in the full suite

**Rule:** after a press, wait for what the kit does next — `findByRole` for the popup, `waitFor(… toHaveFocus())` for focus inside it — before the next key; never assert that a popup is absent straight after a click.

Base UI draws a popup, and moves focus into it, a moment after the press. A
key sent in between is lost (`End` in a menu that has not focused its first
item yet), and "no listbox after a click" is true only for that moment: a
read-only `Select` does open, to be read, and locks only the value. Both
passed in their own package and failed about one run in four once the merged
suite loaded the machine (`I3`).
