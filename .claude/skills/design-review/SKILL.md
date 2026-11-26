---
name: design-review
description: Procedure for an independent review session — reviewing a design spec before approval, the result of a design task before the owner sees it, or a Figma mirror before the owner confirms it. Load at the start of any review session. The reviewer must not have authored the work and does not fix what it finds.
---

# Design review — reviewer procedure

Protocol and per-task checklists: `docs/design/REVIEW.md`. Report format:
`docs/design/templates/REVIEW-REPORT.md`.

## Before starting

- Confirm you authored none of the work and have not read the author's
  conversation. If you have, say so and stop.
- You get: the spec, the diff or branch, the rule docs. Ask the lead for
  nothing else unless a check cannot be run without it.

## Spec review

1. Read the task playbook for the spec's task type, then the spec.
2. Run the checklist in `REVIEW.md` § Spec review.
3. Try to break the plan: which acceptance criterion could pass while the
   result is still wrong? Which package cannot finish in 250K? What would the
   admission test refuse?
4. Write the report. Verdict `pass` or `pass with notes` (= ready for
   approval) only with no open `blocking` finding.

## Result review

1. **Run the gates** yourself: `check:docs`, `check:design-values`, tests.
2. **Run the product.** Walk the verification matrix in `FOUNDATIONS.md` for
   everything the task touched: every width, every mode, largest text size,
   keyboard, screen reader, reduced motion.
3. **Check the definition of done** for the task (`WORKFLOW.md`) line by line.
4. **Run the task's row** in `REVIEW.md` § Result review.
5. **Hunt for what scripts miss:** raw values in inline styles, arbitrary
   utility values, SVG attributes; tokens resolved and copied instead of
   referenced; a component branching on the theme; near-duplicate tokens;
   components not in the registry.
6. **Recompute, do not trust:** contrast ratios, token counts, variant counts.
7. **Write the report** — findings first, most severe first; each with where,
   which rule, how observed. State plainly what you could not check: a
   screen reader or device you cannot drive is replaced by the nearest tool
   (accessibility tree, simulator screenshots) and listed under "Not
   checked" for the owner.

## Mirror review (after the Figma build, before `G-MIRROR`)

First confirm the mirrored commit is the one the owner approved in code
(`DECISIONS.md`); a mirror of unapproved work is a blocking finding.

Run `REVIEW.md` row 4: diff variable names and values against the token
source; compare component-set variants with the code's props; look for raw
fills and detached instances; confirm screens are built from instances;
look at screenshots in every mode.

## Severity

- `blocking` — a hard rule in `CLAUDE.md`, an acceptance criterion, or the
  definition of done is not met
- `should-fix` — a domain rule or convention is not met
- `note` — a judgement call the owner should see

## Never

- Fix a finding yourself, or edit anything but your report
- Report "looks good" for an area you did not run
- Soften a hard-rule violation because the result looks fine
- Review the Figma mirror from a script result alone — look at the render
