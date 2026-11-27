import { column, tableId } from '@/fixtures/keys'
import { formatDuration, translate, type Locale, type MessageKey } from '@/i18n'
import type { ChangeKind } from '@/lib/vocab'
import { cellText, memoryChanges, numberCell, rowOf, stringCell, tableOf, type MemoryColumn, type MemoryRow, type MemoryTable, type Snapshot } from '@/runtime'
import { appliedFor, pageTools, petPath } from '@/screens/profession/page-tools'

// A memory table as the memory view draws it (spec part 3 § Memory view):
// every cell as text, a cell with no data as 尚无数据, a dog as a link to its
// file, and the rows that changed lately. Two tables of the hero flow are
// told in the spec's own words: the breed tier folds 只数 · 最短 · 最长 into
// 实测平均 and says what 适用时长 rests on; the per-dog tier says the same of
// each dog.

export type MemoryCell = { text: string; href?: string }

export type MemoryTableView = {
  id: string
  name: string
  /** The first column names the row. */
  columns: { id: string; label: string }[]
  rows: { id: string; change?: ChangeKind; cells: MemoryCell[] }[]
}

type Context = {
  /** What the cells are read from — the long or the empty variant under those previews. */
  view: Snapshot
  /** The state itself: which rows changed, and which dogs have a file to link to. */
  state: Snapshot
  locale: Locale
}

const b = column.breeds
const d = column.dogDurations

/** The breed tier shows six columns; 只数, 最短 and 最长 are said inside 实测平均. */
const breedColumns: string[] = [b.breed, b.type, b.applied, b.basis, b.observed, b.updatedAt]

export function memoryTableView(table: MemoryTable, { view, state, locale }: Context): MemoryTableView {
  const t = (key: MessageKey<'memory'>, params?: Record<string, string | number>) => translate(locale, 'memory', key, params)
  const tools = pageTools(view, locale)
  const duration = (minutes: number) => formatDuration(locale, minutes)
  const known = tableOf(state, tableId.dogs)
  const changes = memoryChanges(state, table)
  const shown = table.id === tableId.breeds ? table.columns.filter((each) => breedColumns.includes(each.id)) : table.columns

  function plain(row: MemoryRow, each: MemoryColumn): MemoryCell {
    const value = row.cells[each.id]
    if (each.type === 'flag' && typeof value === 'boolean') return { text: t(value ? 'flag.yes' : 'flag.no') }
    const text = cellText(view, table, row, each.id, locale) ?? t('cell.none')
    const isDog = each.type === 'ref' && each.refTable === tableId.dogs && typeof value === 'string' && rowOf(known, value) !== undefined
    return isDog ? { text, href: petPath(value) } : { text }
  }

  function cell(row: MemoryRow, each: MemoryColumn): MemoryCell {
    if (table.id === tableId.breeds) {
      const count = numberCell(row, b.dogs) ?? 0
      if (each.id === b.basis && stringCell(row, b.basis) === 'average') return { text: t('breeds.basis.average', { count }) }
      if (each.id === b.basis && stringCell(row, b.basis) === 'seed') return { text: t('breeds.basis.seed') }
      if (each.id === b.observed) {
        const average = numberCell(row, b.observed)
        const min = numberCell(row, b.min)
        const max = numberCell(row, b.max)
        if (average === null || min === null || max === null) return { text: t('cell.none') }
        return { text: t('breeds.observed', { average: duration(average), count, min: duration(min), max: duration(max) }) }
      }
    }
    if (table.id === tableId.dogDurations && each.id === d.applied) {
      const dogId = stringCell(row, d.dog)
      if (!dogId || !rowOf(tableOf(view, tableId.dogs), dogId)) return plain(row, each)
      const applied = appliedFor(view, dogId)
      return { text: t('dogs.applied', { duration: duration(applied.minutes), basis: tools.basisWords(applied.basis) }) }
    }
    return plain(row, each)
  }

  return {
    id: table.id,
    name: table.name[locale],
    columns: shown.map((each) => ({ id: each.id, label: each.label[locale] })),
    rows: table.rows.map((row) => ({ id: row.id, change: changes[row.id], cells: shown.map((each) => cell(row, each)) })),
  }
}
