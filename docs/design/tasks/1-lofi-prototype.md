# Task 1 — Low-fidelity prototype from the IA map

> Status: evergreen — playbook: turning the IA map into a running, responsive,
> accessible prototype built from the chosen UI kit, with base components
> registered and no visual decisions baked in.

**Read first:** `../FOUNDATIONS.md` · `../COMPONENTS.md` · `../RESPONSIVE.md` · `../ACCESSIBILITY.md` · `../TOKENS.md` § Placeholder theme · `../GOVERNANCE.md` · the stack doc
**Skills (load before the first line of UI code):** `/responsive` · `/accessibility` · `/design-tokens`
**Gate:** `G-1` (Review of the running prototype) · **Figma:** none — the low-fi prototype is never mirrored · **Then:** task 2

## What "low-fidelity" means here

Structure, hierarchy, behaviour and content — yes. Brand colour, final type,
decoration — no. The prototype is **fully real** in layout, responsiveness,
states and accessibility, and **deliberately neutral** in appearance.

Low fidelity is achieved by the **placeholder theme**, not by skipping tokens:
components reference semantic tokens from the first commit, and those tokens
resolve to greys, one system font and the default scale. Task 2 then swaps
the values without touching component code; task 3 finishes the styling.

## Steps

1. **Inventory.** Walk the IA map; list every screen and the components each
   needs. Map each component to the kit. Whatever the kit lacks goes to the
   spec's additions table and through `GOVERNANCE.md`.
2. **Scaffold.** App shell, routing/navigation that matches the IA, the token
   source with the placeholder theme, the theme provider, both modes wired.
3. **Layout primitives first.** Page container, stack, grid, section — the
   only places where page padding, gaps and breakpoints are decided.
4. **Base components**, in dependency order. Each one: taken from the kit,
   wrapped only to bind tokens and fix the public props; all states; the
   accessibility contract; a test; a row in `COMPONENTS.md`.
5. **Screens**, composed only from registered components and layout
   primitives. Real copy or realistic copy — never lorem ipsum. Every data
   surface gets empty, loading, error and long-content states.
6. **Verify** every screen across the matrix. Fix in the component, not in
   the screen.
7. **Self-check** against the definition of done, then hand to review.

## Rules specific to this task

- No component is written from scratch if the kit has it. No second kit.
- No colour, size, radius, shadow or spacing literal anywhere outside the
  token source — the placeholder theme is still a theme.
- Responsive behaviour is designed per screen in the spec, not discovered
  afterwards: what reflows, wraps, collapses, scrolls.
- Navigation follows the platform's conventions (stack doc § Platform
  conventions) unless the owner decided otherwise.
- One primary action per screen. One dominant region per screen.
- A screen that needs a custom one-off layout is a signal: either a layout
  primitive is missing or the IA node is two screens.

## Suggested work packages

| Package | Owns |
| --- | --- |
| Scaffold + placeholder theme + layout primitives | App shell, token source, theme provider |
| Base components A (actions, inputs) | Component files, tests, registry rows |
| Base components B (navigation, containers, feedback) | Same |
| Screens, by IA branch | One package per branch |
| Matrix verification + fixes | Screenshots, fixes in components |

## Common failures

- Low-fi built with inline greys "for now" — the raw values survive to task 3
- A component that works at one width and one font size
- States added only to the happy path
- Kit component restyled so heavily that its focus and keyboard behaviour broke

## Done

`WORKFLOW.md` § Definition of done, row 1; reviewer checklist in `REVIEW.md`.
