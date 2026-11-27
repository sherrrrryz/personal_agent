// Flow `schedule-rows` (D-46): in `block.schedule` one day is one row across
// the people — every drawn person's cell of a day starts at the same height.
// Run by `npm run matrix -- --flows schedule-rows`, at 1440 and 1024, on the
// rota (排班, a week) and the bookings by groomer (预约).
import { expect, test } from '@playwright/test'

import { openCell } from '../matrix/harness.ts'

const screens = [
  { name: 'the rota', route: '/m/profession.shifts?scene=s3' },
  { name: 'the bookings', route: '/m/profession.appointments?scene=s2' },
]

/** A box may differ from its neighbour by a rounding step, not by more. */
const SLACK = 1

for (const width of [1440, 1024]) {
  for (const { name, route } of screens) {
    test(`schedule-rows — w${width}: ${name}, a day starts at one height for everyone`, async ({ browser }) => {
      const { context, page } = await openCell(browser, { width }, route)
      const scroller = page.locator('[data-slot="schedule-scroller"]').first()
      await scroller.scrollIntoViewIfNeeded()
      const measured = await scroller.evaluate((element) => {
        const people = Array.from(element.querySelectorAll<HTMLElement>('[data-resource]')).filter(
          (column) => column.getClientRects().length > 0,
        )
        const days: Record<string, number[]> = {}
        for (const column of people) {
          for (const cell of column.querySelectorAll<HTMLElement>('[data-day]')) {
            ;(days[cell.dataset.day ?? ''] ??= []).push(cell.getBoundingClientRect().top)
          }
        }
        return {
          people: people.length,
          names: people.map((column) => column.firstElementChild?.getBoundingClientRect().top ?? 0),
          days,
          sideways: document.documentElement.scrollWidth > document.documentElement.clientWidth,
        }
      })
      // The check means something only with people side by side.
      expect(measured.people).toBeGreaterThan(1)
      expect(Object.keys(measured.days).length).toBeGreaterThan(0)
      const spread = (tops: number[]) => Math.max(...tops) - Math.min(...tops)
      expect(spread(measured.names)).toBeLessThanOrEqual(SLACK)
      for (const [day, tops] of Object.entries(measured.days)) {
        expect(tops, `${day}: a cell per drawn person`).toHaveLength(measured.people)
        expect(spread(tops), `${day}: tops ${tops.join(', ')}`).toBeLessThanOrEqual(SLACK)
      }
      expect(measured.sideways).toBe(false)
      await context.close()
    })
  }
}
