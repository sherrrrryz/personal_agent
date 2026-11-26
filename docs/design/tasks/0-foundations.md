# Task 0 — Foundations intake

> Status: evergreen — playbook: how the project's fixed inputs are collected
> and decided before any prototype work starts.

**Read first:** `../WORKFLOW.md` · `../FOUNDATIONS.md` · `../HITL.md` · `../DECISIONS.md` · `../TOKENS.md` § One source · `../FIGMA-SYNC.md` § Before the first mirror · the stack doc(s) for the candidate platform(s)
**Pipeline:** reduced — draft → fresh-session review → `G-0`. No spec, no lead, no Figma stage (`../WORKFLOW.md`).
**Skills:** none · **Gate:** `G-0` (Decide) · **Output:** a filled `FOUNDATIONS.md`

## Why this task exists

Tasks 1–5 all assume answers that only the owner can give. Asking for them
one at a time, mid-work, is the most expensive way to get them.

## Steps

1. **Collect** the brief, the IA map and the base values. List what is
   missing; do not invent a base value.
2. **Give every IA node a stable id** and fill the IA table.
3. **Platform:** web → React; app → React Native; both → both stacks, one
   token source (`TOKENS.md` § One source). Record the reasoning.
4. **UI kit shortlist:** compare two or three maintained kits per platform
   against the criteria below. Recommend one.
5. **Verification matrix:** propose the cells from the stack docs' defaults
   and the product's audience.
6. **Modes:** light and dark are required; ask about high contrast and
   brand variants.
7. **Figma:** confirm the file, fonts and icon set, and read the plan's
   current limits from Figma's own plan page — modes per collection, Code
   Connect, API access (`FIGMA-SYNC.md` § Before the first mirror). Record
   them as a `DECISIONS.md` entry. Also agree how many task-5 additions may
   accumulate before a mirror run.
8. Present everything at `G-0` as **one** decision packet. Record each answer
   in `DECISIONS.md`, then fill `FOUNDATIONS.md`.

## UI-kit selection criteria

A kit is chosen, never assembled from several, and never hand-built.

| Criterion | What to check |
| --- | --- |
| Accessibility is built in | Keyboard, focus management, roles and names come from the kit's primitives, documented per component |
| Themable through tokens | Every visual value is reachable through CSS variables or a theme object — no hard-wired colours |
| Unstyled or lightly styled base | A low-fi theme is possible without fighting the kit's look |
| Covers the inventory | The components the IA needs exist; list the gaps |
| Maintained | Recent releases, supports the current React / React Native version |
| Agent-friendly | Widely used, well documented, source readable; copied-in components are acceptable |
| One token source can feed it | Especially when web and app must share tokens |
| Licence | Compatible with the product |

Candidates and their current status are in the stack docs
(`stacks/react-web.md` § UI kits, `stacks/react-native.md` § UI kits). Verify
maintenance status at decision time; it changes.

## Done

`WORKFLOW.md` § Definition of done, row 0. This task has no code and no Figma
stage; its review is the spec-review checklist applied to `FOUNDATIONS.md`.
