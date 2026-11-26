# Components — data display

> Status: evergreen — the registry rows and the accessibility contract of
> the components that show records and what changed in them. Contract every component meets, conventions and the
> index of families: `../COMPONENTS.md`.

<!--
HOW TO BUILD THIS FILE
- Skeleton written by package S1b of task 1; the rows are written by package
  S5 (`docs/specs/lofi-prototype-system.md`, criteria A-15), in the same change
  that adds each component. One writer: nobody else edits this file.
- Admitted by the spec for this family: `Table`, `Item`, `Avatar`, `BehaviourModeBadge`, `ChangeMarker`, and whichever of the A-15 components S5 places here.
- A row here and the code must agree — `src/test/registry-parity.test.ts`
  fails otherwise (`../COMPONENTS.md` § Conventions, "One component, one row").
-->

Code: `src/components/data-display/`.

> **D-43 (2026-11-26) — read this first.** Every component of this family is drawn as stock
> shadcn/ui draws it. Where a registry note, a contract row or a pitfall below describes an
> appearance of ours on a kit control — the 44 px target minimum (`min-h-target`), height `auto`,
> a border instead of a shadow or scrim, a bar or fill marking a state, an always-on underline, a
> restated focus ring, the grey theme — it is **superseded**: that restyle is removed. What still
> differs from stock is listed, completely, in § Deviations from stock. Props, names, roles,
> states and keyboard behaviour are unchanged.

## Deviations from stock

The complete list for this family (D-43; `../COMPONENTS.md` § Conventions).

| Component | What is added | Why |
| --- | --- | --- |
| `Item` | Title and description are not clamped (`line-clamp-none`), actions wrap, text aligns to the start | Invisible when the text fits. The kit cuts the title to one line and the description to two, with nowhere to read the rest |
| `Table` | Our scroller — a named region and a tab stop with the kit's ring when focused — replaces the kit's unnamed one; cells align by `text-start` / `text-end` | Keyboard reach of columns that do not fit; no visible difference at rest |

**Removed with D-43:** the 44 px minimum on `Item`; the wrapping of `BehaviourModeBadge` and
`ChangeMarker` (they are the kit's one-line `Badge`); the wrapping cells, minimum column width, border and
moved caption of `Table` (cells are one line as in the kit; a wide table scrolls inside its region).

## Registry

One row per component. The Component cell is the component's name in
backticks and nothing else. Source: `kit` · `wrapped` · `new` · `dependency`;
Status: `lofi` · `styled` · `deprecated → <replacement>` (`../COMPONENTS.md`
§ Registry).

| Component | Source | Variants | Status | Notes |
| --- | --- | --- | --- | --- |
| `BehaviourModeBadge` | `new` | `mode: autonomous · assisted · deferred` | `lofi` | Which behaviour mode applies to an action, a proposal or a notification (`lofi-prototype-system.md` § Additions). The kit's `Badge` (`outline`) with the icon and the name of `src/lib/vocab.ts`, so every surface says a mode the same way. Unlike the kit badge its height follows the text and the text wraps. Under a ceiling the caller passes the mode that applies (`capMode`) |
| `ChangeMarker` | `new` | `kind: new · updated · removed` | `lofi` | Marks a block, an item, a canvas node or a row as changed since the user last looked (`lofi-prototype-system.md` § Additions). Built like `BehaviourModeBadge`, from the change vocabulary |
| `Avatar` | `kit` | `size: sm · default · lg`; sub-parts `AvatarImage`, `AvatarFallback`, `AvatarGroup`, `AvatarGroupCount` | `lofi` | A face or an initial beside a name, never instead of it. Always given `aria-hidden="true"` by the caller (on the `Avatar`, or on the `AvatarGroup` as a whole). The low-fi prototype ships no images: `AvatarFallback` with one or two characters. The kit's `AvatarBadge` is not exported (a dot with no text) |
| `Item` | `wrapped` | `variant: default · outline · muted`; `size: default · sm · xs`; `render`; sub-parts `ItemGroup`, `ItemMedia` (`variant: default · icon · image`), `ItemContent`, `ItemTitle`, `ItemDescription`, `ItemActions` | `lofi` | One record as a row. The wrapper binds the target minimum as the row's minimum block and inline size, shows title and description in full (the kit cuts them after one and two lines), keeps the text column at a readable width and lets the actions wrap. `render={<a … />}` (or a router link) makes the whole row one link. Inside an `ItemGroup` each `Item` is a list item. Not exported: the kit's `ItemSeparator` (not a list child), `ItemHeader`, `ItemFooter`. § Pitfalls |
| `Table` | `wrapped` | `caption` (required); sub-parts `TableHeader`, `TableBody`, `TableFooter`, `TableRow`, `TableHead` (`align: start · end`, `scope`), `TableCell` (`align: start · end`) | `lofi` | Records in rows and columns, in its own sideways scroller: the page never scrolls sideways for a table. Cell text wraps; a column keeps a minimum width, below which the table scrolls. The caption is under the table and scrolls with it, so keep it to a line. Row headers are `TableHead scope="row"`. Loading, empty and error are `DataState`'s, around the table. § Pitfalls |

## Accessibility contract

One row per component of the registry above; the reviewer tests against it
(`../ACCESSIBILITY.md` § Per-component contract). Min target is 44 × 44 CSS px
through `size.target.min` for anything interactive.

| Component | Role | Name comes from | Keyboard | Focus | Min target | Announces |
| --- | --- | --- | --- | --- | --- | --- |
| `BehaviourModeBadge` | None (`span`) | Its text, the mode's name in the current language; the icon is `aria-hidden` | Not focusable | — | — | Nothing by itself: its text is part of the accessible name of the link, button or heading that contains it. Icon and word, never colour alone |
| `ChangeMarker` | None (`span`) | Its text, the change kind's word in the current language; the icon is `aria-hidden` | Not focusable | — | — | Nothing by itself: its text is part of the accessible name of what contains it. Icon and word, never colour alone |
| `Avatar` | None; hidden (`aria-hidden="true"` from the caller) | — (the name is the text beside it) | Not focusable | — | — | Nothing: decorative beside a name |
| `Item` | None as a plain row; `link` when rendered as a link; `listitem` (around it) inside an `ItemGroup`, which is a `list` | As a link: its title and description, with any badge in them | As a link: one tab stop, Enter follows it; nothing inside a link row is interactive. As a plain row: only the controls in `ItemActions` are tab stops | The kit's ring on the row when it is a link | A link row: the full row width × at least 44 CSS px. Controls in `ItemActions` are `Button`s: 44 × 44 CSS px | Nothing |
| `Table` | A `region` (the scroller) holding a `table`; `columnheader` and `rowheader` cells | The region and the table: the caption | The scroller is one tab stop, also when nothing is cut off; Left and Right arrows scroll it when the table is wider than its place | The kit's ring on the scroller | — (the scroller is as large as the table's visible part) | Nothing by itself; header cells are read with each cell. State changes are `DataState`'s |

## Pitfalls

### A table's sideways scroller cannot be reached with the keyboard

**Rule:** use `Table` from this family, never the kit's `table.tsx`; do not put a `Table` inside another element that scrolls sideways.

The kit wraps its `table` in a `div` that scrolls sideways but has no name
and takes no focus, so a keyboard user cannot bring the hidden columns into
view. `Table` adds its own scroller around it — a `region` named by the
caption, with `tabIndex={0}` and the kit's ring — and switches the kit's
inner one off from outside (`*:overflow-visible`), without editing the kit
file. `data-display.test.tsx` checks the structure; the computed style and the
arrow keys were checked in a browser.

### A CJK column collapses to one character per line

**Rule:** a text column beside other columns gets a minimum inline size; do not rely on the longest word to hold it open.

Chinese text can break after every character, so its smallest possible width
is one character. In a table with wrapping cells, or in a flex row beside
actions, the column gives all its room away before anything wraps or scrolls.
`TableHead`, `TableCell` and `ItemContent` therefore carry `min-w-24`: below
it a table scrolls and an item's actions move under the text.

### The list of an `ItemGroup` has no items

**Rule:** import `Item` and `ItemGroup` from this family; never put anything but an `Item` directly inside an `ItemGroup`.

The kit's `ItemGroup` is `role="list"`, but its `Item` has no role, so the
list announces no items (and axe reports the list's children). The wrapper
puts each `Item` of a group in a `listitem`. A separator, a heading or a
bare `div` between the items would be a list child that is not an item —
which is why `ItemSeparator` is not exported; the group's gap separates.

### A link row with a button in it

**Rule:** a row is either one link (`render`) or a plain row with `Button`s in `ItemActions` — never both.

A control nested in a link cannot be reached or named reliably. When a row
needs to open something **and** offer an action, keep the row plain and put
both in `ItemActions`.

