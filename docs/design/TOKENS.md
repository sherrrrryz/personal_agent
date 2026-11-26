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

- **Source:** `<path>` — JSON in the W3C Design Tokens Community Group format
  (`$value`, `$type`, `$description`; aliases written `{group.token}`).
  The format reached its first stable version (2025.10) in October 2025;
  confirm the current version when adopting.
- **Build:** `<tool, e.g. Style Dictionary>` generates every output. Generated
  files are never edited by hand and say so in their header.
- **Outputs:** web → CSS custom properties (`<path>`); React Native → a typed
  theme object (`<path>`); ~~Figma → variables, by `/figma-mirror`~~ (not in use, D-04).
- **Format facts that shape the source** (DTCG 2025.10): set `$type`
  explicitly on the token or its group; a colour is an object with a colour
  space and components, not a bare hex string; a `dimension` is
  `{ value, unit }` and the only units are `px` and `rem`; composite types
  exist for `shadow`, `typography`, `border`, `transition`, `gradient`.
  **Blur, opacity, z-index and breakpoints are not spec types** — store blur
  and breakpoints as `dimension`, opacity and z-index as `number`.
- **Tool support is partial.** Check that the build tool handles every type
  the source uses, and expect to write a custom transform for React Native
  (plain density-independent numbers) — see `stacks/react-native.md`.
- **Figma's native token import is lossy** (no composite types, `px` only).
  The mirror binds shadow and typography fields one by one; a human checks them.
- **Names are identical everywhere.** `color.bg.surface` in the source is
  `--color-bg-surface` in CSS, `theme.color.bg.surface` in React Native and
  `color/bg/surface` in Figma, with the code name stored as the Figma
  variable's code syntax.

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
- Mode switching: `<mechanism per platform>` — follows the system
  preference; an in-app override exists only if the owner decided so (Apple's
  guidance is to follow the system). No flash of the wrong theme on load.

## Placeholder theme (task 1)

The low-fi prototype runs on the real semantic token **names** with neutral
values: greys from one ramp, one system font stack, the default spacing and
type scale, minimal radius, no decorative shadow. Both modes exist. Task 2
replaces values; component code does not change. A semantic name the
placeholder theme lacks is added through the same admission test.

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

| Foreground | Background | Use | Light | Dark | Required |
| --- | --- | --- | --- | --- | --- |
| `color.text.default` | `color.bg.surface` | Body text | `<ratio>` | `<ratio>` | 4.5 |
| `color.border.control` | `color.bg.surface` | Input boundary | | | 3 |
| `color.focus.ring` | `color.bg.surface` | Focus indicator | | | 3 |

## Pitfalls

<Add entries as learned — e.g. an alias chain the build flattened wrongly, a
unit the React Native output cannot express.>
