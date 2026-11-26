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
| An import of `@/app` works on this Mac and fails, or loads another module, elsewhere | [§8](#8-tooling-and-the-shell) |
| `npm run matrix` stops with `no matches found`, or checks a route nobody named | [§8](#8-tooling-and-the-shell) |
| Opening the chat panel pushes the header, or the composer she is typing in, out of the window | [§2](#2-layout-and-reflow) |
| A sidebar group is opened and nothing seems to happen | [§2](#2-layout-and-reflow) |
| `npm run matrix -- '/chat/conv-1'` reports `route-not-found` for a route that is registered | [§8](#8-tooling-and-the-shell) |
| A flow's Tab walk begins in the middle of the page | [§8](#8-tooling-and-the-shell) |
| A flow with a type error passes `npm run verify` | [§8](#8-tooling-and-the-shell) |

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

### Opening the chat panel pushes the header, or the composer she is typing in, out of the window

**Rule:** whatever grows inside the shell's bottom row takes its limit from the room the shell has left, measured (`usePanelLimit` in `src/chat/ChatBar.tsx`), and the bar keeps its end in the window while the composer has focus.

The shell's column is header, `main` with a minimum, then the bar's row; when
the three are taller than the window the column scrolls as a whole — its
fallback, so nothing is ever covered. "At most half the shell" alone is 320 of
640 px: at 320 × 640 the header, `main`'s minimum, the panel and the composer
passed the window by 124 px, the column scrolled and the header left the
screen. The panel's limit is therefore the smaller of half the shell and what
the header, `main` at its minimum and the rest of the bar leave — never under
`main`'s own minimum. Where even that does not fit (320 × root 24 px) the
column still scrolls, and a panel that grows while the answer arrives would
push the focused composer under the window's edge: a `ResizeObserver` on the
bar scrolls its end into view while the composer has focus. Both limits are
measured in px at run time and set as an inline style — there is no token for
"what is left". Observed with Chromium, task 1, S12; `flow panel-open` asserts
it at 1440 (its 320 × root 24 px cell went when phone widths left the scope).

### A sidebar group is opened and nothing seems to happen

**Rule:** a collapsible group at the end of the sidebar brings its last row into view when she opens it (`RecentGroup` in `src/chat/RecentGroup.tsx`) — when she opens it, not when the page loads with it open.

The sidebar's middle scrolls and its footer stays. A group that expands at the
bottom of a full sidebar (scene `s2` at 1440 × 900) adds its rows below the
scroller's edge: the chevron turns, the rows exist, a test in jsdom finds
them, and on the screen nothing changes. Observed with Chromium, task 1, S12;
the third test of `flow panel-open` asserts it.

## 3. Theme and colour

## 4. Elevation and blur

## 5. UI kit

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

### `npm run matrix -- '/chat/conv-1'` reports `route-not-found` for a route that is registered

**Rule:** name the scene with a route whose screen exists only in one: `npm run matrix -- '/chat/conv-1' --scene s2`.

The scenes a route lists in `matrixRoutes` are read by `--all` only. A route
named on the command line runs without `?scene=`, in the state before
onboarding, where a conversation, a sub-module or a notification of the story
does not exist yet — and a screen that answers "no such thing" with the
not-found screen fails as a misspelt route would. `--preview <state>` is added
the same way, one state per run.

### A flow's Tab walk begins in the middle of the page

**Rule:** before counting Tab stops in a flow, tab off the end of the document (`tabThrough` in `e2e/flows/panel-open.spec.ts`) — or use the harness's `keyboardPass`, which allows for it.

A click, and a field that has focus, leave Chromium's starting point for
sequential focus navigation where they were; `blur()` does not move it back.
A walk that follows a click then begins after the clicked control and never
sees what comes before it — it reads as "Tab never reaches `main`".

### A flow with a type error passes `npm run verify`

**Rule:** until `e2e/matrix/tsconfig.json` (a frozen file) includes `../flows/*.ts`, type-check a new flow by hand: a temporary `tsconfig` beside it that extends `../matrix/tsconfig.json` and includes `*.ts`, then `npx tsc --noEmit -p` it.

`tsc -b` covers `e2e/matrix/` and `playwright.config.ts`; `e2e/flows/` is in
no `include`. Playwright strips types without checking them, so a flow runs
and passes with an error the compiler would have named. Found in task 1, S12;
the include is the integration leg's to add.

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
