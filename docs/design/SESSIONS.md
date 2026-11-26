# Sessions — who runs what, and the 400K budget

> Status: evergreen — how a big design task is split across sessions, how much
> each session may consume, and how unfinished work is handed over. The
> step-by-step procedure for a lead is the `/design-sessions` skill.

<!--
HOW TO BUILD THIS DOC
- Process, not project content. Fill the two <placeholders> (how sessions are
  started in your tool, how usage is read) and leave the rest.
- If the budget number changes, change it here only; every other doc points here.
-->

## Roles

| Role | Started by | Lifetime | May write code | May start sessions |
| --- | --- | --- | --- | --- |
| **Spec session** | Owner, or the orchestration session the owner designated (D-40) | One spec | No — the spec only | No |
| **Spec-review session** | Owner, or the orchestration session (D-40) | One review | No — the report only | No |
| **Lead session** | Owner, after approval — in this project the owner-designated orchestration session is the lead (D-40) | One approved spec | No — board, briefs, close-out docs only | Yes — child and review sessions |
| **Child session** | Lead | One work package (or one leg of it) | Yes | No |
| **Review session** | Lead | One review | No — the report only | No |

A fresh session is used at each role change so that no role inherits another's
assumptions: the spec reviewer has not seen the author's reasoning, the lead
has not seen the debate, the reviewer has not seen the implementation
struggle.

**A child session is a real session, not a background task or a subagent.**
The owner can open it, read it, steer it and stop it. Subagents and background
tasks are allowed *inside* a child session for searching and reading only;
they never own a work package.

How to start a session here: in the Claude desktop app (Code tab) the lead
calls the app's start-session tool (`mcp__ccd_session__start_session`) with
a `fresh` context and a brief; packages that run in parallel get
`use_worktree: true`. The owner starts spec, review and lead sessions from
the sidebar's **New session** on this folder. In a terminal, `claude` in
the checkout (or in the package's worktree) is the same thing.

## Where sessions work

- **One task branch** per spec: `design/<spec-name>` (for example `design/lofi-prototype`), in one
  working directory. Packages that run **in sequence** share it, one session
  at a time.
- Packages that run **in parallel** each get their own worktree and their own
  branch cut from the task branch (`<task-branch>--<package>`). When they
  finish, an integration package merges them back, in the order the lead
  names, and re-runs the checks. A branch is never checked out in two places.
- **Runtime state has one absolute location** — `/Users/axue/Documents/personal_agent/.orchestration/` — written into every brief. It is untracked, so
  it does not exist in other worktrees; sessions always use the absolute path.

## The budget

- **Hard cap: 400K tokens per session**, every role — the cumulative total
  the session has consumed as the usage tool reports it, not the size of the
  current context window; compaction does not reset it.
- **Plan for 250K.** A work package is sized so that a child finishes it,
  including its own verification, in about 250K. The rest is margin.
- **Checkpoint at 300K.** At the first step boundary after 300K the session
  stops starting new work and writes its handoff. It does not "just finish
  this one thing".
- How to read usage: in the desktop app, the session usage tool
  (`mcp__ccd_session_mgmt__get_usage`) or the usage shown in the session's
  header; in the CLI, `/cost`. Compare the **cumulative tokens consumed**
  against the cap, not the current context size.
  Check it at every step boundary of the package, not only when it feels long.
  If usage cannot be read, the brief sets a step-count checkpoint instead
  (hand off after the planned handoff point, no judgement calls).

A session that discovers at 150K that its package will not fit says so
immediately — it does not wait for the checkpoint. The lead then splits the
package; the session continues on the first half.

## Sizing work packages

The spec carries the package plan (`docs/specs/_TEMPLATE.md` § Work packages);
the lead may refine it but not silently drop a criterion.

- One package = one coherent outcome with its own done-check (for example
  "form controls: Input, Select, Checkbox, Radio, Switch — coded, registered,
  matrix-verified").
- Rough costs to plan with, until the project has its own numbers in
  `DECISIONS.md`: a base component with states, tests and registry entry ≈
  25–40K; a screen composed from existing components ≈ 30–50K; a token tier
  for one type ≈ 20–30K; mirroring ten components into Figma ≈ 80–120K
  (design-tool calls are expensive — size these packages smallest).
- A package that reads a lot (audits, migrations) is split by directory, not
  by step.
- Every package names the files it owns. Two packages that run at the same
  time never own the same file; the token source, the theme entry point, the
  package manifest and the lockfile have **one writer at a time**.

## The board

Runtime state lives in `.orchestration/` at the root of the main checkout
(see "Where sessions work"). It is **not committed** — it is working memory for the sessions of one task, and what
matters from it is moved into `docs/` at close.

```
.orchestration/
  BOARD.md                 one row per package: owner session, status, handoff link
  briefs/<package>.md      what the lead told the child
  handoffs/<package>-<n>.md
  reviews/<name>.md
```

Package status is one of `queued` · `running` · `handed-off` · `in-review` ·
`changes-requested` · `done`. Only the lead edits `BOARD.md`; a child reports
by writing its handoff or completion note and saying so in its final message.

## The brief (lead → child)

A brief is complete when a session with no other context could do the work:

1. The outcome and its done-check, copied from the spec
2. The files the package owns, and the files it must not touch
3. The docs to read first — by path, at most five
4. The acceptance criteria this package carries
5. The budget rule and where the handoff goes
6. What is already true (previous handoff, if this is a second leg)

A brief never says "see the conversation" or "based on earlier findings".

## The handoff (child → next child)

Written to `.orchestration/handoffs/` from `templates/HANDOFF.md`. It is
planned, not improvised: the brief tells the child from the start where the
natural stopping points are, and the child keeps a running "state" section
current as it works, so the handoff at 300K is a tidy-up, not an
archaeology exercise.

A handoff must let the next session start **without re-reading what the
previous one read**: what is finished and verified, what is half-done and in
which file, what was decided and why, what was tried and failed, and the
exact next step.

Work in progress is committed on the package's branch before handing off (a
WIP commit is fine); uncommitted edits do not survive a session change.

### Lead, spec and review sessions

The cap applies to them too. A lead that reaches 300K brings the board fully
up to date, writes a handoff naming the next action, and asks the owner to
start a successor lead — the board and the briefs are its state. A review or
spec session that will not fit says so early; the lead (or the owner) splits
the review by package or the spec in two.

## What the lead does and does not do

- Does: read the spec, cut packages, write briefs, start sessions, read
  handoffs and reports (with search, not whole files), keep the board, call
  the owner at gates, close out.
- Does not: write feature code, fix review findings itself, read whole source
  files to "check" a child's work — that is what the review session is for.
- Stops and asks the owner only at the gates in `HITL.md`. Everything else it
  decides and records.

## Pitfalls

### The lead could no longer start sessions overnight

- **Cause:** in the Claude desktop app, a session may start another session
  only on the owner's own message, or on a turn triggered by a child session
  finishing **in an unbroken chain from that message**. Any automated turn in
  between — a scheduled heartbeat, a cron prompt — breaks the chain, and every
  later `start_session` is refused until the owner writes again.
- **Rule:** a lead that must run unattended sets **no** scheduled prompts or
  heartbeats in its own session. It relies on the child-finished turns only,
  and tells the owner before they leave that one word from them restarts a
  stalled chain. Messages to sessions that already exist are not affected.
  The same refusal applies to a session whose task was given by another
  session: **a successor lead started by the outgoing lead cannot start
  children.** The owner starts the successor (or writes one message in it),
  as "Roles" says; the outgoing lead leaves the handoff and a proposal card.
  A long unattended chain can also pause after many child-finished turns in a
  row; one word from the owner resumes it.
- **First seen:** task 1, spec review, 2026-11-26 (D-41 night).

### A child could not write its report to `.orchestration/`

- **Cause:** child sessions run in their own worktree and a hook refuses
  writes outside it, so the absolute runtime path in "Where sessions work" is
  read-only for them.
- **Rule:** a child writes its report, completion note or handoff to
  `<its worktree>/.orchestration/…` (untracked) and names the path in its
  final message; the lead copies it to the main checkout's `.orchestration/`.
  Every brief says so.
- **First seen:** task 1, spec review, 2026-11-26.
