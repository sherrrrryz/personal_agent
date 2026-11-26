# Components — layout primitives

> Status: evergreen — the registry rows and the accessibility contract of
> the only places page padding, gaps and breakpoints are decided. Contract every component meets, conventions and the
> index of families: `../COMPONENTS.md`.

<!--
HOW TO BUILD THIS FILE
- Skeleton written by package S1b of task 1; the rows are written by package
  S2 (`docs/specs/lofi-prototype-system.md`, criteria A-10), in the same change
  that adds each component. One writer: nobody else edits this file.
- Admitted by the spec for this family: `Page`, `Stack`, `Inline`, `Grid`, `Section`.
- Demos: `/dev/components?family=layout`. `Page` cannot be nested, so the
  gallery page itself is its live demo.
- A row here and the code must agree — `src/test/registry-parity.test.ts`
  fails otherwise (`../COMPONENTS.md` § Conventions, "One component, one row").
-->

Code: `src/components/layout/`.

## Registry

One row per component. The Component cell is the component's name in
backticks and nothing else. Source: `kit` · `wrapped` · `new` · `dependency`;
Status: `lofi` · `styled` · `deprecated → <replacement>` (`../COMPONENTS.md`
§ Registry).

| Component | Source | Variants | Status | Notes |
| --- | --- | --- | --- | --- |
| `Page` | `new` | `width: prose · wide · full` (default `wide`); slots `title` (the one `h1`), `description`, `actions` | `lofi` | The content of `main`. The only place page padding is set; it steps up at the `md` and `lg` breakpoint tokens — with the shell, the only reader of the viewport. `prose` is a reading measure, `wide` the default for lists and grids, `full` for the canvas and schedules |
| `Stack` | `new` | `gap` (below; default `md`); `align: stretch · start · center · end`; `as: div · ul · ol · header · footer · article · aside · form` | `lofi` | Children one under the other, one gap between them |
| `Inline` | `new` | `gap` (default `sm`); `align: start · center · end · baseline · stretch`; `justify: start · center · end · between`; `as: div · ul · ol · header · footer · span` | `lofi` | A cluster that wraps onto new lines when room runs out; the gap applies in both directions |
| `Grid` | `new` | `min: 3xs · xs · sm · lg` (default `xs`); `gap` (default `md`); sub-part `GridItem` with `span: auto · full` | `lofi` | Equal columns by **container query**: one column when narrow, one more at each container step where another item of about `min` width fits (16 · 20 · 24 · 32rem, Tailwind's shipped container steps; the gap comes out of the items). Never reads the viewport |
| `Section` | `new` | `level: 2 · 3 · 4` (default 2); `gap` (default `md`); slots `title`, `actions` | `lofi` | A titled part of a page: heading row (actions wrap under the heading when room runs out), then the body |

**`gap` names** — the same seven on every primitive, each a step of the
spacing scale (Tailwind's, as shipped — `../TOKENS.md` § Placeholder theme);
a screen names a step and never writes a number: `none` 0 · `xs` step 1 ·
`sm` step 2 · `md` step 4 · `lg` step 6 · `xl` step 8 · `2xl` step 12
(`src/components/layout/gap.ts`).

**What the primitives do not take.** No `className` and no `style`: page
padding, gaps and breakpoints are decided here and nowhere else, so a screen
that needs something a primitive lacks extends a variant in this family
(`../GOVERNANCE.md`, the ladder) instead of overriding one in place. Every
other HTML attribute (`id`, `aria-*`, `data-*`, `role`) passes through to the
outer element. None sets a block size, a margin outside itself, or hides
overflow; text wraps (`layout.test.tsx` checks the sources).

## Accessibility contract

One row per component of the registry above; the reviewer tests against it
(`../ACCESSIBILITY.md` § Per-component contract). Min target is 44 × 44 CSS px
through `size.target.min` for anything interactive.

| Component | Role | Name comes from | Keyboard | Focus | Min target | Announces |
| --- | --- | --- | --- | --- | --- | --- |
| `Page` | None of its own (it sits inside the shell's `main`); its title is the page's one `h1` | — | Not interactive | — | — | — |
| `Stack` | None; the element given by `as` keeps its own (`ul` → list) | — | Not interactive | — | — | — |
| `Inline` | None; the element given by `as` keeps its own | — | Not interactive | — | — | — |
| `Grid` | None | — | Not interactive; items keep the source order at every column count | — | — | — |
| `Section` | `region` (a `section` with a name) | Its heading, by `aria-labelledby`; two sections on one page need different titles | Not interactive | — | — | — |

Controls placed in the `actions` slot of `Page` or `Section` bring their own
contract (their family file); the slot adds none and wraps them under the
title rather than shrinking them.
