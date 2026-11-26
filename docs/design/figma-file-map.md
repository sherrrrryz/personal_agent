# Figma file map

> **Not in use in this project (D-04, `DECISIONS.md`).** Kept for when Figma is
> enabled by a later decision; nothing in this document binds current work.


> Status: evergreen — a lookup table: where each mirrored stage, component and
> screen lives in the Figma file. It says nothing about what the implementation
> looks like; the code is authoritative for that.

<!--
HOW TO BUILD THIS DOC
- Create it in the first task-4 run and extend it in every later one — the
  session that creates a node adds its row before it ends.
- Node ids and one-line notes only. No rationale, no screenshots.
- Themes are variable modes on ONE node. Do not add light/dark node columns.
-->

**File:** see `FOUNDATIONS.md` § Figma · **Ids of everything created:** `figma-ledger.json`

## Tool-call rules for this file

<Which calls are safe on this file and which are not — e.g. always fetch by
node id, never a whole page; take the screenshot alongside the structured
read.>

## Pages

| Page | Node id | Holds | Last mirrored (commit) |
| --- | --- | --- | --- |
| `<Foundations>` | | Swatches, type specimen, spacing, elevation | |
| `<Components>` | | Component sets | |
| `<Screens — low-fi>` | | Task 1 screens | |
| `<Review — task n>` | | Frames for gate `G-n` | |

## Variable collections

| Collection | Modes | Mirrors (token path) |
| --- | --- | --- |

## Components

| Component (code name) | Component-set node id | Variant properties | Notes |
| --- | --- | --- | --- |

## Screens

| IA node | Screen | Node id | Matrix widths present |
| --- | --- | --- | --- |
