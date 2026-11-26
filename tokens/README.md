# tokens/ — the one token source

**To change a colour** (the only thing the owner changes, D-43): add the value to
`primitive/color.json`, point the role at it in `semantic/color.json` (light) and
`semantic/color.dark.json` (dark), run `npm run tokens:build`, list the role in
`docs/design/TOKENS.md` § Changed from stock.

Design tokens in the W3C DTCG JSON format (2025.10). Rules:
`docs/design/TOKENS.md`; admission of new values: `docs/design/GOVERNANCE.md`.

```text
tokens/
  primitive/   raw values, named for what they are; no alias, no mode
    color.json       color.neutral.0 … 950 · color.white-alpha.10, .15 · color.red.400, .600 · color.blue.700 · color.system.highlight
    dimension.json   space.6 · border.width.2 · radius.lg · breakpoint.md, .lg
    font.json        font.stack.sans
  semantic/    aliases of primitives, named for their purpose; never a raw value
    color.json       shadcn/ui's colour roles, light (default), stock values (D-43) · color.focus.forced
    color.dark.json  the same roles, dark — one entry for every role
    dimension.json   size.target.min · border.width.focus · radius.base, radius.step.*
    font.json        font.family.sans
```

- **The tier is the folder, the mode is the file.** A semantic token points
  at a primitive of the same `$type`; a token that varies by mode has an entry
  in `<type>.json` and in `<type>.dark.json`.
- **Build:** `npm run tokens:build` (`scripts/build-tokens.mjs`, Style
  Dictionary) writes `src/tokens/generated/tokens.css` and
  `src/tokens/generated/breakpoints.ts`. Never edit those by hand; commit them
  with the source change. The build fails on a broken tier rule or a missing
  mode, and `npm test` fails when the generated files are stale or a contrast
  pair of `docs/design/TOKENS.md` § Contrast pairs drops below its requirement.
- **Adding a file:** list it in `SOURCES` in `scripts/build-tokens.mjs` — the
  order there is the order of the output.
- **Names in CSS:** `docs/design/TOKENS.md` § One source (primitives are
  `--primitive-*`; semantic colours carry shadcn/ui's names, e.g.
  `--muted-foreground`).

This folder and `src/tokens/generated/` are the only places where raw visual
values may appear (`design-values.config.json` § tokenPaths).
