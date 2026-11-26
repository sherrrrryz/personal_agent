# Components — data blocks

> Status: evergreen — the registry rows and the accessibility contract of
> the blocks that carry figures, lists, tables and schedules. Contract every component meets, conventions and the
> index of families: `../COMPONENTS.md`.

<!--
HOW TO BUILD THIS FILE
- Skeleton written by package S1b of task 1; the rows are written by package
  S10 (`docs/specs/lofi-prototype-shell.md`, criteria R-12), in the same change
  that adds each component. One writer: nobody else edits this file.
- Admitted by the spec for this family: `block.summary`, `block.list`, `block.table`, `block.schedule`.
- A row here and the code must agree — `src/test/registry-parity.test.ts`
  fails otherwise (`../COMPONENTS.md` § Conventions, "One component, one row").
-->

Code: `src/blocks/<name>/`.

## Registry

One row per component. The Component cell is the id of a block (`` `block.<name>` ``) or the component's name in
backticks and nothing else. Source: `kit` · `wrapped` · `new` · `dependency`;
Status: `lofi` · `styled` · `deprecated → <replacement>` (`../COMPONENTS.md`
§ Registry).

| Component | Source | Variants | Status | Notes |
| --- | --- | --- | --- | --- |
| `block.summary` | `new` | — (props `items: [{ id, label, value, delta? }]`) | `lofi` | A wrapping row of key figures (`lofi-prototype-shell.md` § Blocks). A description list: each figure is a term with its value and, when given, a line saying how it moved. A figure keeps a readable width (`min-w-32`) and the row wraps before one narrows further. Values arrive as text, already formatted by the page builder. Nothing in it is interactive |
| `block.list` | `new` | — (props `items: [{ id, title, meta, badges, actions?, href? }]`) | `lofi` | Items with a title, a line of meta, badges and actions. An `ItemGroup` of `Item`s (`outline`, `sm`): an item with `href` and no action is one link; with actions the row is plain, its title is the link and the actions are `Button`s (`sm`; `primary` → the primary button) in a row of their own under the text until the block's own width reaches the `@md` container step (28rem), beside it from there. A badge with `mode` is `BehaviourModeBadge`; the others are the kit's `Badge` (`secondary`), wrapping. § Conventions |

## Accessibility contract

One row per component of the registry above; the reviewer tests against it
(`../ACCESSIBILITY.md` § Per-component contract). Min target is 44 × 44 CSS px
through `size.target.min` for anything interactive.

| Component | Role | Name comes from | Keyboard | Focus | Min target | Announces |
| --- | --- | --- | --- | --- | --- | --- |
| `block.summary` | A description list (`dl`) of `term` / `definition` groups, inside `DataState` | Each figure: its label (the term) | Not focusable | — | — | Loading, empty, error and "loaded" through `DataState`'s status region. A change marker is words beside the label, never colour alone |
| `block.list` | A `list` of `listitem`s; a link row is a `link`; actions are `button`s | A link row: its title, marker, badges and meta. A title link: the title. An action: its label, then the item's title (`Send: …`), so equal actions in different rows are told apart | One tab stop per link row; in a plain row the title link, then each action; a disabled action leaves the tab order | The kit's ring on the row, the title link and the buttons | A link row: the row's width × at least 44 CSS px. Title link and buttons: 44 × 44 CSS px | Loading, empty, error and "loaded" through `DataState`'s status region. An action's effect is the screen's to announce |

## Conventions

- **What a block is:** a folder `src/blocks/<name>/` whose `index.ts` exports a `BlockDefinition` (`{ id, Component, demo }`, `src/blocks/types.ts`) by name and as the default export. `Component` takes `props`, `changes`, `state` and `onAction`; it draws no title and has no outer margin — the block renderer does both.
- **States:** every block wraps its content in `DataState`. `ready` with nothing to show is `empty`, with the block's own sentence (namespace `data-blocks`); `long` is `ready` with more content. A block has no retry of its own: the frame owns the run.
- **Items and markers:** the element of each item carries `data-item="<id>"`; an item named in `changes` shows a `ChangeMarker` beside its title or label. Tests read both (`src/blocks/list/testing.tsx`).
- **Shared parts** live in `src/blocks/list/` because every folder under `src/blocks/` is a block of its own: `parts.tsx` (`BlockEntry`, `BlockItemLink`, `BlockBadges`, `BlockActions`, `BlockEmpty`), `demo-view.tsx` (the gallery demo of a block: a state picker, the usual content with its changes, the long content; `?preview=` picks the opening state), `testing.tsx` (`renderBlock`, `describeBlockStates`).
- **Links** are router links to screens of the prototype (`href` is a path). A link in a title or a cell is as high as a target.
- **Texts and figures** arrive in the props, in the reader's language and already computed: a block derives nothing (空档, 本周工时 … are the page builder's). A block formats only the times of its own contract, with `useFormat()`.
