# tokens/ — the one token source

**To change a colour** (the only thing the owner changes, D-43): add the value to
`primitive/color.json`, point the role at it in `semantic/color.json` (light) and
`semantic/color.dark.json` (dark), run `npm run tokens:build`, list the role in
`docs/design/TOKENS.md` § Changed from stock.

**To change the frosted look** (the bars and overlays that float over the
page, D-47): the four `surface-frosted` tokens — `docs/design/TOKENS.md`
§ Frosted surface.

Design tokens in the W3C DTCG JSON format (2025.10). Rules:
`docs/design/TOKENS.md`; admission of new values: `docs/design/GOVERNANCE.md`.

```text
tokens/
  primitive/   raw values, named for what they are; no alias, no mode
    color.json       color.neutral.0 … 950 · color.white-alpha.10, .15, .70 · color.neutral-900-alpha.70 · color.black-alpha.10, .40 · color.red.400, .600 · color.blue.700 · color.system.highlight
    dimension.json   border.width.2 · blur.sm, .md · radius.lg · breakpoint.md, .lg
    font.json        font.stack.sans
  semantic/    aliases of primitives, named for their purpose; never a raw value
    color.json       shadcn/ui's colour roles, light (default), stock values (D-43) · color.surface-frosted, color.surface-frosted-shadow (D-47) · color.focus.forced
    color.dark.json  the same roles, dark — one entry for every role
    dimension.json   border.width.focus · surface.frosted.blur, surface.frosted.shadow.blur (D-47) · radius.base, radius.step.*
    font.json        font.family.sans
```

- **The tier is the folder, the mode is the file.** A semantic token points
  at a primitive of the same `$type`; a token that varies by mode has an entry
  in `<type>.json` and in `<type>.dark.json`.
- **Build:** `npm run tokens:build` (`scripts/build-tokens.mjs`, Style
  Dictionary) writes `src/tokens/generated/tokens.css` and
  `src/tokens/generated/breakpoints.ts`. Never edit those by hand; commit them
  with the source change. The build fails on a broken tier rule or a missing
  mode, and `npm test` fails when the generated files are stale. (Contrast
  is not tested — the requirement is withdrawn by D-43.)
- **Adding a file:** list it in `SOURCES` in `scripts/build-tokens.mjs` — the
  order there is the order of the output.
- **Names in CSS:** `docs/design/TOKENS.md` § One source (primitives are
  `--primitive-*`; semantic colours carry shadcn/ui's names, e.g.
  `--muted-foreground`).

This folder and `src/tokens/generated/` are the only places where raw visual
values may appear (`design-values.config.json` § tokenPaths).
