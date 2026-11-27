// Flow `hero-4` (B-24, spec part 3 § Screens and flows): stage 4 of the hero story, opened in
// scene `s4` and walked with the pointer from the sidebar. What the stage does and asserts
// is in `support.ts`. Run by `npm run matrix -- --flows hero-4`, at 1440 and 1024.
import { test } from '@playwright/test'

import { open, stage4, widths } from './support.ts'

for (const width of widths) {
  test(`hero-4 — w${width}: stage 4 in scene s4`, async ({ browser }) => {
    const { context, page } = await open(browser, width, '/m/notifications?scene=s4')
    try {
      await stage4(page, 'hero-4')
    } finally {
      await context.close()
    }
  })
}
