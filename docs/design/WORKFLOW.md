# Design workflow — lifecycle of a design task

> Status: evergreen — the one pipeline every design task runs through, the five
> task types it serves, and what "done" means for each. Session mechanics are
> in `SESSIONS.md`, human gates in `HITL.md`, review in `REVIEW.md`.

<!--
HOW TO BUILD THIS DOC
- Keep it on day one. It is process, not project content; edit only when the
  owner changes how work is run.
- A step earns a place here only if skipping it has silently produced a bad
  result. Do not add ceremony.
-->

## The task types

| # | Task | Input | Output | Playbook |
| --- | --- | --- | --- | --- |
| 0 | Foundations intake | Product brief, IA map, base values | Filled `FOUNDATIONS.md`, approved by the owner | [tasks/0-foundations.md](tasks/0-foundations.md) |
| 1 | Low-fidelity prototype | IA map + chosen UI kit | Running prototype, base components, placeholder theme | [tasks/1-lofi-prototype.md](tasks/1-lofi-prototype.md) |
| ~~2~~ — **not in use in this project (D-43)** | Design tokens | Base colour / type / radius / spacing / shadow / blur values | One token source, all tiers and modes, generated outputs | [tasks/2-design-tokens.md](tasks/2-design-tokens.md) |
| ~~3~~ — **not in use in this project (D-43)** | Apply tokens to components | Tasks 1 + 2 | Styled components, zero raw values, both themes | [tasks/3-apply-tokens.md](tasks/3-apply-tokens.md) |
| 4 | Figma mirror | The output of task 2, 3 or a batch of 5 — **after the owner approved the running code** | Figma variables, components and screens rebuilt from the code; owner confirms the match | [tasks/4-figma-mirror.md](tasks/4-figma-mirror.md) |
| 5 | Build on the existing system | A feature request, no Figma | New screens/components that follow the system | [tasks/5-extend-system.md](tasks/5-extend-system.md) |

> **D-04 — Figma is not in use in this project.** Task 4, pipeline step 8 and
> gate `G-MIRROR` are switched off; every stage closes at the owner's review of
> the running code (step 7). The Figma text below describes the full kit and
> binds only if Figma is enabled by a later decision.

> **D-43 — tasks 2 and 3 are not in use in this project.** The owner will not
> have them done (“任务2，3将不再进行，需要快速生产”): the prototype ships on
> stock shadcn/ui styling, and gates `G-2` and `G-3` do not occur. The
> playbooks are kept; the text below that schedules tasks 2 and 3 (the fixed
> order, the placeholder-to-real swap) binds only if a later decision
> supersedes D-43. In this project the order is 0 → 1, then 5.

Task 4 is not a one-off: it is the closing stage of tasks 2 and 3 (the
design system) and of every batch of task-5 work (components and screens
built on the system). **Tasks 0 and 1 are never mirrored** — the low-fi
prototype is reviewed as running code only.

**The mirror never starts before the owner has looked at the running code
and said it is right** (gates `G-2`, `G-3`, `G-5`). Figma records what was
approved; it is not where approval happens.

**Order is fixed for a new product:** 0 → 1 → 2 → 4 → 3 → 4, then 5 (→ 4 per
batch) indefinitely. Task 1 already consumes tokens — the placeholder theme (see
`TOKENS.md` § Placeholder theme). Task 2 swaps the placeholder values for the
real ones; task 3 finishes the styling (states, variants, units, component
refinements) and may edit component styles but not component structure.

## Big task or small task

A **big task** needs a spec and the full pipeline below. Anything in this list
is big:

- Tasks 1–3 in full, and any slice of them that spans more than one work package
- A new component, a new token, a new mode, or a change to an existing token's value or name
- A new flow or a new IA node; a new screen that needs anything the system lacks
- A UI-kit upgrade or replacement
- Any change that touches more than ~5 files of UI code

A **small task** (a tweak, or a new screen for an existing IA node, that only
composes existing components and existing tokens and stays under ~5 files)
skips the spec and the lead/child split. It still runs both check scripts
and still gets an independent review (`REVIEW.md` § Light review).

**Task 0 has its own reduced pipeline:** one session drafts `FOUNDATIONS.md`
following the playbook → a fresh session reviews it with the spec-review
checklist → the owner decides at `G-0`. No spec, no lead, no Figma stage.
Task 1 runs the full pipeline except step 8.

When unsure, it is big.

## The pipeline (big tasks)

```
 1 Spec session ──► 2 Spec-review session ──► 3 OWNER APPROVES (HITL)
                                                    │
 7 OWNER REVIEWS THE RUNNING CODE ◄── 6 Independent review ◄── 5 Child sessions ◄── 4 Lead session
                │
 8 Figma mirror → mirror review → OWNER CONFIRMS THE MATCH ──► 9 Close        (task 1 skips step 8)
```

| Step | Who | Reads | Produces | Exit condition |
| --- | --- | --- | --- | --- |
| 1 Spec | A spec session | The task playbook, `FOUNDATIONS.md`, the domain docs the playbook names | `docs/specs/<name>.md`, status `draft`, including the work-package plan | Every template section filled or explicitly skipped |
| 2 Spec review | A **fresh** session that has not seen step 1's conversation | The spec and the docs it cites — nothing else | Review report (`templates/REVIEW-REPORT.md`) | Verdict `pass` or `pass with notes` (= ready for approval). Blocking findings are fixed in the spec by a spec session — the original author or a new one, never the reviewer — and re-reviewed |
| 3 Approval | Owner | The spec + the review verdict | Status flipped to `approved` | Owner's explicit word (gate `G-SPEC`) |
| 4 Lead | A **fresh** lead session | The approved spec, `SESSIONS.md` | Board, one brief per work package | Every acceptance criterion is owned by a package |
| 5 Execute | Child sessions started by the lead | Their brief, the docs it names | Code + docs, or a handoff | Package's done-check passes, or handoff written |
| 6 Independent review | A **fresh** session that authored none of it | Spec, diff, rule docs | Review report | No open blocking finding; fixes made by a child, not by the reviewer |
| 7 Owner review of the code | Owner, on the running prototype / components | Evidence packet (`HITL.md`) | Owner comments, triaged and fixed in code | Owner's explicit word that the coded result is right (gates `G-1`, `G-2`, `G-3`, `G-5`) |
| ~~8 Mirror~~ — **not in use in this project (D-04)** | A child session builds; a fresh review session checks the mirror (`REVIEW.md`, row 4); then the owner | `FIGMA-SYNC.md` | Figma page, mirror review verdict | Step 7 passed first · mirror review passes · owner confirms Figma matches the approved code (gate `G-MIRROR`) |
| 9 Close | Lead | — | Spec `implemented`; registry, token, decision and pitfall docs updated; board archived | `check:docs` and `check:design-values` green |

Three different sessions write, check the plan, and check the result. The
session that wrote something never reviews it, and the reviewer never fixes
what it found.

## Definition of done, per task

A task is done only when **all** of these hold. The reviewer checks each one.

| Task | Done means |
| --- | --- |
| 0 | `FOUNDATIONS.md` has no `<placeholder>` left; platform, UI kit and verification matrix are recorded as owner decisions in `DECISIONS.md` |
| 1 | The owner passed `G-1` on the running prototype (no Figma stage) · every IA node is reachable in the running prototype · every component comes from the kit or is registered in `COMPONENTS.md` · no raw visual value outside the token source · passes the verification matrix (`FOUNDATIONS.md`) for layout and font scale · accessibility contract met for every registered component · all states (empty, loading, error, long text) exist for every screen |
| 2 | One token source generates every platform output · every semantic token resolves in every mode · contrast pairs in `TOKENS.md` pass · no two tokens of one type closer than the minimum step (`GOVERNANCE.md`) · nothing references a primitive directly from a component |
| 3 | `check:design-values` reports zero **and** the reviewer's manual search finds no raw value the script cannot see · every component renders correctly in every mode and at the largest font scale · unit policy (`RESPONSIVE.md`) holds · visual diff against task 1 structure shows no layout regression |
| 4 | Figma variables match the token source name-for-name and value-for-value · every registered component exists as a component set with the same variants · it reflects the commit the owner approved at `G-2` / `G-3` / `G-5` · the owner confirmed the match at `G-MIRROR`, comments triaged and closed |
| 5 | Nothing new was created that an existing token or component covers · every addition passed the admission test and is registered · plus every done-criterion of row 3 |

## Which docs a task reads

The router table lives in `CLAUDE.md` § Task router so that it is in context
at the start of every session. Playbooks repeat only their own row.

## When something does not fit

- A rule blocks a legitimate design: do not work around it. Raise an exception
  through `HITL.md` § Always ask; the owner's answer is recorded in `DECISIONS.md`.
- A lesson was learned the hard way: write it into `UI-PITFALLS.md` in the same
  change. Lessons never live only in a session or in agent memory.
- The spec turns out to be wrong mid-execution: the lead stops the affected
  package and asks the owner for a spec session to amend the spec (the lead
  does not write specs); the amendment goes back through steps 2–3.
  Packages the amendment does not touch keep running.
