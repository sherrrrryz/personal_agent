---
name: design-tokens
description: Rules for creating, expanding and applying design tokens in this repo — tiers, naming, modes, units, and the admission test for anything new. Load BEFORE adding or changing a token, styling a component, or writing any visual value (colour, size, spacing, radius, shadow, blur, motion).
---

# Design tokens — working rules

Architecture and naming: `docs/design/TOKENS.md`. Admission and limits:
`docs/design/GOVERNANCE.md`. Units: `docs/design/RESPONSIVE.md` § Unit policy.

## The rule

**No visual value is written anywhere except the token source.** Components
reference tokens; they never contain a literal and never copy a token's
resolved value.

## Using tokens

1. Find the semantic token whose **purpose** matches. Do not pick by matching
   value — a colour that matches today breaks in the next mode.
2. Reference the most specific tier that exists: component → semantic.
   Components never reference a primitive.
3. ~~Use only the foreground/background pairings in `TOKENS.md` § Contrast pairs.~~ Withdrawn by D-43: no contrast requirement, no pairs table.
4. Style every state from tokens, including focus, disabled and error.
5. Never branch on the mode in a component. If you need to, a semantic token
   is missing.

## When no token fits

Stop. Walk the ladder in `GOVERNANCE.md` and take the first rung that works:
use → compose → configure → extend a variant → add a semantic alias → add a
component → add a primitive.

- A value that differs from an existing one by less than the minimum step
  **is** the existing one. Use it.
- A one-off stays local and is built from existing tokens.
- A new semantic token needs two real uses and a spec (`G-SPEC`).
- A new primitive needs the owner.

## Creating or changing tokens

1. Edit the **source** only. Run the build. Never touch generated files.
2. Primitive: raw value, derived from a base value by the written rule,
   named for what it is. No mode.
3. Semantic: an alias, named for its purpose, with a value in **every** mode.
   Surfaces come with their foreground.
4. Component tier: only with a written reason.
5. Units by role. Text and text-related spacing scale with the user's text
   setting; only the allowlist in `RESPONSIVE.md` § Unit policy is fixed.
6. Dark is designed: re-check contrast against the dark surface.
7. Renaming or changing a value is breaking: owner, spec, migration of every
   consumer, Figma variables updated in place.
8. Delete what has no consumer.

## Before calling it done

- [ ] `tokens:build` output is clean and committed; nothing hand-edited
- [ ] Every semantic token resolves in every mode
- [ ] ~~Contrast pairs table updated and recomputed~~ (withdrawn by D-43)
- [ ] No near-duplicate (minimum step), no orphan
- [ ] `check:design-values` reports zero
- [ ] Names identical in source, code and Figma code syntax
- [ ] Budget table in `GOVERNANCE.md` updated

## Never

- A literal "for now"
- A local constant standing in for a token
- A value in an inline style, an arbitrary-value utility or an SVG attribute
- A token named after its appearance on the semantic tier
- A second token for a value that already has one
