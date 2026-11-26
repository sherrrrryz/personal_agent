import { screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { translate } from '@/i18n'
import { changeKind } from '@/lib/vocab'

import { describeBlockStates, localesUnderTest, renderBlock } from '../list/testing'

import TableBlockDemo from './TableBlock.demo'
import { tableBlock } from './index'

// Component evidence for `block.table` (R-12).

const { Component: TableBlock } = tableBlock

describeBlockStates(tableBlock, {
  emptyKey: 'table.empty',
  emptyProps: { caption: 'Nothing', columns: [{ id: 'a', label: 'A' }], rows: [] },
  itemIds: (props) => props.rows.map((row) => row.id),
})

describe('block.table', () => {
  it('is registered under its id', () => {
    expect(tableBlock.id).toBe('block.table')
  })

  it.each(localesUnderTest)('%s: scrolls inside a named, focusable scroller', (locale) => {
    const demo = tableBlock.demo(locale)
    renderBlock(locale, <TableBlock props={demo.props} changes={{}} state="ready" />)
    const scroller = screen.getByRole('region', { name: demo.props.caption })
    expect(scroller).toHaveAttribute('tabindex', '0')
    expect(scroller).toHaveAttribute('data-slot', 'table-scroller')
    expect(scroller.className).toContain('overflow-x-auto')
    expect(within(scroller).getByRole('table', { name: demo.props.caption })).toBeInTheDocument()
  })

  it.each(localesUnderTest)('%s: seven columns, each headed by its label; the first cell names the row', (locale) => {
    const demo = tableBlock.demo(locale)
    renderBlock(locale, <TableBlock props={demo.props} changes={{}} state="ready" />)
    expect(demo.props.columns).toHaveLength(7)
    expect(screen.getAllByRole('columnheader').map((cell) => cell.textContent)).toEqual(
      demo.props.columns.map((column) => column.label),
    )
    const rowHeaders = screen.getAllByRole('rowheader')
    expect(rowHeaders).toHaveLength(demo.props.rows.length)
    for (const row of screen.getAllByRole('row').slice(1)) {
      expect(within(row).getAllByRole('rowheader')).toHaveLength(1)
      expect(within(row).getAllByRole('cell')).toHaveLength(6)
    }
  })

  it('a column of numbers is aligned to the end, header and cells alike', () => {
    const demo = tableBlock.demo('en')
    renderBlock('en', <TableBlock props={demo.props} changes={{}} state="ready" />)
    const ends = demo.props.columns.map((column) => column.align === 'end')
    for (const row of screen.getAllByRole('row')) {
      const cells = Array.from(row.children)
      cells.forEach((cell, index) => {
        expect(cell.classList.contains('text-end')).toBe(ends[index])
        expect(cell.classList.contains('min-w-24')).toBe(true)
      })
    }
  })

  it('a cell may be a link and may carry a note under its text', () => {
    const demo = tableBlock.demo('en')
    const { container } = renderBlock('en', <TableBlock props={demo.props} changes={{}} state="ready" />)
    const golden = container.querySelector<HTMLElement>('[data-item="golden"]')!
    expect(within(golden).getByRole('link', { name: 'Golden retriever' })).toHaveAttribute('href', '/m/duration')
    expect(golden).toHaveTextContent(translate('en', 'data-blocks', 'table.demo.basis.note', { n: 4 }))
    // Only the named cell is a link.
    expect(container.querySelectorAll('a')).toHaveLength(1)
    expect(container.querySelector('button')).toBeNull()
  })

  it.each(localesUnderTest)('%s: a changed row is marked in words in its row header', (locale) => {
    const demo = tableBlock.demo(locale)
    const { container } = renderBlock(locale, <TableBlock props={demo.props} changes={demo.changes} state="ready" />)
    expect(container.querySelector('[data-item="corgi"] th')).toHaveTextContent(
      translate(locale, 'common', changeKind.new.labelKey),
    )
    expect(container.querySelector('[data-item="poodle"] [data-change]')).toBeNull()
  })

  it('a row with no value for a column draws an empty cell, not a missing one', () => {
    renderBlock(
      'en',
      <TableBlock
        props={{
          caption: 'Sparse',
          columns: [
            { id: 'a', label: 'A' },
            { id: 'b', label: 'B' },
            { id: 'c', label: 'C' },
          ],
          rows: [{ id: 'r1', cells: { a: 'one', c: 'three' } }],
        }}
        changes={{}}
        state="ready"
      />,
    )
    const cells = screen.getAllByRole('cell')
    expect(cells.map((cell) => cell.textContent)).toEqual(['', 'three'])
  })

  it.each(localesUnderTest)('%s: the gallery demo renders two tables with different names', (locale) => {
    renderBlock(locale, <TableBlockDemo />)
    const names = screen.getAllByRole('region').map((region) => region.getAttribute('aria-labelledby'))
    expect(names).toHaveLength(2)
    const demo = tableBlock.demo(locale)
    // Its own caption: the definition's caption is on the renderer's demo page of the same gallery.
    expect(screen.getByRole('region', { name: translate(locale, 'data-blocks', 'table.demo.alone.caption') })).toBeInTheDocument()
    expect(screen.queryByRole('region', { name: demo.props.caption })).not.toBeInTheDocument()
    expect(screen.getByRole('region', { name: demo.long.caption })).toBeInTheDocument()
  })
})
