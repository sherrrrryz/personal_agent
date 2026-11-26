---
name: accessibility
description: Accessibility rules for every UI change in this repo (WCAG 2.2 AA plus platform target sizes). Load BEFORE writing or changing any component, layout, screen, colour token or interaction, on web or React Native, including low-fidelity prototypes.
---

# Accessibility — working rules

Reference, numbers and sources: `docs/design/ACCESSIBILITY.md`. Platform APIs:
`docs/design/stacks/`. Allowed colour pairings: `docs/design/TOKENS.md` § Contrast pairs.

Accessibility is built in from the first commit. It is never a later pass,
and restyling must not remove it.

## While building

1. **Use the kit's primitive or the native element.** Roles, names and
   keyboard behaviour come with it. Add a role by hand only with the full
   behaviour of that pattern.
2. **Name, role, state** on every interactive element. Icon-only controls get
   a name. The accessible name contains the visible label.
3. **Keyboard:** everything reachable and operable; order follows reading
   order; no trap; focus always visible and never hidden under a bar.
4. **Dialogs and sheets:** focus in on open, contained, back to the trigger on
   close; Escape / back closes; background inert.
5. **Targets — withdrawn by D-43 in this project (no target-size requirement; kit controls keep their stock size).** Kit text: 44×44 pt (iOS, web touch), 48×48 dp (Android); never under
   24×24 CSS px. The hit area may exceed the visible mark.
6. **Contrast — withdrawn by D-43 in this project (stock shadcn/ui colours as they are; nothing is measured).** Kit text: text 4.5:1 (large text 3:1); boundaries, icons, focus and
   state indicators 3:1 — every state, every mode. Use only pairings listed in
   `TOKENS.md`.
7. **Never colour alone** for meaning: add text, icon or shape.
8. **Labels and errors:** every input has a visible label; errors are text,
   next to the field, saying how to fix it.
9. **Text size and reflow:** see `/responsive` — 200% text, 320 px reflow.
10. **Motion:** honour reduced motion; content is complete without animation.
11. **Gestures and drags** have a single-tap alternative.
12. **Status changes** are announced without moving focus (on React Native:
    both the Android and the iOS mechanism).

## Before calling it done

- [ ] Automated scan clean — this is the smaller part
- [ ] Keyboard pass: reach, operate, leave every control; ring visible throughout
- [ ] Screen-reader pass: name, role, state, order, announcements
      (web: one reader; app: VoiceOver **and** TalkBack)
- [ ] Contrast recomputed for every pairing the change introduces, per mode
- [ ] Targets measured
- [ ] Reduced motion on
- [ ] The component's row in `ACCESSIBILITY.md` § Per-component contract is
      filled and true

## Stop and ask the owner

- A brand colour that cannot meet contrast in a pairing the design needs
- A design that requires departing from the kit's accessible behaviour
- Lowering any number in `ACCESSIBILITY.md`

## Never

- A `div` / `View` with a click handler where a button exists
- A placeholder used as the label
- Removing the focus outline without a token-based replacement
- "Fixing" contrast by nudging a value in a component instead of the token
- Hiding focusable content from assistive technology
