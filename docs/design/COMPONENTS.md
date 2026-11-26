# Components — the registry and the contract

> Status: evergreen — which components exist, where each comes from, and the
> contract every component meets. A component that is not in the registry
> (the family files under `components/`) does not exist for the purposes of
> task 5.

<!--
HOW TO BUILD THIS DOC
- Created in task 1. This file keeps the contract, the conventions, the index
  of family files, the kit components not used and the kit patches.
- The registry itself is split by family from the start (it passes 40 rows —
  `docs/specs/lofi-prototype-system.md`): `components/<family>.md`. One row is
  added there in the same change that adds a component.
- The registry is a lookup table. Props and behaviour are in the code; do not
  copy them here beyond the variant names.
-->

## The contract

Every component in the registry, without exception:

1. **Comes from the UI kit** — used directly, or wrapped to bind tokens and
   narrow the props. A component built from scratch is listed as `new` and
   carries the spec that admitted it.
2. **Has no raw visual value.** Every colour, size, space, radius, shadow,
   blur and duration is a token reference.
3. **Declares its variants as named, typed options** (`variant`, `size`,
   `tone`) on one consistent scale. No boolean per look, no one-off override props.
4. **Implements every state that applies:** default · hover · focus-visible ·
   pressed · selected · disabled · loading · error · read-only. Data surfaces
   add empty · loading · error · partial.
5. **Meets its accessibility contract** (`ACCESSIBILITY.md` § Per-component
   contract): role, accessible name, keyboard interaction, focus behaviour,
   minimum target size, contrast in every mode.
6. **Adapts:** fills or fits its container, never assumes a width; survives
   the largest font scale and the longest translation without clipping;
   mirrors correctly in RTL when the product requires it.
7. **Is theme-blind:** it reads semantic tokens and never branches on the mode.
8. **Has tests** for each variant and interactive state, and a row in its
   family file (§ Registry).
9. **Composes through slots/children**, so that a new need is met by
   composition before a new prop.

## Conventions

**Where code lives**

| Folder | Holds |
| --- | --- |
| `src/components/ui/` | The kit: files copied from shadcn/ui by its CLI. Kit code is this folder and nothing else (D-06) |
| `src/components/<family>/` | Registered components of one family, with the family's `index.ts`; tests (`Name.test.tsx`) and demos (`Name.demo.tsx`) beside the component |
| `src/hooks/`, `src/lib/`, `src/i18n/`, `src/theme/`, `src/app/` | Shared hooks, helpers, messages, theme provider, the app host. `src/hooks/use-mobile.ts` was written by the CLI but is **our code**, rewritten on the breakpoint token |
| `src/tokens/generated/` | Build output of `tokens/` — never edited |
| `src/runtime/`, `src/fixtures/`, `src/shell/`, `src/chat/` | Part 2: the fake runtime, story data, the app shell and the chat surfaces (single-use compositions, not registry items) |
| `src/blocks/<name>/`, `src/block-renderer/`, `src/module/` | Part 2: one folder per block (`block.<name>`), the block renderer, the module frame — registered components outside `src/components/` |
| `src/modules/<ia-id>/`, `src/screens/<area>/` | Part 3: a module's page builder; screens and screen-local compositions |

**Import boundary — enforced by lint.** Only files under `src/components/`
may import from `src/components/ui/` (`.oxlintrc.json`, `no-restricted-imports`;
`npm run lint` fails otherwise). Everything else imports a component from its
family's `index.ts`, which re-exports a `kit` row unchanged, by name
(`export { Card } from '@/components/ui/card'`), or exports the wrapper. A
later fix that needs a wrapper therefore changes no importer. The rule reads
static `import` and `export … from`; a dynamic `import()` of a kit file is the
same defect and is caught at review.

**What `wrapped` means** — always the same thin thing: the wrapper fills the
kit's built-in names from the messages (§ Kit patches) and narrows the props.
**It does not restyle (D-43):** the control is drawn as stock shadcn/ui draws
it — no forced target size, no restated focus ring, no added border, colour,
radius or state mark. Behaviour stays Base UI's. Every interactive kit
control is `wrapped`; only non-interactive ones are `kit`.

**Deviations from stock** are the few classes a wrapper still adds, each
because a matrix assertion (sideways scroll, clipped text, visible focus)
fails without it, each invisible at the default size. Every one is listed in
its family file under § Deviations from stock; adding one needs the failing
cell named there. Until D-43 a wrapper also bound `size.target.min` (44 px)
with height `auto` — that is withdrawn.

**One component, one row — checked by `src/test/registry-parity.test.ts`**
on every `npm test`:

- A registered component is a file `Name.tsx` or a folder `Name/` (with its
  own `index.ts`) directly inside `src/components/<family>/`,
  `src/block-renderer/` or `src/module/`, and a block is a folder
  `src/blocks/<name>/`. `Name` is `PascalCase`. Tests, demos and helpers
  (lower-case file names: `index.ts`, `button-variants.ts`, `types.ts`) are
  not components.
- Its row is in the `## Registry` table of its family file: the Component
  cell is the name in backticks and nothing else — `` `Button` ``, or
  `` `block.<name>` `` for a block. `src/block-renderer/` registers in
  `components/blocks.md`, `src/module/` in `components/module.md`, a block in
  `components/blocks.md` or `components/data-blocks.md`.
- A `kit` row has no file of ours; the family's `index.ts` re-exports it by
  name.
- The test fails on a component with no row, a row with no code, a `kit` row
  that is not re-exported, a family folder with no family file, and a
  malformed row. A folder that does not exist yet is not an error.
- **Sub-parts** are named `ParentPart` (`SidebarItem`) and live in the
  parent's file, or the parent becomes a folder `Parent/` holding them. A
  sub-part with a file of its own at the family's top level needs its own row.

**Component evidence** — the phrase the acceptance criteria use. For each
component: a test file (render, every variant and state, the keyboard path,
`axe` with no violation, and in zh-CN no English accessible name or text), a
demo on the gallery (`/dev/components?family=<family>`), a registry row and a
contract row in its family file.

**Glob registries.** Parallel packages never edit a central index; these are
found by `import.meta.glob`: `src/i18n/messages/<namespace>.<locale>.ts` ·
`src/screens/<area>/routes.tsx` (also exporting `matrixRoutes`) ·
`src/screens/<area>/module-routes.tsx` · `src/blocks/<name>/index.ts` ·
`src/modules/<ia-id>/module.ts` · every `*.demo.tsx`.

**Writing a component**

- **Naming:** files and components `PascalCase`; one primary export per file.
- **Variant values:** lower-case words shared across components
  (`size: sm | md | lg`, `variant: primary | secondary | ghost | danger`).
- **No user-visible string in a component.** Text, `aria-label`, `title`,
  `alt` and `placeholder` come from the messages (`src/i18n/`) or from a prop.
- **Layout is not a component's job.** Outer margin is never set inside a
  component; spacing between siblings belongs to the parent's gap. Page
  padding, gaps and breakpoints are decided only in the layout primitives.
- **Icons** come from one set (`lucide-react`), are swapped by prop, and
  inherit colour and size from tokens.
- **Layers:** tokens → kit primitives → registered components → compositions
  (screen-local) → screens. An import that skips upward is a defect.

## Registry

The registry is the twelve family files. Each carries the registry columns
and the accessibility-contract columns (`ACCESSIBILITY.md` § Per-component
contract) for its components, and has one writer: the package that builds the
family.

| Family | File | Code | Holds |
| --- | --- | --- | --- |
| Layout primitives | [components/layout.md](components/layout.md) | `src/components/layout/` | `Page`, `Stack`, `Inline`, `Grid`, `Section` |
| Actions | [components/actions.md](components/actions.md) | `src/components/actions/` | Buttons and toggles |
| Inputs | [components/inputs.md](components/inputs.md) | `src/components/inputs/` | Fields and form controls |
| Navigation | [components/navigation.md](components/navigation.md) | `src/components/navigation/` | Sidebar, breadcrumb, tabs, menus, theme and locale switches |
| Containers and overlays | [components/containers.md](components/containers.md) | `src/components/containers/` | Dialogs, sheets, cards, collapsibles, tooltips |
| Feedback and status | [components/feedback.md](components/feedback.md) | `src/components/feedback/` | Badges, alerts, toasts, loading and empty states |
| Data display | [components/data-display.md](components/data-display.md) | `src/components/data-display/` | Tables, items, avatars, markers |
| Chat | [components/chat.md](components/chat.md) | `src/components/chat/` | Composer, message list, persistence switch |
| Blocks | [components/blocks.md](components/blocks.md) | `src/block-renderer/`, `src/blocks/<name>/` | The block renderer and the text, empty and proposal blocks |
| Data blocks | [components/data-blocks.md](components/data-blocks.md) | `src/blocks/<name>/` | The summary, list, table and schedule blocks |
| Module frame | [components/module.md](components/module.md) | `src/module/` | The frame every module page sits in |
| Workflow | [components/workflow.md](components/workflow.md) | `src/components/workflow/` | The node canvas of the workflow editor |

**Row values.** Source: `kit` (used as is, re-exported) · `wrapped` (kit +
token binding, as above) · `new` (built, spec cited) · `dependency` (a
single-purpose library that is not a UI kit, e.g. the React Flow canvas,
D-16). Status: `lofi` (placeholder theme only) · `styled` ·
`deprecated → <replacement>`. The family files have no Figma column: Figma is
not in use (D-04); a decision superseding it adds the column.

**Blocks (D-12).** A registered component may additionally be a **block**:
the unit a module workflow's page description may reference by its stable
block id (`block.<name>`, the Component cell of its row). Only blocks may be
emitted by a workflow; the module frame lays them out, so a block never sets
outer margin. Admission of blocks: `GOVERNANCE.md` § The admission test,
"Blocks".

## Kit components deliberately not used

Not installed. None is needed by the task-1 inventory; adding one is an
admission (`GOVERNANCE.md`), and for those that bring a library, a new
dependency.

| Kit component | Why not | Use instead |
| --- | --- | --- |
| `Calendar` / date picker | Brings a second dependency (`react-day-picker`); the need is covered | `block.schedule` |
| `Command` | Brings `cmdk`; no command palette in the IA | `DropdownMenu`, `Select` |
| `Carousel` | Brings `embla-carousel-react`; no carousel in the IA | `Grid`, a list |
| `Chart` | Brings `recharts`; no chart in the task-1 screens | `block.summary` figures, `Table` |
| `Resizable` | Brings `react-resizable-panels`; no resizable pane in the IA | The shell's layout; `Sheet` |
| `Drawer` | Brings `vaul`; the bottom sheet already exists | `Sheet` with `side: bottom` |
| `Checkbox` | No multi-select form in the inventory | `Switch` for on/off, `RadioGroup` for one of several |
| `Accordion` | One disclosure pattern is enough | `Collapsible` |
| `ScrollArea` | Native scrolling keeps keyboard and assistive behaviour | A native scroller that is focusable and named (the `Table` contract) |
| `Popover` | Every floating need has a more specific pattern | `DropdownMenu`, `Tooltip`, `Dialog`, `Sheet` |

## Kit patches

Kit files are edited for **one reason only**: a built-in English string a
user can see or hear becomes a prop, which our wrapper fills from the
messages. No visual value is added and no behaviour changes. Every patch is
listed here so a kit upgrade can re-apply it; `src/components/ui/kit-patches.test.tsx`
(our test, not a kit file) fails while a kit file still holds a user-visible
string literal, and checks each prop below.

| Kit file | Component | Was | Now |
| --- | --- | --- | --- |
| `dialog.tsx` | `DialogContent` | `sr-only` "Close" in the close button | Prop `closeLabel` |
| `dialog.tsx` | `DialogFooter` | Text "Close" of the optional close button (`showCloseButton`) | Prop `closeLabel` |
| `sheet.tsx` | `SheetContent` | `sr-only` "Close" in the close button | Prop `closeLabel` |
| `sidebar.tsx` | `Sidebar` | Title "Sidebar" and description "Displays the mobile sidebar." of the compact sheet | Props `mobileTitle`, `mobileDescription` (no description element when absent) |
| `sidebar.tsx` | `SidebarTrigger` | `sr-only` "Toggle Sidebar" | Prop `label` |
| `sidebar.tsx` | `SidebarRail` | `aria-label` and `title` "Toggle Sidebar" | Prop `label`, feeding both |
| `breadcrumb.tsx` | `Breadcrumb` | `aria-label="breadcrumb"` on the `nav` | No default: the caller's `aria-label` |
| `breadcrumb.tsx` | `BreadcrumbEllipsis` | `sr-only` "More" | Prop `label` |
| `spinner.tsx` | `Spinner` | `aria-label="Loading"` | No default: the caller's `aria-label` |

- **Every one of these props is optional in the kit file** — the patch stays
  the smallest possible edit. The wrapper makes it impossible to forget: it
  passes the message itself or requires the prop in its own type. A `kit` row
  re-exported unchanged (`Spinner`) is named at each use, or sits beside
  status text inside a region with `aria-busy`.
- **Not a kit patch, same duty:** the `sonner` library (in `node_modules`)
  has English defaults of its own — the wrapper passes `containerAriaLabel`
  and `toastOptions.closeButtonAriaLabel`, and `theme` from our
  `ThemeProvider` (the kit's `sonner.tsx` reads `next-themes`, which has no
  provider here).
- **After `shadcn add` or an upgrade** of a file above: re-apply its rows,
  then run `npm test`. Never add a visual value while there (D-06).
