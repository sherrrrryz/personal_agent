# Stack rules — React (web)

> Status: evergreen — the hard rules and working conventions for building the
> design system in React for the browser. Framework-neutral rules are in
> `../RESPONSIVE.md`, `../ACCESSIBILITY.md` and `../TOKENS.md`; this document
> says how they are met on the web.

<!--
HOW TO BUILD THIS DOC
- Keep the hard rules. Fill the <placeholders> with the project's choices in
  task 0, and add conventions as the project settles them.
- Version-sensitive facts (kit versions, browser baselines) were checked on
  2026-11-20; re-check when adopting.
-->

**Styling system:** Tailwind v4 reading the CSS custom properties generated from the token source (D-03; kit and tooling in `../FOUNDATIONS.md`) · **UI kit:** see `../FOUNDATIONS.md`

## Hard rules

1. **Font sizes in `rem`.** Never `px`, never a bare viewport unit. Fluid type
   only as `clamp(<rem>, <rem> + <vw>, <rem>)` with the minimum ≥ `1rem` and
   the maximum at least twice the minimum, so 200% stays reachable.
2. **`line-height` is unitless.**
3. **Reflow at 320 CSS px** with no horizontal page scroll.
4. **No fixed height on anything that contains text.**
5. **Every colour, size, space, radius, shadow, blur and duration is a CSS
   custom property generated from the token source.** No literals in
   components, no arbitrary-value utilities (`p-[13px]`, `text-[#333]`).
6. **Native element first.** An ARIA role is added only together with the
   complete keyboard behaviour the Authoring Practices define for that pattern.
7. **A visible focus indicator on every focusable element**, via
   `:focus-visible`, ≥ 3:1 against its surroundings; sticky bars never cover
   the focused element (`scroll-padding`).
8. **Targets ≥ 24×24 CSS px everywhere; ≥ 44×44 wherever touch is possible.**
9. **Logical properties only** (`margin-inline`, `padding-block`,
   `inset-inline-start`), never left/right.
10. **Motion lives inside `@media (prefers-reduced-motion: no-preference)`** —
    the reduced state is the default.
11. **Themes switch by re-pointing semantic variables**, never by per-component
    overrides; `color-scheme` is set so native controls match; no flash of the
    wrong theme on load.
12. **Components adapt to their container** (`@container`); only page layout
    uses viewport media queries.

**Kit-code exception (D-06):** files copied from shadcn/ui into
`src/components/ui/` are exempt from rules 4, 5 and 9 above (fixed heights,
arbitrary-value utilities, physical properties inside the kit) as well as
from `CLAUDE.md` rules 1, 6 and 10. Everything we author follows all twelve.

## Units

The policy table is in `../RESPONSIVE.md`. Web specifics:

- `rem` for type, spacing, control sizes and radii; `em` where a value should
  follow the element's own font size (icon beside text, letter spacing).
- `px` only for the allowlist: borders and dividers, focus-ring geometry,
  shadow geometry. (House rule — no standard forbids `px` there or requires
  `rem` elsewhere except for text.)
- Full-height layouts use `dvh` / `svh`, not `vh`.
- Container-relative units (`cqi`) for sizes that follow the component's own
  width; always bounded by `clamp()`.
- Measure of running text in `ch`.
- Media and container query conditions in `rem`/`em`, chosen by where the
  content breaks, not by device names (house rule: relative conditions follow
  the user's text size).

## Tokens on the web

- Output: `src/tokens/generated/tokens.css` — `:root` for the default mode plus one block per mode
  (the `.dark` class on `<html>` — shadcn's `@custom-variant dark` — set before first paint), with aliases kept as
  `var()` references.
- The styling system reads the variables (Tailwind v4 `@theme inline` maps each custom property to a utility);
  utilities or classes are generated from tokens, so a value outside the scale
  cannot be written by accident.
- User-preference modes: `prefers-color-scheme` sets the default; an explicit
  user choice overrides it (the in-app toggle, D-19); `prefers-contrast: more` maps to the high-contrast
  mode if the product has one; `forced-colors: active` must remain usable —
  do not rely on background colour alone to show state.

## Accessibility on the web

- Roles, names and keyboard behaviour come from the kit's primitives. Do not
  rebuild them; do not strip them when restyling.
- Semantic HTML: one `h1`, headings in order, landmarks, real `button` and
  `a`, `label` bound to every input.
- Dialogs: focus moves in, is contained, returns to the trigger; Escape
  closes; the rest of the page is inert.
- Hover- or focus-triggered content is dismissible with Escape, hoverable and
  persistent.
- Status messages use live regions and do not move focus.
- Tools: axe-core (`vitest-axe` in component tests) and Lighthouse in CI (proposed in task 0, confirmed at `G-0`) — necessary, not sufficient.

## UI kits

Candidates as of 2026-11-20 — verify status when choosing (task 0).

| Kit | Model | Accessibility layer | Tokens |
| --- | --- | --- | --- |
| shadcn/ui | Source copied into the repo | Base UI (default), Radix or React Aria | CSS variables |
| Base UI · Radix Primitives · React Aria Components | Headless dependency | Own, follows the Authoring Practices | Unstyled — you bring the tokens |
| Mantine · MUI · Chakra UI | Styled dependency | Own | Theme object → CSS variables |
| HeroUI | Styled dependency | React Aria Components | CSS variables |

No kit claims a WCAG conformance level; "accessible" means it follows the
Authoring Practices patterns. The product is still tested.

A copied-in kit keeps components readable and editable by agents and the
system small; a dependency gets upstream fixes but is opaque. Decide once
(`../tasks/0-foundations.md`).

## Platform conventions

- Navigation: persistent navigation at expanded widths; a single dominant
  column with a compact navigation pattern at compact widths.
- One primary action per view; destructive actions are distinct and confirmed.
- Works with keyboard, pointer and touch at every width — width does not
  imply input type.

## Verification

Matrix cells for the web are in `../FOUNDATIONS.md`. Minimum: 320 / 768 /
1024 / 1440 CSS px wide · 100% and 200% zoom, plus a larger root font size ·
every mode · keyboard only · one screen reader · reduced motion.

## Pitfalls

<Add entries as learned; symptoms also go in `../UI-PITFALLS.md`.>
