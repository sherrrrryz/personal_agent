# Task 4 — Mirror the approved stage in Figma

> **Not in use in this project (D-04, `DECISIONS.md`).** Kept for when Figma is
> enabled by a later decision; nothing in this document binds current work.


> Status: evergreen — playbook: the closing stage of tasks 2 and 3 and of
> each task-5 batch: once the owner has approved the running code, rebuild it
> in Figma and have the owner confirm the match. Task 1 is never mirrored.

**Read first:** `../FIGMA-SYNC.md` · `../figma-file-map.md` · `../HITL.md`
**Skills:** `/figma-mirror` (which requires the Figma plugin's own skills before any write)
**Gate:** `G-MIRROR` (Review) — after `G-2` / `G-3` / `G-5` has already passed on the code

## Preconditions

- The stage's independent review verdict is `pass` or `pass with notes`.
  Unreviewed work is never mirrored — the owner's attention is the scarcest
  resource in this workflow.
- **The owner has seen the running code and passed the stage's gate**
  (`G-2`, `G-3` or `G-5`), recorded in `DECISIONS.md`. Without that entry,
  stop — do not mirror on an independent review alone.
- The branch is committed; the mirror records the commit the owner approved.
- The stage is not task 1.

## Steps

1. **Scope.** State which build-order stages apply (`FIGMA-SYNC.md` § Which
   stages a task runs) and what will *not* be built.
2. **Drift check** on what already exists. Resolve before adding.
3. **Build** in order — variables → styles → components → screens — one
   stage validated before the next. Write every id to the ledger and the file map.
4. **Self-validate:** counts against the source, zero raw fills, zero detached
   instances, one screenshot per finished composition compared with the
   running code.
5. **Review page.** Assemble the frames the owner should look at, in each mode.
6. **Mirror review.** A fresh review session checks the mirror against
   `REVIEW.md` row 4 — it looks at the render, not at script results. Fix
   what it finds before the owner sees anything.
7. **Evidence packet** for `G-MIRROR` (`HITL.md`): Figma beside the running
   code. Ask the owner to confirm the match. Stop the dependent work.
8. **Triage** the owner's comments with the lead: fix now · amend spec · new
   spec · won't do (with the owner's agreement).
9. **Fix in code**, re-run the affected checks, **update Figma in place**,
   resolve each thread.
10. **Close:** the owner's explicit confirmation is recorded in `DECISIONS.md`
   with the commit and the Figma page.

## Rules specific to this task

- Figma is rebuilt from the code the owner approved; nothing is designed in
  Figma first, and nothing is mirrored before the owner approved it in code.
- A new design wish raised at `G-MIRROR` goes back to code and its own gate;
  it is not patched into Figma.
- An owner edit in Figma is a comment. It reaches code through step 8.
- Mirror packages are the smallest in the plan (`SESSIONS.md` § Sizing) —
  design-tool calls are costly and a half-built component set is hard to
  hand over. One package ≈ one page or ≤ 10 components.
- The handoff for a mirror package always includes the ledger path and the
  last validated node.

## Done

`WORKFLOW.md` § Definition of done, row 4; reviewer checklist in `REVIEW.md`.
