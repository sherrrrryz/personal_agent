# Components — layout primitives

> Status: evergreen — the registry rows and the accessibility contract of
> the places page padding, gaps and breakpoints are decided (`ModuleFrame` restates `Page`'s padding — `module.md`). Contract every component meets, conventions and the
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
| `Page` | `new` | `width: prose · wide · full` (default `wide`); `height: content · fill` (default `content`); slots `title` (the one `h1`), `description`, `actions` | `lofi` | The content of `main`. `height: fill` (D-45) makes the page exactly as tall as `main`, so that a child with `min-h-0 flex-1` — the conversation of a dedicated chat — takes the room that is left and scrolls inside itself; it is the family's one block size (`h-full`), it clips nothing (what does not fit spills and `main` scrolls), and `layout.test.tsx` allows exactly that one. Where page padding is set for every screen that is not a module's; it steps up at the `md` and `lg` breakpoint tokens — with the shell, a reader of the viewport. `ModuleFrame` (`module.md`) does not sit inside `Page` and restates the same padding and steps for a module's screens: change the two together. `prose` is a reading measure, `wide` the default for lists and grids, `full` for the canvas and schedules |
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
through `size.target.min` for anything interactive. **Withdrawn by D-43:** there is no
target-size and no contrast requirement; the "Min target" column binds nothing.

| Component | Role | Name comes from | Keyboard | Focus | Min target | Announces |
| --- | --- | --- | --- | --- | --- | --- |
| `Page` | None of its own (it sits inside the shell's `main`); its title is the page's one `h1` | — | Not interactive | — | — | — |
| `Stack` | None; the element given by `as` keeps its own (`ul` → list) | — | Not interactive | — | — | — |
| `Inline` | None; the element given by `as` keeps its own | — | Not interactive | — | — | — |
| `Grid` | None | — | Not interactive; items keep the source order at every column count | — | — | — |
| `Section` | `region` (a `section` with a name) | Its heading, by `aria-labelledby`; two sections on one page need different titles | Not interactive | — | — | — |

`Section` takes `inline` (D-50): the heading, the body and the actions on one row, wrapping only when they do not fit — for a short body such as `block.summary`'s line of figures.

**The shell's two bars lie over `main` (D-47).** `Page` and `ModuleFrame` sit
in the shell's `main` (`src/shell/Shell.tsx`), which fills the whole column:
the shell's header is laid over its start and the chat bar row
(`[data-shell-bar]`) over its end, both frosted (`surface-frosted`,
`../TOKENS.md` § Frosted surface), and the page scrolls beneath them. Since
D-50 each bar is a transparent row (`p-2`, `pointer-events-none`) holding a
floating panel (`[data-shell-panel]`, `shellPanelClass` in
`src/shell/panel.ts`): frosted, rounded on every corner, ringed like a card.
The page shows and takes clicks in the room around the panel; the measured
size of a bar includes that room. `main`
keeps the room of each bar as padding and as `scroll-padding` — measured, as
`--shell-header-size` and `--shell-bar-size` on `[data-shell]`
(`src/shell/use-bar-sizes.ts`) — so a page's first and last content and a
focused control are never under a bar. A screen does nothing for this; a
`sticky top-0` of its own inside `main` would stick **under** the header — add
`top-(--shell-header-size)`.

**What the shell's header holds (D-53).** From the start: in the compact
size class only, the `SidebarTrigger` that opens the sheet (otherwise the
trigger is at the top of the sidebar — `navigation.md`); **返回**, a ghost
icon `Button` with `ArrowLeft` named by `common` `action.back`; the
breadcrumb; then the open screen's slot and the prototype controls. 返回 goes
back to where she came from: one step back along the history when the entry
before is a screen inside the shell, else up to the breadcrumb's level above,
replacing the open entry; on a top-level screen with neither it is not drawn.
The browser does not say where its previous entry leads, so the shell keeps
its own copy of the history from the moment the app loaded
(`src/shell/in-app-history.ts`, called in `Shell` above the bare branch so
that no move is missed). A move that is not a step she took — a scene jump,
clearing `?scene=` — replaces the address (`navigate(…, { replace: true })`);
a push there would become a step back. A screen that closes something with
an address of its own (the appointment sheet) asks `useCameFrom()` (from
`@/shell`): when the page it closes to is where she came from it goes back,
else it replaces its address with that page — closing is never a new step.

Controls placed in the `actions` slot of `Page` or `Section` bring their own
contract (their family file); the slot adds none and wraps them under the
title rather than shrinking them.
