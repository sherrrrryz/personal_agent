# Components — the registry and the contract

> Status: evergreen — which components exist, where each comes from, and the
> contract every component meets. A component that is not in this registry
> does not exist for the purposes of task 5.

<!--
HOW TO BUILD THIS DOC
- Created in task 1; one row is added in the same change that adds a component.
- The registry is a lookup table. Props and behaviour are in the code; do not
  copy them here beyond the variant names.
- When the registry passes ~40 rows, split it by family into
  `components/<family>.md` and keep this file as the contract plus an index.
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
8. **Has tests** for each variant and interactive state, and a row here.
9. **Composes through slots/children**, so that a new need is met by
   composition before a new prop.

## Conventions

- **Location:** shared → `<path>`; app- or screen-only compositions → `<path>`
- **Naming:** files and components `PascalCase`; one primary export per file;
  tests colocated. Sub-parts use `Parent.Part` or `ParentPart` — pick one: `<choice>`
- **Variant values:** lower-case words shared across components
  (`size: sm | md | lg`, `tone: neutral | accent | danger`)
- **Layout is not a component's job.** Outer margin is never set inside a
  component; spacing between siblings belongs to the parent's gap.
- **Icons** come from one set (`<set>`), are swapped by prop, and inherit
  colour and size from tokens.
- **Layers:** tokens → kit primitives → registered components → compositions
  (screen-local) → screens. An import that skips upward is a defect.

## Registry

Source: `kit` (used as is) · `wrapped` (kit + token binding) · `new` (built,
spec cited). Status: `lofi` (placeholder theme only) · `styled` · `deprecated → <replacement>`.

### Layout primitives

| Component | Source | Variants | Status | Figma node | Notes |
| --- | --- | --- | --- | --- | --- |
| `<Page>` | | | | | |
| `<Stack>` | | | | | |

### Actions

| Component | Source | Variants | Status | Figma node | Notes |
| --- | --- | --- | --- | --- | --- |
| `<Button>` | `wrapped` | `variant`, `size` | | | |

### Inputs

| Component | Source | Variants | Status | Figma node | Notes |
| --- | --- | --- | --- | --- | --- |

### Navigation

| Component | Source | Variants | Status | Figma node | Notes |
| --- | --- | --- | --- | --- | --- |

### Containers and overlays

| Component | Source | Variants | Status | Figma node | Notes |
| --- | --- | --- | --- | --- | --- |

### Feedback and status

| Component | Source | Variants | Status | Figma node | Notes |
| --- | --- | --- | --- | --- | --- |

### Data display

| Component | Source | Variants | Status | Figma node | Notes |
| --- | --- | --- | --- | --- | --- |

## Kit components deliberately not used

| Kit component | Why not | Use instead |
| --- | --- | --- |
