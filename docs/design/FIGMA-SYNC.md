# Figma sync — mirroring the coded system into Figma

> **Not in use in this project (D-04, `DECISIONS.md`).** Kept for when Figma is
> enabled by a later decision; nothing in this document binds current work.


> Status: evergreen — which side owns what, the order in which a coded stage
> is rebuilt in Figma, and how drift is found. The working procedure is the
> `/figma-mirror` skill; node ids are in `figma-file-map.md`.

<!--
HOW TO BUILD THIS DOC
- Fill the plan/limits line before task 4 is first run — a plan limit
  discovered mid-mirror wastes a whole package.
- Add to Pitfalls every time a mirror had to be redone.
-->

## Direction and authority

In this workflow **code is written first and Figma mirrors it.** The owner
judges the result in running code; Figma is the faithful record of what was
approved, where the owner compares and comments. It is not where values are
decided, and not where a stage is first shown.

**What is mirrored, and when:**

- The **design system** — tokens (task 2), then styled components and their
  screens (task 3) — and everything later built on it (task-5 batches).
- **Never the low-fi prototype** (task 1): it is throwaway in appearance, and
  mirroring it would mean building everything in Figma twice.
- **Only after the owner passed the stage's gate on the running code**
  (`G-2`, `G-3`, `G-5` in `HITL.md`). The mirror reflects that approved commit.

| Thing | Owner | The other side |
| --- | --- | --- |
| Token values, token names, mode values | The token source in code | Figma variables are regenerated to match |
| Component props, variants, states | The component code | Component-set properties are derived from them |
| Collection grouping, page structure, layer naming in Figma | Figma conventions | Not reflected in code |
| Owner's comments and corrections | Figma (and the conversation) | Become spec amendments or fixes **in code**, then re-mirrored |

An edit made directly in Figma is a **comment, not a change**. It is carried
back to code through `HITL.md` § After the owner answers, never left as the
only place a value lives.

When code and Figma disagree and it is not obvious which is stale, show both
and ask. Never silently pick.

## Before the first mirror

- **File and plan** are recorded in `FOUNDATIONS.md` § Figma (verified in
  task 0, with a `DECISIONS.md` entry). What to verify:
  light + dark modes need a paid plan; Code Connect needs Organization or
  Enterprise and a published library; the variables REST API needs
  Enterprise. The number of modes per collection depends on the plan and has
  changed over time — read the current limit from Figma's plan page and
  record what the plan allows there.
- **Typeface and icon set** installed and licensed for the file; never mirror
  with a substitute font.
- **Ledger:** `docs/design/figma-ledger.json` — **committed**. Every created
  node, variable and style id is written here the moment it is returned. It
  is the only safe basis for later edits and deletes, so it must outlive the
  task that created it.

## Build order

Each stage is validated before the next one starts. Nothing is built on
unvalidated work.

| Stage | Built from | Result in Figma | Exit check |
| --- | --- | --- | --- |
| 1 Variables | Token source | Collections: `Primitives` (one mode, hidden from pickers) → semantic collections (aliases, one per mode: `Light`, `Dark`, …) → spacing / radius / type | Counts match the source · zero broken aliases · every variable scoped (never "all scopes" without the owner) · code syntax set from the real code name |
| 2 Styles | Composite tokens | Text styles for the type ramp, effect styles for shadows and blur, their fields bound to variables | Every composite token has exactly one style |
| 3 Components | `COMPONENTS.md`, in dependency order | One component set per code component; variants = the code's variant props; booleans / text / instance-swap for the rest; every fill, stroke, gap, padding and radius bound to a variable | Variant count matches · no unnamed variants · screenshot reviewed |
| 4 Screens | The running prototype | Frames assembled **from component instances** with auto-layout | Every screen in scope exists · no detached instance · no raw fill · screenshot vs running code |
| 5 Review page | The matrix | One page per mirror run with the frames the owner compares against the running code, in each mode | `G-MIRROR` evidence complete (`HITL.md`) |

### Which stages a task runs

| After task | Stages |
| --- | --- |
| 1 Low-fi | None — not mirrored |
| 2 Tokens | 1 → 2 → 5 (swatch and specimen page) |
| 3 Apply | 1–2 as an update in place → 3 → 4 (components and screens are built here for the first time) → 5 |
| 5 Extend (batch) | Every new or changed component and screen of the batch; variables and styles only where a token was added |

## Rules of the mirror

- **Inspect before creating.** Read the file's existing variables, styles and
  components first; update in place when something exists.
- **Bind, never copy.** A node uses the variable, not its resolved value. A
  raw fill in Figma is the same defect as a raw value in code.
- **Names:** Figma variables use a lowercase slash path that mirrors the token
  path (`color/bg/surface`); the code name travels in the variable's code
  syntax. Do not rename either side to match the other.
- **Themes are modes**, not duplicate frames. One node, switched per mode. A
  semantic variable holds one alias for each mode of its collection. A frame
  renders in the collection's first mode until its mode is set explicitly —
  set it on every review frame.
- **Typography goes through text styles**; shadows and blur through effect
  styles — these are not single variables.
- **Writes are sequential and small** (20–30 variables or one component per
  call). Reads may run in parallel.
- **Delete only by id from the ledger**, never by name or prefix.
- **Validate by evidence:** counts and ids for structure, one screenshot of
  the finished composition for appearance. The render is the truth; a script
  that returned "ok" proves nothing about how it looks.
- **A flattened image of the UI is never a deliverable.**
- **Contrast failures found during the mirror are reported, not auto-fixed** —
  the fix belongs in the token source and may need the owner.

## What does not map

Record how each is represented so that the mirror is not "fixed" back.

| In code | In Figma | Note |
| --- | --- | --- |
| `rem` / fluid `clamp()` sizes | A plain number at the default root size and the default viewport | Figma numbers are unitless; put the real expression in the variable description and code syntax |
| React Native density-independent numbers | The same number | Font scaling is shown as extra review frames, not as a mode |
| Breakpoint / size-class behaviour | Separate frames per matrix width | Do not model as variable modes unless the plan has modes to spare |
| Shadow that changes per theme | One effect style whose colour is bound to a moded variable | Effect styles have no modes |
| z-index, focus order, roles | Component description | Not representable as variables |
| Motion durations and easings | Variables where supported, else description | |

## Drift check

Run at the start of every task 4 and in every governance audit.

1. Export variable names, modes and values from Figma.
2. Diff against the token source.
3. Diff component-set properties against `COMPONENTS.md`.
4. Anything that differs is fixed **in Figma** to match code — unless the
   difference is an owner edit, which goes through HITL.

`<The command or script that performs steps 1–3, once the project has one.>`

## Pitfalls

<Add entries as they are learned — e.g. a mode limit hit mid-run, a font that
silently fell back, a component set whose variants stacked at the origin.>
