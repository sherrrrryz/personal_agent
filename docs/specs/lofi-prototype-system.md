# Design spec: low-fi prototype — system (tooling, placeholder theme, base components, matrix harness)

> Status: approved
> Task type: 1 low-fi
> Author: spec session `t1-spec` · Date: 2026-11-26
> Spec review: `pass with notes` (pass 3 at `f810aad`, 2026-11-26, `.orchestration/reviews/task1-spec-review.md`; pass 1 and 2 `changes requested`, all blocking and should-fix findings closed) · Approved by: owner waiver D-41, 2026-11-26 — `G-SPEC` waived once; marked `approved` by the orchestration session on the passing review
> **Superseded in part, 2026-11-26 (`docs/design/DECISIONS.md` D-43, D-44) — the text below is not rewritten.** D-43: stock shadcn/ui styling; every target-size and contrast requirement is withdrawn; tasks 2 and 3 are not done. D-44: acceptance is desktop only (1024 CSS px and up, default text size, light and dark, both locales) with the light done-check. A line here that names 44 px or 24 px targets, contrast ratios or pairs, 320, 768, root 24 px, 200 % zoom, the bottom sheet, compact navigation, 步骤列表 as the compact default, touch, or the placeholder theme is not a requirement.

Part 1 of 3. Part 2 — runtime, shell, chat, blocks, module frame — is [lofi-prototype-shell.md](lofi-prototype-shell.md); part 3 — every IA screen, the workflow editor, the flows, the matrix run — is [lofi-prototype-screens.md](lofi-prototype-screens.md). Criteria are `A-nn` here, `R-nn` in part 2, `B-nn` in part 3. All three share one task branch, `design/lofi-prototype`; the plan across them is § Work packages below.

## Goal

When this is done the prototype has its ground: a neutral grey theme generated from the token source in light and dark, zh-CN and en, every base component taken from shadcn/ui, registered, tested and at least 44 px to the touch, and a command that walks any screen through the verification matrix and says what broke. Nothing the owner would call a screen exists yet; parts 2 and 3 build on this.

## Inputs

- `docs/design/FOUNDATIONS.md` (§ UI kit, § Token tooling, § Base values, § Modes, § Verification matrix); playbook `docs/design/tasks/1-lofi-prototype.md`; `COMPONENTS.md`, `GOVERNANCE.md`, `TOKENS.md` § Placeholder theme, `RESPONSIVE.md`, `ACCESSIBILITY.md`, `stacks/react-web.md`
- Decisions: D-03, D-05, D-06 (kit, base values, kit-code exemption — **not extended**) · D-17, D-18, D-19, D-24, D-25 (locales, modes, theme toggle, CJK stack) · D-22 (behaviour modes) · D-32–D-35 (tooling, matrix) · D-04 (no Figma) · D-40, D-41 (orchestration; `G-SPEC` waived once)
- Platform and kit: web, React 19 + TypeScript, Vite 8; shadcn/ui CLI 4.23.1, style `base-nova`, Base UI primitives, lucide icons; Tailwind v4

## Scope

### In scope

- Tooling and scaffold; the token source with the placeholder theme; light/dark; zh-CN/en; test setup; lint boundary
- Layout primitives and the base component families: actions, inputs, navigation, containers, feedback, data display
- The matrix harness (`npm run matrix`) and the integration legs that merge parallel waves

### Out of scope

- Runtime, shell, chat, blocks, module frame → part 2. Screens, workflow editor, flows, evidence packet → part 3
- Real values (brand colour, Geist wiring, elevation, final radius) → task 2; component styling → task 3
- Figma (D-04); RTL (D-17); a high-contrast mode (D-18)

## Design

### Tooling (exact versions, no range in `package.json`; registry checked 2026-11-26)

| Purpose | Package @ version | Notes |
| --- | --- | --- |
| Build | `vite` 8.3.8 (installed), `@vitejs/plugin-react` 6.3.0 | D-32 |
| Styling | `tailwindcss` 4.3.5, `@tailwindcss/vite` 4.3.5, `tw-animate-css` 1.4.0 | D-03 |
| Kit | `shadcn` CLI 4.23.1 (`init`: style `base-nova`, base colour `neutral`), `@base-ui/react` 1.9.0, `lucide-react` 1.81.0, `class-variance-authority` 0.7.1, `clsx` 2.1.1, `tailwind-merge` 3.7.1, `sonner` 2.0.8, `@fontsource-variable/geist` 5.3.0 | Versions the CLI resolves win if they differ; S1 records the installed ones. Geist is installed, **not imported** in task 1 |
| Canvas | `@xyflow/react` 13.0.3 | D-16; the only non-kit UI dependency; used in part 3 |
| Tokens | `style-dictionary` 5.8.0 | D-33; `npm run tokens:build` |
| Routing | `react-router` 8.5.3 (library mode) | Not a UI kit |
| Tests | `vitest` 5.1.2, `jsdom` 31.0.1, `@testing-library/react` 16.3.3, `@testing-library/user-event` 14.6.13, `@testing-library/jest-dom` 8.0.0, `vitest-axe` 0.1.0 + `axe-core` 4.14.1 | `npm test` = `vitest run`; `verify` gains it. If `vitest-axe` fails under Vitest 5, S1 calls `axe-core` through a local matcher and records a Notify |
| Matrix | `@playwright/test` 1.65.1 (Chromium only), `@axe-core/playwright` 4.14.1 | `npm run matrix`. Dev-only. Accepted by the lead under D-41 (was Q2); Notify at `G-1`. It replaces neither the VoiceOver pass nor Lighthouse (D-35) |

No i18n library and no state library (§ Decisions).

### Code layout and package contracts (S1 writes them into `COMPONENTS.md` § Conventions)

- **Folders:** `src/components/ui/` kit files · `src/components/<family>/` registered components with an `index.ts`, tests and `*.demo.tsx` colocated · `src/hooks/` · `src/lib/` · `src/i18n/` · `src/theme/` · `src/app/` · `src/tokens/generated/` · part 2: `src/runtime/`, `src/fixtures/`, `src/shell/`, `src/chat/`, `src/blocks/<name>/`, `src/module/` · part 3: `src/modules/<ia-id>/`, `src/screens/<area>/`. Sub-parts are named `ParentPart`. Icons: `lucide-react` only.
- **Import boundary (lint-enforced):** only files under `src/components/` may import from `src/components/ui/`. Everything else imports a component from its family's `index.ts`, which re-exports a `kit` row unchanged or exports the wrapper. A later fix that needs a wrapper therefore changes no importer.
- **Kit code is `src/components/ui/` and nothing else (D-06).** `src/hooks/use-mobile.ts`, which the CLI writes for `Sidebar`, is **our code**: S1 rewrites it to test `(width < <compact breakpoint>)` with the `rem` value imported from the token build; it holds no number.
- **Kit files are edited for one reason only:** a built-in English accessible name (`sr-only` "Close", "Toggle Sidebar", the mobile sidebar's title) becomes a prop that our wrapper fills from the messages. No visual value is added. Each patch is listed in `COMPONENTS.md` § Kit patches (file, what, why) so a kit upgrade can re-apply it.
- **Glob registries keep parallel packages off shared files** (`import.meta.glob`; nobody edits a central index): `src/i18n/messages/<namespace>.<locale>.ts` · top-level routes `src/screens/<area>/routes.tsx`, each also exporting `matrixRoutes` (path, the scenes and previews in which it differs) · child routes of a module `src/screens/<area>/module-routes.tsx` (part 2) · `src/blocks/<name>/index.ts` · `src/modules/<ia-id>/module.ts` · every `*.demo.tsx`, shown on `/dev/components?family=<f>`.
- **Registry split by family from the start** (it passes 40 rows): `docs/design/components/<family>.md` — `layout`, `actions`, `inputs`, `navigation`, `containers`, `feedback`, `data-display` (here), `chat`, `blocks`, `data-blocks`, `module` (part 2), `workflow` (part 3) — one writer each, carrying the registry columns **and** the accessibility-contract columns. `COMPONENTS.md` keeps the contract, conventions and an index; `ACCESSIBILITY.md` § Per-component contract points to the family files.
- **Component evidence** — the phrase the criteria of all three parts use. For each component: a test file (render, every variant and state, the keyboard path, `axe` with no violation, and in zh-CN no English accessible name or text), a demo on the gallery, a registry row and a contract row in its family file. A **registry-parity test** (S1) fails when a component folder has no row or a row has no folder.

### Placeholder theme and tokens

- **Source** `tokens/*.json` (DTCG), three tiers with nothing skipped. **Primitives:** one neutral ramp (the twelve lightness steps of `FOUNDATIONS.md` § Base values, chroma 0); `space.11` (0.25rem × 11) and `border.width.2`, both steps of Tailwind's shipped scales; `radius.sm` (the shipped radius × 0.6); `breakpoint.md` 48rem and `breakpoint.lg` 64rem (Tailwind's shipped values); the font stack system-ui → PingFang SC → Microsoft YaHei → Noto Sans CJK SC (D-25). **Semantic, each an alias:** shadcn's colour role names, a light and a dark value each, **every role grey including `destructive` and `chart-1…5`** (danger is carried by icon and text, hard rule 13) with `ring` on the same step as `foreground`; `radius` and its derived steps; `font.family.sans`; `size.target.min` → `space.11`; `border.width.focus` → `border.width.2`; `color.focus.forced` → the primitive string token `color.system.highlight` (the CSS system colour used under forced colours; one value, no mode). No component tier.
- **Build:** Style Dictionary writes `src/tokens/generated/tokens.css` (`:root` and `.dark` blocks with aliases kept as `var()`, plus a generated `@theme` block setting Tailwind's `md` and `lg` breakpoints) and `src/tokens/generated/breakpoints.ts` (the same two values as constants, for `use-mobile.ts`). Both carry "generated — do not edit". CSS names are shadcn's (`color.muted-foreground` → `--muted-foreground`); S1 records the name transform in `TOKENS.md`.
- **`src/index.css` holds only:** the imports (Tailwind, `tw-animate-css`, the kit's stylesheet, `tokens.css`); `@custom-variant dark`; the `@theme inline` mapping (`var()` references only); `--color-*: initial`, so **no stock palette utility exists**; the shadow scale reset (overlays separate by `border`); **a reduced-motion rule** — under `prefers-reduced-motion: reduce` every animation and transition has zero duration, because the kit animates dialogs and sheets unconditionally and is not edited for it; **a forced-colors rule** giving `:focus-visible` an outline of `border.width.focus` in the colour `color.focus.forced`, both as variables from `tokens.css`, because a box-shadow ring vanishes there — the system-colour keyword itself is written only in the token source. The theme block `shadcn init` writes moves into `tokens/` and leaves this file.
- **Shipped scales:** Tailwind's spacing, type, blur and motion scales are used as shipped through stock utilities (D-05; `TOKENS.md` § Placeholder theme); task 2 lifts them into the source. Until then those values are not generated from `tokens/` — a Notify at `G-1`.
- **Modes (D-19):** `ThemeProvider` reads `localStorage` `pa.theme` (`system` default · `light` · `dark`) and follows `prefers-color-scheme` while `system`; an inline script in `index.html` sets `.dark` and `color-scheme` before first paint.
- **Locale (D-24) — decided here:** `LocaleProvider` picks from `navigator.languages` (any `zh*` → zh-CN, otherwise en), sets `<html lang>`, and is overridden by `localStorage` `pa.locale`. **The user switches with `LocaleSelect`** (a labelled select, options in their own language), present in the shell's preferences menu, on the `settings` home and in the onboarding header. Switching re-renders in place. Dates, times and durations go through `Intl`.
- **Shared vocabularies (S2, `src/lib/vocab.ts`):** the three behaviour modes (icon + 自主 · 协助 · 待确认 / Autonomous · Assisted · Deferred) and the change kinds (icon + 新 · 已更新 · 已移除), so the picker, the badge and the marker built in parallel cannot diverge.

### Layout primitives (the only places page padding, gaps and breakpoints are decided)

`Page` (the content of `main`; page padding; `width: prose | wide | full`; one `h1` slot) · `Stack` (vertical `gap`) · `Inline` (wrapping cluster; `gap`, `align`, `justify`) · `Grid` (`min` item width → intrinsic columns by container query) · `Section` (heading level, optional actions, body). `gap` takes names of the spacing scale, never a number.

### Components

`wrapped` here always means the same thin thing: the wrapper binds `size.target.min` as minimum block and inline size with height `auto`, lets text wrap, fills the kit's built-in names from the messages and narrows the props. Behaviour stays Base UI's (`ACCESSIBILITY.md` § Behaviour patterns). **Every interactive kit control is `wrapped`; only non-interactive ones are `kit`.**

| Component | Source | Variants | States | Accessibility contract |
| --- | --- | --- | --- | --- |
| `Page`, `Stack`, `Inline`, `Grid`, `Section` | `new` | above | — | `Section` → `section` named by its heading; no role otherwise |
| `Button` | `wrapped` | `variant: primary · secondary · ghost · danger · link`; `size: sm · md · icon` | default · hover · focus-visible · pressed · disabled · loading | Native `button`; icon-only requires `aria-label` (type-enforced); loading sets `aria-busy` and keeps the label |
| `Field`, `Input`, `Textarea`, `Select`, `Switch`, `RadioGroup`, `InputGroup` (`Label`: `kit`) | `wrapped` | kit's | default · focus · disabled · invalid · read-only | Every control inside `Field`: visible label = name, description, error text beside the field. `Switch` and radio: the whole labelled row is the target |
| `Toggle`, `ToggleGroup` | `wrapped` | kit's | pressed · unpressed · disabled | `aria-pressed`; a group is one tab stop, arrows move |
| `BehaviourModePicker` | `new` (`RadioGroup`) | `ceiling?` — options above it disabled, the reason as text | per option | Radio group named by its legend; each option = icon + name + one line of meaning (vocabulary above) |
| `Sidebar` (its parts), `Breadcrumb`, `Tabs`, `DropdownMenu` | `wrapped` | kit's | current / selected · disabled | Named `nav`; current item `aria-current="page"`; open-sidebar labels wrap, the icon rail shows icon + tooltip + name; tabs one tab stop, labels wrap |
| `ThemeToggle`, `LocaleSelect` | `new` (`ToggleGroup`, `Select`) | — | — | Named group / labelled select; `LocaleSelect` options carry `lang` |
| `Dialog`, `AlertDialog`, `Sheet` | `wrapped` | `Sheet side: end · bottom` | open · closed | Focus in, contained, returned; Escape closes; the close control is our `Button` with a localised name |
| `Collapsible`, `Tooltip`, `Card`, `Separator` | `kit` | kit's | open · closed | The trigger of a `Collapsible` or `Tooltip` is always our `Button`; a tooltip is never the only label |
| `Badge`, `Alert`, `Skeleton`, `Spinner`, `Empty`, `Progress` | `kit` | kit's | — | `Skeleton` / `Spinner` inside a region with `aria-busy`; `Progress` has a text equivalent |
| `Sonner` (toast) | `wrapped` | — | — | Polite; never the only place an error appears; action and close meet the target size, names localised |
| `DataState` | `new` | `state: ready · loading · empty · error`; slots `empty`, `error` | all four | Loading: `aria-busy` + status text; empty: the kit's `Empty` in the slot; error: `Alert` with the reason and a retry `Button`; changes announced politely |
| `BehaviourModeBadge`, `ChangeMarker` | `new` (`Badge`) | `mode` / `kind` (vocabulary above) | — | Icon + text, never colour alone; part of the parent's accessible name |
| `Table`, `Item` | `wrapped` | kit's | — | `Table`: header cells, caption, inside its own sideways scroller that is focusable and named; an interactive `Item` meets the target size |
| `Avatar` | `kit` | kit's | — | Decorative beside a name |

Chat, block and module components are admitted in part 2; the canvas components in part 3. **Kit components deliberately not used** (S1 records them): `Calendar` / date picker (a second dependency; `block.schedule` covers the need), `Command`, `Carousel`, `Chart`, `Resizable`, `Drawer`, `Checkbox`, `Accordion`, `ScrollArea`, `Popover`.

### Matrix harness (`npm run matrix`, package M1)

- **Cells (D-34 names the axes; this is how they combine):** 100% at 320 · 768 · 1024 · 1440; **200% zoom** at 768 · 1024 · 1440, run as 384 · 512 · 720 CSS px viewports; **root 24 px** at all four widths; each × light/dark × zh-CN/en = **44 cells** per screen. 320 at 200% is not a cell: it is under the WCAG 1.4.10 floor, and 320 × root 24 px is the harder text case. **Root 24 px means the browser's default font size is 24 px — not a style on `html`** — so `rem` media and container queries move with it, as for a real user; the harness's self-test proves both the computed root size and that `(min-width: 48rem)` flips at 1152 px.
- **Asserted in every cell:** no sideways page scroll; no clipped text (content overflowing a box that hides overflow); every target ≥ 44 × 44 CSS px, measured as the box that answers a click (links inside running text are exempt, WCAG 2.5.8); screenshot saved. **`axe`:** zero violations at 320 and 1440 × light and dark (four cells per screen). **Passes at 320 and 1440, light zh-CN:** `--keyboard` (every focusable reached, focus visible, no trap), `--reduced-motion` (no animation of non-zero duration after opening overlays), `--forced-colors` and `--text-spacing` (WCAG 1.4.12 overrides; no clipped text).
- **Interface:** `npm run matrix -- [route…] [--all] [--scene <id>] [--preview <state>] [--cells full|stress|smoke] [--flows [name]] [--keyboard] [--reduced-motion] [--forced-colors] [--text-spacing] [--out <dir>]`. `--all` reads every `matrixRoutes`. `stress` = 320 × root 24 px (dark en; light zh-CN), 768 × 200% (light en), 1440 × 200% (dark zh-CN). Scene and preview go in as `?scene=&preview=`; theme and locale as the `pa.*` keys.
- **Parallel worktrees:** each run starts its own dev server from its working directory on a free port and never reuses one; output goes to `<working directory>/.matrix/<run>/` (git-ignored): screenshots, `report.json`, `index.html`. Only part 3's last package copies a run to `.orchestration/evidence/`.
- **Self-test:** fixture pages under `e2e/matrix/fixtures/` (outside `src/`, so the raw values of the failing page are not UI source): one passes, one has a sideways scroll, a clipped label and a 24 px target.

## Additions to the design system

| Addition | Closest existing | Why it does not serve | Uses (≥2) |
| --- | --- | --- | --- |
| Token `size.target.min` (→ `space.11`, 2.75rem) | The spacing step itself | A step picked by value is not a purpose (hard rule 5); the 44 px floor must change in one place | Every wrapper |
| Token `border.width.focus` (→ `border.width.2`) | The kit's `ring-3` utility | The forced-colors outline needs a named width; `TOKENS.md` already reserves the role | The global focus rule; the canvas node focus (part 3) |
| Token `color.focus.forced` (→ `color.system.highlight`, a string token) | `ring` | `ring` is a grey that forced colours discard; the outline must use a system colour, and a keyword in `src/index.css` would be a colour outside the token source (hard rule 1) | The global focus rule; the canvas node focus (part 3) |
| Token `font.family.sans` with the CJK stack | shadcn `--font-sans` (Geist) | Geist has no CJK glyphs (D-25, approved) | All text, both locales |
| Tokens `breakpoint.md`, `breakpoint.lg` | Tailwind's shipped theme keys | `use-mobile.ts` and the utilities must read one value (`RESPONSIVE.md`: breakpoints are tokens) | The hook; every `md:` / `lg:` utility |
| `Page`, `Stack`, `Inline`, `Grid`, `Section` | `Card`, raw flex utilities | The kit has no layout primitives (playbook step 3) | Every screen |
| The `wrapped` rows | The kit controls as shipped | Fixed heights `h-7…h-9`, `truncate` and `whitespace-nowrap` clip at 200% and sit under 44 px; built-in names are English | Everywhere |
| `DataState` | `Skeleton`, `Empty`, `Alert` by hand | Four states on every data surface, hand-composed, drift apart and lose their announcements | Every block, list and panel |
| `BehaviourModeBadge`, `BehaviourModePicker` | `Badge`, `RadioGroup` | Three modes need one icon and wording everywhere or colour becomes the carrier | Canvas actions, proposals, notifications, `settings.ai-modes`, node inspector |
| `ChangeMarker` | `Badge` | Same: one wording and icon for 新 / 已更新 / 已移除 | Block titles and items, canvas diff, memory rows |
| `ThemeToggle`, `LocaleSelect` | `ToggleGroup`, `Select` | Bound to the providers; three placements must stay identical | Shell menu, `settings`, onboarding |

No primitive is added that the base values do not already contain on a shipped scale, so none is an `HITL.md` Always-ask on its own. Both modes and every text size: shown by A-03, A-13, A-14, A-15, A-16.

## Responsive and adaptive behaviour

**Which structure a cell gets.** All breakpoints are `rem`, in CSS and in `use-mobile.ts` alike, so the kit's sidebar and our layout always agree. Compact `< 48rem`, medium `48–64rem`, expanded `≥ 64rem`:

| Width | 100% | 200% zoom | Root 24 px |
| --- | --- | --- | --- |
| 320 | compact (20rem) | — | compact (13.3rem) |
| 768 | medium (48rem) | compact (24rem) | compact (32rem) |
| 1024 | expanded (64rem) | compact (32rem) | compact (42.7rem) |
| 1440 | expanded (90rem) | compact (45rem) | medium (60rem) |

Only the shell and `Page` read the viewport; components answer to their container with Tailwind's shipped container steps. `Grid` re-columns by its own width. `Table` scrolls sideways inside itself. `Sheet` is `bottom` in the compact shell and `end` otherwise. `Dialog` content scrolls inside with its actions wrapping beneath. Text wraps everywhere; the single truncating slot in the system is the breadcrumb (full path one tap away). Risky cells: 320 × root 24 px for `Tabs`, `Select`, `ToggleGroup` and sidebar items with en labels; 768 × 200% for sheets.

## Accessibility

- **Targets:** ≥ 44 × 44 CSS px on every interactive element, by the wrappers, measured per family in the matrix (A-13, A-14, A-15) and again on the merged gallery (A-16).
- **Focus:** the kit's ring, visible on every focusable; measured **as composited on a rendered control** (the kit draws it at half opacity) at ≥ 3:1 on `background`, `card` and `sidebar` in both modes and ≥ 2 px (A-13); under forced colours the outline rule takes over.
- **Contrast pairs introduced** (S1 fills `TOKENS.md` § Contrast pairs, computed from the source, both modes): `foreground`/`background`, `card-foreground`/`card`, `popover-foreground`/`popover`, `primary-foreground`/`primary`, `secondary-foreground`/`secondary`, `muted-foreground` on `background` and on `muted`, `accent-foreground`/`accent`, `sidebar-foreground`/`sidebar`, `sidebar-accent-foreground`/`sidebar-accent` (4.5); `border`, `input` on `background` (3).
- **Names in both languages:** no accessible name stays English in zh-CN (kit patches above).
- **Motion:** honoured globally by the reduced-motion rule. **Forced colours (D-18):** selected, pressed and current states keep a border or an icon, not background alone.
- **Departures from the kit's accessibility behaviour:** none — names are localised, behaviour is untouched.

## Decisions and rejected alternatives

- **Three specs, twenty-seven packages** against the lead's ten: the sizing guide, the review's finding that parallel packages must not need each other's output, and an integration leg after every parallel wave. Reopen: measured costs after wave 3.
- **Every interactive kit control wrapped** (reverses the first draft's "only `Button`"): the 44 px floor, wrapping text and localised names cannot be had otherwise without editing kit code for visual values.
- **`use-mobile.ts` rewritten as our code** rather than extending D-06 to `src/hooks/` (the lead's decision).
- **All-grey roles including `destructive`**; task 2 restores the hue. **Geist installed, not wired.**
- **No i18n or state library; `react-router`.** Reopen: a third locale, ICU plurals beyond `Intl.PluralRules`, server data.
- **Playwright for the matrix** (was Q2; accepted under D-41). Rejected: a hand-run seven-cell covering set — not a command, not repeatable by the reviewer.

## Owner gates

- **`G-SPEC` — waived once for these specs by D-41.** The Always-ask items the three parts name are covered by the waiver and are listed for the owner at `G-1`: every `new` and `wrapped` row and every token in the Additions tables of parts 1–3. Departures from kit accessibility: none. Hard-rule exceptions: none beyond D-06 as written. Nothing needs a licence, a paid plan, a credential or an account.
- **Notify at `G-1`** (accepted by the lead under D-41): 状态预览 as a second prototype device (was Q1; part 2); Playwright (was Q2); `react-router`; Geist not wired; all-grey `destructive`; Tailwind's shipped scales not generated from `tokens/` until task 2; the kit patches for localised names; the registry split by family; the 44-cell combination (320 × 200% dropped; `axe`, keyboard, reduced motion, forced colours and text spacing on a subset of cells); part 3's memory view and pet-file route.
- **`G-1`** — not waived; the evidence packet is part 3's last package.

## Acceptance criteria

- [ ] **A-01** `npm run verify` and `npm test` exit 0; no version range in `package.json` for the packages of § Tooling — commands + `grep '"[\^~]'` on those lines
- [ ] **A-02** `npm run tokens:build` regenerates `tokens.css` and `breakpoints.ts` byte-identically (`git diff --exit-code`); `src/index.css` holds no colour, length or non-zero duration literal and no `:root` value block — `check:design-values` + `grep -c oklch src/index.css` = 0
- [ ] **A-03** Tiers: every semantic token of every type is an alias of a primitive; every colour role has a light and a dark value, all chroma 0; `bg-red-500` in a scratch file produces no rule — token tests + build-output grep
- [ ] **A-04** `src/hooks/use-mobile.ts` contains no numeric literal and builds its query from `breakpoints.ts` — unit test on the query string + grep
- [ ] **A-05** The built CSS contains the reduced-motion rule and the forced-colors focus rule; `TOKENS.md` § Contrast pairs lists every pair of § Accessibility with its computed ratio at or above the requirement, both modes — build-output grep + recomputation test
- [ ] **A-06** Lint fails on a seeded import of `src/components/ui/*` from outside `src/components/`; the registry-parity test fails on a seeded unregistered component; `src/components/ui/` holds no user-visible string literal (each is a prop, listed in `COMPONENTS.md` § Kit patches) — both seeded runs, then removed + grep
- [ ] **A-07** Docs and config written in the same change: `COMPONENTS.md` (conventions, index, kit-not-used, § Kit patches), the twelve family-file skeletons and their `docs/README.md` rows, `TOKENS.md` § One source / § Placeholder theme / § Contrast pairs, `RESPONSIVE.md` § Breakpoints, `ACCESSIBILITY.md` § Per-component contract pointer, `FOUNDATIONS.md` § UI kit versions, § Token tooling and § Commands, `CLAUDE.md` § Common commands (`test`, `tokens:build` — the lines only), `tokens/README.md`, `tsconfig*.json` alias, `.gitignore` (`.matrix/`, Playwright output), `.oxlintrc.json` — `check:docs` + reviewer read
- [ ] **A-08** Theme: with no stored choice the app follows `prefers-color-scheme`; `setTheme` overrides and survives reload; `color-scheme` is set; no light frame on a dark reload — provider tests + screenshots of the gallery at 1440 light and dark
- [ ] **A-09** Locale: `['zh-TW']` → zh-CN, `['fr']` → en; `setLocale` switches without reload and sets `<html lang>`; a scan of `src/` (kit folder included) finds no user-visible string literal — JSX text, `aria-label`, `title`, `alt`, `placeholder` — outside `src/i18n/` and `src/fixtures/`, bar an allowlist file; both locales of every namespace have the same keys — tests
- [ ] **A-10** Component evidence for `Page`, `Stack`, `Inline`, `Grid`, `Section`; no fixed block size; the two vocabularies export every mode and change kind with a key in both locales — `npm test`
- [ ] **A-11** Matrix harness: on the passing fixture page it runs the 44 cells and every pass and flag of § Matrix harness, writes screenshots, `report.json` and `index.html` under `.matrix/`, exits 0; on the failing page it exits non-zero naming the three defects; the self-test proves root 24 px; two runs started together from two directories do not share a server — commands. `FOUNDATIONS.md` § Verification matrix "How to run it", `stacks/react-web.md` tools line and the `matrix` line of `CLAUDE.md` § Common commands are written
- [ ] **A-12** After merging S2 and M1: `verify`, `npm test` and `npm run matrix -- /dev/components?family=layout` are green on the task branch — commands
- [ ] **A-13** Actions and inputs — component evidence for `Button`, `Field`, `Input`, `Textarea`, `Select`, `Switch`, `RadioGroup`, `InputGroup`, `Toggle`, `ToggleGroup`, `BehaviourModePicker`; `matrix /dev/components?family=actions` and `…=inputs` report zero failures; the composited focus ring of a rendered `Button` and `Input` measures ≥ 3:1 on `background`, `card` and `sidebar`, both modes, ≥ 2 px — `npm test` + matrix + measured values in the completion note
- [ ] **A-14** Navigation and containers — component evidence for `Sidebar`, `Breadcrumb`, `Tabs`, `DropdownMenu`, `ThemeToggle`, `LocaleSelect`, `Dialog`, `AlertDialog`, `Sheet`, `Collapsible`, `Tooltip`, `Card`, `Separator`; overlays prove focus in, containment, return and Escape; `matrix` on both families with `--reduced-motion` reports zero failures — `npm test` + matrix
- [ ] **A-15** Feedback and data display — component evidence for `Badge`, `Alert`, `Sonner`, `Skeleton`, `Spinner`, `Empty`, `Progress`, `DataState`, `BehaviourModeBadge`, `ChangeMarker`, `Table`, `Item`, `Avatar`; `DataState` proves its four states and announcements; `matrix` on both families reports zero failures — `npm test` + matrix
- [ ] **A-16** After merging S4, S5 (each carrying S3) and S6b (carrying S6): `verify` and `npm test` green; `npm run matrix -- /dev/components` over all 44 cells with `--keyboard`, `--forced-colors` and `--text-spacing` reports zero failures, any fix landing in the component — commands + `report.json`

## Work packages

**The plan across the three parts.** Packages in one wave run in parallel, each in its own worktree on a branch cut from `design/lofi-prototype`; an **integration leg** (`I2…I6`) then merges them in the table's order, re-runs `verify`, `npm test` and the matrix over what exists, fixes what the merge broke, and is the only writer while it runs. The next wave starts from the merged branch. **Inside wave 3** S4 and S5 build on S3's wrappers (`Button`, `Select`, `ToggleGroup`), so their worktrees are cut from **S3's finished branch** — no extra merge leg — and I3 merges S4, S5 (each already carrying S3) and S6b (carrying S6).

| Wave | Runs | Then |
| --- | --- | --- |
| 1 | S1 → S1b | — |
| 2 | S2 · M1 | I2 |
| 3 | S3 → (S4 · S5), with (S6 → S6b) alongside from the start of the wave | I3 |
| 4 | S7 · S8 · S9 · S10 | I4 |
| 5 | S11 · S12 | I5 |
| 6 | C1 · C2 · C3 · C4 | I6 |
| 7 | C6 → C5 → C7, one at a time | `G-1` review |

**Frozen files.** `package.json`, the lockfile, `tokens/`, `src/tokens/generated/`, `src/index.css`, `index.html`, `vite.config.ts`, `vitest.config.ts`, `tsconfig*.json`, `components.json`, `design-values.config.json`, `.oxlintrc.json`, `.gitignore`, `src/components/ui/**` and `src/hooks/**` are written by S1 and S1b only (S1 installs every dependency and kit file and writes every script: `test`, `tokens:build`, `matrix`); from I3 on, `src/runtime/**` and `src/fixtures/**` are frozen the same way. A package that needs a change in a frozen file stops and tells the lead, who serialises it as a short leg of the owning package before the requester continues. Test-only fixtures inside a package's own folder are always allowed and never imported by app code.

| # | Package | Owns (files) | Criteria | Est. tokens | Depends on | Planned handoff point |
| --- | --- | --- | --- | --- | --- | --- |
| S1 | Scaffold, dependencies, kit files, token source and build, `src/index.css`, test setup | The frozen files above except the runtime folders; `scripts/build-tokens.mjs`, `src/lib/utils.ts`, `src/test/**`, `TOKENS.md`, `tokens/README.md` | A-01, A-02, A-03, A-05 | 150K | — | After the install and `tokens:build`, before the CSS rules and the contrast table |
| S1b | Hook rewrite, kit patches, lint boundary, parity test, doc skeletons | `src/hooks/**`, `src/components/ui/**` (patches), `.oxlintrc.json`, `src/test/registry-parity.test.ts`, and the docs and config named in A-07 except S1's two | A-04, A-06, A-07 | 110K | S1 | After the hook and patches, before the docs |
| S2 | Providers, i18n core, vocabularies, layout primitives, router host, gallery route | `src/main.tsx`, `src/App.tsx`, `src/app/**`, `src/i18n/**` (core + `common`), `src/theme/**`, `src/lib/vocab.ts`, `src/components/layout/**`, `src/screens/dev/**`, `components/layout.md` | A-08, A-09, A-10 | 165K | S1b | After providers and i18n, before the primitives |
| M1 | Matrix harness | `playwright.config.ts`, `e2e/matrix/**`, `scripts/matrix.mjs`; the doc lines named in A-11 | A-11 | 150K | S1b | After cells and assertions pass the self-test, before the passes and `--flows` |
| I2 | Merge wave 2 | Whatever the merge needs | A-12 | 30K | S2, M1 | — |
| S3 | Actions, inputs | `src/components/actions/**`, `src/components/inputs/**`, `actions.md`, `inputs.md`, namespace `inputs` | A-13 | 175K | I2 | After `Button` and the `Field` controls, before toggles, the picker and the ring measurement |
| S4 | Navigation, containers | `src/components/navigation/**`, `src/components/containers/**`, `navigation.md`, `containers.md`, namespace `navigation` | A-14 | 195K | S3 | After navigation, before overlays |
| S5 | Feedback, data display | `src/components/feedback/**`, `src/components/data-display/**`, `feedback.md`, `data-display.md`, namespace `feedback` | A-15 | 180K | S3 | After feedback, before data display |
| I3 | Merge wave 3; the merged gallery pass | Fixes in `src/components/**` (their packages are finished) | A-16 | 80K | S4, S5, S6b | After the merge is green, before the full-cell gallery run |

S6 and S6b (runtime and story data) are specified in part 2 and run in wave 3 beside S3–S5. A-14 and A-15 use S3's wrappers, part 1's kit files and S2's vocabularies, and nothing of each other's or of S6's.

## Review plan

Two independent result reviews: one after I5, of everything screens stand on (parts 1 and 2); one after C7, of the whole task (part 3). **When they start is changed by D-42:** neither is started while the prototype is being built; the owner first looks at the built prototype, and the reviews follow on the owner's word, before `G-1`. The first probes hardest, for this part: every wrapped control at 320 × root 24 px and 768 × 200% in en — `Select`, `Tabs`, `ToggleGroup`, sidebar items, sheet headers; target sizes measured, not eyeballed; the focus ring's composited contrast in dark; zh-CN accessible names of every overlay; reduced motion on dialogs and sheets; `tokens.css` rebuilt byte-identical; that `use-mobile.ts` and the CSS agree at 1024 × root 24 px; that no package wrote outside its row. The reviewer re-runs `npm run matrix`.
