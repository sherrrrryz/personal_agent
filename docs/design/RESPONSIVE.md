# Responsive and adaptive rules

> Status: evergreen — how layouts and components adapt to screen size and to
> the user's text size, and which unit each kind of value is written in.
> Framework specifics are in `stacks/`; the working checklist is the
> `/responsive` skill.

<!--
HOW TO BUILD THIS DOC
- The rules are framework-neutral and fixed. Fill the breakpoint table from
  FOUNDATIONS.md and keep the unit policy in step with the token source.
- A rule's numbers come from the standards cited; re-verify them when the
  standard is revised.
-->

Two things vary independently and both must be handled: **the space
available** (viewport, container, orientation, safe areas) and **the size of
text** (browser zoom, root font size, system font scale). A layout that
handles only the first is not responsive.

## Principles

1. **Content decides the layout; the layout does not decide the content.**
   Containers fill, fit or flex. A design dimension is a specification, not a
   fixed constraint.
2. **Smallest first.** Build the narrowest, largest-text case first and add
   room; never start wide and squeeze.
3. **Intrinsic before conditional.** Prefer wrapping, flexible grids and
   min/max constraints; use a breakpoint only when the *structure* changes.
4. **Components respond to their container, pages respond to the viewport.**
5. **Hierarchy survives every size.** What is most important at the widest
   size is still most important at the narrowest.
6. **Nothing is lost.** Content and function available at one size are
   reachable at every size.

## Layout rules

- The page never scrolls in two directions. Only content that needs two
  dimensions — data tables, diagrams, maps, and (house rule) code blocks —
  may scroll sideways, each inside its own container.
- Content reflows into a single column at the narrowest matrix width
  (WCAG 1.4.10: 320 CSS px wide without horizontal scrolling).
- Page padding is set once, on the outer layout primitive. Space between
  siblings is the parent's `gap`; components carry no outer margin.
- Avoid nested scroll containers.
- Persistent bars never cover content; safe-area insets are applied once, at
  the screen level.
- Line length of running text is capped (house rule: 45–75 characters).
- Works in both orientations unless the product has a stated reason
  (WCAG 1.3.4).
- Use logical directions (start/end, inline/block) so RTL needs no rewrite.
- One density per screen.

## Text-scaling rules

- Text must be resizable to 200% without loss of content or function
  (WCAG 1.4.4). On native, the system font scale is honoured.
- **Nothing that contains text has a fixed height.** Use min-height and let
  it grow. Fixed-height rows, buttons, tabs and badges are the usual breakage.
- Text wraps by default. Truncation is a decision recorded per text slot,
  with a way to reach the full text.
- Line height is a unitless ratio, never a fixed length.
- Spacing related to text scales with it; structural spacing need not.
- Layout survives increased text spacing (WCAG 1.4.12: line height 1.5,
  paragraph spacing 2×, letter spacing 0.12em, word spacing 0.16em).
- Capping the font scale is an exception per component, recorded with the
  reason, and never below the largest size the matrix requires.
- Design for a string 30–40% longer than the source language (house rule).

## Unit policy

Each role has one unit. Tokens are stored accordingly; a value in the wrong
unit is a defect even if it renders correctly today.

| Role | Web | React Native | Why |
| --- | --- | --- | --- |
| Font size | `rem` (fluid sizes: `clamp()` with `rem` bounds) | Number, scaled by the system font scale | Follows the user's text setting |
| Line height | Unitless | Multiple of the font size | Scales with the text |
| Spacing inside components (padding, gap) | `rem` | Number | Keeps proportion with text |
| Layout spacing, gutters | `rem`, or fluid `clamp()` | Number, stepped by size class | Adapts to space |
| Widths of containers | `%`, `fr`, `min()/max()`, `ch` for measure | Flex, percentages | Never a fixed width |
| Heights | `auto` / `min-height` | `minHeight` | Text must be able to grow |
| Control minimum size, touch target | `rem` with a floor at the platform minimum | Number at the platform minimum | Target size |
| Radius | `rem` for controls; pills use a very large fixed value (**allowed**) | Number | Keeps shape with size |
| Border and divider width | `px` (**allowed**) | `StyleSheet.hairlineWidth` or 1 (**allowed**) | A hairline should not scale |
| Focus ring width and offset | `px` (**allowed**) | Number (**allowed**) | Must stay crisp |
| Shadow offsets and shadow blur | `px` (**allowed**) | Number (**allowed**) | Optical, not textual |
| Backdrop / layer blur | `px` (**allowed**) | Platform intensity, mapped once in the token transform | Optical; not the same scale as the design tool |
| Opacity, z-index / layer, font weight | Unitless number | Number | Not a length |
| Duration, easing | `ms`, cubic-bezier | Number (ms), easing function | Motion tokens |
| Icon size | `em`/`rem` to follow adjacent text | Number, scaled with text where adjacent | |
| Breakpoints | `em`/`rem` in media or container queries | Size class from window width | Respect zoom |
| Letter spacing | `em` | Number derived from the font size | Proportional |
| Viewport-relative sizes | Dynamic viewport units, always with a `rem` bound | Window dimensions | Never text sized by viewport alone |

**Allowlist of fixed units — the one list, cited by every other doc:**
border and divider widths, focus-ring geometry, shadow geometry, blur
radius, the pill radius, and media that has intrinsic pixel dimensions.

These are still **tokens**: the fixed unit lives in the token source.
Component code references the token and contains no length of its own; the
only literal the check lets through is a `1px` hairline, and anything else
needs a line-level exemption with a reason (`check:design-values`).

**Storing units the token format lacks.** The format's `dimension` type
allows only `px` and `rem`. Values the policy expresses otherwise — `em`,
`ch`, `%`, `clamp()` expressions, unitless ratios — are stored as `number`
or string tokens with the unit or expression recorded in `$extensions`, and
the build emits the final CSS; React Native receives the resolved number.

## Breakpoints and size classes

| Name | Web (viewport / container) | App (window width) | Structure |
| --- | --- | --- | --- |
| Compact | `<e.g. < 600>` | `< 600dp` | One column; panels become sheets or stacked sections |
| Medium | `<e.g. 600–839>` | `600–839dp` | Two regions may sit side by side |
| Expanded | `<e.g. ≥ 840>` | `≥ 840dp` | Persistent navigation, multi-pane |

Breakpoints are tokens, but CSS custom properties cannot be used inside
media or container query conditions — the build emits them as build-time
constants for the styling system (`<mechanism, e.g. the framework's
breakpoint theme keys or custom media>`). A component never hard-codes one, and a structural
change at a breakpoint is written in the spec, not discovered in the code.

## User preferences

Honour, on every platform: reduced motion, colour scheme, increased
contrast where the platform exposes it, and text size.

## Verifying

Run the verification matrix in `FOUNDATIONS.md`. At each cell: no sideways
scroll, no clipped or overlapping text, no unreachable control, hierarchy
intact, targets still at minimum size.

## Pitfalls

<Add entries as learned; symptoms also go in `UI-PITFALLS.md`.>
