---
name: responsive
description: Responsive and adaptive rules for every UI change in this repo — screen size, container size and the user's text size. Load BEFORE writing or changing any component, layout or screen, on web or React Native, including low-fidelity prototypes.
---

# Responsive — working rules

Reference and rationale: `docs/design/RESPONSIVE.md`. Stack specifics:
`docs/design/stacks/react-web.md`, `docs/design/stacks/react-native.md`.
Matrix: `docs/design/FOUNDATIONS.md` § Verification matrix.

Two axes, always both: **space available** and **text size**.

> **Narrowed by D-44 in this project:** acceptance is on desktop only —
> widths of 1024 CSS px and up, default text size (the matrix cells are 1024
> and 1440). Keep writing layouts the way the rules below say and leave
> existing responsive code in place, but do not build, check or fix for
> widths under 1024 px, root 24 px, compact navigation or touch: a failure
> found only there is listed, not fixed. In the checklist, "narrowest width"
> reads 1024 px and "largest text size" reads the default.

## While building

1. Start from the narrowest width at the largest text size. Add room upward.
2. Let content size things: fill, fit, flex, wrap. A dimension from a design
   is a specification, not a fixed constraint.
3. Reach for wrapping, flexible grids and min/max before a breakpoint. Use a
   breakpoint only when the structure changes, and take it from the tokens.
4. Components respond to their container; pages respond to the viewport/window.
5. Page padding once, on the outer layout primitive. Sibling spacing is the
   parent's gap. No outer margin on components.
6. Nothing containing text gets a fixed height — `min-height` / `minHeight`.
7. Text wraps. Truncation is a recorded decision with a way to read the rest.
8. Each value in the unit its role is assigned (`RESPONSIVE.md` § Unit policy).
   Web: `rem` for type and spacing, unitless line height, `px` only for
   hairlines, focus rings and shadow geometry. React Native: numbers from the
   theme, font scaling left on.
9. Logical directions (start/end), never left/right.
10. Safe-area insets once, at the screen level. Bars never cover content.
11. Hierarchy and function are the same at every size — nothing disappears.

## Before calling it done

Run every matrix cell the change touches and look at each one:

- [ ] Narrowest width: one column, no sideways page scroll
- [ ] Every width class: structure as the spec describes
- [ ] Largest text size: nothing clipped, overlapped or unreachable
- [ ] Longest realistic strings and a 30–40% longer translation
- [ ] Empty, loading, error and very long content
- [ ] Both orientations (app), resized window (tablet / desktop)
- [ ] ~~Targets still at minimum size~~ — withdrawn by D-43
- [ ] RTL, if the product requires it
- [ ] `check:design-values` reports zero (it does not see everything — look
      for raw values in inline styles, utilities and SVG yourself)

Fix in the component or the layout primitive, not in the screen.

## Never

- A fixed width or height to make a mock-up's numbers match
- Text sized by the viewport alone
- A breakpoint chosen from a device name
- Turning font scaling off, or capping it without a recorded reason
- Hiding content at small sizes because it did not fit
- Branching on device type or orientation instead of available size
