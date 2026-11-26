---
name: design-sessions
description: Procedure for the lead session of a big design task — cutting an approved spec into work packages, starting child sessions, enforcing the 400K token budget, handoffs, review and close-out. Load at the start of any lead session, and in a child session before writing a handoff.
---

# Design sessions — lead procedure

Rules and rationale: `docs/design/SESSIONS.md`. Pipeline: `docs/design/WORKFLOW.md`.
Gates: `docs/design/HITL.md`. This skill is the checklist.

## If you are the lead

0. This procedure is for big tasks. Task 0 and small tasks have reduced
   pipelines (`WORKFLOW.md`).
1. **Confirm the spec is `approved`** and that you did not write or review it.
   If either is false, stop and tell the owner.
2. **Read** the spec, `FOUNDATIONS.md`, `DECISIONS.md`. Do not read source files.
3. **Create the board:** `<main checkout>/.orchestration/BOARD.md` (always
   the absolute path — other worktrees cannot see it), one row per work package
   from the spec. Check: every acceptance criterion has exactly one owning
   package; no two concurrent packages own the same file; each ≤ 250K estimated.
4. **Write one brief per package** to `.orchestration/briefs/` — the six
   parts in `SESSIONS.md` § The brief. A brief must stand alone.
5. **Start child sessions** — real sessions, not background tasks or
   subagents. Sequential packages share the task branch; parallel packages
   get their own worktree and branch, merged back by an integration package
   (`SESSIONS.md` § Where sessions work). In parallel only when the files
   are disjoint; the token source,
   theme entry point, manifest and lockfile have one writer at a time.
6. **When a child reports:** read its completion note or handoff with search,
   not in full. Update the board.
   - Handoff → start the next leg with a brief that points at the handoff.
   - Complete → queue the package for review.
7. **Start the independent review session** (`/design-review`) once the
   packages it covers are complete. It must not be a session that wrote any
   of the work.
8. **Triage every finding:** assign fixes to a child session; dismiss only
   with a written reason; a dismissed `blocking` finding goes to the owner.
   Send fixed findings back for re-review.
9. **On a passing verdict,** bring the evidence packet to the owner and ask
   for the review of the **running code** (`G-1` / `G-2` / `G-3` / `G-5`).
   Fix what the owner asks for in code and show it again. Task 1 goes
   straight to Close after this.
   **Only after the owner's explicit pass,** start the Figma mirror package
   (`/figma-mirror`). When it is built, start a fresh review session on the
   mirror; after it passes, ask the owner to confirm the match (`G-MIRROR`).
10. **Close:** spec → `implemented`; registry, token, decision and pitfall
    docs updated; measured token costs added to `DECISIONS.md`; both gates
    green; board archived or deleted.

Stop for the owner only at the gates and the "Always ask" list in `HITL.md`.

## If you are a child

1. Read your brief and the docs it names — nothing more until you need it.
2. Keep a running **State** section in your handoff file from the first step.
3. Check token usage at every step boundary.
4. **At 300K** (or as soon as you can see the package will not fit): stop
   starting new work, commit what you have on your package's branch, finish the
   handoff from `docs/design/templates/HANDOFF.md`, report, end.
5. **Never exceed 400K.** Never start a session yourself. Never edit the board.
6. On completion: run the package's done-check and both gates, write a short
   completion note (what was done, evidence, Notify items), report, end.

## Never

- A lead writing feature code or fixing a finding itself
- A reviewer fixing what it found
- Two sessions in one working directory writing the same file
- "Continue from the conversation" in a brief or a handoff
- Passing a gate on anything but the owner's explicit word
- Starting a mirror before the owner approved the running code, or mirroring task 1
