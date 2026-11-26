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

## Measured costs

Real token costs observed on this project, used to size later packages
(`SESSIONS.md` § Sizing).

| Kind of package | Tokens used | Notes |
| --- | --- | --- |
