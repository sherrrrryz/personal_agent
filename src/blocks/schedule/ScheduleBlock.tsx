import { useId, useState } from 'react'

import { focusRing } from '@/components/actions/focus-ring'
import { ItemGroup } from '@/components/data-display'
import { DataState, Skeleton } from '@/components/feedback'
import { Field, Select } from '@/components/inputs'
import { useFormat, useT } from '@/i18n'
import { addDays, datePart, toDate } from '@/runtime'

import { BlockEmpty, BlockEntry } from '../list/parts'
import type { BlockChanges, BlockComponentProps, ScheduleBlockProps } from '../types'

type Slot = ScheduleBlockProps['slots'][number]

// How many resources stand side by side follows the block's own width, by
// container query: one below the `@md` step, two from it, all of them from
// `@2xl`. The chosen resource is always drawn, its neighbour from `@md`, the
// others from `@2xl`. A resource that is not drawn is `display: none`: out of
// sight and out of the accessibility tree alike, and one choice away.
const shown = {
  always: 'grid',
  fromMd: 'hidden @md:grid',
  from2xl: 'hidden @2xl:grid',
} as const

// The choice of resource is needed only while some resource is not drawn.
const pickerShown = {
  untilMd: '@md:hidden',
  until2xl: '@2xl:hidden',
} as const

// One day is one row across the resources (D-46). The grid has a row for the
// names and a row per day; a resource is a column that spans them all and
// takes its rows from the grid (`subgrid`), so its cell of a day starts where
// every other resource's does, and a row is as high as its highest cell. The
// columns fill in the order of the resources; one that is not drawn takes no
// column and adds nothing to a row's height.
const gridClass = 'grid grid-flow-col gap-x-4 gap-y-3'

// The number of rows comes from the range, and a column is one share of the
// width but never narrower than its own minimum (`auto-cols-fr` would let a
// column shrink under it and run into its neighbour). Neither is a design
// value: a count and a share.
const gridTracks = (days: number) => ({ gridTemplateRows: `repeat(${days + 1}, auto)`, gridAutoColumns: '1fr' })

// Alone, a column takes the block's width; beside others it keeps a readable
// width, and the row scrolls inside the scroller when they do not all fit.
const columnClass = 'row-span-full min-w-0 grid-rows-subgrid @md:min-w-48'

// Each cell is a size container: its entries' actions stay under the text. (A
// size container cannot be a subgrid, so it is the cell, not the column.)
const cellClass = '@container flex min-w-0 flex-col gap-2'

type ColumnProps = {
  resource: ScheduleBlockProps['resources'][number]
  days: string[]
  slots: Slot[]
  changes: BlockChanges
  visibility: string
  onAction?: (actionId: string, itemId: string) => void
}

/** One resource: its name, then a cell per day with its slots in order of time; the day is named when the range has several. */
function ResourceColumn({ resource, days, slots, changes, visibility, onAction }: ColumnProps) {
  const t = useT('data-blocks')
  const format = useFormat()
  const labelId = useId()
  const time = (at: string) => format.time(toDate(at))
  return (
    <div role="group" aria-labelledby={labelId} data-resource={resource.id} className={`${columnClass} ${visibility}`}>
      <p id={labelId} className="font-medium wrap-anywhere">
        {resource.label}
      </p>
      {days.map((day) => {
        const ofDay = slots.filter((slot) => datePart(slot.start) === day)
        const dayId = `${labelId}-${day}`
        return (
          <div key={day} data-day={day} className={cellClass}>
            {days.length > 1 && (
              <p id={dayId} className="text-sm font-medium text-muted-foreground">
                {format.date(toDate(day), { weekday: 'short', month: 'short', day: 'numeric' })}
              </p>
            )}
            {ofDay.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t('schedule.none')}</p>
            ) : (
              <ItemGroup aria-labelledby={days.length > 1 ? `${labelId} ${dayId}` : labelId}>
                {ofDay.map((slot) => (
                  <BlockEntry
                    key={slot.id}
                    id={slot.id}
                    lead={t('schedule.slot.time', { start: time(slot.start), end: time(slot.end) })}
                    title={slot.title}
                    meta={slot.meta}
                    badges={slot.badges}
                    actions={slot.actions}
                    href={slot.href}
                    change={changes[slot.id]}
                    onAction={onAction}
                  />
                ))}
              </ItemGroup>
            )}
          </div>
        )
      })}
    </div>
  )
}

/**
 * `block.schedule` — time slots by resource over a day or a week. The
 * resources are columns in a scroller that has a name and is a tab stop, and
 * a day is one row across them; how many are drawn follows the block's own
 * width, and below the step that shows them all a labelled `Select` chooses
 * the one to start from.
 */
export function ScheduleBlock({ props, changes, state, onAction }: BlockComponentProps<'block.schedule'>) {
  const t = useT('data-blocks')
  const format = useFormat()
  const [chosen, setChosen] = useState<string | null>(null)
  const { range, resources, slots } = props

  const days = Array.from({ length: Math.max(1, range.days) }, (_, index) => addDays(range.start, index))
  const drawn = slots
    .filter((slot) => days.includes(datePart(slot.start)) && resources.some((resource) => resource.id === slot.resourceId))
    .sort((a, b) => a.start.localeCompare(b.start))

  const selected = Math.max(0, resources.findIndex((resource) => resource.id === chosen))
  // The neighbour drawn beside the chosen one: the next resource, or the one before the last.
  const neighbour = selected + 1 < resources.length ? selected + 1 : selected - 1

  const first = format.date(toDate(days[0]), days.length === 1 ? { dateStyle: 'full' } : undefined)
  const rangeText =
    days.length === 1 ? first : t('schedule.range.span', { start: first, end: format.date(toDate(days[days.length - 1])) })

  return (
    <DataState
      state={state === 'ready' && drawn.length === 0 ? 'empty' : state}
      empty={<BlockEmpty title={t('schedule.empty')} />}
      loading={
        <div className="flex gap-4">
          <div className="flex flex-1 flex-col gap-2">
            <Skeleton className="h-5 w-1/2" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
          <div className="flex flex-1 flex-col gap-2">
            <Skeleton className="h-5 w-1/2" />
            <Skeleton className="h-16 w-full" />
          </div>
        </div>
      }
    >
      <div data-slot="schedule" className="@container flex min-w-0 flex-col gap-3">
        <p className="text-sm font-medium">{rangeText}</p>
        {resources.length > 1 && (
          <div data-slot="schedule-picker" className={resources.length > 2 ? pickerShown.until2xl : pickerShown.untilMd}>
            <Field label={t('schedule.resource.label')}>
              <Select
                options={resources.map((resource) => ({ value: resource.id, label: resource.label }))}
                value={resources[selected].id}
                onValueChange={setChosen}
              />
            </Field>
          </div>
        )}
        <div
          role="group"
          aria-label={t('schedule.region', { range: rangeText })}
          tabIndex={0}
          data-slot="schedule-scroller"
          className={`overflow-x-auto rounded-md border p-3 ${focusRing}`}
        >
          <div data-slot="schedule-grid" className={gridClass} style={gridTracks(days.length)}>
            {resources.map((resource, index) => (
              <ResourceColumn
                key={resource.id}
                resource={resource}
                days={days}
                slots={drawn.filter((slot) => slot.resourceId === resource.id)}
                changes={changes}
                visibility={index === selected ? shown.always : index === neighbour ? shown.fromMd : shown.from2xl}
                onAction={onAction}
              />
            ))}
          </div>
        </div>
      </div>
    </DataState>
  )
}
