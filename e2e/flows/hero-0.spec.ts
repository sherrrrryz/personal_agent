// Flow `hero-0` (B-20, spec part 3 § Screens and flows): stage 0 of the hero story, opened in
// scene `s0` and walked with the pointer from the sidebar. What the stage does and asserts
// is in `support.ts`. Run by `npm run matrix -- --flows hero-0`, at 1440 and 1024.
import { test } from '@playwright/test'

import { open, stage0, widths } from './support.ts'

for (const width of widths) {
  test(`hero-0 — w${width}: stage 0 in scene s0`, async ({ browser }) => {
    const { context, page } = await open(browser, width, '/m/notifications?scene=s0')
    try {
      await stage0(page, 'hero-0')
    } finally {
      await context.close()
    }
  })
}
