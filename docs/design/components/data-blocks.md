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
| `block.summary` | `new` | — (props `items: [{ id, label, value, delta? }]`) | `lofi` | A wrapping row of key figures (`lofi-prototype-shell.md` § Blocks). A description list: each figure is a term with its value and, when given, a line saying how it moved. A figure keeps a readable width (`min-w-32`) and the row wraps before one narrows further. Values arrive as text, already formatted by the page builder. Nothing in it is interactive |
| `block.list` | `new` | — (props `items: [{ id, title, meta, badges, actions?, href? }]`) | `lofi` | Items with a title, a line of meta, badges and actions. An `ItemGroup` of `Item`s (`outline`, `sm`): an item with `href` and no action is one link; with actions the row is plain, its title is the link and the actions are `Button`s (`sm`; `primary` → the primary button) in a row of their own under the text until the block's own width reaches the `@md` container step (28rem), beside it from there. A badge with `mode` is `BehaviourModeBadge`; the others are the kit's `Badge` (`secondary`), wrapping. § Conventions |
| `block.table` | `new` | — (props `caption`, `columns: [{ id, label, align? }]`, `rows: [{ id, cells }]`) | `lofi` | Columns × rows in `Table` (data-display): the table scrolls sideways inside its own scroller, never the page. `align: end` for a column of numbers. The first column is the row's header and carries a changed row's marker. A cell is text, or `{ text, href?, note? }`: a link and a fainter note under the text (a cell with a note keeps `min-w-48`, twice a plain column, so sentences stay readable). A row with no value for a column gets an empty cell. Cells arrive as text, already formatted |
| `block.schedule` | `new` | — (props `range: { kind: day · week, start, days }`, `resources: [{ id, label }]`, `slots: [{ id, resourceId, start, end, title, meta, badges?, actions?, href? }]`) | `lofi` | Time slots by resource (`lofi-prototype-shell.md` § Blocks). The range in words, then the resources as columns inside one scroller; a column lists its slots in order of time — per day when the range has several, and a day with nothing says so. A slot is the entry of `block.list` with its time above the title. **Container steps:** one resource below `@md` (28rem), two up to `@2xl` (42rem), all from `@2xl`, scrolling inside if they do not fit; below the step that shows them all a labelled `Select` (当前显示 / Showing) chooses the resource drawn first, and its neighbour is the second. A slot outside the range or of an unknown resource is not drawn. § Pitfalls |

## Accessibility contract

One row per component of the registry above; the reviewer tests against it
(`../ACCESSIBILITY.md` § Per-component contract). Min target is 44 × 44 CSS px
through `size.target.min` for anything interactive. **Withdrawn by D-43:** there is no
target-size and no contrast requirement; the "Min target" column binds nothing.

| Component | Role | Name comes from | Keyboard | Focus | Min target | Announces |
| --- | --- | --- | --- | --- | --- | --- |
| `block.summary` | A description list (`dl`) of `term` / `definition` groups, inside `DataState` | Each figure: its label (the term) | Not focusable | — | — | Loading, empty, error and "loaded" through `DataState`'s status region. A change marker is words beside the label, never colour alone |
| `block.list` | A `list` of `listitem`s; a link row is a `link`; actions are `button`s | A link row: its title, marker, badges and meta. A title link: the title. An action: its label, then the item's title (`Send: …`), so equal actions in different rows are told apart | One tab stop per link row; in a plain row the title link, then each action; a disabled action leaves the tab order | The kit's ring on the row, the title link and the buttons | A link row: the row's width × at least 44 CSS px. Title link and buttons: 44 × 44 CSS px | Loading, empty, error and "loaded" through `DataState`'s status region. An action's effect is the screen's to announce |
| `block.table` | A `region` (the scroller) holding a `table`; `columnheader`s; the first cell of each row is its `rowheader` | The region and the table: the caption. A cell link: the cell's text | The scroller is one tab stop, also when nothing is cut off; Left and Right arrows scroll it. Then each cell link, in reading order | The kit's ring on the scroller and on a cell link | The scroller: as large as the table's visible part. A cell link: 44 × 44 CSS px | Loading, empty, error and "loaded" through `DataState`'s status region. A changed row: the marker's word is part of its row header, so it is read with every cell of the row |
| `block.schedule` | A `group` (the scroller) holding one `group` per resource, each with a `list` of slots; the picker is a `combobox` | The scroller: the range in words (日程 / Schedule). A resource: its label. A list: the resource, and the day in a week. Slots and actions: as `block.list` | The picker (when shown), then the scroller — one tab stop, Left and Right arrows scroll it — then each drawn slot's link and actions in reading order. A resource that is not drawn is not in the tab order | The kit's ring on the picker, the scroller, links and buttons | Picker, links and buttons: 44 × 44 CSS px | Loading, empty, error and "loaded" through `DataState`'s status region. Choosing a resource changes what is drawn; the `Select` announces its value |

## Conventions

- **What a block is:** a folder `src/blocks/<name>/` whose `index.ts` exports a `BlockDefinition` (`{ id, Component, demo }`, `src/blocks/types.ts`) by name and as the default export. `Component` takes `props`, `changes`, `state` and `onAction`; it draws no title and has no outer margin — the block renderer does both.
- **States:** every block wraps its content in `DataState`. `ready` with nothing to show is `empty`, with the block's own sentence (namespace `data-blocks`); `long` is `ready` with more content. A block has no retry of its own: the frame owns the run.
- **Items and markers:** the element of each item carries `data-item="<id>"`; an item named in `changes` shows a `ChangeMarker` beside its title or label. Tests read both (`src/blocks/list/testing.tsx`).
- **Shared parts** live in `src/blocks/list/` because every folder under `src/blocks/` is a block of its own: `parts.tsx` (`BlockEntry`, `BlockItemLink`, `BlockBadges`, `BlockActions`, `BlockEmpty`), `demo-view.tsx` (the gallery demo of a block: a state picker, the usual content with its changes, the long content; `?preview=` picks the opening state), `testing.tsx` (`renderBlock`, `describeBlockStates`).
- **Links** are router links to screens of the prototype (`href` is a path). A link in a title or a cell is as high as a target.
- **Texts and figures** arrive in the props, in the reader's language and already computed: a block derives nothing (空档, 本周工时 … are the page builder's). A block formats only the times of its own contract, with `useFormat()`.

## Pitfalls

### A schedule's hidden resources

**Rule:** how many resources `block.schedule` draws is decided by its own width through container queries (`@md`, `@2xl`) — never by the viewport, never by measuring in script.

The columns that do not fit are `display: none`, so sight, the tab order and
the accessibility tree agree, and the `Select` above the scroller brings any
of them back. jsdom lays out no container query: the unit tests check the
classes that carry the steps, the widths were counted in a browser (the
demo's three containers), and the matrix walks them.

### A block's scroller is a group, a table's is a region

**Rule:** name a schedule's scroller from its range and give it `role="group"`; keep `region` for `Table`, whose name is its caption.

Two schedules of the same day on one page would be two landmarks with one
name (axe `landmark-unique`). A table's caption is written by the page
builder and differs per table; a range does not.

So a page builder gives every `block.table` on a page **its own caption, and
one that is not the block's title**: the renderer makes each block a `region`
named by its title, and a caption with the same words is a second landmark
of that name. Seen on the gallery (I4): the renderer's demo page and this
family's demo drew one table definition, one caption twice — the family demo
(`TableBlock.demo.tsx`) now captions its own table.

### The actions of an entry beside a squeezed text

**Rule:** an entry's actions answer to the entry's container (`@md`), not to how far the text can shrink.

The kit's `Item` wraps its actions only when the text column has reached its
minimum, which leaves a title three characters wide beside a button.
`BlockEntry` gives the actions a row of their own until the container — the
list, or one column of a schedule — reaches `@md`.
