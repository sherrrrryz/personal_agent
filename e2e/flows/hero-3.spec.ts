// Flow `hero-3` (B-23, spec part 3 § Screens and flows): stage 3 of the hero story, opened in
// scene `s3` and walked with the pointer from the sidebar. What the stage does and asserts
// is in `support.ts`. Run by `npm run matrix -- --flows hero-3`, at 1440 and 1024.
import { test } from '@playwright/test'

import { open, stage3, widths } from './support.ts'

for (const width of widths) {
  test(`hero-3 — w${width}: stage 3 in scene s3`, async ({ browser }) => {
    const { context, page } = await open(browser, width, '/m/notifications?scene=s3')
    try {
      await stage3(page, 'hero-3')
    } finally {
      await context.close()
    }
  })
}
