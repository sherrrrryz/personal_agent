# Components — blocks

> Status: evergreen — the registry rows and the accessibility contract of
> the block renderer and the blocks that carry text, an empty page and a proposal. Contract every component meets, conventions and the
> index of families: `../COMPONENTS.md`.

<!--
HOW TO BUILD THIS FILE
- Skeleton written by package S1b of task 1; the rows are written by package
  S9 (`docs/specs/lofi-prototype-shell.md`, criteria R-10, R-11), in the same change
  that adds each component. One writer: nobody else edits this file.
- Admitted by the spec for this family: `BlockRenderer`, `block.text`, `block.empty`, `block.proposal`.
- A row here and the code must agree — `src/test/registry-parity.test.ts`
  fails otherwise (`../COMPONENTS.md` § Conventions, "One component, one row").
-->

Code: `src/block-renderer/` and `src/blocks/<name>/`.

## Registry

One row per component. The Component cell is the id of a block (`` `block.<name>` ``) or the component's name in
backticks and nothing else. Source: `kit` · `wrapped` · `new` · `dependency`;
Status: `lofi` · `styled` · `deprecated → <replacement>` (`../COMPONENTS.md`
§ Registry).

| Component | Source | Variants | Status | Notes |
| --- | --- | --- | --- | --- |

## Accessibility contract

One row per component of the registry above; the reviewer tests against it
(`../ACCESSIBILITY.md` § Per-component contract). Min target is 44 × 44 CSS px
through `size.target.min` for anything interactive.

| Component | Role | Name comes from | Keyboard | Focus | Min target | Announces |
| --- | --- | --- | --- | --- | --- | --- |
