import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { formatDate, formatTime, translate } from '@/i18n'
import { toDate } from '@/runtime'

import { describeBlockStates, drawnItems, localesUnderTest, renderBlock } from '../list/testing'
import type { ScheduleBlockProps } from '../types'

import ScheduleBlockDemo from './ScheduleBlock.demo'
import { scheduleBlock } from './index'

// Component evidence for `block.schedule` (R-12). The container steps are CSS
// container queries, which jsdom does not lay out: here the classes that
// carry them are checked; the widths themselves were counted in a browser
// (`.orchestration/evidence/S10/`, and the matrix walks the demo's containers).

const { Component: ScheduleBlock } = scheduleBlock

/** The order the block draws slots in: by resource, then by time. */
function drawnOrder(props: ScheduleBlockProps): string[] {
  return props.resources.flatMap((resource) =>
    props.slots
      .filter((slot) => slot.resourceId === resource.id)
      .sort((a, b) => a.start.localeCompare(b.start))
      .map((slot) => slot.id),
  )
}

const columnClasses = (container: HTMLElement) =>
  Array.from(container.querySelectorAll('[data-resource]'), (column) =>
    column.className.includes('hidden @2xl:flex') ? 'from-2xl' : column.className.includes('hidden @md:flex') ? 'from-md' : 'always',
  )

describeBlockStates(scheduleBlock, {
  emptyKey: 'schedule.empty',
  emptyProps: { range: { kind: 'day', start: '2026-11-05', days: 1 }, resources: [{ id: 'a', label: 'A' }], slots: [] },
  itemIds: drawnOrder,
})

describe('block.schedule', () => {
  it('is registered under its id', () => {
    expect(scheduleBlock.id).toBe('block.schedule')
  })

  it.each(localesUnderTest)('%s: scrolls inside a named, focusable scroller', (locale) => {
    const demo = scheduleBlock.demo(locale)
    const { container } = renderBlock(locale, <ScheduleBlock props={demo.props} changes={{}} state="ready" />)
    const range = formatDate(locale, toDate(demo.props.range.start), { dateStyle: 'full' })
    const scroller = screen.getByRole('group', { name: translate(locale, 'data-blocks', 'schedule.region', { range }) })
    expect(scroller).toHaveAttribute('tabindex', '0')
    expect(scroller.className).toContain('overflow-x-auto')
    expect(scroller).toBe(container.querySelector('[data-slot="schedule-scroller"]'))
    // The range is also said in sight, above the scroller.
    expect(screen.getByText(range)).toBeVisible()
    expect(container.querySelectorAll('[data-slot="schedule-scroller"] [data-resource]')).toHaveLength(3)
  })

  it.each(localesUnderTest)('%s: each resource is a named group with its slots in order of time', (locale) => {
    const demo = scheduleBlock.demo(locale)
    renderBlock(locale, <ScheduleBlock props={demo.props} changes={{}} state="ready" />)
    for (const resource of demo.props.resources) {
      const column = screen.getByRole('group', { name: resource.label })
      const own = demo.props.slots.filter((slot) => slot.resourceId === resource.id)
      const rows = within(within(column).getByRole('list', { name: resource.label })).getAllByRole('listitem')
      expect(rows).toHaveLength(own.length)
      own.forEach((slot, index) => {
        expect(rows[index]).toHaveTextContent(slot.title)
        expect(rows[index]).toHaveTextContent(slot.meta)
        expect(rows[index]).toHaveTextContent(formatTime(locale, toDate(slot.start)))
        expect(rows[index]).toHaveTextContent(formatTime(locale, toDate(slot.end)))
      })
    }
  })

  it('three resources: the first is always drawn, its neighbour from @md, the rest from @2xl; the picker leaves at @2xl', async () => {
    const demo = scheduleBlock.demo('en')
    const { container } = renderBlock('en', <ScheduleBlock props={demo.props} changes={{}} state="ready" />)
    expect(columnClasses(container)).toEqual(['always', 'from-md', 'from-2xl'])
    const picker = container.querySelector('[data-slot="schedule-picker"]')!
    expect(picker.className).toBe('@2xl:hidden')

    // The labelled Select chooses the resource that is always drawn.
    const select = screen.getByRole('combobox', { name: translate('en', 'data-blocks', 'schedule.resource.label') })
    expect(select).toHaveTextContent(demo.props.resources[0].label)
    await userEvent.click(select)
    await userEvent.click(await screen.findByRole('option', { name: demo.props.resources[2].label }))
    await waitFor(() => expect(columnClasses(container)).toEqual(['from-2xl', 'from-md', 'always']))
    expect(select).toHaveTextContent(demo.props.resources[2].label)

    await userEvent.click(select)
    await userEvent.click(await screen.findByRole('option', { name: demo.props.resources[1].label }))
    await waitFor(() => expect(columnClasses(container)).toEqual(['from-2xl', 'always', 'from-md']))
  })

  it('two resources: both are drawn from @md, where the picker leaves; one resource: no picker', () => {
    const demo = scheduleBlock.demo('en')
    const two = { ...demo.props, resources: demo.props.resources.slice(0, 2) }
    const first = renderBlock('en', <ScheduleBlock props={two} changes={{}} state="ready" />)
    expect(columnClasses(first.container)).toEqual(['always', 'from-md'])
    expect(first.container.querySelector('[data-slot="schedule-picker"]')?.className).toBe('@md:hidden')
    first.unmount()

    const one = { ...demo.props, resources: demo.props.resources.slice(0, 1) }
    const second = renderBlock('en', <ScheduleBlock props={one} changes={{}} state="ready" />)
    expect(columnClasses(second.container)).toEqual(['always'])
    expect(second.container.querySelector('[data-slot="schedule-picker"]')).toBeNull()
    expect(screen.queryByRole('combobox')).toBeNull()
  })

  it.each(localesUnderTest)('%s, a week: every resource lists every day; a day with nothing says so', (locale) => {
    const demo = scheduleBlock.demo(locale)
    const { container } = renderBlock(locale, <ScheduleBlock props={demo.long} changes={{}} state="ready" />)
    const span = translate(locale, 'data-blocks', 'schedule.range.span', {
      start: formatDate(locale, toDate('2026-11-02')),
      end: formatDate(locale, toDate('2026-11-08')),
    })
    expect(screen.getByRole('group', { name: translate(locale, 'data-blocks', 'schedule.region', { range: span }) })).toBeInTheDocument()
    for (const column of container.querySelectorAll('[data-resource]')) {
      const days = Array.from(column.querySelectorAll('[data-day]'), (day) => day.getAttribute('data-day'))
      expect(days).toEqual(['2026-11-02', '2026-11-03', '2026-11-04', '2026-11-05', '2026-11-06', '2026-11-07', '2026-11-08'])
    }
    const none = translate(locale, 'data-blocks', 'schedule.none')
    // 3 resources × 7 days = 21 cells, 14 of them hold one slot.
    expect(screen.getAllByText(none)).toHaveLength(7)
    const monday = formatDate(locale, toDate('2026-11-02'), { weekday: 'short', month: 'short', day: 'numeric' })
    expect(screen.getAllByText(monday)).toHaveLength(3)
    const firstList = within(container.querySelector<HTMLElement>('[data-resource]')!).getAllByRole('list')[0]
    expect(firstList).toHaveAccessibleName(`${demo.long.resources[0].label} ${monday}`)
  })

  it('a slot outside the range or of an unknown resource is not drawn', () => {
    const demo = scheduleBlock.demo('en')
    const stray = [
      { ...demo.props.slots[0], id: 'next-day', start: '2026-11-06T09:00', end: '2026-11-06T10:00' },
      { ...demo.props.slots[0], id: 'nobody', resourceId: 'nobody' },
    ]
    const { container } = renderBlock(
      'en',
      <ScheduleBlock props={{ ...demo.props, slots: [...demo.props.slots, ...stray] }} changes={{}} state="ready" />,
    )
    expect(drawnItems(container)).toEqual(drawnOrder(demo.props))
  })

  it('a slot’s actions are buttons named with the slot; a slot with only a link is one link', async () => {
    const demo = scheduleBlock.demo('en')
    const onAction = vi.fn()
    const { container } = renderBlock('en', <ScheduleBlock props={demo.props} changes={{}} state="ready" onAction={onAction} />)
    const slot = demo.props.slots[1]
    await userEvent.click(screen.getByRole('button', { name: `Start: ${slot.title}` }))
    await userEvent.click(screen.getByRole('button', { name: `Move: ${slot.title}` }))
    expect(onAction.mock.calls).toEqual([
      ['start', 'zl-2'],
      ['move', 'zl-2'],
    ])
    const linkRow = container.querySelector('[data-item="ch-1"]')
    expect(linkRow?.tagName).toBe('A')
    expect(linkRow).toHaveAttribute('href', '/m/appointments')
    // With actions the title is the link.
    expect(within(container.querySelector<HTMLElement>('[data-item="zl-1"]')!).getByRole('link')).toHaveTextContent(
      demo.props.slots[0].title,
    )
  })

  it.each(localesUnderTest)('%s: the gallery demo renders the block at three container widths', (locale) => {
    const { container } = renderBlock(locale, <ScheduleBlockDemo />)
    expect(container.querySelectorAll('[data-slot="schedule-scroller"]')).toHaveLength(4)
    expect(container.querySelector('[data-demo-width="narrow"] [data-slot="schedule"]')).not.toBeNull()
    expect(container.querySelector('[data-demo-width="medium"] [data-slot="schedule"]')).not.toBeNull()
  })
})
