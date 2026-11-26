import { render, screen } from '@testing-library/react'
import type { ReactElement } from 'react'
import { MemoryRouter } from 'react-router'
import { describe, expect, it } from 'vitest'

import { LocaleProvider, LOCALE_STORAGE_KEY, translate, type Locale, type MessageKey } from '@/i18n'
import { axe } from '@/test/axe'

import type { BlockDefinition, BlockId, BlockPropsMap } from '../types'

// Test helpers of the four data blocks (package S10) — not a component, not a test file.

export const localesUnderTest = ['zh-CN', 'en'] as const satisfies readonly Locale[]

/** A block needs the locale (its own words, dates) and a router (its links). */
export function renderBlock(locale: Locale, ui: ReactElement) {
  window.localStorage.setItem(LOCALE_STORAGE_KEY, locale)
  return render(
    <LocaleProvider>
      <MemoryRouter>{ui}</MemoryRouter>
    </LocaleProvider>,
  )
}

/** The ids of the items a block drew, in order: each item's element carries `data-item`. */
export function drawnItems(container: HTMLElement): string[] {
  return Array.from(container.querySelectorAll('[data-item]'), (element) => element.getAttribute('data-item') ?? '')
}

/** The ids of the drawn items that carry a change marker, with the kind. */
export function markedItems(container: HTMLElement): Record<string, string | null> {
  const marked: Record<string, string | null> = {}
  for (const element of container.querySelectorAll('[data-item]')) {
    const marker = element.querySelector('[data-change]')
    if (marker) marked[element.getAttribute('data-item') ?? ''] = marker.getAttribute('data-change')
  }
  return marked
}

// Plain assertions only: this file is compiled with the application, where
// the DOM and axe matchers of the test setup are not declared.

/** The ids of the axe rules a tree breaks. */
async function findings(container: HTMLElement): Promise<string[]> {
  return (await axe(container)).violations.map((violation) => violation.id)
}

/** Which of its four states the block's `DataState` shows. */
function shownState(container: HTMLElement): string | null {
  return container.querySelector('[data-slot="data-state"]')?.getAttribute('data-state') ?? null
}

type Options<Id extends BlockId> = {
  /** The block's own sentence for the empty state. */
  emptyKey: MessageKey<'data-blocks'>
  /** Props with nothing to show: `ready` with these is the empty state too. */
  emptyProps: BlockPropsMap[Id]
  /** The ids of the items in a block's props, in the order the block draws them. */
  itemIds: (props: BlockPropsMap[Id]) => string[]
}

/**
 * The evidence every data block owes (R-12): its demo in ready, loading,
 * empty, error and long, in both locales, marking exactly the items its
 * change set names.
 */
export function describeBlockStates<Id extends BlockId>(definition: BlockDefinition<Id>, options: Options<Id>) {
  const { Component } = definition

  describe(`${definition.id} — states and markers`, () => {
    it.each(localesUnderTest)('%s, ready: every item, exactly the changed ones marked, no axe finding', async (locale) => {
      const demo = definition.demo(locale)
      const { container } = renderBlock(locale, <Component props={demo.props} changes={demo.changes} state="ready" />)
      expect(drawnItems(container)).toEqual(options.itemIds(demo.props))
      expect(Object.keys(demo.changes).length).toBeGreaterThan(0)
      expect(markedItems(container)).toEqual(demo.changes)
      expect(shownState(container)).toBe('ready')
      expect(await findings(container)).toEqual([])
    })

    it('ready with no change set: nothing is marked', () => {
      const demo = definition.demo('zh-CN')
      const { container } = renderBlock('zh-CN', <Component props={demo.props} changes={{}} state="ready" />)
      expect(container.querySelector('[data-change]')).toBeNull()
    })

    it.each(localesUnderTest)('%s, long: every item of the long content, no axe finding', async (locale) => {
      const demo = definition.demo(locale)
      const { container } = renderBlock(locale, <Component props={demo.long} changes={{}} state="ready" />)
      const ids = options.itemIds(demo.long)
      expect(ids.length).toBeGreaterThan(options.itemIds(demo.props).length)
      expect(drawnItems(container)).toEqual(ids)
      expect(await findings(container)).toEqual([])
    })

    it('loading: busy, a status text, no item', async () => {
      const demo = definition.demo('en')
      const { container } = renderBlock('en', <Component props={demo.props} changes={demo.changes} state="loading" />)
      expect(container.querySelector('[aria-busy="true"]')).not.toBeNull()
      expect(screen.getByRole('status').textContent).toContain(translate('en', 'common', 'status.loading'))
      expect(drawnItems(container)).toEqual([])
      expect(await findings(container)).toEqual([])
    })

    it.each(localesUnderTest)('%s, empty: the block’s own sentence, in the status region', async (locale) => {
      const demo = definition.demo(locale)
      const { container } = renderBlock(locale, <Component props={demo.props} changes={{}} state="empty" />)
      expect(screen.getByRole('status').textContent).toContain(translate(locale, 'data-blocks', options.emptyKey))
      expect(drawnItems(container)).toEqual([])
      expect(await findings(container)).toEqual([])
    })

    it('ready with nothing to show is the empty state', () => {
      const { container } = renderBlock('en', <Component props={options.emptyProps} changes={{}} state="ready" />)
      expect(screen.getByRole('status').textContent).toContain(translate('en', 'data-blocks', options.emptyKey))
      expect(shownState(container)).toBe('empty')
    })

    it.each(localesUnderTest)('%s, error: the shared failure text, no item', async (locale) => {
      const demo = definition.demo(locale)
      const { container } = renderBlock(locale, <Component props={demo.props} changes={{}} state="error" />)
      expect(screen.getByRole('status').textContent).toContain(translate(locale, 'feedback', 'dataState.error.title'))
      expect(drawnItems(container)).toEqual([])
      expect(await findings(container)).toEqual([])
    })

    it('the demo has a title and differs between the locales', () => {
      expect(definition.demo('zh-CN').title).not.toBe('')
      expect(definition.demo('zh-CN').title).not.toBe(definition.demo('en').title)
    })
  })
}
