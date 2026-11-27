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
  for code that builds a media query), and `src/tokens/generated/motion.ts`
  (the semantic `motion.*` tokens as milliseconds, nested as they are named —
  `motion.reply.beat` — for code that sets a timer); React Native → not in use (D-01);
  ~~Figma → variables, by `/figma-mirror`~~ (not in use, D-04).
- **Format facts that shape the source** (DTCG 2025.10): set `$type`
  explicitly on the token or its group; a colour is an object with a colour
  space and components, not a bare hex string — here always
  `{ "colorSpace": "oklch", "components": [l, c, h] }`; a `dimension` is
  `{ value, unit }` and the only units are `px` and `rem`; composite types
  exist for `shadow`, `typography`, `border`, `transition`, `gradient`.
  **Blur, opacity, z-index and breakpoints are not spec types** — store blur
  and breakpoints as `dimension`, opacity and z-index as `number`. The build
  has no case for the composite `shadow` type: a shadow is a colour token and
  dimension tokens, put together where it is drawn (§ Frosted surface).
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
  | Any other semantic | `a.b.c` | `--a-b-c` | `border.width.focus` → `--border-width-focus`, `radius.step.md` → `--radius-step-md` |
  | Breakpoint (primitive) | `breakpoint.<name>` | `--breakpoint-<name>` inside `@theme`, as a literal | A media or container query cannot read a custom property; this is the one primitive consumed directly, by Tailwind's `md:` / `lg:` variants and by `breakpoints.ts` |

- **From custom property to utility:** `src/index.css` is shadcn/ui's stock
  theme entry (D-43). It maps every semantic property to a Tailwind theme key
  in `@theme inline` (`--color-<role>: var(--<role>)`, `--radius-<step>:
  var(--radius-step-<step>)`, `--font-sans: var(--font-family-sans)`) and imports Geist. The target
  utilities `min-h-target`, `min-w-target`, `size-target` and their token
  `size.target.min` were withdrawn by D-43 and are removed: they build no rule. Tailwind's own palette,
  opacity modifiers and shadow scale are **left in place** — the kit files
  use them (`bg-black/10`, `shadow-md`, `ring-foreground/10`). That file
  holds no value of its own. It also holds the one class of ours that is a
  look, `surface-frosted` (D-47, § Frosted surface).

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
| Primitive | `color.white-alpha.70` · `color.neutral-900-alpha.70` · `color.black-alpha.10`, `.40` · `blur.sm` (8px), `blur.md` (12px) | The frosted surface (D-47, § Frosted surface). The blur steps are named after Tailwind's blur scale; fixed unit by the allowlist (`RESPONSIVE.md` § Unit policy) |
| Primitive | `color.red.400`, `.600` · `color.blue.700` | The stock theme's `destructive` (dark, light) and its dark `sidebar-primary`; named after Tailwind's scales |
| Primitive | `color.system.highlight` | The CSS system colour `Highlight`, a string token |
| Primitive | `border.width.2` (2px) | A step of Tailwind's shipped border-width scale |
| Primitive | `radius.lg` (0.625rem) | shadcn/ui's stock base radius |
| Primitive | `breakpoint.md` (48rem) · `breakpoint.lg` (64rem) | Tailwind's shipped values |
| Primitive | `font.stack.sans` | Geist Variable → PingFang SC → Microsoft YaHei → Noto Sans CJK SC → `sans-serif` (D-05, D-25). Geist is imported in `src/index.css` from the installed `@fontsource-variable/geist` |
| Semantic | shadcn/ui's 31 colour roles, light and dark | **The stock values**, pinned by `src/test/tokens.test.ts`; a role that differs is listed in § Changed from stock |
| Semantic | `color.focus.forced` → `color.system.highlight` | Focus outline under forced colours; one value, no mode |
| Semantic | `border.width.focus` → `border.width.2` | Width of the forced-colours focus outline |
| Semantic | `radius.base` → `radius.lg`, and `radius.step.sm … 4xl` | The steps are the base × 0.6 · 0.8 · 1 · 1.4 · 1.8 · 2.2 · 2.6 (`pa.scale`) — shadcn/ui's own formula |
| Semantic | `font.family.sans` → `font.stack.sans` | All text, both locales |
| Semantic | `color.surface-frosted`, `color.surface-frosted-shadow` (light and dark) · `surface.frosted.blur`, `surface.frosted.shadow.blur` | The frosted surface (D-47): ours, not shadcn/ui's — § Frosted surface |
| Primitive | `duration.120` · `.300` · `.500` · `.1200` (ms) | Lengths of time, `$type: duration`, `{ value, unit: "ms" }`; named by their value. Added by package K1 (D-45) — the first motion values of our own |
| Semantic | `motion.simulated.delay` → `duration.120` | How long a faked read and a faked run take (`SIMULATED_DELAY` in `src/runtime/store.ts`) |
| Semantic | `motion.reply.beat` → `duration.500` · `motion.reply.write` → `duration.1200` · `motion.reply.settle` → `duration.300` | The replay of an AI reply (`components/chat.md` § The replay of a reply): the thinking state and each step · a text being written out · the pause before each thing the text carries. Read by the runtime, `ChatMessageList` and the onboarding interview from `motion.ts`; no mode |

**Not generated from `tokens/`:** Tailwind's shipped spacing, type,
line-height, font-weight, shadow, blur (but for the frosted surface's two
steps), opacity, z-index and motion scales
and its colour palette are used through stock utilities as shipped (D-05,
D-43) — a transition or an animation in a class is still Tailwind's or the
kit's; the `motion.*` tokens above time what our own code waits for. The breakpoints `sm`, `xl` and `2xl` are Tailwind's shipped ones and
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
3. **Record:** add the role to § Changed from stock and run `npm test`.

## Frosted surface

Surfaces of ours that float or stick over scrolling content are frosted
(D-47, which amends D-43 for this one look): a translucent background, a
backdrop blur, a small shadow. **One set of tokens, one class** — to change
the look, change a value here and run `npm run tokens:build`; no component
holds any of it.

| Token (semantic) | Light → primitive | Dark → primitive | CSS | What it is |
| --- | --- | --- | --- | --- |
| `color.surface-frosted` | `color.white-alpha.70` | `color.neutral-900-alpha.70` | `--surface-frosted` | The surface's background. Dark is the stock raised surface (`card`, `popover`) let through, not the page colour: raised surfaces get lighter |
| `color.surface-frosted-shadow` | `color.black-alpha.10` | `color.black-alpha.40` | `--surface-frosted-shadow` | Colour of the small shadow |
| `surface.frosted.blur` | `blur.md` (12px) | — (no mode) | `--surface-frosted-blur` | Radius of the backdrop blur |
| `surface.frosted.shadow.blur` | `blur.sm` (8px) | — (no mode) | `--surface-frosted-shadow-blur` | Blur radius of the shadow; it has no offset, so it reads the same under the top bar and above the bottom one |

- **Stronger or weaker:** more see-through = a lower opacity step for
  `color.surface-frosted` (add the primitive, e.g. `color.white-alpha.60`,
  point the role at it in both mode files); more blur = point
  `surface.frosted.blur` at a larger `blur.*` step.
- **The class:** `surface-frosted` in `src/index.css`, the only reader of the
  four tokens (`src/test/tokens.test.ts` pins that). It is **unlayered**, so
  it replaces a kit surface's own `bg-popover` and `shadow-*` from our wrapper
  without the kit file being edited; a ring the kit draws on the same element
  stays. Write it beside the surface's stock background (`bg-background` on
  our bars, the kit's own on an overlay) — that background is the fallback.
- **Fallbacks, in the class:** no `backdrop-filter` support,
  `prefers-reduced-transparency: reduce`, `forced-colors: active` → the stock
  opaque background, no blur.
- **No foreground token:** text on a frosted surface is the role the surface
  already carries (`foreground` on the bars, `popover-foreground` on an
  overlay). Contrast over it is not measured (D-43).
- **Where it is used** (the admission test's "two real places"): the shell's
  header and chat bar row; `DropdownMenu`, `Select`'s list, `Dialog`,
  `AlertDialog`, `Sheet`. The two colours are mapped to Tailwind keys
  (`--color-surface-frosted…`) only because every colour role is; do not
  write `bg-surface-frosted` — use the class.

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

**Withdrawn by D-43 (2026-11-26).** The owner removed the contrast
requirement (“去掉点击目标和对比度的要求”): the prototype ships on shadcn/ui's
stock colours as they are. There is no table of allowed pairings, no test
recomputes a ratio (`src/test/contrast.test.ts` and `src/test/color.ts` are
deleted, the focus ring's ratio is no longer pinned), and the matrix runs
`axe` without its `color-contrast` rule. A reference elsewhere to "§ Contrast
pairs" binds nothing in this project.

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
- **A class of ours cannot outrank a kit utility from inside the utilities
  layer.** Tailwind sorts a many-property utility before the single-property
  ones, so an `@utility` that sets a background loses to the kit's
  `bg-popover` on the same element. `surface-frosted` is therefore written
  unlayered, and hands the property back with `revert-layer` in its
  fallbacks.
- **A library's own stylesheet can outrank an unlayered class.** Sonner styles
  a toast with attribute selectors of higher specificity than one class: the
  toast does not take `surface-frosted` and stays stock (D-47).
