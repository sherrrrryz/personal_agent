// Flow `hero-5` (B-25, spec part 3 § Screens and flows): stage 5 of the hero story, opened in
// scene `s5` and walked with the pointer from the sidebar. What the stage does and asserts
// is in `support.ts`. Run by `npm run matrix -- --flows hero-5`, at 1440 and 1024.
import { test } from '@playwright/test'

import { open, stage5, widths } from './support.ts'

for (const width of widths) {
  test(`hero-5 — w${width}: stage 5 in scene s5`, async ({ browser }) => {
    const { context, page } = await open(browser, width, '/m/notifications?scene=s5')
    try {
      await stage5(page, 'hero-5')
    } finally {
      await context.close()
    }
  })
}
