# Independent review

> Status: evergreen — who reviews, what they read, what they check for each
> task, and how findings are closed. The reviewer's procedure is the
> `/design-review` skill; the report format is `templates/REVIEW-REPORT.md`.

<!--
HOW TO BUILD THIS DOC
- Keep the protocol as is. Grow the per-task checklists from real misses: when
  something reached the owner that a reviewer should have caught, add the check.
- A check that a script can run belongs in the script, not here.
-->

## Protocol

1. **Independent means a fresh session that wrote none of the work** and has
   not read the author's conversation. It gets the spec, the diff (or the
   spec alone, for a spec review), and the rule docs.
2. The reviewer **runs things**: the gates, the prototype, the matrix. A review
   that only reads code is not a review of a design.
3. The reviewer **does not fix**. It reports; a child session fixes; the
   reviewer re-checks only the fixed findings.
4. Every finding is one of `blocking` (violates a hard rule, an acceptance
   criterion or the definition of done), `should-fix` (violates a domain rule
   or convention), `note` (judgement call for the owner). Each names the file
   or node, the rule it breaks, and how it was observed.
5. The lead triages every finding: fixed, or dismissed with a written reason.
   A dismissed `blocking` finding needs the owner.
6. The verdict is `pass`, `pass with notes`, or `changes requested`. For a
   spec review, `pass` / `pass with notes` means "ready for approval". Step 7
   of the pipeline does not start on `changes requested`.
7. **What a session cannot run, it says.** If the reviewer cannot drive a
   screen reader or a device, it uses the nearest tool-based substitute
   (accessibility-tree inspection, automated scan, simulator screenshots at
   the matrix sizes), lists the cell under "Not checked", and the lead takes
   that list to the owner at the gate. An unchecked cell is never reported
   as passing.

## Spec review (pipeline step 2)

- Does every requirement of the task playbook appear as an acceptance criterion?
- Is every criterion testable by a command, a screenshot, or a measurable value?
- Does the spec introduce a token or component the admission test
  (`GOVERNANCE.md`) would refuse?
- Does anything contradict `FOUNDATIONS.md`, `DECISIONS.md` or a hard rule?
- Are the work packages disjoint in files, each sized under 250K, each with a
  done-check? Does every criterion have exactly one owning package?
- Are the owner gates named, and is anything from "Always ask" hiding in the plan?
- What is missing: states, modes, font scale, platforms, RTL, empty/error content?

## Result review, per task

Common to all: both gates green (`check:docs`, `check:design-values`), the
definition of done in `WORKFLOW.md`, docs updated in the same change.

| Task | The reviewer additionally checks |
| --- | --- |
| 1 Low-fi | Walk the IA map node by node in the running prototype · each component traces to the kit or the registry · resize through the whole matrix: no horizontal scroll, no clipped or overlapping text · largest font scale: nothing truncates without a way to read it · keyboard / screen-reader pass on every interactive component · every screen has empty, loading, error and long-content states · **kit code (D-06):** every shadcn control in use at 200% zoom and the largest root font size — no clipped or overflowing text in fixed-height buttons, inputs or menu items |
| 2 Tokens | Generated outputs rebuild byte-identical from the source · every semantic token has a value in every mode · recompute contrast for every pair in `TOKENS.md` — do not trust the table · look for near-duplicates and orphans (defined, never used) · no component-tier token aliases a primitive directly |
| 3 Apply | Grep for raw values beyond what the script catches (inline styles, arbitrary-value utilities, SVG attributes) — outside `src/components/ui/`, which is exempt kit code (D-06) and is checked for clipping at 200% instead · every mode at every matrix cell · unit policy: nothing that should scale is fixed · focus, pressed, disabled, error states styled from tokens · screenshots against task 1 for layout regression |
| 4 Mirror (run after the mirror is built, before `G-MIRROR`) | The mirrored commit is the one the owner approved in code (`DECISIONS.md`) · Variable names and values diff against the token source · each component set's variants match the code's props · nothing in Figma is detached or uses a raw fill · the screens are assembled from the component sets, not redrawn |
| 5 Extend | For each new token/component: was the admission test actually applied, and is the answer credible · could an existing one have done it · registry and token docs updated · total count moved by how much |

## Light review (small tasks)

A small task still gets a reviewer that did not write it. The implementing
session asks the owner to start one review session (or starts exactly one,
where the tool allows). One session, the "common to all" checks plus the
task-5 row, a report of findings in the change description. "Gates" here
means the two check scripts — no owner gate and no Figma step unless
something was added.

## What reviewers habitually miss

<Fill from experience. Seed list:>

- Dark mode checked on components but not on full screens with real content
- Font scale checked on body text but not on buttons, tabs and badges
- A token that is used once — the cheapest moment to delete it is now
- "Passes contrast" claimed for the default state only; hover, disabled and
  placeholder not measured
- The Figma mirror looks right but is built from frames, not component instances
