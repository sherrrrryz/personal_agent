# Foundations — the project's fixed inputs

> Status: evergreen — what this product is built on: platforms, stack, UI kit,
> base values, where the IA map lives, and the matrix every screen is verified
> against. Filled in task 0 and approved at gate `G-0`; every later task reads it.

<!--
TASK 0 STATE (2026-11-26): draft. Items marked "proposed — G-0" are the
drafting session's recommendation and become binding only when the owner
decides at G-0 and the answer is recorded in DECISIONS.md. Items still in
<angle brackets> need the owner's input; the owner's summary of what is open
is .orchestration/G0-decision-packet.md. A placeholder left here blocks task 1.
After G-0, change this file only through a spec.
-->

## Product and platforms

- **Product:** `<one sentence: what the personal agent does, for whom>`
- **Platforms:** web only; no native app for now (D-01)
- **Stack:** web → React 19 + TypeScript (D-02), built with Vite 8 (proposed — `G-0`);
  styling system: Tailwind v4 reading the CSS custom properties generated from
  the token source (follows D-03). Rules per stack: `stacks/react-web.md`.
  `stacks/react-native.md` is not in use.
- **Languages and direction:** `<locales, e.g. zh-CN + en; is RTL required>`

## Information architecture

- **IA map:** `<link or path>` — the source for task 1. Format: `<FigJam / Mermaid / outline>`
- **Node ids:** every IA node has a stable id that screens, specs and the
  Figma map refer to.

| IA id | Node | Parent | Screen type |
| --- | --- | --- | --- |
| `<to be filled from the IA map>` | | | |

## UI kit

- **Kit:** shadcn/ui, the whole kit, with Tailwind v4 (D-03); version pinned when
  it is installed in the first task-1 package · **Licence:** MIT
- **Why this one:** accessibility comes from headless primitives that follow
  the Authoring Practices; every visual value is reachable through CSS
  variables, so one token source can feed it; the components are copied into
  the repo, so agents can read and edit them and the system stays small.
- **How components are taken from it:** copied into the repo and owned
  (`src/components/ui/`), added one by one as the IA needs them (`GOVERNANCE.md`);
  not installed wholesale
- **Theming hook:** CSS custom properties generated from the token source,
  mapped to Tailwind utilities through `@theme inline`; no value is written
  in a component
- **Known gaps:** `<filled once the IA map names the components the product needs>`

Building a component the kit already provides is forbidden. Wrapping one to
bind it to tokens is the normal case.

## Token tooling

- **Source:** `tokens/` (DTCG JSON, one file per type) · **Build tool:**
  Style Dictionary (version pinned in task 2) · **Outputs:**
  `src/tokens/generated/tokens.css` (proposed — `G-0`)
- **Check config:** `design-values.config.json` at the repo root lists the UI
  source folders to scan (`include: ["src"]`) and the token source and
  generated outputs to exempt (`tokenPaths: ["tokens/", "src/tokens/generated/"]`).
  The check fails if it finds nothing to scan.

## Figma

**Not in use in this project (D-04).** No Figma file; task 4, gate `G-MIRROR`
and the mirror batching for task 5 are switched off. Each stage closes at the
owner's review of the running code (`G-1`, `G-2`, `G-3`, `G-5`). If Figma is
enabled later, a new decision supersedes D-04 and this section is filled from
`tasks/0-foundations.md` step 7.

## Running prototype

- `npm run dev` → <http://localhost:5173> (also startable from the Claude
  desktop app's browser pane via `.claude/launch.json`, configuration `dev`)

## Base values

The owner's seed values. Task 2 expands them; nothing else may introduce a
primitive. **Not invented by the drafting session** — every row needs the
owner's value or the owner's explicit "agent proposes, I approve at `G-2`".

| Type | Base value(s) | Expansion rule (detail in `TOKENS.md`) |
| --- | --- | --- |
| Colour | `<brand, neutral, status seeds>` | `<ramp method>` |
| Typeface | `<families, licences>` | — |
| Font size | `<base size, scale ratio>` | `<steps>` |
| Spacing | `<base unit>` | `<multipliers>` |
| Radius | `<base>` | `<steps>` |
| Shadow | `<base elevation>` | `<levels>` |
| Blur | `<base>` | `<levels>` |
| Motion | `<base duration, easing>` | `<steps>` |

## Modes

| Mode | Required | Notes |
| --- | --- | --- |
| Light | yes | |
| Dark | yes | Designed, not inverted |
| High contrast | `<yes/no>` | `prefers-contrast: more` maps here if yes |
| Brand / density variants | `<yes/no>` | |

## Verification matrix

Every screen and component is checked at every required cell before a task is
done. Reviewers re-run it. Web only; the app column is empty by D-01.

| Axis | Web (proposed — `G-0`) | App |
| --- | --- | --- |
| Width | 320 · 768 · 1024 · 1440 CSS px | n/a |
| Text size | 100% · 200% browser zoom; root font size 24px | n/a |
| Theme | light · dark (+ high contrast if required) | n/a |
| Input | keyboard · pointer · touch · screen reader | n/a |
| Motion | default · reduced | n/a |
| Direction | LTR (RTL only if a required locale needs it) | n/a |

**How to run it:** `npm run dev`, then open the prototype in the Claude
desktop app's browser pane or Chrome; widths and zoom via the browser's
device toolbar; reduced motion and colour scheme via the rendering emulation
panel; screenshots per cell with the browser tools; screen-reader pass with
VoiceOver on macOS (a session that cannot drive it reports the pass as not
checked, `REVIEW.md` protocol 7).

## Commands

```bash
npm run dev                  # run the prototype — http://localhost:5173
npm run tokens:build         # regenerate src/tokens/generated/ from tokens/ (added in task 2)
npm run check:design-values  # no raw visual values under src/
npm run check:docs           # docs index and status headers
npm run verify               # both checks + lint + build
npm test                     # component tests (added with the task-1 spec)
```
