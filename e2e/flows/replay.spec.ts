// Flow `replay` (D-45, package K1): an answer arrives as a process, not at once. The hero
// sentence on 预约, scene `s0`: the AI's turn is thinking, then working through its steps, then
// its text is written out, then the rule table comes, and only then the proposal with 接受. Its
// first line is visible in the panel without scrolling from the first moment. With reduced
// motion the text is never partly there: it arrives whole. Run by
// `npm run matrix -- --flows replay`, at 1440 and 1024.
import { test, type Page } from '@playwright/test'

import { openCell } from '../matrix/harness.ts'

import { bar, expect, heroPrompt, widths } from './support.ts'

const ROUTE = '/m/profession.appointments?scene=s0'
const reply = '明白了。我把你的经验整理成下面这张表：长毛大型 4 小时，短毛小型 2 小时，其他 3 小时。同一个品种的狗差别也可能很大，所以我还会按名字记录每只狗的实际耗时。这听起来是一条长期规则——要不要把它设为长期，以后预约和排班都按它来？'

/** What the AI's turn in the panel held at one moment. */
interface Moment {
  /** `thinking` · `working` · `writing` · `attaching`, then the status `done`. */
  phase: string
  /** Characters of the answer on screen. */
  text: number
  steps: number
  tables: number
  accept: number
  /** The turn's first line lies inside the conversation's viewport. */
  begins: boolean
}

/** Records the AI's turn at every change of the page, from now on. */
async function record(page: Page): Promise<void> {
  await page.evaluate(() => {
    const moments: unknown[] = []
    ;(window as unknown as { __replay: unknown[] }).__replay = moments
    const read = () => {
      const panel = document.querySelector('[data-chat-panel]')
      const turn = panel ? [...panel.querySelectorAll<HTMLElement>('[data-author="ai"]')].at(-1) : undefined
      const view = panel?.querySelector('[data-slot="message-scroller-viewport"]')?.getBoundingClientRect()
      if (!turn || !view) return
      const box = turn.getBoundingClientRect()
      const moment = {
        phase: turn.dataset.phase ?? turn.dataset.status ?? '',
        text: (turn.querySelector('[data-slot="bubble-content"]')?.textContent ?? '').length,
        steps: turn.querySelectorAll('[data-slot="trace-collapsible-content"] [data-slot="trace-line"]').length,
        tables: turn.querySelectorAll('table').length,
        accept: [...turn.querySelectorAll('button')].filter((button) => button.textContent?.trim() === '接受').length,
        begins: box.top >= view.top - 1 && box.top < view.bottom,
      }
      if (JSON.stringify(moments.at(-1)) !== JSON.stringify(moment)) moments.push(moment)
    }
    new MutationObserver(read).observe(document.body, { subtree: true, childList: true, attributes: true, characterData: true })
  })
}

const recorded = (page: Page) => page.evaluate(() => (window as unknown as { __replay: Moment[] }).__replay)

/** The phases in the order they were first seen. */
const order = (moments: Moment[]) => moments.map((moment) => moment.phase).filter((phase, index, all) => all.indexOf(phase) === index)

async function ask(page: Page): Promise<Moment[]> {
  await record(page)
  await bar(page).getByRole('button', { name: heroPrompt }).click()
  const panel = bar(page).locator('[data-chat-panel]')
  await expect(panel.locator('[data-author="ai"][data-status="done"]')).toBeVisible()
  await expect(panel.getByRole('button', { name: '接受' })).toBeVisible()
  return recorded(page)
}

for (const width of widths) {
  test(`replay — w${width}: the hero answer passes through a working state before 接受 is offered`, async ({ browser }) => {
    const { context, page } = await openCell(browser, { width }, ROUTE)
    try {
      const moments = await ask(page)
      expect(order(moments), 'thinking, working, writing, what it carries, done').toEqual(['thinking', 'working', 'writing', 'attaching', 'done'])
      const during = (phase: string) => moments.filter((moment) => moment.phase === phase)
      // Working: its steps come one at a time, and nothing of the answer is there yet.
      expect(Math.max(...during('working').map((moment) => moment.steps)), 'both steps were shown').toBe(2)
      expect(during('working').some((moment) => moment.steps === 1), 'one step at a time').toBe(true)
      expect(during('thinking').concat(during('working')).filter((moment) => moment.text > 0 || moment.tables > 0), 'no answer while it works').toEqual([])
      // Writing: the text is partly there at some moment — it is written out, not dropped in.
      expect(during('writing').some((moment) => moment.text > 0 && moment.text < reply.length), 'the text is written out').toBe(true)
      // The table comes after the text is whole; 接受 is offered only once the reply is done.
      expect(moments.filter((moment) => moment.tables > 0 && moment.text < reply.length), 'no table before the text is whole').toEqual([])
      expect(moments.filter((moment) => moment.accept > 0 && moment.phase !== 'done'), '接受 only when the reply is done').toEqual([])
      expect(during('attaching').some((moment) => moment.tables === 1), 'the table arrives before the proposal').toBe(true)
      // From the first moment the turn's first line is inside the panel: nothing to scroll to.
      expect(moments.filter((moment) => !moment.begins).map((moment) => moment.phase), 'the working state and the answer begin in view').toEqual([])
    } finally {
      await context.close()
    }
  })
}

test('replay — w1440, reduced motion: the answer is whole at once', async ({ browser }) => {
  const { context, page } = await openCell(browser, { width: 1440 }, ROUTE, { reducedMotion: true })
  try {
    const moments = await ask(page)
    // The parts still come in order; the text is never partly there.
    expect(order(moments)).toEqual(['thinking', 'working', 'writing', 'attaching', 'done'])
    expect(moments.filter((moment) => moment.text > 0 && moment.text < reply.length), 'no partly written text').toEqual([])
    expect(moments.some((moment) => moment.phase === 'writing' && moment.text === reply.length), 'the text arrives whole').toBe(true)
    expect(moments.filter((moment) => moment.accept > 0 && moment.phase !== 'done')).toEqual([])
  } finally {
    await context.close()
  }
})
