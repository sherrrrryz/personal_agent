# Foundations — the project's fixed inputs

> Status: evergreen — what this product is built on: platforms, stack, UI kit,
> base values, where the IA map lives, and the matrix every screen is verified
> against. Filled in task 0 and approved at gate `G-0`; every later task reads it.

<!--
TASK 0 STATE (2026-11-26): draft. Items marked "proposed — G-0" are the
drafting session's recommendation and become binding only when the owner
decides at G-0 and the answer is recorded in DECISIONS.md. Items still in
<angle brackets> need the owner's input; the owner's summary of what is open
is .orchestration/G0-decision-packet.md. A placeholder left here blocks task 1.
After G-0, change this file only through a spec.
-->

## Product and platforms

- **Product:** Personal Agent is a personal AI workbench for everyday users
  that organises life and work into two layers of connected modules —
  messages, calendar, to-do, mail, files, finance and journal, plus projects
  with design, development and project-management sub-modules at work — each
  tied to the user's own accounts and backed by a scheduled, node-editable
  workflow and a memory shared across the modules of its layer, so the AI works
  proactively inside and between modules (autonomous, assisted or deferred, chosen by each task's confidence,
  stakes and reversibility) while a chat bar fixed to the bottom of every
  screen takes requests and opens a dedicated chat only when one is needed;
  the user sees work kept in order, not a transcript. (Owner, 2026-11-26)
- **Platforms:** web only; no native app for now (D-01)
- **Stack:** web → React 19 + TypeScript (D-02), built with Vite 8 (proposed — `G-0`);
  styling system: Tailwind v4 reading the CSS custom properties generated from
  the token source (follows D-03). Rules per stack: `stacks/react-web.md`.
  `stacks/react-native.md` is not in use.
- **Languages and direction:** `<locales, e.g. zh-CN + en; is RTL required>`

## Product brief

The owner's description, 2026-11-26. It is the input to the IA map and to
every spec; it is not itself a spec.

- **Audience:** the general public — non-technical individuals, one user per
  workspace.
- **Two layers:** *Life* and *Work*. Both ship with base modules: messages,
  calendar, to-do, mail, files. Life adds finance records and a journal; Work
  adds projects. A project holds further sub-modules such as design,
  development and project management.
- **Connected accounts:** every module connects to the platforms the user
  already uses, personal and corporate — Google, Slack, Figma, GitHub and the
  like.
- **Every module is a workflow:** behind each module sits a workflow that
  runs on a schedule and rewrites the module's screen with its results, plus a
  memory. The user changes both by talking to the AI, and can also open the
  workflow and edit it directly.
- **Workflows are shown as nodes, not text:** the logic of a workflow is
  presented in a form an everyday user can read and edit — a node-based canvas
  (steps, conditions, schedules, outputs as connected blocks) in the manner of
  node editors — never as a plain "skill" text file.
- **Memory stays inside its layer:** modules in one layer share memory with
  one another. Between Life and Work only **calendar data** crosses; nothing
  else does.
- **Proactive AI with three behaviour modes:** the AI acts on its own
  according to the module's workflow. The user can set a behaviour mode per
  kind of task — **autonomous**, **assisted** or **deferred** — and the AI
  picks the mode for a given task from its confidence, the stakes and how
  reversible the action is.
- **Chat bar:** persistent at the bottom of every screen. From what the user
  types it decides whether to answer in the main thread or open a dedicated
  chat window for that topic.
- **Topics module (both layers):** every conversation with the AI is filed
  automatically by theme into its own topic module — ask about fitness and a
  fitness module appears. A topic's home shows an AI-written summary of the
  important information drawn from those records, followed by every related
  conversation. In Work, the design, development and project-management
  sub-modules each have a view of all their conversations as well.
- **Recent conversations sidebar:** a left sidebar, expandable, listing the
  user's recent conversations.
- **Onboarding:** before any of these screens, a first-run setup flow whose
  main job is connecting all of the user's platform accounts.
- **One-off or persistent:** in every conversation the user can choose, and
  later switch, whether it is a one-off chat or one that becomes a lasting
  sub-module with its own workflow under the module it concerns. Example: "go
  through all my promotional mail and push me the ones that matter, by my
  preferences" can run once, or the AI turns it into a sub-module and workflow
  under Mail that keeps running. The AI may propose the conversion itself.
- **Not chat-first:** unlike agents built around one chat box, the interface
  is the set of modules, and the AI works around them.

**Prototype scope (D-11).** The prototype must show every core
differentiator, not a narrow slice: the two layers with calendar as the only
bridge; a module as a scheduled workflow that rewrites its own screen; the
node-based workflow editor; topics filed automatically with AI summaries; a
conversation switching from one-off to persistent and becoming a sub-module;
the three behaviour modes; the bottom chat bar with dedicated chats; the
onboarding flow. The task-1 spec sizes this into work packages; backends may
be faked.

## Information architecture

- **IA map:** `IA-MAP.md` — the source for task 1. Format: Mermaid tree plus
  a node table (drafted 2026-11-26 from the brief; confirmed at `G-0`)
- **Node ids:** every IA node has a stable id that screens, specs and the
  Figma map refer to.

Top level only; the full table with every module, dynamic node and global
element is `IA-MAP.md` § Nodes.

| IA id | Node | Parent | Screen type |
| --- | --- | --- | --- |
| `onboarding` | First-run setup: connect platform accounts | — | first-run flow |
| `root` | App shell — layer switch, chat bar, sidebar toggle | — | shell |
| `life` | Life layer: messages, calendar, to-do, mail, files, finance, journal, topics | `root` | layer home |
| `work` | Work layer: messages, calendar, to-do, mail, files, projects (design / development / project management, each with chats), topics | `root` | layer home |
| `chat.bar` · `chat.thread` · `chat.recent` | Chat bar (bottom, every screen), dedicated chat, recent-conversations sidebar (left) | `root` | global elements |
| `settings` | Connected accounts, AI behaviour modes; per-module workflow and memory panels | `root` | settings |

## UI kit

- **Kit:** shadcn/ui, the whole kit, with Tailwind v4 (D-03). Checked 2026-11-26
  with CLI 4.23.1: style `base-nova`, primitives `@base-ui/react`, icons
  `lucide-react`, font `@fontsource-variable/geist`, animations `tw-animate-css`;
  pinned when installed in the first task-1 package · **Licence:** MIT
- **Why this one:** accessibility comes from headless primitives that follow
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
  (`<module>.workflow`, D-10) — shadcn/ui has nothing of the kind. Open at
  `G-0` (`.orchestration/G0-decision-packet.md` § 9): a specialised dependency
  such as React Flow styled from tokens, or a component built through the
  admission test. Other gaps are listed when the task-1 spec fixes the
  component inventory

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
| Typeface | Geist Variable (sans; heading = sans), SIL OFL 1.1; no mono installed | — |
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
| Dark | yes | Designed, not inverted |
| High contrast | `<yes/no>` | `prefers-contrast: more` maps here if yes |
| Brand / density variants | `<yes/no>` | |

## Verification matrix

Every screen and component is checked at every required cell before a task is
done. Reviewers re-run it. Web only; the app column is empty by D-01.

| Axis | Web (proposed — `G-0`) | App |
| --- | --- | --- |
| Width | 320 · 768 · 1024 · 1440 CSS px | n/a |
| Text size | 100% · 200% browser zoom; root font size 24px | n/a |
| Theme | light · dark (+ high contrast if required) | n/a |
| Input | keyboard · pointer · touch · screen reader | n/a |
| Motion | default · reduced | n/a |
| Direction | LTR (RTL only if a required locale needs it) | n/a |

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
