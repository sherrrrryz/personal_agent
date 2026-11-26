# The matrix harness

`npm run matrix` — what it runs and asserts is in
`docs/design/FOUNDATIONS.md` § Verification matrix; the contract is
`docs/specs/lofi-prototype-system.md` § Matrix harness. This file is for
people who write flows or change the harness.

| File | What it holds |
| --- | --- |
| `scripts/matrix.mjs` | The command: arguments → plan, this run's own dev server, Playwright, `report.json`, `index.html`, exit code |
| `cells.mjs` | The matrix as data: the 44 cells, the stress, smoke and base sets, where `axe` runs |
| `harness.ts` | `openCell`, `checkCell`, the four passes — imported by the specs here and by `e2e/flows/` |
| `in-page.js` | The assertions that run inside the page (`window.__matrix`), injected as an init script |
| `matrix.spec.ts`, `environment.spec.ts` | One test per planned cell run; the environment proof that starts every run |
| `report.mjs`, `self-test.mjs` | The `index.html` writer; `npm run matrix -- --self-test` |
| `fixtures/` | Self-test pages, outside `src/` on purpose: `pass.html`, `fail.html` (three defects), `passes-fail.html` (defects only the passes see), `blank.html`, `screens/sample/routes.tsx` |
| `tsconfig.json` | `npx tsc --noEmit -p e2e/matrix/tsconfig.json` — the root `tsc -b` does not cover `e2e/` |

## Writing a flow

A flow is `e2e/flows/<name>.spec.ts`, run by `npm run matrix -- --flows <name>`
(no name: every flow). It runs against the dev server of that run; never start
one, never hard-code a port.

```ts
import { expect, test } from '@playwright/test'

import { keyboardPass, openCell } from '../matrix/harness.ts'

test('the panel opens and focus stays visible', async ({ browser }) => {
  // { width, text?: '100' | 'zoom200' | 'root24', theme?, locale? } — light zh-CN at 100% by default
  const { context, page } = await openCell(browser, { width: 320, text: 'root24' }, '/dev/shell')
  await page.getByRole('button', { name: '…' }).click()
  expect((await keyboardPass(page)).failures).toEqual([])
  await context.close()
})
```

`openCell` sets the viewport, the device pixel ratio, the browser's default
font size, `pa.theme` and `pa.locale` (once per tab, so a flow may change them
and reload) and waits for fonts, a quiet network and no `aria-busy` region.
`checkCell(page, { axe: true })`, `keyboardPass`, `reducedMotionPass`,
`forcedColorsPass` and `textSpacingPass` return `{ failures, waived, notes }`;
each failure has a stable `kind` and a readable `message`. For the
reduced-motion and forced-colours passes open the cell with
`{ reducedMotion: true }` or `{ forcedColors: true }`.

## What `--all` reads

Every `src/screens/<area>/routes.tsx` that exists, imported in the browser
through the dev server, must export
`matrixRoutes: { path: string; scenes?: string[]; previews?: string[] }[]`
(a bare path string is accepted). Each route runs in each of its scenes, or
once without `?scene=` when it lists none. With `--cells full` each preview is
added: `long` on the four stress cells, any other state at 320 and 1440 light
zh-CN. A `routes.tsx` without the export stops the run with its name.

## Failure kinds

`sideways-scroll` · `clipped-text` · `small-target` · `axe` ·
`focus-unreached` · `focus-not-visible` · `focus-out-of-view` ·
`focus-covered` · `keyboard-trap` · `motion-under-reduced-motion` ·
`error` (the cell could not be opened or checked) · `not-run`.

## Limits

- **Overlays** are found by `aria-haspopup`, `aria-expanded="false"` and
  `summary`; one opened another way is not exercised by `--reduced-motion`.
  Tooltips are reached only through focus.
- **Targets** are measured in the state the page loads in; a control inside a
  closed overlay is measured by the component's own gallery demo or a flow.
- **Focus visible** means a change of outline, box-shadow, border, background
  or underline on the element, its pseudo-elements or three ancestors. Its
  contrast and thickness are measured elsewhere (A-13).
- **Clipped text** is text past the edge of a box that hides overflow. Text
  that spills out of a box that does not hide it is not caught here; it
  usually shows as a sideways scroll or in the screenshot.
- Chromium only. No screen reader, no real touch.
