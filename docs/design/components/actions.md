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

## Accessibility contract

One row per component of the registry above; the reviewer tests against it
(`../ACCESSIBILITY.md` § Per-component contract). Min target is 44 × 44 CSS px
through `size.target.min` for anything interactive.

| Component | Role | Name comes from | Keyboard | Focus | Min target | Announces |
| --- | --- | --- | --- | --- | --- | --- |
| `Button` | Native `button` | Its text; `size: icon` requires `aria-label` (type-enforced); an icon beside text is `aria-hidden` | Tab reaches it, Enter and Space press it; `disabled` leaves the tab order, `loading` stays in it | The focus ring below, in every variant and state | 44 × 44 CSS px, text or icon-only | `loading`: `aria-busy` and `aria-disabled`, the label stays, the spinner is hidden from assistive technology |
