# Design spec: <name>

> Status: draft
> Task type: <0 foundations | 1 low-fi | 2 tokens | 3 apply | 5 extend>
> Author: <session> · Date: YYYY-MM-DD
> Spec review: <pending | link to verdict> · Approved by: <owner, date>

<!--
Status is one of: draft | approved | implemented | superseded.

Lifecycle:
- A fresh session reviews the draft (docs/design/REVIEW.md § Spec review)
  BEFORE the owner is asked. The owner flips it to `approved`.
- Never implement against `draft`.
- A fresh lead session executes an approved spec; the session that wrote or
  reviewed the spec does not.
- Flip to `implemented` in the change that lands it. Afterwards the code and
  the token source are authoritative for details; the spec keeps the intent.

Size: under ~250 lines. A spec that needs more is two specs.
-->

## Goal

What exists when this is done, in two or three sentences, from the owner's
point of view.

## Inputs

- IA map / brief / base values: `<link or path>`
- Decisions this builds on: `<DECISIONS.md entries>`
- Platform(s) and UI kit: `<from FOUNDATIONS.md>`

## Scope

### In scope

- `<screens, components, token types, modes>`

### Out of scope

- `<what this spec deliberately leaves — prevents scope creep>`

## Design

<The substance. Use the subsection that fits the task type; delete the others.>

### Screens and flows (tasks 1, 5)

| IA node | Screen | Components used | States required |
| --- | --- | --- | --- |

### Components (tasks 1, 3, 5)

| Component | Source (kit / wrapped / new) | Variants | States | Accessibility contract |
| --- | --- | --- | --- | --- |

### Tokens (tasks 2, 3, 5)

| Token | Tier | Type | Value per mode | Derived from | Used by |
| --- | --- | --- | --- | --- | --- |

## Additions to the design system

> Skip if nothing new is created. Otherwise one row per new token or component,
> with the admission test from `GOVERNANCE.md` answered — not asserted.

| Addition | Closest existing | Why it does not serve | Uses (≥2) |
| --- | --- | --- | --- |

## Responsive and adaptive behaviour

How each screen or component behaves across the verification matrix: what
reflows, what wraps, what collapses, what scrolls. Name the cells that are
risky.

## Accessibility

Roles, names, focus order, keyboard interaction, contrast pairs introduced,
motion. Anything that departs from the kit's default behaviour (which needs
the owner — `HITL.md`).

## Decisions and rejected alternatives

What was considered and not chosen, and what would reopen it.

## Owner gates

Which gates from `HITL.md` this task will hit, and what the owner will be
shown at each.

## Acceptance criteria

Each one checkable by a command, a screenshot at a named matrix cell, or a
measured value.

- [ ] `<criterion>` — checked by `<how>`

## Work packages

Sized by `SESSIONS.md` § Sizing. No two packages that may run together own the
same file. Every criterion above appears in exactly one row.

| # | Package | Owns (files / Figma pages) | Criteria | Est. tokens | Depends on | Planned handoff point |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | | | | `<≤250K>` | | `<where a second leg would start>` |

## Review plan

Which review each package or the whole task gets, and anything the reviewer
should probe hardest.
