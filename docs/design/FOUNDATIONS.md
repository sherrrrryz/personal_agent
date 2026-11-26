# Foundations — the project's fixed inputs

> Status: evergreen — what this product is built on: platforms, stack, UI kit,
> base values, where the IA map lives, and the matrix every screen is verified
> against. Filled in task 0 and approved at gate `G-0`; every later task reads it.

<!--
TASK 0 STATE (2026-11-26): draft complete — no placeholder left. Items marked
"proposed — G-0" (Vite, Style Dictionary, the verification matrix) are the
drafting session's recommendation and become binding at G-0. Next: a fresh
session reviews this file, IA-MAP.md and DECISIONS.md with the spec-review
checklist (REVIEW.md); then the owner decides at G-0. After G-0, change this
file only through a spec.
-->

## Product and platforms

- **Product:** Personal Agent is a personal AI workbench for people who run
  their own work — a small business or practice; the manager of a pet-grooming
  shop is the first story — that organises that work into connected modules: a
  shared base (notifications, messages, calendar, to-do, mail, files, topics)
  plus **profession modules** the AI pre-generates from an onboarding
  conversation about what the user does. Every module is tied to the user's own
  accounts and backed by a scheduled, node-editable workflow and a memory
  shared across modules, so the AI works proactively inside and between
  modules (autonomous, assisted or deferred, chosen within the user's ceiling
  by each task's confidence, stakes and reversibility), while a chat bar fixed
  to the bottom of every screen answers in place or opens a dedicated chat;
  the user sees work kept in order, not a transcript. (Rewritten 2026-11-26
  after D-28–D-30; approved at `G-0`)
- **Platforms:** web only; no native app for now (D-01)
- **Stack:** web → React 19 + TypeScript (D-02), built with Vite 8 (proposed — `G-0`);
  styling system: Tailwind v4 reading the CSS custom properties generated from
  the token source (follows D-03). Rules per stack: `stacks/react-web.md`.
  `stacks/react-native.md` is not in use.
- **Languages and direction:** zh-CN and en (D-17); LTR only, no RTL.
  The UI follows the browser language, en is the fallback, `<html lang>` is
  set per locale (D-24); how the user switches is decided in the task-1 spec

## Product brief

The owner's description, 2026-11-26, rewritten the same day when the Life
layer was removed (D-28). It is the input to the IA map and to every spec; it
is not itself a spec.

- **Audience:** non-technical individuals who run their own work — a shop, a
  practice, a one-person business. One user per workspace. The first story is
  the manager of a small pet-grooming shop who sells products, takes grooming
  appointments and schedules a few staff (D-26).
- **One workspace.** The product has a single work layer; there is no Life
  layer (D-28). Memory is shared across all modules of the workspace.
- **Base modules, the same for everyone:** notifications, messages, calendar,
  to-do, mail, files, topics.
- **Profession modules, generated per user (D-29):** in the place the earlier
  design had "projects", the workspace holds modules specific to the user's
  profession. They are **pre-generated at onboarding** from a conversation
  about what the user does, confirmed by the user, and can be added to later
  from conversations (D-08). For the pet-grooming shop: appointments, clients
  and pets, products and inventory, staff shifts. A profession module is a
  module like any other: workflow, memory, frame.
- **Onboarding (D-30):** before the shell, a first-run flow in three steps —
  (1) a **profession interview**: a detailed conversation in which the AI asks
  what the user does, how their work is organised and what recurs, then (2)
  proposes the set of profession modules it will pre-generate, which the user
  edits and confirms, then (3) connects the platform accounts those modules
  draw on. The shell opens on the notifications module afterwards.
- **Connected accounts:** every module connects to the platforms the user
  already uses — Google, Slack, Figma, GitHub and the like; for a shop also
  its booking, messaging and payment tools.
- **Every module is a workflow:** behind each module sits a workflow that
  runs on a schedule and rewrites the module's screen with its results, plus a
  memory. The user changes both by talking to the AI, and can also open the
  workflow and edit it directly.
- **How a workflow "rewrites" its screen (D-12):** the workflow's output
  nodes emit a page description that may only reference **registered blocks**
  (`COMPONENTS.md`) and tokens; the module screen is assembled from it. Content
  changes on every run; **layout changes only when the workflow itself is
  edited**. Each run marks what changed since the last one, and the user can
  pin a block in place. Free-form generated UI is never produced.
- **Triggers, not only schedules (D-12):** a workflow starts on a schedule, on
  an event from a connected account, by hand, or from another module.
  Triggers are nodes in the editor.
- **One module frame for every module (D-12):** a run-state header (last run
  and result, next run, running now, failure reason, items waiting for the
  user's approval in *deferred* mode, run history), the block body, and the
  entries to the module's workflow and memory.
- **Notifications module (D-13):** one for the workspace. It is itself a
  workflow that reads the outputs of every other module and surfaces the most
  important items in one place.
- **Workflows are shown as nodes, not text:** the logic of a workflow is
  presented in a form an everyday user can read and edit — a node-based canvas
  (steps, conditions, schedules, outputs as connected blocks) in the manner of
  node editors — never as a plain "skill" text file. Positioned as *read and
  adjust* (a time, a threshold, a confirmation mode), not *build from scratch*.
- **Proactive AI with three behaviour modes:** the AI acts on its own
  according to the module's workflow. The user can set a behaviour mode per
  kind of task — **autonomous**, **assisted** or **deferred** — and the AI
  picks the mode for a given task from its confidence, the stakes and how
  reversible the action is. Precedence (D-22): the user's setting is the
  **ceiling**; the AI picks at or below it; where nothing is set the AI
  decides, defaulting to *assisted*.
- **Chat bar:** persistent at the bottom of every screen. From what the user
  types it decides whether to answer in place or open a dedicated chat window
  for that topic. "In place" (D-23): a panel that expands above the bar, in
  the context of the current screen, and is filed into Topics; there is no
  separate main-thread page.
- **Topics module:** every conversation with the AI is filed automatically by
  theme into a topic whose home shows an AI-written summary of the important
  information drawn from those records, followed by every related
  conversation (D-07, D-20). Topics are the archive, not a module with a
  workflow.
- **Recent conversations sidebar:** a left sidebar, expandable, listing the
  user's recent conversations (D-15, now over the single workspace).
- **One-off or persistent (D-08):** in every conversation the user can choose,
  and later switch, whether it is a one-off chat or one that becomes a lasting
  sub-module with its own workflow under the module it concerns. The AI may
  propose the conversion itself.
- **Not chat-first:** unlike agents built around one chat box, the interface
  is the set of modules, and the AI works around them.

**Prototype scope (D-11, D-26, D-27).** The prototype shows every core
differentiator through the pet-grooming shop manager: onboarding with the
profession interview that pre-generates her four profession modules; a module
as a scheduled workflow that rewrites its own screen; the node-based workflow
editor as read-and-adjust; topics filed automatically with AI summaries; a
conversation switching from one-off to persistent and becoming a sub-module;
the three behaviour modes; the bottom chat bar with in-place answers and
dedicated chats; the shared module frame with run state; the notifications
module. Flow scripts: `IA-MAP.md` § Prototype flows — the hero story is the
AI learning her grooming times per breed and per dog and changing the
appointment and shift rules over the following weeks. The task-1 spec sizes
this into work packages; backends are faked. Market competition is out of
scope — this is a design exercise.

## Information architecture

- **IA map:** `IA-MAP.md` — the source for task 1. Format: Mermaid tree plus
  a node table (rewritten 2026-11-26 for the single workspace; confirmed at `G-0`)
- **Node ids:** every IA node has a stable id that screens, specs and the
  component registry refer to.

Top level only; the full table with every module, dynamic node and global
element is `IA-MAP.md` § Nodes.

| IA id | Node | Parent | Screen type |
| --- | --- | --- | --- |
| `onboarding` | First run: profession interview → module set → connect accounts | — | first-run flow |
| `root` | App shell — chat bar, sidebar toggle | — | shell |
| `notifications` · `messages` · `calendar` · `todo` · `mail` · `files` · `topics` | Base modules, the same for every user | `root` | module |
| `profession` | Profession modules generated at onboarding; for the shop: `appointments`, `clients`, `inventory`, `shifts` | `root` | module group |
| `chat.bar` · `chat.recent` · `chat.thread` | Chat bar (bottom, every screen), recent-conversations sidebar (left); the dedicated chat hangs off the bar | `root` (`chat.thread` under `chat.bar`) | global elements |
| `settings` | Connected accounts, AI behaviour modes, the profession module set | `root` | settings |

## UI kit

- **Kit:** shadcn/ui, the whole kit, with Tailwind v4 (D-03). Checked 2026-11-26
  with CLI 4.23.1: style `base-nova`, primitives `@base-ui/react`, icons
  `lucide-react`, font `@fontsource-variable/geist`, animations `tw-animate-css`;
  pinned when installed in the first task-1 package · **Licence:** MIT.
  `base-nova` and the Base UI primitives are the CLI's defaults, not a
  separate choice among Base UI / Radix / React Aria; `base-nova` is a styled
  default, so "lightly styled" holds only through the token rebinding of
  tasks 2–3
- **Why this one:** the owner named the kit directly (D-03), so the
  two-or-three-kit comparison in `tasks/0-foundations.md` step 4 was not run;
  the criteria it meets: accessibility comes from headless primitives that follow
  the Authoring Practices; every visual value is reachable through CSS
  variables, so one token source can feed it; the components are copied into
  the repo, so agents can read and edit them and the system stays small.
- **How components are taken from it:** copied into the repo and owned
  (`src/components/ui/`), added one by one as the IA needs them (`GOVERNANCE.md`);
  not installed wholesale
- **Theming hook:** CSS custom properties generated from the token source,
  mapped to Tailwind utilities through `@theme inline`; dark mode is the
  `.dark` class on `<html>` (shadcn's `@custom-variant dark`); no value is
  written in a component
- **Kit-code exemption (D-06):** shadcn's own component code carries literals
  the gate rejects (6 arbitrary utilities in `button.tsx`) and fixed button
  heights (`h-6`…`h-9`). It is kit code: `src/components/ui/` is excluded from
  `check:design-values` and from hard rules 1, 6 and 10, and is never edited to
  add literals. Wrappers, compositions and screens we write follow every rule.
  Reviewers check kit controls for clipped text at 200% zoom instead
- **Known gaps:** a **node-based canvas** for the workflow editor
  (`<module>.workflow`, D-10) — shadcn/ui has nothing of the kind. Decided
  (D-16): **React Flow** (`@xyflow/react`, MIT) is the single-purpose canvas
  dependency — pan, zoom, drag, edges, selection. It is not a second UI kit:
  node bodies, handles, toolbars and panels are shadcn components; every
  visual value in our overrides comes from tokens; the library's own stylesheet
  is imported from `node_modules` and never copied in. Keyboard operation and
  focus of the canvas are verified against `ACCESSIBILITY.md` in the task-1
  review. Version pinned when installed. Other gaps are listed when the task-1
  spec fixes the component inventory

Building a component the kit already provides is forbidden. Wrapping one to
bind it to tokens is the normal case.

## Token tooling

- **Source:** `tokens/` (DTCG JSON, one file per type) · **Build tool:**
  Style Dictionary (version pinned in task 2) · **Outputs:**
  `src/tokens/generated/tokens.css` (proposed — `G-0`)
- **Check config:** `design-values.config.json` at the repo root lists the UI
  source folders to scan (`include: ["src"]`), the token source and
  generated outputs to exempt (`tokenPaths: ["tokens/", "src/tokens/generated/"]`)
  and the kit code that is not ours (`exclude: ["src/components/ui/"]`, D-06;
  the script reports how many files it skipped). The check fails if it finds
  nothing to scan.

## Figma

**Not in use in this project (D-04).** No Figma file; task 4, gate `G-MIRROR`
and the mirror batching for task 5 are switched off. Each stage closes at the
owner's review of the running code (`G-1`, `G-2`, `G-3`, `G-5`). If Figma is
enabled later, a new decision supersedes D-04 and this section is filled from
`tasks/0-foundations.md` step 7.

## Running prototype

- `npm run dev` → <http://localhost:5173> (also startable from the Claude
  desktop app's browser pane via `.claude/launch.json`, configuration `dev`)

## Base values

**shadcn/ui's defaults are the base values (D-05).** Task 2 expands them into
the three tiers and invents nothing; a new primitive enters only through
`GOVERNANCE.md` when a specific design needs it. Values below are from the
CLI 4.23.1 `neutral` theme and Tailwind v4 defaults, checked 2026-11-26;
re-read them from the installed version in task 2.

| Type | Base value(s) | Expansion rule (detail in `TOKENS.md`) |
| --- | --- | --- |
| Colour | shadcn `neutral`: ~30 semantic roles (`background`, `foreground`, `card`, `popover`, `primary`, `secondary`, `muted`, `accent`, `destructive`, `border`, `input`, `ring`, `chart-1…5`, `sidebar-*`), light and dark, OKLCH. Neutral lightness steps used: 0.145 · 0.205 · 0.269 · 0.371 · 0.439 · 0.556 · 0.708 · 0.87 · 0.922 · 0.97 · 0.985 · 1; `destructive` hue ≈ 27 (light) / 22 (dark); no brand hue (`primary` is near-black) | Task 2 lifts the lightness steps into one primitive neutral ramp and re-expresses every shadcn role as an alias to it, so the names shadcn components use stay the semantic tier. A new hue is an `HITL.md` § Always ask |
| Typeface | Geist Variable (sans; heading = sans), SIL OFL 1.1; no mono installed. **Geist has no CJK glyphs**: zh-CN renders in the system CJK stack — PingFang SC → Microsoft YaHei → Noto Sans CJK SC — as a font-family token in the source (D-25) | — |
| Font size | Tailwind v4 default scale, base 1rem (`text-xs` 0.75rem … `text-9xl` 8rem) with paired line heights | Tailwind's scale as shipped; no new step without admission |
| Spacing | Tailwind `--spacing` 0.25rem | Tailwind's integer and half multiples |
| Radius | `--radius` 0.625rem | × 0.6 · 0.8 · 1 · 1.4 · 1.8 · 2.2 · 2.6 (`sm` → `4xl`), plus `full` |
| Shadow | Tailwind v4 default shadow scale | `2xs` … `2xl` as shipped |
| Blur | Tailwind v4 default blur scale | as shipped |
| Motion | Tailwind default transition (150ms, standard ease) + `tw-animate-css` presets | as shipped; reduced motion per `RESPONSIVE.md` |

## Modes

| Mode | Required | Notes |
| --- | --- | --- |
| Light | yes | |
| Dark | yes | Designed, not inverted. Follows the system preference; an in-app light/dark toggle overrides it (D-19) |
| High contrast | no (D-18) | `prefers-contrast: more` is not mapped; `forced-colors` must still be usable (`stacks/react-web.md`) |
| Brand / density variants | no (D-18) | |

## Verification matrix

Every screen and component is checked at every required cell before a task is
done. Reviewers re-run it. Web only; the app column is empty by D-01.

| Axis | Web (proposed — `G-0`) | App |
| --- | --- | --- |
| Width | 320 · 768 · 1024 · 1440 CSS px | n/a |
| Text size | 100% · 200% browser zoom; root font size 24px | n/a |
| Theme | light · dark | n/a |
| Input | keyboard · pointer · touch · screen reader | n/a |
| Motion | default · reduced | n/a |
| Direction | LTR only; both locales (zh-CN, en) checked for text length | n/a |

**How to run it:** `npm run dev`, then open the prototype in the Claude
desktop app's browser pane or Chrome; widths and zoom via the browser's
device toolbar; reduced motion and colour scheme via the rendering emulation
panel; screenshots per cell with the browser tools; screen-reader pass with
VoiceOver on macOS (a session that cannot drive it reports the pass as not
checked, `REVIEW.md` protocol 7).

## Commands

```bash
npm run dev                  # run the prototype — http://localhost:5173
npm run tokens:build         # regenerate src/tokens/generated/ from tokens/ (added in task 2)
npm run check:design-values  # no raw visual values under src/
npm run check:docs           # docs index and status headers
npm run verify               # both checks + lint + build
npm test                     # component tests (added with the task-1 spec)
```
