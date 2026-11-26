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
  always: 'flex',
  fromMd: 'hidden @md:flex',
  from2xl: 'hidden @2xl:flex',
} as const

// The choice of resource is needed only while some resource is not drawn.
const pickerShown = {
  untilMd: '@md:hidden',
  until2xl: '@2xl:hidden',
} as const

// Alone, a column takes the block's width; beside others it keeps a readable
// width, and the row scrolls inside the scroller when they do not all fit.
// Each column is a size container: its entries' actions stay under the text.
const columnClass = '@container min-w-0 flex-1 flex-col gap-3 @md:min-w-48'

type ColumnProps = {
  resource: ScheduleBlockProps['resources'][number]
  days: string[]
  slots: Slot[]
  changes: BlockChanges
  visibility: string
  onAction?: (actionId: string, itemId: string) => void
}

/** One resource: its name, then its slots in order of time — per day when the range has several. */
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
          <div key={day} data-day={day} className="flex flex-col gap-2">
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
 * resources are columns in a scroller that has a name and is a tab stop; how
 * many are drawn follows the block's own width, and below the step that shows
 * them all a labelled `Select` chooses the one to start from.
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
          <div className="flex gap-4">
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
