# Components — navigation

> Status: evergreen — the registry rows and the accessibility contract of
> the components that move the user between places and switch theme and locale. Contract every component meets, conventions and the
> index of families: `../COMPONENTS.md`.

<!--
HOW TO BUILD THIS FILE
- Skeleton written by package S1b of task 1; the rows are written by package
  S4 (`docs/specs/lofi-prototype-system.md`, criteria A-14), in the same change
  that adds each component. One writer: nobody else edits this file.
- Admitted by the spec for this family: `Sidebar`, `Breadcrumb`, `Tabs`, `DropdownMenu`, `ThemeToggle`, `LocaleSelect`.
- A row here and the code must agree — `src/test/registry-parity.test.ts`
  fails otherwise (`../COMPONENTS.md` § Conventions, "One component, one row").
-->

Code: `src/components/navigation/`.

> **D-43 (2026-11-26) — read this first.** Every component of this family is drawn as stock
> shadcn/ui draws it. Where a registry note, a contract row or a pitfall below describes an
> appearance of ours on a kit control — the 44 px target minimum (`min-h-target`), height `auto`,
> a border instead of a shadow or scrim, a bar or fill marking a state, an always-on underline, a
> restated focus ring, the grey theme — it is **superseded**: that restyle is removed. What still
> differs from stock is listed, completely, in § Deviations from stock. Props, names, roles,
> states and keyboard behaviour are unchanged.

## Deviations from stock

The complete list for this family (D-43; `../COMPONENTS.md` § Conventions). Each is invisible at the
default size unless noted.

| Component | What is added | Why — the matrix cell that fails without it |
| --- | --- | --- |
| `Sidebar` | In the viewport, the kit's own `floating` variant — a panel with the `sidebar` background, a ring and `shadow-sm`, inset from the window edge — on the `canvas` colour, which `SidebarProvider` sets (`bg-canvas`) | Not a matrix failure: the owner's polish (D-50); the variant is the kit's, nothing is restyled. `inline` placement (galleries) and the compact sheet are unchanged |
| `SidebarItem`, `SidebarSubItem` | The kit's height as a minimum with height `auto`, and a label that wraps (`whitespace-normal!`, `overflow-visible!`) | Clipped text in 22 cells: the kit cuts a label to one line with nowhere to read the rest |
| `SidebarFooter` | `gap-0 p-0` | Not a matrix failure: our footer holds `SidebarGroup`s, which bring the kit's padding themselves — the footer's own would double it |
| `SidebarContent` | Scrolls in the rail too | A short window: the kit stops the rail from scrolling |
| `Tabs` | The list is never wider than its container and wraps (`max-w-full flex-wrap`, height `auto`); the panel, a tab stop, shows the kit's ring when focused | Sideways scroll at 200% zoom; `focus-not-visible` — the kit removes the panel's outline |
| `DropdownMenu` | As wide as its items need (`w-auto`, never wider than the room), not as its trigger; the item of the open page is semibold | An icon-button trigger gives the kit's menu its 8rem minimum and wraps every item; visible, and the shape of the kit's own examples (`w-56`) |
| `DropdownMenu` | `surface-frosted` on the menu: a translucent background, a backdrop blur and the small shadow instead of the kit's `bg-popover` and `shadow-md`; the kit's ring stays | **Visible, by the owner's decision D-47**: surfaces that float over the page are frosted (`../TOKENS.md` § Frosted surface) |
| `Breadcrumb` | The folded page name truncates (`data-matrix-allow="clip"`, unchanged). The crumb link's `min-h-target` is removed — target size is withdrawn by D-43 | The one truncating slot of the system, by design |

**Removed with D-43:** the 44 px minimum everywhere; the widened rail (`--sidebar-width-icon` is the kit's
3rem again) and the stacked icon-and-count rail item; the bar marking the current item, sub-item and tab
(current and selected are the kit's fills; `aria-current` / `aria-selected` are unchanged); our focus ring
on sidebar items; the gap between menu rows; the border on the inline sidebar and on a menu; the underline
and medium weight of crumbs. **Changed behaviour to know:** a `SidebarItem`'s `badge` is drawn by the
kit's `SidebarMenuBadge` and, as in the kit, is **not drawn in the rail**; it stays in the item's accessible
name in both states.

## Registry

One row per component. The Component cell is the component's name in
backticks and nothing else. Source: `kit` · `wrapped` · `new` · `dependency`;
Status: `lofi` · `styled` · `deprecated → <replacement>` (`../COMPONENTS.md`
§ Registry).

| Component | Source | Variants | Status | Notes |
| --- | --- | --- | --- | --- |
| `Sidebar` | `wrapped` | Three looks, read with `useSidebar().mode`: `open` · `rail` · `sheet`. `SidebarProvider`: `open`, `defaultOpen`, `onOpenChange`; `placement: viewport · inline` (default `viewport`). Sub-parts `SidebarProvider`, `SidebarTrigger`, `SidebarHeader`, `SidebarContent`, `SidebarFooter`, `SidebarGroup` (`label`; `collapsible` with `icon`, `open`, `defaultOpen`, `onOpenChange`), `SidebarItem` (`icon`, `label`, `badge`, `current`, `disabled`, `render`), `SidebarSubItem` (`label`, `current`, `render`) | `lofi` | The app's navigation. `open`: icon and a label that wraps, at the target minimum. `rail`: the icon alone — the label stays as the item's name and is its tooltip, a `badge` stays visible under the icon, sub-items and group headings are not drawn. `sheet`: in the compact size class the kit's off-canvas sheet, opened by `SidebarTrigger`, closed by our close button, Escape or a press outside. **Where the trigger goes (D-53):** in the app, at the top of the sidebar in a `SidebarHeader` — open and in the rail, so the rail opens again from where it folded; the compact sheet has its close button there instead, and the page header keeps a `SidebarTrigger` only in that size class, to open the sheet. The caller decides open or rail (`open`); the kit decides the sheet from the `md` breakpoint token. `placement: inline` puts it in the flow of a page (the gallery) and never makes a sheet. A destination is a router link passed as `render`; `SidebarFooter` holds `SidebarGroup`s. Not used: the kit's `SidebarRail`, `SidebarMenuAction`, `SidebarInput`, `SidebarInset`, `SidebarMenuSkeleton` (under the target minimum, or not needed) |
| `Breadcrumb` | `wrapped` | `items` (`label`, `render`); the last one is the open page | `lofi` | Answers to its container. With room: the whole path, wrapping. Without: one button that opens the path as a menu, then the open page's name on one line, cut short — **the one truncating slot of the system**, and the one `data-matrix-allow="clip"`; the menu holds every level in full. A single level folds nothing and cuts nothing. In a flex row it takes the room that is left |
| `Tabs` | `wrapped` | `tabs` (`value`, `label`, `icon`, `disabled`, `content`); `value`, `defaultValue` (the first tab), `onValueChange` | `lofi` | Horizontal only. The list fills its container and its tabs run onto further lines; each tab is at the target minimum and its label wraps. Selected is a fill **and** a bar under the label drawn as a border (D-18). Always named (`aria-label` or `aria-labelledby`, type-enforced) |
| `DropdownMenu` | `wrapped` | `trigger`; `align: start · end`; `side: bottom · top`; `open`, `onOpenChange`. Sub-parts `DropdownMenuItem` (`icon`, `variant: default · danger`, `disabled`, `current`, `render`), `DropdownMenuGroup` (`label`), `DropdownMenuRadioGroup` (`label`, `value`, `onValueChange`), `DropdownMenuRadioItem` (`value`, `disabled`, `lang`), `DropdownMenuSeparator` | `lofi` | Actions or one choice of several, opened from our `Button`. As wide as its items need and never wider than the window; items are at the target minimum and wrap; separates from the page by a border. Not wrapped: sub-menus, checkbox items, shortcuts |
| `ThemeToggle` | `new` | — | `lofi` | `docs/specs/lofi-prototype-system.md`. A `ToggleGroup` of three — follow the system, light, dark — bound to the `ThemeProvider` (D-19): one stays pressed, each has an icon and words |
| `LocaleSelect` | `new` | — | `lofi` | `docs/specs/lofi-prototype-system.md`. A `Field` and `Select` bound to the `LocaleProvider` (D-24): each language in its own words; choosing re-renders in place |

## Accessibility contract

One row per component of the registry above; the reviewer tests against it
(`../ACCESSIBILITY.md` § Per-component contract). Min target is 44 × 44 CSS px
through `size.target.min` for anything interactive. **Withdrawn by D-43:** there is no
target-size and no contrast requirement; the "Min target" column binds nothing.

| Component | Role | Name comes from | Keyboard | Focus | Min target | Announces |
| --- | --- | --- | --- | --- | --- | --- |
| `Sidebar` | `navigation` (`nav`) holding one `list` per group; in the sheet a `dialog` around it; items are links (`render`) or `button`s | The landmark and the sheet: the required `aria-label`. A list: its group's `label`. An item: its `label`, then its `badge` — also in the rail, where the label is visually hidden, never removed | Tab walks header, items, sub-items and footer in reading order; Enter follows a link. Sheet: Escape closes. `SidebarTrigger`: Enter or Space; the kit also toggles on Ctrl/⌘ + B | The focus ring of `actions.md` on every item. Sheet: focus moves in, is contained, returns to the trigger | Item, sub-item, trigger, close and collapsible heading 44 × 44 CSS px; the rail is the target plus the group's padding | `aria-current="page"` on the open destination, plus a bar; `aria-expanded` on the trigger and on a collapsible heading; `aria-disabled` |
| `Breadcrumb` | `navigation` (`nav`) with a `list`; the open page is a `link` with `aria-current="page"` and `aria-disabled`; folded, a `button` with a `menu` | The landmark: "You are here" in the user's language, or `aria-label`. A level: its `label`. The button: "Show the full path" | Tab reaches every level; folded, the button opens the menu (Enter, Space, arrows), Escape closes it and returns focus | The focus ring of `actions.md` on every link and on the button | Every link and the button 44 × 44 CSS px | `aria-current="page"`; the menu's `aria-expanded` |
| `Tabs` | `tablist` of `tab`s, each with a `tabpanel` | The list: `aria-label` / `aria-labelledby` (required). A tab: its `label`. A panel: its tab | One tab stop; the arrows move between tabs, Enter or Space selects; Tab goes on to the panel | The kit's ring on the focused tab; the ring of `actions.md` on the panel | Each tab 44 × 44 CSS px | `aria-selected`; a disabled tab is `aria-disabled` |
| `DropdownMenu` | `button` with `aria-haspopup="menu"`; `menu` of `menuitem` / `menuitemradio`; `group`s | The menu: its trigger. An item: its text. A group: its `label` | Enter, Space or the arrows open onto the first item; arrows, Home, End and typing move; Enter chooses; Escape closes; focus returns to the trigger | The highlighted item is filled; real focus is on it, so the forced-colours outline applies | Trigger and every item 44 CSS px high | `aria-expanded`; `aria-checked` on a radio item, with a check mark; `aria-disabled`; `aria-current="page"` on a `current` item |
| `ThemeToggle` | `group` of three `button`s with `aria-pressed` | The group: "Appearance" in the user's language. Each button: its words | As `ToggleGroup`: one tab stop, arrows move, Enter or Space chooses | As `ToggleGroup` | Each button 44 × 44 CSS px | `aria-pressed`; the page changes mode at once |
| `LocaleSelect` | `combobox` with a `listbox`, inside a labelled field | The field's label: "Language" in the user's language | As `Select` | As `Select` | Trigger and options 44 CSS px high | The chosen language as the trigger's text; each option carries its own `lang`; `<html lang>` follows |

## Pitfalls

### The kit's icon rail cuts labels and shrinks items under the target

**Rule:** in the rail render the label visually hidden (it stays the name) and replace the kit's rail size with the important modifier; never let the kit's own rail styling reach an item.

The kit turns a menu button into a fixed `2rem` square with hidden overflow
when the sidebar folds, using `!important`; the label is cut by the box and
the item is under 44 px. `Sidebar.tsx` restates the size (`size-auto!`), draws
only the icon and the badge, and gives the label to the tooltip.

### The kit sets the rail width in an inline style

**Rule:** change `--sidebar-width-icon` with a class carrying the important modifier on the provider, built from tokens; a plain class loses to the inline style.

The rail must hold a target-size item inside the group's padding, which the
kit's `3rem` does not. `SidebarProvider` sets it to the target token plus that
padding.

### A tooltip that is not showing still takes the first Escape

**Rule:** give a sidebar item its tooltip only in the rail.

The kit keeps the tooltip mounted and merely hides its popup outside the
rail. Focusing the item opens it, invisibly, and the next Escape closes the
tooltip instead of the sheet the item is in — two presses to leave.

### Two navigation landmarks with one name

**Rule:** every `Sidebar` and every second `Breadcrumb` on a page gets a name of its own.

axe reports `landmark-unique` when two `nav`s share a name; a screen-reader
user cannot tell them apart in the landmark list. `Breadcrumb` takes
`aria-label` for the page that shows two.

### The kit's own close button inside the compact sidebar sheet has no name

**Rule:** do not un-hide it; the wrapper adds its own named close button.

`sidebar.tsx` hides the sheet's built-in close button with a class and does
not pass it a label. It is `display: none` in a browser, so nothing reads it;
a jsdom test sees it because no stylesheet applies there — run `axe` on the
sheet's content, not on the kit's hidden button.

### Tabs stay in one row and their labels stack letter by letter

**Rule:** a tab keeps `flex-auto` (its basis is its label), never the kit's `flex-1`.

The list wraps, but from a zero basis every tab fitted the first line: at
320 px with the root at 24 px three English tabs shrank to the target minimum
and `wrap-anywhere` broke their labels one letter a line — no clipping, so the
matrix passed it; the eyes-on pass of `I3` found it. From the label's own
width, tabs that do not fit run onto a further line and share it.
