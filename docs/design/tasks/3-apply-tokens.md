# Task 3 — Apply tokens to the components

> Status: evergreen — playbook: styling the registered components with the
> real token set, in units that respond, without breaking the adaptive
> behaviour built in task 1.

**Read first:** `../FOUNDATIONS.md` § Verification matrix · `../COMPONENTS.md` · `../TOKENS.md` · `../RESPONSIVE.md` § Unit policy · `../ACCESSIBILITY.md` · `../GOVERNANCE.md` · the stack doc § Units
**Skills:** `/design-tokens` · `/responsive` · `/accessibility`
**Gate:** `G-3` (Review of the running result — the owner approves before anything is mirrored) · **Then:** task 4 → `G-MIRROR`

## Goal

Every registered component looks final in every mode, contains zero raw
values, and still passes the whole verification matrix.

## Steps

1. **Baseline.** Capture matrix screenshots of the task-1 prototype. They are
   the reference for "layout did not regress".
2. **Per component, in dependency order:**
   1. Confirm every visual property already references the right token
      (colour, type, spacing, radius, border, shadow, blur, motion,
      opacity) and add the references low-fi did not need.
   2. Style every state — hover, focus-visible, pressed, selected, disabled,
      loading, error — from tokens. Focus indication is a token, not an
      afterthought.
   3. Check the unit of every dimension against the unit policy.
   4. Run the component at every matrix cell, every mode.
   5. Update its row in `COMPONENTS.md`.
3. **Missing token?** Stop. Walk the admission ladder (`GOVERNANCE.md`). Do
   not add a local constant.
4. **Screens.** Re-run the matrix on whole screens with real content; compare
   with the baseline.
5. **Gate.** `check:design-values` must report zero.

## Rules specific to this task

- A dimension is written in the unit the policy assigns to its role. Fixed
  units are allowed only for the roles on the policy's allowlist (hairlines
  and the like).
- Nothing that contains text has a fixed height. Containers grow.
- Touch and click targets keep their minimum size after styling.
- Tokens are bound, not resolved: no copying a token's value into a style.
- Styling must not change structure. If a component needs a structural change
  to look right, that is a task-1 defect — fix it there and re-verify.
- Per-theme literals are forbidden. If something reads correctly in one mode
  only, it is using the wrong token.

## Suggested work packages

One package per component family (actions, inputs, navigation, containers,
feedback, data display), then one for screens + matrix. Families can run in
parallel when their files are disjoint; the theme entry point has one writer.

## Common failures

- Converting everything to relative units mechanically — borders and icon
  grids blur, or radii balloon at large text sizes
- Focus ring that disappears on the dark surface
- Disabled state implemented as opacity over an already low-contrast colour
- Shadow tokens that do nothing in dark mode
- A "temporary" raw value inside an SVG or an inline style, invisible to the gate

## Done

`WORKFLOW.md` § Definition of done, row 3; reviewer checklist in `REVIEW.md`.
