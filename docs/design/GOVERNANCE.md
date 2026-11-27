# Governance — keeping the design system small

> Status: evergreen — the test a new token or component must pass, the limits
> on near-duplicates, and how things are changed and removed. Read before
> creating anything the system does not already have.

<!--
HOW TO BUILD THIS DOC
- The admission ladder and the test are fixed. Fill the minimum-step table and
  the budget from your own token source once task 2 is done.
- Every "refused" example you add from real history makes the next agent's
  decision easier. Keep them.
-->

The default answer to "should I add one?" is **no**. A design system's cost
grows with every item: each one must be themed, mirrored, documented, reviewed
and kept consistent forever.

## The admission ladder

Walk it top-down and stop at the first rung that works.

1. **Use** an existing component with an existing token, as is.
2. **Compose** existing components.
3. **Configure** — an existing prop, slot or variant of an existing component.
4. **Extend** — add a variant or a prop to an existing component (spec required).
5. **Add** a semantic token that aliases an existing primitive (or, with a
   written reason, a component token that aliases a semantic one).
6. **Add** a new component built from kit primitives (approved in the spec at
   `G-SPEC` before it is built; reviewed by the owner in running code at `G-5`, before it is mirrored).
7. **Add** a new primitive value (owner decision — `HITL.md` § Always ask).

## The admission test

A new token or component is admitted only when every answer is written into
the spec's "Additions to the design system" table:

| Question | Passing answer |
| --- | --- |
| What is the closest existing item? | Named, with its value or screenshot |
| Why does it not serve? | A reason a user would notice — not "the mock shows 14" |
| Where is it used? | At least **two** real, distinct places now. One use = keep it local to the composition, built from existing tokens |
| Is it nearer than the minimum step to a neighbour? | No (table below) |
| Does it name a purpose? | Yes — `surface/raised`, never `gray-750` or `card-2` |
| Does it work in every mode and at every font scale? | Shown, not assumed |

The threshold is **two**. A need that appears once is met locally, by
composing existing components and existing tokens — never with a raw value.
When the same composition is needed in a second place, it may be proposed
as a system item. Not before.

**Blocks (D-12).** A block is a registered component marked as a block in
`COMPONENTS.md`, with a stable block id that a module workflow's page
description may reference. The threshold applies unchanged: a block is a
system item once **two** module workflows emit it, or the module frame uses
it. A need one workflow has is met inside that module's page description by
composing existing blocks — it is not a new block and is not registered.

## Minimum step — what counts as "too similar"

Two tokens of the same type that differ by less than this are duplicates;
keep one.

| Type | Minimum distinguishable step |
| --- | --- |
| Colour (same role) | `<e.g. one ramp step; no two semantic colours within ΔE 3 of each other in the same mode unless they are a deliberate alias>` |
| Spacing | Only values on the scale; nothing between two adjacent steps |
| Font size | Only steps of the type scale |
| Radius | `<e.g. 5 steps total: none, sm, md, lg, full>` |
| Shadow / elevation | `<e.g. 4 levels>` |
| Blur | `<e.g. 3 levels>` |
| Duration / easing | `<e.g. 3 durations, 2 easings>` |

## Budget

A soft ceiling that makes growth visible. Crossing it is allowed only with a
`DECISIONS.md` entry.

| Kind | Now | Ceiling |
| --- | --- | --- |
| Primitive colours | 18 | `<n>` |
| Semantic colours | 32 (31 with a dark value) | `<n>` |
| Type styles | 0 of our own — Tailwind's shipped scale; one `font.family` token | `<n>` |
| Spacing steps | 0 of our own — Tailwind's shipped scale; 9 radius and border-width tokens | `<n>` |
| Components in `COMPONENTS.md` | 63 rows (54 components, 2 chat surfaces, 7 blocks) | `<n>` |

"Now" was counted at the close-out of task 1 (2026-11-26) from `tokens/` and the twelve family files. No ceiling is set yet: the stock shadcn/ui theme is the only theme and tasks 2 and 3 are not done (D-43).

The reviewer reports the delta on every task-5 review.

## Changing and removing

- **Renames and value changes are breaking.** They need the owner, a spec, and
  a migration in the same change: every consumer updated, generated outputs
  rebuilt~~, Figma variables updated in place (never deleted and recreated —
  that breaks bindings)~~ (Figma not in use, D-04).
- **Deprecate, then delete.** Mark the item deprecated in the token source or
  `COMPONENTS.md` with its replacement; delete it in the first change after
  its last consumer is gone.
- **Orphans go.** A token or component with no consumer is deleted in the
  change that discovers it, unless a spec in `approved` status needs it.

## Audit

Run at the start of any large task-5 effort and before every `G-5`:

1. Naming — anything not following `TOKENS.md` / `COMPONENTS.md` conventions
2. Coverage — raw values per category (`check:design-values`), should be zero
3. Duplicates — pairs under the minimum step
4. Orphans — defined, never referenced
5. Completeness — components missing a state, a mode, or a registry entry
6. ~~Drift — token source vs Figma variables (`FIGMA-SYNC.md` § Drift check)~~ — not in use in this project (D-04)

## Refused additions

<A short log of things that were proposed and not added, with the reason and
what was used instead. This is the most useful section for the next agent.>

| Proposed | Refused because | Used instead |
| --- | --- | --- |
