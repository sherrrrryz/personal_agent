// Flow `hero-2` (B-22, spec part 3 § Screens and flows): stage 2 of the hero story, opened in
// scene `s2` and walked with the pointer from the sidebar. What the stage does and asserts
// is in `support.ts`. Run by `npm run matrix -- --flows hero-2`, at 1440 and 1024.
import { test } from '@playwright/test'

import { open, stage2, widths } from './support.ts'

for (const width of widths) {
  test(`hero-2 — w${width}: stage 2 in scene s2`, async ({ browser }) => {
    const { context, page } = await open(browser, width, '/m/notifications?scene=s2')
    try {
      await stage2(page, 'hero-2')
    } finally {
      await context.close()
    }
  })
}
