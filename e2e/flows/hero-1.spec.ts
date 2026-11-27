// Flow `hero-1` (B-21, spec part 3 § Screens and flows): stage 1 of the hero story, opened in
// scene `s0` and walked with the pointer from the sidebar. What the stage does and asserts
// is in `support.ts`. Run by `npm run matrix -- --flows hero-1`, at 1440 and 1024.
import { test } from '@playwright/test'

import { open, stage0, stage1, widths } from './support.ts'

for (const width of widths) {
  test(`hero-1 — w${width}: stage 1 in scene s0`, async ({ browser }) => {
    const { context, page } = await open(browser, width, '/m/notifications?scene=s0')
    try {
      await stage0(page, 'hero-1')
        await stage1(page, 'hero-1')
    } finally {
      await context.close()
    }
  })
}
