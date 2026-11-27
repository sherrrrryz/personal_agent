# Accessibility rules

> Status: evergreen — the accessibility baseline every component and screen
> meets from the first commit, with the standard each rule comes from. The
> working checklist is the `/accessibility` skill; platform APIs are in `stacks/`.

<!--
HOW TO BUILD THIS DOC
- The baseline is fixed at WCAG 2.2 level AA plus the platform target sizes.
  Raise it per project in FOUNDATIONS.md; never lower it without the owner.
- Fill the per-component contract as components are registered.
- Re-verify criterion numbers when WCAG is revised. On 2026-11-20 the
  criteria in the Contrast, target-size, focus, reflow, resize, text-spacing,
  dragging, name-role-value and status rows were read from the WCAG 2.2 text;
  the remaining numbers are cited from the standard's structure and should be
  confirmed when adopting.
-->

**Baseline:** WCAG 2.2 level AA, plus Apple's and Material's touch-target
guidance on native. Accessibility is part of "done" for task 1 — it is not a
later pass, and styling in task 3 must not regress it.

Automated checks find only a minority of problems. A keyboard pass and a
screen-reader pass are required for every component.

## Perceivable

| Rule | Number | Source |
| --- | --- | --- |
| Text contrast | ≥ 4.5:1; large text (≥ 18pt, or ≥ 14pt bold — about 24px / 18.7px) ≥ 3:1 | WCAG 1.4.3 |
| Non-text contrast — control boundaries, icons, focus indicators, state changes | ≥ 3:1 against adjacent colours | WCAG 1.4.11 |
| Colour is never the only carrier of meaning | Add text, icon or shape | WCAG 1.4.1 |
| Text resizes to 200% without loss | | WCAG 1.4.4 |
| Reflow at 320 CSS px wide | No two-direction scrolling | WCAG 1.4.10 |
| Text-spacing overrides do not break layout | | WCAG 1.4.12 |
| Meaningful images have a text alternative; decorative ones are hidden from assistive tech | | WCAG 1.1.1 |
| Structure is conveyed in markup/roles: headings in order, lists, landmarks, table headers | | WCAG 1.3.1 |
| Content shown on hover or focus is dismissible, hoverable, persistent | | WCAG 1.4.13 |

## Contrast

Contrast is measured for **every state** (default, hover, focus, disabled is
exempt but must stay legible, placeholder is not exempt) and **every mode**.
The allowed pairings are the table in `TOKENS.md`.

**Withdrawn by D-43 (2026-11-26):** this section and the two contrast rows of
§ Perceivable (text contrast, non-text contrast) are not requirements in this
project. The stock shadcn/ui colours are used as they are; no pair is measured
and `TOKENS.md` § Contrast pairs holds no table. Every other row is
unchanged by this note.

## Operable

| Rule | Number | Source |
| --- | --- | --- |
| Everything works from the keyboard; no trap | | WCAG 2.1.1, 2.1.2 |
| Focus order follows reading order | | WCAG 2.4.3 |
| Focus is always visible | A visible indicator exists (WCAG 2.4.7, AA); it contrasts ≥ 3:1 (WCAG 1.4.11, AA). **House rule:** at least 2px thick — taken from 2.4.13, which is level AAA | WCAG 2.4.7, 1.4.11 |
| The focused element is not hidden behind sticky bars or overlays | | WCAG 2.4.11 |
| Pointer target size | ≥ 24×24 CSS px on web (the WCAG AA floor). **This kit's minimum, from platform guidance rather than WCAG AA: 44×44 pt on iOS, 44×44 CSS px on web where touch is possible, 48×48 dp on Android** | WCAG 2.5.8; Apple HIG; Material |
| Any drag has a single-pointer alternative | | WCAG 2.5.7 |
| Gestures have a simple-tap alternative | | WCAG 2.5.1 |
| Nothing flashes more than 3 times a second | | WCAG 2.3.1 |
| Motion honours the reduced-motion preference | **House rule** above AA — WCAG 2.3.3 is level AAA; both platforms recommend it | Platform guidance |
| Moving or auto-updating content can be paused | | WCAG 2.2.2 |

**Withdrawn by D-43 (2026-11-26):** the **Pointer target size** row and the
contrast figure of the focus row (≥ 3:1) are not requirements in this project
— the owner removed them (“去掉点击目标和对比度的要求”). Kit controls keep
shadcn/ui's stock size and colours; nothing measures a target or a ratio.
What stays: a visible focus indicator (the stock ring), every other row of
this table, names, roles, states and full keyboard operation.

The visible mark may be smaller than the target; the hit area may not.

## Understandable

- Every input has a visible label that is also its accessible name; a
  placeholder is not a label (WCAG 3.3.2, 2.5.3). One exception, on the
  owner's word (D-49): the chat bar's text control keeps its label as its
  name but does not draw it.
- Errors are identified in text, next to the field, with how to fix them
  (WCAG 3.3.1, 3.3.3) — never by colour alone.
- Nothing changes context on focus or on input without warning (WCAG 3.2.1, 3.2.2).
- Navigation and naming are consistent across screens (WCAG 3.2.3, 3.2.4).
- The page/screen language is declared (WCAG 3.1.1).

## Robust

- Every interactive element exposes **name, role, value/state** to assistive
  technology (WCAG 4.1.2).
- Status changes that do not move focus are announced (WCAG 4.1.3).
- Use the platform's native element or the kit's primitive before adding
  roles by hand. A custom widget follows the WAI-ARIA Authoring Practices
  pattern for its type.

## Behaviour patterns every kit component must keep

| Pattern | Required behaviour |
| --- | --- |
| Dialog / sheet | Focus moves in on open, stays inside while open, returns to the trigger on close; Escape / back closes; background is inert |
| Menu / select / combobox | Arrow keys move, Enter/Space selects, Escape closes, type-ahead where the pattern defines it |
| Tabs | One tab stop; arrows move between tabs; the panel is associated with its tab |
| Toggle, checkbox, radio, switch | State exposed; radios form a group with one tab stop |
| Icon-only button | Has an accessible name |
| Toast / inline status | Announced politely; not the only place an error appears |
| Disclosure / accordion | Expanded state exposed; content reachable in order |

Restyling a kit component must not remove any of this. If it does, the
styling is wrong (`HITL.md` § Always ask covers deliberate departures).

## Per-component contract

One row per registered component; the reviewer tests against it. **The rows
live in the family files**, beside the registry row of the same component —
`components/<family>.md` § Accessibility contract; the index of families is
`COMPONENTS.md` § Registry. Every row has these columns:

| Column | Says |
| --- | --- |
| Role | The native element or ARIA role the component exposes |
| Name comes from | Content, a visible label, or a prop — never a built-in string: every name is localised (`COMPONENTS.md` § Kit patches) |
| Keyboard | The keys that operate it, as the kit's primitive defines them |
| Focus | Where focus goes on open and close, and that the ring is visible |
| Min target | **Withdrawn by D-43** — no target-size requirement; a family file's "Min target" column binds nothing. Kit controls keep their stock size |
| Announces | State and changes exposed to assistive technology |

## Verifying

1. Automated scan (`<tool>`) — catches the easy part only
2. Keyboard pass: reach, operate and leave every control; watch the focus ring
3. Screen-reader pass: `<VoiceOver / TalkBack / NVDA>` — name, role, state of every control; reading order; announcements. A session that cannot drive a screen reader inspects the accessibility tree instead and reports the pass as **not checked** (`REVIEW.md`, protocol 7) — the owner or a human tester closes it
4. ~~Contrast: recompute the pairs table in every mode~~ — withdrawn by D-43
5. Text size, reflow and reduced motion: the verification matrix

## Pitfalls

<Add entries as learned; symptoms also go in `UI-PITFALLS.md`.>
