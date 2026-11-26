import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { translate } from '@/i18n'
import { behaviourMode } from '@/lib/vocab'

import ListBlockDemo from './ListBlock.demo'
import { listBlock } from './index'
import { describeBlockStates, localesUnderTest, renderBlock } from './testing'

// Component evidence for `block.list` (R-12).

const { Component: ListBlock } = listBlock

describeBlockStates(listBlock, {
  emptyKey: 'list.empty',
  emptyProps: { items: [] },
  itemIds: (props) => props.items.map((item) => item.id),
})

describe('block.list', () => {
  it('is registered under its id', () => {
    expect(listBlock.id).toBe('block.list')
  })

  it.each(localesUnderTest)('%s: a list of items with title, meta and badges', (locale) => {
    const demo = listBlock.demo(locale)
    renderBlock(locale, <ListBlock props={demo.props} changes={{}} state="ready" />)
    const rows = within(screen.getByRole('list')).getAllByRole('listitem')
    expect(rows).toHaveLength(demo.props.items.length)
    demo.props.items.forEach((item, index) => {
      expect(rows[index]).toHaveTextContent(item.title)
      expect(rows[index]).toHaveTextContent(item.meta)
      for (const badge of item.badges.filter((each) => !each.mode)) expect(rows[index]).toHaveTextContent(badge.label)
    })
  })

  it.each(localesUnderTest)('%s: a badge that says a behaviour mode is the shared mode badge', (locale) => {
    const demo = listBlock.demo(locale)
    const { container } = renderBlock(locale, <ListBlock props={demo.props} changes={{}} state="ready" />)
    const badge = container.querySelector('[data-item="remind"] [data-mode]')
    expect(badge).toHaveAttribute('data-mode', 'deferred')
    expect(badge).toHaveTextContent(translate(locale, 'common', behaviourMode.deferred.nameKey))
    expect(badge?.querySelector('svg')).toHaveAttribute('aria-hidden', 'true')
  })

  it('an item with a link and no action is one link, with nothing interactive inside', () => {
    const demo = listBlock.demo('en')
    const { container } = renderBlock('en', <ListBlock props={demo.props} changes={{}} state="ready" />)
    const row = container.querySelector('[data-item="confirmed"]')
    expect(row?.tagName).toBe('A')
    expect(row).toHaveAttribute('href', '/m/confirmations')
    expect(row).toHaveAccessibleName(expect.stringContaining(demo.props.items[0].title))
    expect(row?.querySelector('button, a')).toBeNull()
  })

  it('an item with actions is a plain row: its title is the link, its actions are buttons named with the item', async () => {
    const demo = listBlock.demo('en')
    const onAction = vi.fn()
    const { container } = renderBlock('en', <ListBlock props={demo.props} changes={{}} state="ready" onAction={onAction} />)
    const remind = container.querySelector<HTMLElement>('[data-item="remind"]')!
    expect(remind.tagName).not.toBe('A')
    const title = demo.props.items[1].title
    const send = within(remind).getByRole('button', { name: `Send: ${title}` })
    expect(send).toHaveTextContent('Send')
    await userEvent.click(send)
    await userEvent.click(within(remind).getByRole('button', { name: `Skip: ${title}` }))
    expect(onAction.mock.calls).toEqual([
      ['send', 'remind'],
      ['skip', 'remind'],
    ])

    const record = container.querySelector<HTMLElement>('[data-item="record"]')!
    expect(within(record).getByRole('link', { name: demo.props.items[2].title })).toHaveAttribute('href', '/m/duration')
    expect(within(record).getByRole('button')).toBeDisabled()
  })

  it('an item without meta or actions draws neither', () => {
    const { container } = renderBlock(
      'en',
      <ListBlock props={{ items: [{ id: 'bare', title: 'Bare', meta: '', badges: [] }] }} changes={{}} state="ready" />,
    )
    expect(container.querySelector('[data-slot="item-description"]')).toBeNull()
    expect(container.querySelector('button, a')).toBeNull()
  })

  it.each(localesUnderTest)('%s: the gallery demo renders', (locale) => {
    renderBlock(locale, <ListBlockDemo />)
    expect(screen.getAllByRole('list').length).toBeGreaterThanOrEqual(2)
    expect(screen.getByRole('group', { name: translate(locale, 'data-blocks', 'demo.pick') })).toBeInTheDocument()
  })
})
