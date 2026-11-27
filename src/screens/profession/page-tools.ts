import type { PageBlock } from '@/blocks/types'
import { basis, column, defaultEstimate, moduleId, tableId } from '@/fixtures/keys'
import { formatDate, formatDateTime, formatDuration, formatNumber, translate, type Locale, type MessageKey } from '@/i18n'
import {
  cellText,
  datePart,
  numberCell,
  rowOf,
  stringCell,
  tableOf,
  toDate,
  type MemoryRow,
  type MemoryTable,
  type Snapshot,
} from '@/runtime'
import { modulePath } from '@/shell'

// What the page builders of the profession modules share
// (`src/modules/profession.*/module.ts`, the pet file, the appointment
// sheet): the words of namespace `profession`, cells as text, and the figures
// no table stores — a dog's 适用时长 with its basis, a difference, a span.

export type Basis = (typeof basis)[keyof typeof basis]

/** 适用时长 of a dog and what it rests on: its own record, its breed's row, or the default. */
export function appliedFor(view: Snapshot, dogId: string): { minutes: number; basis: Basis } {
  const own = numberCell(rowOf(tableOf(view, tableId.dogDurations), dogId), column.dogDurations.applied)
  if (own !== null) return { minutes: own, basis: basis.own }
  const breed = stringCell(rowOf(tableOf(view, tableId.dogs), dogId), column.dogs.breed) ?? ''
  const byBreed = numberCell(rowOf(tableOf(view, tableId.breeds), breed), column.breeds.applied)
  return byBreed !== null ? { minutes: byBreed, basis: basis.breed } : { minutes: defaultEstimate, basis: basis.default }
}

/** Whole minutes from one story time to another. */
export function minutesBetween(start: string, end: string): number {
  return Math.round((toDate(end).getTime() - toDate(start).getTime()) / 60_000)
}

/** The module that owns the breed table — 服务时长, under whatever id it has after a promotion. */
export function durationModuleId(view: Snapshot): string | undefined {
  return tableOf(view, tableId.breeds)?.ownerModuleId
}

export const petPath = (dogId: string) => `${modulePath(moduleId.clients)}/pets/${dogId}`

/** A dog's portrait (D-50): an illustration in `public/pets/`; a dog without one shows a paw. */
export const petAvatar = (dogId: string) => `${import.meta.env.BASE_URL}pets/${dogId}.svg`
export const appointmentPath = (appointmentId: string) => `${modulePath(moduleId.appointments)}/appointments/${appointmentId}`

/** The words and formats of one page, in the reader's language. */
export function pageTools(view: Snapshot, locale: Locale) {
  const t = (key: MessageKey<'profession'>, params?: Record<string, string | number>) => translate(locale, 'profession', key, params)
  const cell = (table: MemoryTable | undefined, row: MemoryRow | undefined, columnId: string): string =>
    (table && row ? cellText(view, table, row, columnId, locale) : null) ?? ''
  const duration = (minutes: number) => formatDuration(locale, minutes)
  const dogs = tableOf(view, tableId.dogs)

  return {
    t,
    cell,
    duration,
    number: (value: number) => formatNumber(locale, value),
    date: (at: string) => formatDate(locale, toDate(datePart(at))),
    dateTime: (at: string) => formatDateTime(locale, toDate(at)),
    basisWords: (code: string | null) => t(code === basis.own ? 'basis.own' : code === basis.breed ? 'basis.breed' : 'basis.default'),
    /** 大福（金毛）. */
    dogLabel(dogId: string): string {
      const row = rowOf(dogs, dogId)
      return row ? t('dog.label', { name: cell(dogs, row, column.dogs.name), breed: cell(dogs, row, column.dogs.breed) }) : dogId
    },
    dogName: (dogId: string) => cell(dogs, rowOf(dogs, dogId), column.dogs.name) || dogId,
    /** 实际 − 预计 in words: +15 分钟 · −10 分钟 · 准时. */
    diff(estimate: number, actual: number): string {
      const by = actual - estimate
      return by === 0 ? t('diff.none') : t(by > 0 ? 'diff.over' : 'diff.under', { duration: duration(Math.abs(by)) })
    },
    /** A page that has nothing to show: one `block.empty` in the screen's own words. */
    empty(section: MessageKey<'profession'>, title: string, body: string): PageBlock {
      return { key: 'empty', block: 'block.empty', title: t(section), span: 'full', props: { title, body } }
    },
  }
}

export type PageTools = ReturnType<typeof pageTools>
