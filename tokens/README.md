# tokens/ — the one token source

Design tokens in the W3C DTCG JSON format live here, one file per type
(`color.json`, `dimension.json`, …), created in task 2 from the base values in
`docs/design/FOUNDATIONS.md`. The build (`npm run tokens:build`, added in
task 2) generates `src/tokens/generated/tokens.css`; generated files are never
edited by hand. Rules: `docs/design/TOKENS.md`; admission of new values:
`docs/design/GOVERNANCE.md`.

This folder and `src/tokens/generated/` are the only places where raw visual
values may appear (`design-values.config.json` § tokenPaths).
