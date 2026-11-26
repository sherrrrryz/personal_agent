# Design tokens — architecture, naming, modes

> Status: evergreen — how the token set is structured, how base values are
> expanded, how modes work, and how one source feeds every platform and Figma.
> Working rules are the `/design-tokens` skill; admission of new tokens is
> `GOVERNANCE.md`.

<!--
HOW TO BUILD THIS DOC
- The architecture sections are fixed. Fill the expansion rules, the type
  list and the contrast table in task 2, from the real token source.
- The token VALUES live in the source, not here. This doc holds rules and the
  small tables a reviewer must be able to recompute.
-->

## One source

- **Source:** `tokens/` — JSON in the W3C Design Tokens Community Group format
  (`$value`, `$type`, `$description`; aliases written `{group.token}`),
  version 2025.10. **The tier is the folder, the mode is the file:**
  `tokens/primitive/<type>.json` holds raw values; `tokens/semantic/<type>.json`
  holds aliases, in the default (light) mode; `tokens/semantic/<type>.dark.json`
  holds the dark value of every token that has a mode. No component tier yet.
- **Build:** Style Dictionary 5.8.0, driven by `scripts/build-tokens.mjs`
  (`npm run tokens:build`), generates every output. Generated files are never
  edited by hand and say so in their header. The build **fails** when a
  primitive holds an alias, a semantic token holds a raw value or points at
  anything but a primitive of the same `$type`, a colour role lacks a mode, or
  two tokens would get the same CSS name. `npm test` fails when the generated
  files are not what the build writes now.
- **Outputs:** web → CSS custom properties, `src/tokens/generated/tokens.css`
  (`:root` — primitives and the light semantic values; `.dark` — the dark
  values; a generated `@theme` block — the breakpoints, as literals), and
  `src/tokens/generated/breakpoints.ts` (the same breakpoints as constants,
  for code that builds a media query); React Native → not in use (D-01);
  ~~Figma → variables, by `/figma-mirror`~~ (not in use, D-04).
- **Format facts that shape the source** (DTCG 2025.10): set `$type`
  explicitly on the token or its group; a colour is an object with a colour
  space and components, not a bare hex string — here always
  `{ "colorSpace": "oklch", "components": [l, c, h] }`; a `dimension` is
  `{ value, unit }` and the only units are `px` and `rem`; composite types
  exist for `shadow`, `typography`, `border`, `transition`, `gradient`.
  **Blur, opacity, z-index and breakpoints are not spec types** — store blur
  and breakpoints as `dimension`, opacity and z-index as `number`.
- **Two conventions of this repo beyond the format** (the build understands
  them; another tool will not): a **string token** (`$type: "string"`) holds a
  CSS keyword that is not a colour value — today only the system colour
  `color.system.highlight`; and `$extensions["pa.scale"]` on a semantic
  dimension is a unitless factor applied to the aliased primitive, emitted as
  `calc(var(…) * factor)` — today only the radius steps.
- **Tool support is partial.** Style Dictionary reads the files, merges them,
  resolves and checks every reference and name; the CSS and TypeScript text is
  written by this repo's two formats in `scripts/build-tokens.mjs`, because
  the shipped formats neither keep shadcn's names nor emit the colour object.
  A new `$type` needs a case in that script (`rawCss`) — the build stops and
  says so.
- **Figma's native token import is lossy** (no composite types, `px` only).
  Not in use (D-04).
- **CSS names — the transform** (`cssName` in `scripts/build-tokens.mjs`):

  | Tier | Source path | CSS custom property | Why |
  | --- | --- | --- | --- |
  | Primitive | `a.b.c` | `--primitive-a-b-c` | Kept out of Tailwind's theme namespaces (`--radius-sm`, `--breakpoint-md` are Tailwind's own keys) and greppable: nothing outside `tokens.css` may contain `--primitive-` |
  | Semantic colour | `color.<role>` | `--<role>` | shadcn/ui's names, which the kit files use: `color.muted-foreground` → `--muted-foreground`, `color.focus.forced` → `--focus-forced` |
  | Semantic radius base | `radius.base` | `--radius` | shadcn/ui's name. The spec calls this token `radius`; the format does not let `radius` be a token and a group at once |
  | Any other semantic | `a.b.c` | `--a-b-c` | `size.target.min` → `--size-target-min`, `radius.step.md` → `--radius-step-md` |
  | Breakpoint (primitive) | `breakpoint.<name>` | `--breakpoint-<name>` inside `@theme`, as a literal | A media or container query cannot read a custom property; this is the one primitive consumed directly, by Tailwind's `md:` / `lg:` variants and by `breakpoints.ts` |

- **From custom property to utility:** `src/index.css` is shadcn/ui's stock
  theme entry (D-43). It maps every semantic property to a Tailwind theme key
  in `@theme inline` (`--color-<role>: var(--<role>)`, `--radius-<step>:
  var(--radius-step-<step>)`, `--font-sans: var(--font-family-sans)`,
  `--spacing-target: var(--size-target-min)` → the utilities `min-h-target`,
  `min-w-target`, `size-target`) and imports Geist. Tailwind's own palette,
  opacity modifiers and shadow scale are **left in place** — the kit files
  use them (`bg-black/10`, `shadow-md`, `ring-foreground/10`). That file
  holds no value of its own.

## Modes

- Required modes are listed in `FOUNDATIONS.md`. Each semantic token that
  varies has a value in **every** mode; the build fails on a gap.
- **Dark is designed, not inverted:** raised surfaces get lighter rather than
  casting stronger shadows; saturated colours are toned down on dark
  surfaces; contrast is re-measured against the dark surface.
- Components are theme-blind. If a component needs to know the mode, a
  semantic token is missing.
- Mode switching (web): the `.dark` class on `<html>` re-points the semantic
  properties (`tokens.css`), and `color-scheme` is set beside it so native
  controls match. It follows the system preference; the in-app toggle
  overrides it and is remembered in `localStorage` `pa.theme` (`system` ·
  `light` · `dark`, D-19). An inline script in `index.html` applies both
  before first paint, so there is no flash of the wrong theme on load.

## Placeholder theme (task 1)

**Superseded by D-43 (2026-11-26).** The grey placeholder theme is withdrawn:
the token source now holds shadcn/ui's stock `neutral` theme, and the reset of
Tailwind's palette and shadow scale is gone. What follows in this section
describes the source as it is now; the placeholder's own values are in the
history of this file.

| Tier | Tokens | Notes |
| --- | --- | --- |
| Primitive | `color.neutral.0 … 950` — twelve steps | shadcn/ui's neutral ramp, OKLCH, chroma 0; named after Tailwind's neutral scale, `0` is white |
| Primitive | `color.white-alpha.10`, `.15` | White at 10% and 15%: the stock dark theme's borders |
| Primitive | `color.red.400`, `.600` · `color.blue.700` | The stock theme's `destructive` (dark, light) and its dark `sidebar-primary`; named after Tailwind's scales |
| Primitive | `color.system.highlight` | The CSS system colour `Highlight`, a string token |
| Primitive | `space.6` (1.5rem) · `border.width.2` (2px) | Steps of Tailwind's shipped spacing and border-width scales |
| Primitive | `radius.lg` (0.625rem) | shadcn/ui's stock base radius |
| Primitive | `breakpoint.md` (48rem) · `breakpoint.lg` (64rem) | Tailwind's shipped values |
| Primitive | `font.stack.sans` | Geist Variable → PingFang SC → Microsoft YaHei → Noto Sans CJK SC → `sans-serif` (D-05, D-25). Geist is imported in `src/index.css` from the installed `@fontsource-variable/geist` |
| Semantic | shadcn/ui's 31 colour roles, light and dark | **The stock values**, pinned by `src/test/tokens.test.ts`; a role that differs is listed in § Changed from stock |
| Semantic | `color.focus.forced` → `color.system.highlight` | Focus outline under forced colours; one value, no mode |
| Semantic | `size.target.min` → `space.6` | The WCAG 2.2 AA target floor, 24 CSS px, for a target we build ourselves (a text link outside running text). Kit controls are not enlarged |
| Semantic | `border.width.focus` → `border.width.2` | Width of the forced-colours focus outline |
| Semantic | `radius.base` → `radius.lg`, and `radius.step.sm … 4xl` | The steps are the base × 0.6 · 0.8 · 1 · 1.4 · 1.8 · 2.2 · 2.6 (`pa.scale`) — shadcn/ui's own formula |
| Semantic | `font.family.sans` → `font.stack.sans` | All text, both locales |

**Not generated from `tokens/`:** Tailwind's shipped spacing, type,
line-height, font-weight, shadow, blur, opacity, z-index and motion scales
and its colour palette are used through stock utilities as shipped (D-05,
D-43). The breakpoints `sm`, `xl` and `2xl` are Tailwind's shipped ones and
are not for our code: only `md` and `lg` are tokens (`RESPONSIVE.md` §
Breakpoints).

## Changing a colour

The owner changes a few specific colours and nothing else (D-43). One place:

1. **Where:** `tokens/semantic/color.json` (light) and
   `tokens/semantic/color.dark.json` (dark) — one line per shadcn/ui role
   (`primary`, `accent`, `destructive`, …), each pointing at a value in
   `tokens/primitive/color.json`. Add the new value there (OKLCH), point the
   role at it.
2. **Build:** `npm run tokens:build` — rewrites
   `src/tokens/generated/tokens.css`; never edit that file or `src/index.css`.
3. **Record:** add the role to § Changed from stock and run `npm test` — it
   prints the new ratios for § Contrast pairs; copy them in.

## Changed from stock

Colour roles whose value differs from shadcn/ui's stock `neutral` theme, in
either mode. `src/test/tokens.test.ts` compares every role with the stock
value and fails when a changed role is missing here or a listed one is stock
again. **None yet.**

| Role | Stock (light · dark) | Now (light · dark) | Decision |
| --- | --- | --- | --- |

## Naming

- Lower-case, dot-separated path: `category.role.variant.state`
- Purpose, never appearance, on the semantic tier: `color.text.danger`, not `color.red`
- Every surface has its foreground: `color.bg.accent` ↔ `color.text.on-accent`
- Scale steps: `xs sm md lg xl` on the semantic tier; numbers on the primitive tier
- States as the last segment: `.hover`, `.pressed`, `.disabled`
- No abbreviations beyond `bg`, `sm/md/lg`; no component names on the semantic tier

## Contrast pairs

Every foreground/background pairing the system uses, measured in every
mode. Thresholds: `ACCESSIBILITY.md` § Contrast.

Ratios are WCAG 2.x contrast ratios computed from the token source (OKLCH →
linear sRGB → relative luminance; a translucent colour is first composited
over its background), written rounded **down** to two decimals.
`src/test/contrast.test.ts` recomputes every row on each `npm test` and
fails when a ratio is stale — after changing a colour token, run the test
and copy the ratios it reports. Names are source paths; the CSS property is
the path without `color.`.

**Status** is `ok` when both modes meet the requirement, and `gap` when the
stock value does not. By D-43 the stock value wins: a `gap` row is a known,
recorded shortfall of shadcn/ui's stock theme, kept for the owner to decide
when they change colours — it is not fixed in a component. The test fails
when a row marked `ok` drops below its requirement, and when a row marked
`gap` no longer has one (so the mark never goes stale).

| Foreground | Background | Use | Light | Dark | Required | Status |
| --- | --- | --- | --- | --- | --- | --- |
| `color.foreground` | `color.background` | Body text | 19.79 | 18.95 | 4.5 | ok |
| `color.card-foreground` | `color.card` | Text on a card | 19.79 | 17.15 | 4.5 | ok |
| `color.popover-foreground` | `color.popover` | Text in a menu, a select list or a tooltip surface | 19.79 | 17.15 | 4.5 | ok |
| `color.primary-foreground` | `color.primary` | Label of a primary button | 17.15 | 14.22 | 4.5 | ok |
| `color.secondary-foreground` | `color.secondary` | Label of a secondary button | 16.42 | 14.47 | 4.5 | ok |
| `color.muted-foreground` | `color.background` | Secondary text, placeholder | 4.73 | 7.63 | 4.5 | ok |
| `color.muted-foreground` | `color.muted` | Secondary text on a muted surface | 4.33 | 5.82 | 4.5 | gap |
| `color.accent-foreground` | `color.accent` | Hovered or highlighted item | 16.42 | 14.47 | 4.5 | ok |
| `color.sidebar-foreground` | `color.sidebar` | Sidebar text | 18.95 | 17.15 | 4.5 | ok |
| `color.sidebar-accent-foreground` | `color.sidebar-accent` | Hovered or current sidebar item | 16.42 | 14.47 | 4.5 | ok |
| `color.border` | `color.background` | Boundary of a card or an overlay, a divider | 1.25 | 1.25 | 3 | gap |
| `color.input` | `color.background` | Boundary of an input | 1.25 | 1.47 | 3 | gap |
| `color.muted-foreground` | `color.card` | Card description (kit) | 4.73 | 6.90 | 4.5 | ok |
| `color.muted-foreground` | `color.popover` | Menu label, select group label (kit) | 4.73 | 6.90 | 4.5 | ok |
| `color.destructive` | `color.background` | Error text, danger label (kit) | 4.76 | 6.84 | 4.5 | ok |
| `color.destructive` | `color.card` | The same, on a card | 4.76 | 6.19 | 4.5 | ok |
| `color.sidebar-primary-foreground` | `color.sidebar-primary` | Sidebar brand tile (kit) | 17.15 | 6.53 | 4.5 | ok |
| `color.border` | `color.card` | Divider and input boundary on a card | 1.25 | 1.32 | 3 | gap |
| `color.sidebar-border` | `color.sidebar` | Sidebar edge and separators | 1.20 | 1.32 | 3 | gap |

The first twelve rows are the pairs the task-1 spec introduces; the rest are
pairings the kit files already use. **Not in the table because it is not a
solid pair:** the focus ring. The kit paints `ring` at half opacity, three
pixels wide, with a solid `ring` border inside it. Composited on a rendered
control (`compositeOver` in `src/test/color.ts` does the blend the way a
browser does) the stock ring measures 1.52–1.54 (light) and 1.87 (dark)
against `background`, `card` and `sidebar`; the solid border 2.48–2.59
(light) and 3.79–4.18 (dark). That is under 3:1 in light mode — a known gap
of the stock theme (D-43), pinned by
`src/components/actions/focus-ring.test.tsx`. Translucent tints the kit
derives from a role (`bg-destructive/10`, `bg-input/30`, `bg-muted/50`) are
looked at on the rendered control at review.

## Pitfalls

- **A primitive named like a Tailwind theme key collides with it.** Tailwind
  emits `--radius-sm`, `--breakpoint-md` and the rest of its theme as custom
  properties of the same names; a primitive `radius.sm` written to CSS as
  `--radius-sm` would silently replace the utility's value. Primitives are
  therefore emitted as `--primitive-*`, and semantic steps that feed a
  Tailwind key get a name of their own (`--radius-step-sm`) that
  `src/index.css` maps onto the key.
- **A translucent role has no contrast ratio of its own.** The stock dark
  `border` and `input` are white at 10–15%: measure them composited over the
  surface they sit on (`resolveRawColor` and `compositeOver` in `src/test/`),
  never as the bare colour.
- **Do not bring the palette reset back.** `--color-*: initial` in
  `src/index.css` silently removes `black`, `white` and every shadow the kit
  files use — the scrim behind a dialog disappears with no error (withdrawn by
  D-43; `src/test/css-build.test.ts` fails if it returns).
- **Tailwind scans every file it is pointed at.** `src/index.css` limits the
  scan to `src/` (`source(".")`); without it, class-like strings in `docs/`
  (`p-[13px]`, `text-[#333]`) become rules with raw values in the built CSS.
- **Style Dictionary reports two tokens with one CSS name as a "collision"
  warning**; the build turns warnings into errors. Read it as: two source
  paths map to the same custom property.
