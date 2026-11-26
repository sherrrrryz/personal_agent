---
name: figma-mirror
description: NOT IN USE in this project (docs/design/DECISIONS.md D-04) — do not load; Figma is switched off. Original purpose, for when it is enabled — procedure for rebuilding a coded design stage in Figma (variables, styles, component sets, screens) and having the owner confirm it matches. Only for stages the owner has already approved in running code (tasks 2, 3 and task-5 batches — never the low-fi prototype). Load BEFORE any Figma write in this repo, together with the Figma plugin's own skills.
---

# Figma mirror — procedure

> **Not in use in this project (D-04).** Stop here: this project has no Figma
> stage. Kept for when a later decision enables Figma.

Authority, build order and mapping rules: `docs/design/FIGMA-SYNC.md`.
Node ids: `docs/design/figma-file-map.md`. Gates and evidence: `docs/design/HITL.md`.

**Also load, every time:** the Figma plugin's `figma-use` skill (mandatory
before each write call), plus `figma-generate-library` for variables and
components and `figma-generate-design` for screens (names as of plugin
v2.2 — use the plugin's current equivalents). This
skill adds the project's order, gates and authority rules on top of them;
where they conflict, this repo's rules below win.

## Preconditions — stop if any is false

- The stage is task 2, task 3 or a task-5 batch — task 1 is never mirrored
- The stage passed independent review
- **The owner saw the running code and passed `G-2` / `G-3` / `G-5`** — the
  entry is in `docs/design/DECISIONS.md`; if it is missing, stop and tell the lead
- The branch is committed (record the commit — the one the owner approved)
- `FIGMA-SYNC.md` § Before the first mirror is filled in: file, plan limits,
  font, icon set
- You know which build-order stages this task runs

## Steps

1. **Post the scope** — what will be built, what will not, the acceptance checks.
2. **Open the ledger** `docs/design/figma-ledger.json` (committed); re-read it each
   turn; write every returned id to it at once.
3. **Read the file first:** pages, collections and modes, variables, styles,
   component sets. Run the drift check. Update in place whatever exists.
4. **Variables:** primitives (single mode, hidden from pickers) → semantic
   (aliases, one per mode, scoped to their role) → spacing / radius / type.
   Rename default modes. Code syntax = the real code token name. 20–30 per call.
5. **Styles:** text styles for the type ramp; effect styles for shadow and
   blur; bind their fields to variables. (After task 1 these are the
   placeholder text styles.)
6. **Components**, in dependency order, one at a time: base with auto-layout
   and every property bound → variants → combine → properties → description.
   Validate counts, then one screenshot.
7. **Screens:** assembled from instances inside auto-layout frames. Compare a
   screenshot with the running code, in each mode.
8. **Review page** for `G-MIRROR`, each frame set explicitly to its mode.
   Update `figma-file-map.md` and commit the ledger. Report to the lead: a
   fresh review session checks the mirror **before** the evidence packet
   goes to the owner.
9. **After the owner's comments:** fixes land in code first, then Figma is
   updated in place, then the thread is resolved.

## Rules

- Code decides values and names; Figma is regenerated to match. A difference
  you cannot explain is shown to the owner, not resolved silently.
- Bind variables — never paste a resolved value. No raw fills, no detached
  instances, no flattened images of UI.
- Themes are modes on one node.
- Writes are sequential; reads may be parallel.
- Check existence before creating. Delete only by id from the ledger.
- Never build on a stage that failed its exit check.
- Use the product's real font and icon set; stop if they are unavailable.
- Contrast problems are reported, not fixed in Figma.
- Never publish a library or touch a file other than the one in
  `FIGMA-SYNC.md` without the owner (`G-PUB`).

## Budget

Mirror packages are small: one page or ≤ 10 components. At the 300K
checkpoint the handoff names the ledger, the last validated node and the
next item in the build order.
