# Components — inputs

> Status: evergreen — the registry rows and the accessibility contract of
> the fields and form controls. Contract every component meets, conventions and the
> index of families: `../COMPONENTS.md`.

<!--
HOW TO BUILD THIS FILE
- Skeleton written by package S1b of task 1; the rows are written by package
  S3 (`docs/specs/lofi-prototype-system.md`, criteria A-13), in the same change
  that adds each component. One writer: nobody else edits this file.
- Admitted by the spec for this family: `Field`, `Label`, `Input`, `Textarea`, `Select`, `Switch`, `RadioGroup`, `InputGroup`, and whichever of the A-13 components S3 places here.
- A row here and the code must agree — `src/test/registry-parity.test.ts`
  fails otherwise (`../COMPONENTS.md` § Conventions, "One component, one row").
-->

Code: `src/components/inputs/`.

> **D-43 (2026-11-26) — read this first.** Every component of this family is drawn as stock
> shadcn/ui draws it. Where a registry note, a contract row or a pitfall below describes an
> appearance of ours on a kit control — the 44 px target minimum (`min-h-target`), height `auto`,
> a border instead of a shadow or scrim, a bar or fill marking a state, an always-on underline, a
> restated focus ring, the grey theme — it is **superseded**: that restyle is removed. What still
> differs from stock is listed, completely, in § Deviations from stock. Props, names, roles,
> states and keyboard behaviour are unchanged.

## Deviations from stock

The complete list for this family (D-43; `../COMPONENTS.md` § Conventions).

| Component | What is added | Why — the matrix cell that fails without it |
| --- | --- | --- |
| `Input`, `Textarea`, `Select`, `InputGroup` | While **invalid and focused**, the kit's own ring (`focusRingOverInvalid`, `src/components/actions/focus-ring.ts`); no other state changes | `focus-not-visible` in the keyboard pass: the kit's invalid tint outranks `:focus-visible`, so a focused invalid field looks unfocused (WCAG 2.4.7) |
| `Select` | The trigger fills its field (`w-full`), keeps the kit's height as a minimum and lets a chosen value wrap | Clipped text at 320 px: the kit cuts the value to one line (`line-clamp-1`) with nowhere to read the rest |
| `Select` | `surface-frosted` on the list: a translucent background, a backdrop blur and the small shadow instead of the kit's `bg-popover` and `shadow-md`; the kit's ring stays. The kit's two scroll buttons inside a long list keep their opaque `bg-popover` | **Visible, by the owner's decision D-47**: surfaces that float over the page are frosted (`../TOKENS.md` § Frosted surface) |

**Removed with D-43:** the 44 px minimum on every control and row; the dashed edge and `muted` fill of a
read-only control (read-only is the native state and looks like any field); the full `primary` border of a
checked row; the enlarged hit box of a switch or radio (the kit's own reaches past the mark); the border on
the select list (the kit's shadow and ring separate it) and its wrapping options; `alignItemWithTrigger` is
the kit's default again.

## Registry

One row per component. The Component cell is the component's name in
backticks and nothing else. Source: `kit` · `wrapped` · `new` · `dependency`;
Status: `lofi` · `styled` · `deprecated → <replacement>` (`../COMPONENTS.md`
§ Registry).

| Component | Source | Variants | Status | Notes |
| --- | --- | --- | --- | --- |
| `Field` | `wrapped` | Slots `label`, `description`, `error`; `disabled` | `lofi` | Label above, then one control, its description and its error text (an icon and words). Gives the control inside it its `id`, description, validity and `disabled` — a screen wires nothing. Holds `Input`, `Textarea`, `Select` or an `InputGroup` |
| `Label` | `kit` | — | `lofi` | Re-exported unchanged. `Field`, `Switch` and `RadioGroup` already label their control; use it alone only for a control none of them can hold |
| `Input` | `wrapped` | Native `type`; states by `disabled`, `readOnly`, `aria-invalid` | `lofi` | One line, target minimum, height `auto`. Read-only is a dashed edge on `muted`, not a fill alone |
| `Textarea` | `wrapped` | States as `Input` | `lofi` | Several lines; grows with what is typed (the kit's minimum height, never a fixed one) |
| `Select` | `wrapped` | `options` (`value`, `label`, `lang?`, `disabled?`), `placeholder`; states by `disabled`, `readOnly`, validity | `lofi` | Fills its field; a long value and a long option wrap instead of being clamped; each option is at the target minimum; the list opens under the trigger and separates by a border |
| `Switch` | `wrapped` | Slots `label`, `description`; states by `checked`, `disabled`, `readOnly` | `lofi` | A bordered labelled row that toggles as a whole; takes effect at once. Carries its own label, so it does not go inside `Field` |
| `RadioGroup` | `wrapped` | Slots `legend`, `description`, `error`; `options` (`value`, `label`, `description?`, `disabled?`); states by `disabled`, `readOnly`, validity | `lofi` | One bordered labelled row per option, the row is the target; carries its own legend, so it does not go inside `Field` |
| `InputGroup` | `wrapped` | Slots `start`, `end`; `align: inline · block` (default `inline`) | `lofi` | One border around a control and what is attached to it. Attached actions are our `Button` (never the kit's small group button); `block` puts `end` under a `Textarea` |
| `BehaviourModePicker` | `new` | Slots `legend`, `description`, `error`; `ceiling?: autonomous · assisted · deferred`; `extraOptions?`; states by `disabled`, `readOnly`, validity | `lofi` | Our `RadioGroup` with the three behaviour modes of `src/lib/vocab.ts`: icon, name and one line of meaning per option, the same everywhere a mode is shown. Under a `ceiling` (D-22) the modes above it are disabled, a value above it is shown as the ceiling, and the reason is a sentence in the group's description — never dimming alone. `extraOptions` adds choices that are not a mode after the three (未设置 on `settings.ai-modes`); they are never capped. The legend says what the mode is chosen for |

## Accessibility contract

One row per component of the registry above; the reviewer tests against it
(`../ACCESSIBILITY.md` § Per-component contract). Min target is 44 × 44 CSS px
through `size.target.min` for anything interactive. **Withdrawn by D-43:** there is no
target-size and no contrast requirement; the "Min target" column binds nothing.

| Component | Role | Name comes from | Keyboard | Focus | Min target | Announces |
| --- | --- | --- | --- | --- | --- | --- |
| `Field` | `group` (the kit's, unnamed); the label is a native `label` | — | Not interactive; a click on the label focuses the control | — | — | The error text is an `alert`, and is the control's description together with the help text |
| `Label` | Native `label` | Its text | Not interactive | — | — | — |
| `Input` | Native `input` (`textbox`, `searchbox`…) | The `Field` label; alone, `aria-label` | Tab; typing | The focus ring of `actions.md`, kept while invalid | 44 CSS px high, as wide as its field | `aria-invalid` with the error as description; `readonly`; `disabled` |
| `Textarea` | Native `textarea` | As `Input` | Tab; typing; Enter is a new line | As `Input` | As `Input` | As `Input` |
| `Select` | `combobox` button with a `listbox` of `option`s | The `Field` label; alone, `aria-label` | Enter, Space or the arrows open; arrows move; Enter chooses; Escape closes and returns focus to the trigger; typing jumps to an option | Ring on the trigger; in the open list the active option is filled | Trigger and every option 44 CSS px high | The chosen value as the trigger's text; `aria-expanded`; a disabled option is `aria-disabled`; an option in another language carries `lang`; read-only is `aria-readonly` — the list still opens to be read (the kit's behaviour, kept: rule 14) and choosing changes nothing |
| `Switch` | `switch` | Its `label` (the description is its description) | Tab; Space or Enter toggles | Ring around the whole row | The row, at least 44 CSS px high; the control's own hit box is 44 × 44 too | `aria-checked`; `aria-readonly`; `aria-disabled` |
| `RadioGroup` | `radiogroup` of `radio`s | Group: its `legend`. Option: its `label` (the option's description is its description) | One tab stop; arrows move and choose, skipping disabled options; Tab leaves | Ring around the focused option's row | Each row, at least 44 CSS px high; each control's own hit box 44 × 44 | `aria-checked`; the error is an `alert` and the group's description; `aria-invalid` on the group |
| `InputGroup` | `group` (the kit's, unnamed) | — (the control inside is named by its `Field`) | Tab order follows reading order: `start`, the control, `end` | The group draws the ring of the control inside it, kept while invalid | The control 44 CSS px high; an attached `Button` 44 × 44 | — |
| `BehaviourModePicker` | As `RadioGroup`: `radiogroup` of `radio`s | Group: its `legend`. Option: the mode's name from the shared vocabulary (the icon is `aria-hidden`); the mode's meaning is the option's description | As `RadioGroup`; a mode above the ceiling is skipped by the arrows | As `RadioGroup` | As `RadioGroup` | As `RadioGroup`; a mode above the ceiling is `aria-disabled`, and the sentence saying which mode the settings allow at most is part of the group's description, after the caller's own |
