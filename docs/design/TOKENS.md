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

- **From custom property to utility:** `src/index.css` maps every semantic
  property to a Tailwind theme key in `@theme inline` (`--color-<role>:
  var(--<role>)`, `--radius-<step>: var(--radius-step-<step>)`, `--font-sans:
  var(--font-family-sans)`, `--spacing-target: var(--size-target-min)` → the
  utilities `min-h-target`, `min-w-target`, `size-target`). It first sets
  `--color-*: initial` and `--shadow-*: initial`, so a colour or shadow
  utility exists **only** for a mapped token — `bg-red-500` produces no rule.
  That file holds no value of its own.

## Three tiers

| Tier | Holds | Named by | May reference | Referenced by |
| --- | --- | --- | --- | --- |
| **Primitive** | Raw values | What it is: `blue.500`, `space.4`, `font.size.300` | Nothing | Semantic only |
| **Semantic** | Aliases | What it is for: `color.bg.surface`, `color.text.muted`, `space.inset.md` | Primitives | Components |
| **Component** (optional) | Aliases | Component + part + state: `button.bg.hover` | Semantic | That component only |

- A semantic token never holds a raw value. A component never references a
  primitive.
- **Modes exist on the semantic tier only.** A primitive has one value forever.
- The component tier is empty by default. Add a component token only when a
  component needs a decision that must change independently of every
  semantic token — and say why in the spec.
- Reference the most specific tier that exists for the purpose.
- The tiering itself is industry convention (Material: reference → system →
  component; Spectrum, Primer: the same three). "Components never touch a
  primitive" is stricter than those systems state it — it is this kit's house
  rule, because it is what keeps every mode working without per-component work.
- Never pick a token because its colour happens to match. Pick it for its
  role; a matching value breaks in the next mode.

## Token types

| Type | Primitive scale | Semantic roles (examples) | Unit in source |
| --- | --- | --- | --- |
| Colour | Ramps per hue, `<n>` steps | `bg.*`, `text.*`, `border.*`, `icon.*`, `status.*`, `focus.ring`, `overlay.*` | `<colour space, e.g. OKLCH or hex>` |
| Font family | `<families>` | `font.family.body`, `.heading`, `.mono` | — |
| Font size | Type scale | `text.body`, `text.label`, `text.title.*` | Scalable (see `RESPONSIVE.md` § Unit policy) |
| Line height | `<steps>` | Paired with each text role | Unitless ratio |
| Font weight | `<weights>` | Paired with each text role | Number |
| Spacing | Multiples of the base unit | `space.inset.*`, `space.stack.*`, `space.inline.*` | Scalable |
| Size | `<control heights, icon sizes>` | `size.control.*`, `size.icon.*`, `size.target.min` | Per policy |
| Radius | `<steps>` | `radius.control`, `radius.surface`, `radius.pill` | Per policy |
| Border width | `<steps>` | `border.width.default`, `.strong`, `.focus` | Fixed (hairlines) |
| Shadow / elevation | `<levels>` | `elevation.raised`, `.overlay`, `.modal` | Composite |
| Blur | `<levels>` | `blur.backdrop`, `.overlay` | Fixed (allowlist) |
| Opacity | `<steps>` | `opacity.disabled`, `.scrim` | Number |
| Motion | Durations, easings | `motion.duration.fast`, `motion.easing.standard` | ms, cubic-bezier |
| Breakpoint / size class | `<values>` | — | Per stack doc |
| Z-index / layer | `<named layers>` | `layer.overlay`, `.modal`, `.toast` | Number |

Composite tokens (typography, shadow, border, transition) are built from the
single-value tokens above, never from raw values.

## Expanding base values

Every scale is generated by a rule written here, so that it can be
regenerated and so that "off-scale" has a definition.

| Type | Rule |
| --- | --- |
| Colour ramp | `<e.g. fixed lightness steps in a perceptual space, chroma tuned per step; the base value sits at step n>` |
| Neutral | `<e.g. same method, low chroma, tinted toward the brand hue>` |
| Type scale | `<base size × ratio^n, rounded to …; n from −2 to +6>` |
| Spacing | `<base unit × {0, 0.5, 1, 1.5, 2, 3, 4, 6, 8, 12, 16}>` |
| Radius | `<base × {0, 0.5, 1, 1.5, 2}, plus full>` |
| Elevation | `<n levels; each = offset, blur, spread, colour token + opacity>` |
| Blur | `<n levels>` |
| Motion | `<n durations, n easings>` |

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

The low-fi prototype runs on the real semantic token **names** with neutral
values: greys from one ramp, one system font stack, the default spacing and
type scale, minimal radius, no decorative shadow. Both modes exist. Task 2
replaces values; component code does not change. A semantic name the
placeholder theme lacks is added through the same admission test.

What the source holds today (`docs/specs/lofi-prototype-system.md`):

| Tier | Tokens | Notes |
| --- | --- | --- |
| Primitive | `color.neutral.0 … 950` — twelve steps | The lightness steps of `FOUNDATIONS.md` § Base values, OKLCH, chroma 0; named after Tailwind's neutral scale, `0` is white |
| Primitive | `color.system.highlight` | The CSS system colour `Highlight`, a string token; off the ramp by nature, admitted by the spec (D-41) |
| Primitive | `space.11` (2.75rem) · `border.width.2` (2px) | Steps of Tailwind's shipped spacing and border-width scales |
| Primitive | `radius.sm` (0.375rem) | The shipped radius 0.625rem × 0.6 |
| Primitive | `breakpoint.md` (48rem) · `breakpoint.lg` (64rem) | Tailwind's shipped values |
| Primitive | `font.stack.system` | `system-ui` → PingFang SC → Microsoft YaHei → Noto Sans CJK SC → `sans-serif` (D-25) |
| Semantic | shadcn/ui's 31 colour roles, light and dark | **Every role is a step of the neutral ramp**, `destructive` and `chart-1…5` included: danger is carried by icon and text (hard rule 13) until task 2 restores the hue |
| Semantic | `color.focus.forced` → `color.system.highlight` | Focus outline under forced colours; one value, no mode |
| Semantic | `size.target.min` → `space.11` | The 44 px floor of every interactive control; grows with the text size |
| Semantic | `border.width.focus` → `border.width.2` | Width of the focus outline |
| Semantic | `radius.base` → `radius.sm`, and `radius.step.sm … 4xl` | The steps are the base × 0.6 · 0.8 · 1 · 1.4 · 1.8 · 2.2 · 2.6 (`pa.scale`) |
| Semantic | `font.family.sans` → `font.stack.system` | All text, both locales. Geist is installed, not imported |

**Where the placeholder roles differ from shadcn/ui's `neutral` theme, and
why** — each difference exists to meet a row of § Contrast pairs or a line
of the spec; task 2 decides the real values:

| Role | shadcn `neutral` | Placeholder | Reason |
| --- | --- | --- | --- |
| `border`, `input`, `sidebar-border` | 0.922 (light) · white at 10–15% (dark) | `neutral.500` in both modes | 3:1 against `background`; with the shadow scale reset, the border is what separates an overlay |
| `muted-foreground` (light) | 0.556 | `neutral.600` | 4.5:1 on `muted` (0.556 gives 4.34) |
| `ring`, `sidebar-ring` | 0.708 · 0.556 | The step of `foreground` | The kit draws the ring at half opacity; composited it must still reach 3:1 (measured on rendered controls, spec A-13) |
| `destructive` | Red, hue ≈ 27 · 22 | `neutral.600` · `neutral.400` | Every role grey in task 1 |
| `sidebar-primary` (dark) | Blue, hue ≈ 264 | `neutral.200`, with `sidebar-primary-foreground` `neutral.900` | Every role grey in task 1 |
| `chart-1…5` (dark) | The light values again | `neutral.200 … 600` | Dark is designed: lighter steps on the dark surface |
| `--radius` | 0.625rem | 0.375rem | Minimal radius |

**Not generated from `tokens/` until task 2:** Tailwind's shipped spacing,
type, line-height, font-weight, blur, opacity, z-index and motion scales are
used through stock utilities as shipped (D-05). Tailwind's stock **colour
palette and shadow scale are removed** (`--color-*: initial`, `--shadow-*:
initial`), so `bg-black/10`, `text-white`, `shadow-md` and the like — which
some kit files carry — produce no rule: the scrim behind a dialog or sheet is
not drawn, and nothing casts a shadow. The breakpoints `sm`, `xl` and `2xl`
are Tailwind's shipped ones and are not for our code: only `md` and `lg`
are tokens (`RESPONSIVE.md` § Breakpoints).

## Naming

- Lower-case, dot-separated path: `category.role.variant.state`
- Purpose, never appearance, on the semantic tier: `color.text.danger`, not `color.red`
- Every surface has its foreground: `color.bg.accent` ↔ `color.text.on-accent`
- Scale steps: `xs sm md lg xl` on the semantic tier; numbers on the primitive tier
- States as the last segment: `.hover`, `.pressed`, `.disabled`
- No abbreviations beyond `bg`, `sm/md/lg`; no component names on the semantic tier

## Contrast pairs

Every foreground/background pairing the system allows, measured in every
mode. A pairing not in this table is not allowed. Thresholds:
`ACCESSIBILITY.md` § Contrast.

Ratios are WCAG 2.x contrast ratios computed from the token source (OKLCH →
linear sRGB → relative luminance), written rounded **down** to two decimals.
`src/test/contrast.test.ts` recomputes every row on each `npm test` and
fails when a ratio is stale or below its requirement — after changing a
colour token, run the test and copy the ratios it reports. Names are source
paths; the CSS property is the path without `color.`.

| Foreground | Background | Use | Light | Dark | Required |
| --- | --- | --- | --- | --- | --- |
| `color.foreground` | `color.background` | Body text | 19.79 | 18.95 | 4.5 |
| `color.card-foreground` | `color.card` | Text on a card | 19.79 | 17.15 | 4.5 |
| `color.popover-foreground` | `color.popover` | Text in a menu, a select list or a tooltip surface | 19.79 | 17.15 | 4.5 |
| `color.primary-foreground` | `color.primary` | Label of a primary button | 17.15 | 14.22 | 4.5 |
| `color.secondary-foreground` | `color.secondary` | Label of a secondary button | 16.42 | 14.47 | 4.5 |
| `color.muted-foreground` | `color.background` | Secondary text, placeholder | 7.80 | 7.63 | 4.5 |
| `color.muted-foreground` | `color.muted` | Secondary text on a muted surface | 7.15 | 5.82 | 4.5 |
| `color.accent-foreground` | `color.accent` | Hovered or highlighted item | 16.42 | 14.47 | 4.5 |
| `color.sidebar-foreground` | `color.sidebar` | Sidebar text | 18.95 | 17.15 | 4.5 |
| `color.sidebar-accent-foreground` | `color.sidebar-accent` | Hovered or current sidebar item | 16.42 | 14.47 | 4.5 |
| `color.border` | `color.background` | Boundary of a card or an overlay, a divider | 4.73 | 4.18 | 3 |
| `color.input` | `color.background` | Boundary of an input | 4.73 | 4.18 | 3 |
| `color.muted-foreground` | `color.card` | Card description (kit) | 7.80 | 6.90 | 4.5 |
| `color.muted-foreground` | `color.popover` | Menu label, select group label (kit) | 7.80 | 6.90 | 4.5 |
| `color.destructive` | `color.background` | Error text, danger label (kit); grey in task 1 — the icon and the words carry the meaning | 7.80 | 7.63 | 4.5 |
| `color.destructive` | `color.card` | The same, on a card | 7.80 | 6.90 | 4.5 |
| `color.sidebar-primary-foreground` | `color.sidebar-primary` | Sidebar brand tile (kit) | 17.15 | 14.22 | 4.5 |
| `color.border` | `color.card` | Divider and input boundary on a card | 4.73 | 3.78 | 3 |
| `color.sidebar-border` | `color.sidebar` | Sidebar edge and separators | 4.53 | 3.78 | 3 |

The first twelve rows are the pairs the task-1 spec introduces; the rest are
pairings the kit files already use. **Not in the table because it is not a
solid pair:** the focus ring. The kit paints `ring` at half opacity, so its
contrast is measured as composited on a rendered control against
`background`, `card` and `sidebar` (≥ 3:1, both modes — spec A-13;
`compositeOver` in `src/test/color.ts` does the blend the way a browser
does). Translucent tints the kit derives from a role (`bg-destructive/10`,
`bg-input/30`, `bg-muted/50`) are checked on the rendered control at review.

## Pitfalls

- **A primitive named like a Tailwind theme key collides with it.** Tailwind
  emits `--radius-sm`, `--breakpoint-md` and the rest of its theme as custom
  properties of the same names; a primitive `radius.sm` written to CSS as
  `--radius-sm` would silently replace the utility's value. Primitives are
  therefore emitted as `--primitive-*`, and semantic steps that feed a
  Tailwind key get a name of their own (`--radius-step-sm`) that
  `src/index.css` maps onto the key.
- **`--color-*: initial` removes `black` and `white` too.** A kit file's
  `bg-black/10` scrim or `text-white` then produces no rule, with no error.
  A scrim, if a design needs one, is a semantic token mapped in
  `src/index.css` — never the stock colour back.
- **Tailwind scans every file it is pointed at.** `src/index.css` limits the
  scan to `src/` (`source(".")`); without it, class-like strings in `docs/`
  (`p-[13px]`, `text-[#333]`) become rules with raw values in the built CSS.
- **Style Dictionary reports two tokens with one CSS name as a "collision"
  warning**; the build turns warnings into errors. Read it as: two source
  paths map to the same custom property.
