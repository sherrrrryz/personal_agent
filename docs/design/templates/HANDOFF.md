# Handoff: <package name> — leg <n>

> Status: evergreen — template. Copy to `.orchestration/handoffs/<package>-<n>.md`;
> the copy is runtime state and is not committed.

<!--
Write this so the next session can start WITHOUT re-reading what you read.
Keep the "State" section current while you work; at the 300K checkpoint you
only tidy it. Under ~120 lines. No narrative of how the session went.
-->

- **Spec:** `docs/specs/<name>.md` · **Package:** `<id>` · **Branch:** `<branch>` @ `<commit>`
- **Written at:** `<tokens used>` of 400K · **Reason:** `<checkpoint | blocked | package split>`

## Done and verified

<What is finished, with the command or screenshot that proves it. Only things
the next session can rely on without re-checking.>

- [x] `<outcome>` — verified by `<command / matrix cells>`

## In progress

<What is half-done, in which file, and what state it is in. Say plainly if a
file does not currently build.>

- `<path>` — `<what is there, what is missing>`

## Not started

- [ ] `<remaining acceptance criterion or step>`

## Decisions made in this leg

<Choice · why · what it rules out. Anything the owner should hear goes to the
lead as a Notify item as well.>

## Tried and abandoned

<Approaches that failed and why, so they are not tried again.>

## Traps

<Things that cost time: a tool call that times out, a file that must not be
regenerated, a flaky check.>

## Exact next step

<One instruction the next session can execute first, with the file and the
command.>

## Read first (at most five)

- `<path>` — `<why>`
