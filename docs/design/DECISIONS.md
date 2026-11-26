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

## Measured costs

Real token costs observed on this project, used to size later packages
(`SESSIONS.md` § Sizing).

| Kind of package | Tokens used | Notes |
| --- | --- | --- |
