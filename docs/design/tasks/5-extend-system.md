# Task 5 — Build on the existing design system (no Figma)

> Status: evergreen — playbook: implementing new screens and features directly
> in code from the existing system, adding to the system only when the
> admission test is passed.

**Read first:** `../FOUNDATIONS.md` · `../COMPONENTS.md` · `../TOKENS.md` · `../GOVERNANCE.md` · `../UI-PITFALLS.md` · the stack doc
**Skills:** `/design-tokens` · `/responsive` · `/accessibility`
**Gate:** `G-5` (Review of the running result) per batch, before the batch is mirrored · **Then:** task 4 → `G-MIRROR`

## The two cases

**A. Everything needed exists.** Compose registered components with existing
tokens. Small task (unless it is a new flow, a new IA node, or more than ~5
files): no spec, light review. The result joins the next mirror batch.

**B. Something new is needed.** Big task: spec with the additions table,
full pipeline. The result joins the next mirror batch.

Decide which case applies *before* writing code, by reading the registry —
not by starting to build and seeing what is missing.

## Steps

1. **Read the registry and the token list.** Know what exists.
2. **Design in code** from existing parts. Sketch the composition in the spec
   (or the change description for case A): which components, which variants,
   which tokens.
3. **For every gap**, walk the admission ladder (`GOVERNANCE.md`) and stop at
   the first rung that works. Write the answer down.
4. **Anything genuinely new** follows the constant rules, in this order:
   1. Responsive and accessible from the first commit (`/responsive`,
      `/accessibility`)
   2. Values are tokenised first, then applied — a new value enters the token
      source (through the admission test) before any component uses it
   3. Units by the unit policy
   4. All states, all modes
   5. Registered in `COMPONENTS.md` / the token source in the same change
5. **Verify** across the matrix. Run both gates.
6. **Independent review** — light for case A, full for case B.
7. **Close the batch at `G-5`.** The owner looks at the batch in running code
   and passes `G-5`; that closes it in this project. ~~Batch the mirror: new
   components and screens accumulate until a task-4 run is due
   (`FOUNDATIONS.md` § Figma); only then is it mirrored and confirmed at
   `G-MIRROR`.~~ (Figma not in use, D-04)

## Rules specific to this task

- No Figma file is not a licence to improvise. The registry and the token
  source *are* the design.
- "Close to an existing one" means **use the existing one**. A new item that
  differs by less than the minimum step is refused.
- A one-off need is solved by composition and existing tokens, locally. It
  may become a system item when a second real use appears, not before.
- Never fork a component to change its look. Add a variant through a spec,
  or use it as it is.
- The system's total size is reported in every review (`GOVERNANCE.md` § Budget).

## Common failures

- A new spacing value because a mock-up in someone's head had 14 where the
  scale has 12 and 16
- A "special" card that is the existing card with one padding changed
- A new semantic colour that aliases the same primitive as an existing one
- New screens or components never mirrored, so the owner's Figma file quietly goes stale
- A batch mirrored before the owner saw it running — Figma then records something nobody approved

## Done

`WORKFLOW.md` § Definition of done, row 5; reviewer checklist in `REVIEW.md`.
