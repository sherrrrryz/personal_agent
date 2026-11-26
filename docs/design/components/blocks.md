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

> **D-43 (2026-11-26).** The kit controls inside these components are drawn as stock shadcn/ui draws
> them: no 44 px minimum, no border added to the kit's `Empty`, `Card` or `Badge`. Where a note below says
> otherwise it is superseded. Target size is not a requirement (withdrawn by D-43): our own links carry no `*-target` class.

## Registry

One row per component. The Component cell is the id of a block (`` `block.<name>` ``) or the component's name in
backticks and nothing else. Source: `kit` · `wrapped` · `new` · `dependency`;
Status: `lofi` · `styled` · `deprecated → <replacement>` (`../COMPONENTS.md`
§ Registry).

| Component | Source | Variants | Status | Notes |
| --- | --- | --- | --- | --- |
| `BlockRenderer` | `new` | `state: ready · loading · empty · error`; `blockStates`, `changes`, `pins` + `onTogglePin`, `onAction`, `level`; slots `empty`, `errorTitle`, `error`, `onRetry` | `lofi` | Draws a `PageDescription` (D-12; `lofi-prototype-shell.md` § Blocks): each block in a `Section` named by its title; `half` blocks that follow each other pair from the `@2xl` container step (42rem) and stack below it, a `half` block with no partner takes the row; a pinned block keeps the position it was pinned at (`arrangeBlocks`); a block named in the `ChangeSet` gets a `ChangeMarker` on its title and one line counts the changes (`countPageChanges`). An id no block registered is drawn as an error `Alert` and logged in development. `ready` with no block is `empty`. Pins of a module: `useModulePins(moduleId)` |
| `block.text` | `new` | — | `lofi` | A short AI-written note with links, at a reading measure (`max-w-prose`). Paragraphs split on blank lines. Change ids: `body`, and a link's `href`. No body and no link is `empty` |
| `block.empty` | `new` | — | `lofi` | What a workflow emits when its page has nothing: a statement, why, and one next step (a link drawn as a secondary button). It is the empty state, so `empty` shows the same as `ready`. Change ids: `body`, `action`. An empty collection inside another block is that block's `DataState`, not this |
| `block.proposal` | `new` | — | `lofi` | `ProposalCard`: the mode badge, the source, an optional lead-in, then the parts — each 接受 / 拒绝 through `onAction('accept' \| 'reject', part.id)`; a decided part says so in words. Without `onAction` it is read only. Change ids: the part ids. No part is `empty` |

## Accessibility contract

One row per component of the registry above; the reviewer tests against it
(`../ACCESSIBILITY.md` § Per-component contract). Min target is 44 × 44 CSS px
through `size.target.min` for anything interactive. **Withdrawn by D-43:** there is no
target-size and no contrast requirement; the "Min target" column binds nothing.

| Component | Role | Name comes from | Keyboard | Focus | Min target | Announces |
| --- | --- | --- | --- | --- | --- | --- |
| `BlockRenderer` | Each block a `section` (`region`) named by its title; the pin a toggle button (`aria-pressed`) | The section: the block's title, with the change word when marked. The pin: 固定「title」 — it contains the visible 固定 | Tab reaches each pin; Enter or Space toggles it | Stays on the pin when the block moves or holds | Pin 44 × 44 CSS px | Politely, without moving focus: what pinning did (已固定「title」… / 已取消固定…), the count of a new run's changes, and the page's loading, empty and error through `DataState`. The pin's state is `aria-pressed`, a filled toggle with a bar — not colour alone |
| `block.text` | Paragraphs; the links a `list` | The list: 相关链接. A link: its label | Tab reaches each link; Enter follows it | The kit's ring on the link | Link 44 × 44 CSS px | Loading, empty and error through its `DataState`. A change marker is text beside what changed |
| `block.empty` | Text; the next step a link | The link: its label | Tab, Enter | The ring on the link | Link 44 × 44 CSS px | Loading and error through its `DataState` |
| `block.proposal` | The parts a `list` (建议的各项); each part a `group`; a `status` line under them | The group: the part's text. 接受 / 拒绝: their label, described by the part's text | Tab reaches 接受 then 拒绝 of each waiting part; Enter or Space decides | After a decision focus moves to 接受 of the next part still waiting (wrapping to earlier ones); when none is left, to the status line, which shows the ring | Buttons 44 × 44 CSS px | The status line, politely: how many parts still wait, then 全部已处理 with the counts. A decided part shows 已接受 / 已拒绝 as text with an icon |

## Registering a block

A block registers by existing: `src/blocks/<name>/index.ts` exports a
`BlockDefinition` (`src/blocks/types.ts`) — `{ id: 'block.<name>', Component, demo }`.
`src/block-renderer/registry.ts` reads every such file by glob and takes every
export of that shape, whatever the export is called; nobody edits a central
list. It throws at start-up on two definitions of one id, on a definition in a
folder of another name, and on a block folder that defines nothing. The row of
the block goes into this file or `data-blocks.md` in the same change.

A block component receives `props`, `changes` (its marked items: item id →
change kind), `state` and `onAction`; it renders no title, sets no outer
margin, and draws its own loading, empty and error through `DataState`. It
imports nothing from `src/block-renderer/index.ts` (that file loads the
registry, and with it every block) — helpers are imported by file
(`block-link.tsx`, `block-demo.tsx`).

## Pitfalls

### A pinned block jumps when the workflow's order changes

**Rule:** the position of a block comes from `arrangeBlocks(page.blocks, pins)` and nowhere else; a pin stores the position the block had *as drawn* when it was pinned.

The page description is in the workflow's order, the screen is in the drawn
order, and the two differ as soon as one block is pinned. Passing the index of
the description to `togglePin` pins the block somewhere it never was.
`BlockRenderer` passes the drawn index; a caller that pins from outside it
must do the same.

### Two blocks with one title fail the landmark check

**Rule:** block titles are unique on a page — each block is a `region` named by its title (axe `landmark-unique`).

A page builder that emits the same block twice gives each its own title; a
demo that draws several renderers on one page does too.

