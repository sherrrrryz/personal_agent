# Decisions

> Status: evergreen — every answer the owner has given that binds future work.
> Read before asking the owner anything: a question answered here is never
> asked again.

<!--
HOW TO BUILD THIS DOC
- Append-only, newest last. One entry per decision, written the day it is made.
- An entry is the QUESTION, the ANSWER, and WHAT IT BINDS. No discussion.
- When a decision is reversed, add a new entry and mark the old one
  "superseded by D-nn"; do not edit history.
- A decision that is really a general rule moves into the doc that owns the
  domain, and the entry here points to it.
-->

| # | Date | Question | Decision | Binds | Source |
| --- | --- | --- | --- | --- | --- |
| D-01 | 2026-11-26 | Which platform(s)? | Web only; no native app for now | `FOUNDATIONS.md` § Product and platforms; the stack doc is `stacks/react-web.md` | Owner, in conversation before task 0 |
| D-02 | 2026-11-26 | Which front-end library? | React (with TypeScript) | `FOUNDATIONS.md` § Product and platforms; every component | Owner, in conversation before task 0 |
| D-03 | 2026-11-26 | Which UI kit for web? | shadcn/ui, used as the whole kit (components copied into the repo; its default headless primitives); Tailwind v4 follows, because shadcn/ui requires it. No second kit, no hand-built component the kit provides | `FOUNDATIONS.md` § UI kit; `stacks/react-web.md` § Styling system; every component | Owner, in conversation during task 0 |
| D-04 | 2026-11-26 | Is Figma part of this project? | No. Task 4 (mirror), gate `G-MIRROR`, the mirror batching for task 5, `FIGMA-SYNC.md`, `figma-file-map.md` and the `/figma-mirror` skill are switched off — kept in the repo, marked "not in use", binding nothing. Every stage closes at the owner's review of the running code (`G-1`, `G-2`, `G-3`, `G-5`). Enabling Figma later needs a new decision that supersedes this one | `CLAUDE.md` § Task router row 4 and § Hard rules 15–16; `WORKFLOW.md` step 8; `HITL.md` `G-MIRROR`; `FOUNDATIONS.md` § Figma | Owner, in conversation during task 0 |
| D-05 | 2026-11-26 | Where do the base values come from? | shadcn/ui's defaults are the base values: the `neutral` theme's semantic colour roles (light and dark, OKLCH), Geist as the typeface, `--radius` 0.625rem, plus Tailwind v4's default scales for spacing, type, shadow, blur and motion — all pinned at the versions installed in task 1 (CLI 4.23.1, style `base-nova`, checked 2026-11-26). The owner supplies no seed values of their own. A new primitive is added only when a specific design needs it, through the admission test in `GOVERNANCE.md` | `FOUNDATIONS.md` § Base values; task 2 (expands these, invents nothing); `HITL.md` § Always ask still applies to new hues, families and off-scale sizes | Owner, in conversation during task 0 |
| D-06 | 2026-11-26 | How is shadcn's copied component code treated under the hard rules and the gate? | Option A — it is kit code, not ours. Files copied from shadcn/ui into `src/components/ui/` are exempt from `check:design-values` (`design-values.config.json` § exclude) and from hard rules 1, 6 and 10 (literals, units, fixed heights inside the kit). They are not edited to add literals. Everything we author — wrappers, compositions, screens, tokens — follows every rule and is scanned. Reviewers compensate by checking every kit control in use for clipped or overflowing text at 200% zoom and the largest root font size (`REVIEW.md` rows 1 and 3). Evidence: CLI 4.23.1 `button.tsx` has 6 arbitrary utilities and fixed heights `h-6`…`h-9` | `CLAUDE.md` § Hard rules (kit-code exception); `design-values.config.json`; `REVIEW.md`; `FOUNDATIONS.md` § UI kit | Owner, in conversation during task 0 (G-0 packet § 8) |
| D-07 | 2026-11-26 | IA: do Topics hold all conversations, are the shared base modules one component family, and is there a first-run flow? | Yes to all three: `life.topics` / `work.topics` are the home of every conversation (the recent-conversations sidebar is a shortcut into them); messages, calendar, to-do, mail and files are one component family rendered in both layers; an onboarding flow runs once before the shell and connects the user's platform accounts | `IA-MAP.md` (nodes `onboarding`, `*.topics`, `chat.recent`); the task-1 spec's component inventory | Owner, in conversation during task 0 |
| D-08 | 2026-11-26 | Can a conversation become a lasting module? | Yes. In every conversation the user chooses, and can later switch, between a one-off chat and a persistent one; persistent conversations become a user-created sub-module with its own workflow under the module they concern (e.g. a promotions digest under Mail), and the AI may propose that conversion itself | `IA-MAP.md` (`chat.bar`, `chat.thread`, `<module>.<workflow>`); `FOUNDATIONS.md` § Product brief; the task-1 spec's chat and module components | Owner, in conversation during task 0 |
| D-09 | 2026-11-26 | What crosses between the Life and Work layers? | Calendar data only. Every other module, its memory and its workflow stay inside its layer; memory sharing is within a layer | `IA-MAP.md` (`life.calendar`, `work.calendar`, `<module>.memory`); `FOUNDATIONS.md` § Product brief; every memory and data-flow design | Owner, in conversation during task 0 |
| D-10 | 2026-11-26 | What is a module, and how is its logic shown? | Every module is backed by a workflow that runs on a schedule and rewrites the module's screen with its results. The workflow's logic is presented to the user in an easy-to-read, directly editable form — a node-based canvas (steps, conditions, schedule, outputs as connected blocks), in the manner of node editors — never as plain skill text. It is also editable by talking to the AI | `IA-MAP.md` (`<module>.workflow`); `FOUNDATIONS.md` § UI kit known gaps; the task-1 spec | Owner, in conversation during task 0 |
| D-11 | 2026-11-26 | How big is the prototype? | It shows every core differentiator (list in `FOUNDATIONS.md` § Product brief), not a narrow slice; backends may be faked. The task-1 spec turns this into work packages | Task-1 spec scope; `SESSIONS.md` package sizing | Owner, in conversation during task 0 |
| D-12 | 2026-11-26 | How does a workflow "rewrite" its module screen, what starts it, and what do all modules share? | (1) Block model: the workflow's output nodes emit a page description that may reference only registered blocks (`COMPONENTS.md`) and tokens; the module screen is assembled from it. Content changes per run; layout changes only when the workflow itself is edited; each run marks what changed; the user can pin blocks. No free-form generated UI. (2) Triggers: schedule, event from a connected account, manual, or from another module of the same layer — all nodes in the editor. (3) One module frame: run-state header (last run and result, next run, running, failure, items awaiting approval in deferred mode, history), block body, entries to workflow and memory | `IA-MAP.md`; `COMPONENTS.md` (blocks are the registry); the task-1 spec (frame first) | Owner, in conversation during task 0 (agent proposed, owner approved) |
| D-13 | 2026-11-26 | Is there a place that gathers the most important content from all modules? | Yes: a notifications module, one per layer, itself a workflow that reads every other module's output in its layer and surfaces the most important items. Whether a single cross-layer view is also wanted is open at `G-0` | `IA-MAP.md` (`life.notifications`, `work.notifications`); `FOUNDATIONS.md` § Product brief | Owner, in conversation during task 0 |
| D-14 | 2026-11-26 | Is there a cross-layer notifications view? | No. Notifications exist only per layer (closes the open part of D-13); calendar remains the only Life ↔ Work bridge (D-09) | `IA-MAP.md`; any aggregation design | Owner, in conversation during task 0 |

## Measured costs

Real token costs observed on this project, used to size later packages
(`SESSIONS.md` § Sizing).

| Kind of package | Tokens used | Notes |
| --- | --- | --- |
