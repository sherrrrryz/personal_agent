# UI pitfalls — indexed by symptom

> Status: evergreen — what silently goes wrong between the token source, the
> UI kit, the framework and Figma on this project, and the rule that prevents
> it. The reader arrives with a symptom.

When the code and this document disagree, the code is right — fix the document
in the same change.

<!--
HOW TO BUILD THIS DOC
- Start it empty apart from the index and headings. It fills one entry at a
  time, in the change that hit the problem.
- Admission test: the failure is SILENT or MISLEADING, and the rule is not
  visible where the mistake gets made. A failure that throws a clear error
  does not belong here.
- Lessons go here, never only into a session, a handoff or agent memory.

Entry format:

### <Symptom, as observed>

**Rule:** <what to do, one sentence, naming the token/component/file.>

<Two or three sentences of mechanism: why it happens, and on which
platform/version it was observed.>
-->

## Symptom index

| Symptom | Where |
| --- | --- |
| `<Text is clipped at the largest font size>` | [§1](#1-text-scaling) |
| `<A layout scrolls sideways at 320px>` | [§2](#2-layout-and-reflow) |
| `<A colour is right in light mode and unreadable in dark>` | [§3](#3-theme-and-colour) |
| `<A shadow or blur does not appear, or differs from Figma>` | [§4](#4-elevation-and-blur) |
| `<The kit component lost its keyboard behaviour after styling>` | [§5](#5-ui-kit) |
| `<Figma shows a different value from the code>` | `FIGMA-SYNC.md` § Drift check |
| `<The gate is green and a raw value is still there>` | [§6](#6-token-pipeline) |

## 1. Text scaling

## 2. Layout and reflow

## 3. Theme and colour

## 4. Elevation and blur

## 5. UI kit

## 6. Token pipeline

## 7. Figma mirror

## Categories worth checking early

Use as a review prompt on the first few components; add an entry only once a
real failure is observed and understood on this stack.

- Fixed heights on anything containing text; line-height in fixed units
- Icon-only controls without an accessible name
- Relative units compounding inside nested components
- Viewport-height units behind mobile browser chrome and on-screen keyboards
- Shadows invisible on dark surfaces; elevation needing a lighter surface instead
- Blur radius meaning different things in the design tool and the framework
- Translucent tokens composited over the wrong surface in one mode
- Focus rings clipped by `overflow: hidden` or lost against the dark surface
- Safe-area insets applied twice, or not at all, around persistent bars
- A generated token file edited by hand and overwritten on the next build
- Kit upgrades that rename a slot or data attribute the theme hooks into
- Fonts that fall back silently — in the browser, on device, and in Figma
