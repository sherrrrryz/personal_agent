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
| A screen inside the shell is too wide and the matrix reports no sideways scroll — or a full-page screenshot of it stops at the window's edge | [§2](#2-layout-and-reflow) |
| A kit control looks different from shadcn/ui's own — taller, bordered, underlined, grey — or a dialog has no scrim and no shadow | [§5](#5-ui-kit) |
| An import of `@/app` works on this Mac and fails, or loads another module, elsewhere | [§8](#8-tooling-and-the-shell) |
| `npm run matrix` stops with `no matches found`, or checks a route nobody named | [§8](#8-tooling-and-the-shell) |

## 1. Text scaling

## 2. Layout and reflow

### A screen inside the shell is too wide and the matrix reports no sideways scroll

**Rule:** the element that scrolls a screen — the shell's `main` (`src/shell/Shell.tsx`) — cuts sideways overflow with `overflow-x: clip` and never scrolls it; any later scrolling wrapper around a whole screen does the same.

The harness's `sideways-scroll` check measures the page. Once `main` scrolls
(`overflow-y: auto`), a screen wider than the window overflows `main`, not the
page: `main` would scroll sideways, the page would not, and the check would
pass on a broken screen. Cut instead, the too-wide content fails as
`clipped-text` — a failure that names the element. (`overflow-x: clip` beside
`overflow-y: auto` computes to `hidden`.) Observed with Chromium, task 1, S7.

For the same reason a full-page screenshot of a screen inside the shell shows
the window only: the page is one window high and the rest is inside `main`'s
scroller. The assertions are not affected — they run in the page — but for
eyes on what is below the fold, scroll `main` in a flow before the screenshot,
or look at the content on a bare route (`/dev/components`).

## 3. Theme and colour

## 4. Elevation and blur

## 5. UI kit

### A kit control looks different from shadcn/ui's own, or a dialog has no scrim and no shadow

**Rule:** never restyle a kit control from a wrapper, a composition or a screen, and never reset Tailwind's palette or shadow scale in `src/index.css` (D-43). A class on a kit control is a *deviation from stock*: it needs a failing matrix cell, must be invisible at the default size, and is listed in the family file.

The low-fi prototype first ran on a grey placeholder theme with the stock
palette and shadows removed, and every wrapper bound a 44 px minimum, its own
focus ring, borders and state bars. It cost a wrapper class list, tests and
doc rows per control, and the result was not the kit's look. The owner
withdrew it: stock shadcn/ui everywhere, a few colours changed later in
`tokens/` (`TOKENS.md` § Changing a colour). Two traps remain. With height
`auto`, the kit's own padding makes a control taller than stock — keep the
kit's height as `min-h-*` and use `py-1` (`components/actions.md` §
Pitfalls). And `min-h-target` sizes nothing any more — the target-size
requirement is withdrawn by D-43 — so it is not a way to size a kit control.

## 6. Token pipeline

## 7. Figma mirror

## 8. Tooling and the shell

### An import of `@/app` works on this Mac and fails, or loads another module, elsewhere

**Rule:** import from `src/app/` by file — `@/app/routes`, `@/app/router`, `@/app/Providers` — and never add an `index.ts` to `src/app/`.

`src/App.tsx` and the folder `src/app/` differ only in case. On macOS's
case-insensitive disk `@/app` resolves to `App.tsx`; on a case-sensitive one
(Linux, CI) it resolves to the folder, so the same line imports two different
things and nothing warns on the machine it was written on. For the same
reason `main.tsx` imports `./App.tsx` with its extension. Observed with
Vite 8 and TypeScript 7 on macOS, task 1.

### `npm run matrix` stops with `no matches found`, or checks a route nobody named

**Rule:** quote a matrix route that carries a query: `npm run matrix -- '/dev/components?family=layout'`.

In zsh an unquoted `?` is a filename pattern: the shell stops with
`zsh: no matches found` before the harness starts, which reads like a missing
route. In bash the word passes through as written until a file happens to
match, and then the file's path replaces it. The same holds for `*` and `[`.
Lines in the task-1 specs written without the quotes are meant with them.

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
