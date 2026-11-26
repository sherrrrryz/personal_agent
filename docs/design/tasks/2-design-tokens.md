# Task 2 — Expand base values into design tokens

> Status: evergreen — playbook: turning the owner's base values into a complete
> tiered token set with every mode, in one source that generates every
> platform's output.

**Read first:** `../FOUNDATIONS.md` § Base values · `../TOKENS.md` · `../GOVERNANCE.md` · `../ACCESSIBILITY.md` § Contrast · `../RESPONSIVE.md` § Unit policy · the stack doc § Tokens
**Skills:** `/design-tokens` · `/accessibility`
**Gate:** `G-2` (Review of the running result — the owner approves before anything is mirrored) · **Then:** task 4 → `G-MIRROR`

## Goal

After this task no future scenario — a new mode, a new platform, a new screen
— requires a hardcoded value. Everything visual is a token, and every token
is derived from the base values by a written rule.

## Steps

1. **Primitives.** Expand each base value by its rule in `TOKENS.md`: colour
   ramps, type scale, spacing scale, radius steps, elevation levels, blur
   levels, motion steps. Write the rule next to the result so the scale can
   be regenerated.
2. **Semantic tier.** Name by purpose (`color/bg/surface`,
   `color/text/muted`, `space/inset/md`). Each aliases a primitive. Every
   surface colour has its paired foreground.
3. **Modes.** Give every semantic colour (and anything else that changes) a
   value in every required mode. Dark is designed: surfaces get lighter with
   elevation, saturation is tuned, shadows are reconsidered — it is not an
   inversion.
4. **Contrast.** Fill the contrast-pairs table in `TOKENS.md` for every mode
   and fix failures at the alias level. A failure that can only be fixed by
   changing a base value goes to the owner.
5. **Component tier** only where a component needs a decision that no
   semantic token expresses and that must change independently. Default: none.
6. **Build.** One source → generated outputs for each platform in
   `FOUNDATIONS.md`. Generated files are never edited by hand.
7. **Swap the placeholder theme.** The semantic names the prototype already
   uses now resolve to real values. Anything that breaks is a naming gap —
   fix the token set, not the component. Add a **token preview page** to
   the running prototype — swatches, type specimen, spacing, radius,
   elevation and blur, in every mode, rendered from the generated tokens.
   It is what the owner looks at for `G-2`, since nothing is in Figma yet.
8. **Prune.** Remove any token with no consumer and no approved spec needing
   it; collapse near-duplicates (`GOVERNANCE.md` § Minimum step).

## Rules specific to this task

- A primitive is added only by derivation from a base value. An off-scale
  value needs the owner.
- Semantic tokens never hold raw values; components never reference
  primitives.
- Modes live on the semantic tier only. Primitives are mode-less.
- Units follow the unit policy in `RESPONSIVE.md` — sizes that must scale
  with the user's text setting are stored in scalable units for the web
  output and as scalable numbers for React Native.
- Token names are identical in the source, the generated code and the Figma
  code syntax.

## Suggested work packages

| Package | Owns |
| --- | --- |
| Primitives + build pipeline | Token source (primitive files), build config |
| Semantic colour, all modes, contrast table | Semantic colour files, `TOKENS.md` table |
| Type, spacing, radius, elevation, blur, motion | The remaining semantic files |
| Theme swap + prune | Theme entry point; one writer |

The token source has **one writer at a time**; these packages run in sequence.

## Common failures

- Dark mode produced by flipping the ramp
- A semantic token per component "to be safe" — the tier explodes
- Two neutrals one step apart that nobody can tell from each other
- Contrast checked for body text only

## Done

`WORKFLOW.md` § Definition of done, row 2; reviewer checklist in `REVIEW.md`.
