import { screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { changeKind } from '@/lib/vocab'
import { translate } from '@/i18n'

import { describeBlockStates, localesUnderTest, renderBlock } from '../list/testing'

import SummaryBlockDemo from './SummaryBlock.demo'
import { summaryBlock } from './index'

// Component evidence for `block.summary` (R-12).

const { Component: SummaryBlock } = summaryBlock

describeBlockStates(summaryBlock, {
  emptyKey: 'summary.empty',
  emptyProps: { items: [] },
  itemIds: (props) => props.items.map((item) => item.id),
})

describe('block.summary', () => {
  it('is registered under its id', () => {
    expect(summaryBlock.id).toBe('block.summary')
  })

  it.each(localesUnderTest)('%s: each figure is a term with its value and, when given, how it moved', (locale) => {
    const demo = summaryBlock.demo(locale)
    const { container } = renderBlock(locale, <SummaryBlock props={demo.props} changes={{}} state="ready" />)
    const list = container.querySelector('dl')!
    expect(list.children).toHaveLength(demo.props.items.length)
    demo.props.items.forEach((item, index) => {
      const group = list.children[index]
      expect(group.querySelector('dt')).toHaveTextContent(item.label)
      const details = Array.from(group.querySelectorAll('dd'), (each) => each.textContent)
      expect(details).toEqual(item.delta === undefined ? [item.value] : [item.value, item.delta])
    })
    expect(within(list).getAllByRole('term')).toHaveLength(demo.props.items.length)
  })

  it.each(localesUnderTest)('%s: a changed figure says so in words beside its label', (locale) => {
    const demo = summaryBlock.demo(locale)
    const { container } = renderBlock(locale, <SummaryBlock props={demo.props} changes={demo.changes} state="ready" />)
    const term = container.querySelector('[data-item="unplaced"] dt')
    expect(term).toHaveTextContent(translate(locale, 'common', changeKind.new.labelKey))
  })

  it('has nothing to operate: no link, no button', () => {
    const demo = summaryBlock.demo('en')
    const { container } = renderBlock('en', <SummaryBlock props={demo.long} changes={{}} state="ready" />)
    expect(container.querySelector('a, button, [tabindex]:not([role="status"])')).toBeNull()
  })

  it.each(localesUnderTest)('%s: the gallery demo renders', (locale) => {
    const { container } = renderBlock(locale, <SummaryBlockDemo />)
    expect(container.querySelectorAll('dl')).toHaveLength(2)
    expect(screen.getByRole('group', { name: translate(locale, 'data-blocks', 'demo.pick') })).toBeInTheDocument()
  })
})
