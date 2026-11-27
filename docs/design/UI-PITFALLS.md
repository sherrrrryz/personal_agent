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
| A screen inside the shell scrolls as a whole document, down into empty space | [§2](#2-layout-and-reflow) |
| Opening the chat panel pushes the header, or the composer she is typing in, out of the window | [§2](#2-layout-and-reflow) |
| A sidebar group is opened and nothing seems to happen | [§2](#2-layout-and-reflow) |
| `npm run matrix -- '/chat/conv-1'` reports `route-not-found` for a route that is registered | [§8](#8-tooling-and-the-shell) |
| A flow's Tab walk begins in the middle of the page | [§8](#8-tooling-and-the-shell) |
| The page in `npm run dev` reloads by itself while nobody edits it | [§8](#8-tooling-and-the-shell) |
| A panel, sheet or selection opened in one scene shows another object after a jump in 原型控制 | [§8](#8-tooling-and-the-shell) |
| `axe` reports `label-content-name-mismatch` on a button that has a perfectly good name | [§5](#5-ui-kit) |
| The keyboard pass reports that Tab leaves a modal sheet, or never reaches the page behind it | [§5](#5-ui-kit) |
| In forced colours every sidebar item and button has a frame, and the current item or selected tab looks like the others | [§3](#3-theme-and-colour) |
| A screen passes `--cells smoke` and fails `--cells full` | [§8](#8-tooling-and-the-shell) |
| After a scene jump a click on 页面 · 工作流 · 记忆 does nothing | [§8](#8-tooling-and-the-shell) |
| A conversation gets taller and taller by itself after she sends a message, or an answer is cut at its beginning | [§5](#5-ui-kit) |
| Cells that should line up across columns are staggered | [§2](#2-layout-and-reflow) |

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

### A screen inside the shell scrolls as a whole document, down into empty space

**Rule:** the shell's `main` stays `relative` (`src/shell/Shell.tsx`); a scroller of your own that holds visually hidden text or kit form controls needs the same.

`sr-only` text and the hidden inputs behind the kit's switch, checkbox and
select are `position: absolute`. Inside a scroller that is not positioned
their containing block is the page, so they do not scroll with the content:
one that sits 2000 px down a long screen makes the document 2000 px tall
while the shell is one window high — the window gets its own scrollbar and
scrolls to nothing. Sideways the matrix would catch it; downwards nothing
does. Found on `/dev/frame` at 1440 (the renderer's pin status line), task 1, I5.

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

### Cells that should line up across columns are staggered

**Rule:** put the rows on one grid and make each column a `subgrid` of them.

Columns that each stack their own cells cannot share a row. `subgrid` is
dropped silently when the column is a size container (`@container`) — move
the container to the cell — and `auto-cols-fr` is `minmax(0, 1fr)`, which
lets a column with a minimum width overlap its neighbour: use `1fr`. Seen on
排班, K2, D-46.

## 3. Theme and colour

### In forced colours every sidebar item and button has a frame, and the current item or selected tab looks like the others

**Rule:** record it, do not restyle it — the stock kit carries "current" and "selected" by a background fill (D-43); the state stays in `aria-current` / `aria-selected`, and the breadcrumb and the `h1` say where she is.

Forced colours paints a transparent outline or border in a system colour, and
the kit's controls carry one at rest (`outline-hidden`, `border-transparent`),
so all of them are drawn framed; the fills that mark the current sidebar item
and the selected tab are removed there. Focus still differs (the frame changes
colour — the harness's forced-colours pass checks that). Seen in the C7
passes run, task 1; a fix would be a restyle of kit controls, which D-43 rules out.

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

### `axe` reports `label-content-name-mismatch` on a button that has a perfectly good name

**Rule:** when a button gets an `aria-label` that adds its object, the label must contain the button's visible word unchanged — pick the label by the same variant that picks the word (`connectors.reconnect.name.<variant>` in `ConnectorList`).

The visible word was 重试 and the name 重新连接「微信」: clear to read, refused
by `axe` (WCAG 2.5.3 — a voice user says the word she sees). It showed only
under `?preview=error`, which `--cells smoke` does not open. Task 1, C7.

### The keyboard pass reports that Tab leaves a modal sheet, or never reaches the page behind it

**Rule:** in a test or a flow, wait a frame after a Tab that lands on the end of a kit dialog before pressing again or reading `document.activeElement`; do not "fix" the dialog.

Base UI traps focus with two guard elements: the guard takes the focus and
hands it back into the dialog on the next animation frame. Two Tab presses
inside one frame — only a script can do it — walk out into the covered page.
The harness waits for the guard and, for a route that opens on a modal
(`…/appointments/<id>`, `?history=open`), walks the dialog only
(`e2e/matrix/README.md` § Limits). Task 1, C7.

### A conversation gets taller and taller by itself after she sends a message

**Rule:** the kit's `MessageScroller` scrolls only inside a box of limited height that is a flex column (`ChatMessageList` fills it); a surface where the page scrolls instead passes `follow={false}`.

The scroller places a new turn of hers (`scrollAnchor`) at the top of its
viewport and, to be able to, adds room under it: the viewport's size less
what follows the turn. Where nothing limits the list, the viewport is as tall
as its content, the added room makes it taller, and the room is measured
again — the onboarding interview grew by about 4000 px a second. With
`follow={false}` no turn is an anchor and nothing is added. The same
component's `autoScroll` was tried and left off: it follows the end of a
growing answer, so in the in-place panel the answer's beginning — the part
she reads first — had scrolled away when it was complete (the flow
`panel-open` asserts that it has not). Detail: `components/chat.md`
§ Pitfalls. Observed with Chromium and `@shadcn/react` 0.3.1, task 1, K1.

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

### The page in `npm run dev` reloads by itself while nobody edits it

**Rule:** keep `.claude/**`, `.matrix/**` and `.orchestration/**` in `server.watch.ignored` of `vite.config.ts`, anchored at the checkout's own directory.

Vite watches the whole project root. Other sessions' worktrees live under
`.claude/worktrees/`, matrix runs write `.matrix/`, notes go to
`.orchestration/` — every file written there reloaded the page open in the
main checkout, which reads like a crash or a lost state. The patterns are
absolute, not `**/.claude/**`: a worktree's own path contains `.claude/`, and
the loose form would stop it watching itself. Found in task 1, wave 5.

### A panel, sheet or selection opened in one scene shows another object after a jump in 原型控制

**Rule:** component state that names a runtime object (a conversation, proposal, node or row id) must be dropped when the scene changes — remember `state.epoch` beside the id and treat a different epoch as "nothing open" (`src/chat/ChatBar.tsx`).

Ids repeat between scenes: `conv-1` is one conversation in 第一晚 and another
in 今天. A panel opened on 预约 reopened after the jump on the other
scene's `conv-1`, the hero sentence went into it, and 接受 landed on a
different module's workflow. Found by the keyboard flow in task 1, C5.

### A screen passes `--cells smoke` and fails `--cells full`

**Rule:** before calling a screen done, run its previews once: `npm run matrix -- '<route>' --preview error --cells smoke` (and `empty`, `loading`, `long`) — `smoke` alone never opens them.

Only `--all --cells full` adds the previews a route lists, so a fault that
exists only in a screen's error or empty state survives every per-package
smoke run. In task 1 the one failure of the full run was of this kind.

### After a scene jump a click on 页面 · 工作流 · 记忆 does nothing

**Rule:** in a flow, close 原型控制's menu before clicking what it covers (`jump` in `e2e/flows/support.ts` does); by hand, click the button once more or press Escape.

The menu stays open after a scene is chosen (the shell's design, so several
scenes can be tried in a row) and lies over the view tabs at the right of
the frame header. Listed for the owner at `G-1`. Task 1, C5.

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
