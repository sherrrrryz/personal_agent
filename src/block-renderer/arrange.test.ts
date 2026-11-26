// @vitest-environment node
import { describe, expect, it } from 'vitest'

import { blockIds, type ChangeSet } from '@/blocks/types'

import { arrangeBlocks, countPageChanges, pairSpans } from './arrange'
import { blockRegistry, collectBlocks, isBlockDefinition } from './registry'

// R-10, the arithmetic: where a pinned block goes, which blocks pair, what the
// summary line counts — and what the registry takes and refuses.

const keys = (blocks: Array<{ key: string }>) => blocks.map((block) => block.key).join(' ')
const page = (order: string) => order.split(' ').map((key) => ({ key }))

describe('arrangeBlocks', () => {
  it('draws the workflow’s order when nothing is pinned', () => {
    expect(keys(arrangeBlocks(page('a b c d')))).toBe('a b c d')
    expect(keys(arrangeBlocks(page('a b c d'), {}))).toBe('a b c d')
    expect(arrangeBlocks([])).toEqual([])
  })

  it('a pinned block keeps its index after the description is re-ordered; the others flow around it', () => {
    const pins = { b: 1 }
    expect(keys(arrangeBlocks(page('a b c d'), pins))).toBe('a b c d')
    expect(keys(arrangeBlocks(page('d c b a'), pins))).toBe('d b c a')
    expect(keys(arrangeBlocks(page('b a c d'), pins))).toBe('a b c d')
    expect(keys(arrangeBlocks(page('c d a b'), pins))).toBe('c b d a')
    expect(keys(arrangeBlocks(page('d c b a'), { a: 0, d: 3 }))).toBe('a c b d')
  })

  it('ignores a pin whose block is gone, and keeps a pin past the end on the last place', () => {
    expect(keys(arrangeBlocks(page('a b c'), { gone: 0 }))).toBe('a b c')
    expect(keys(arrangeBlocks(page('a b'), { a: 5 }))).toBe('b a')
    expect(keys(arrangeBlocks(page('a b c'), { a: -2 }))).toBe('a b c')
  })

  it('two pins on one place: the next free one, else the one before', () => {
    expect(keys(arrangeBlocks(page('a b c'), { a: 1, c: 1 }))).toBe('b a c')
    expect(keys(arrangeBlocks(page('a b c'), { a: 2, b: 2 }))).toBe('c b a')
  })

  it('does not change the description it was given', () => {
    const blocks = page('a b c')
    arrangeBlocks(blocks, { c: 0 })
    expect(keys(blocks)).toBe('a b c')
  })
})

describe('pairSpans', () => {
  const spans = (asked: string) => pairSpans(asked.split(' ').map((span) => ({ span: span as 'full' | 'half' }))).join(' ')

  it('two half blocks that follow each other share a row', () => {
    expect(spans('half half')).toBe('half half')
    expect(spans('full half half full')).toBe('full half half full')
    expect(spans('half half half half')).toBe('half half half half')
  })

  it('a half block with no partner takes the row', () => {
    expect(spans('half')).toBe('full')
    expect(spans('half full half')).toBe('full full full')
    expect(spans('half half half')).toBe('half half full')
  })
})

describe('countPageChanges', () => {
  const changes: ChangeSet = { blocks: { a: { x: 'new', y: 'updated' }, b: {}, gone: { z: 'removed' } } }

  it('counts the marked items of the blocks on the page, and one for a block named without an item', () => {
    expect(countPageChanges(page('a b c'), changes)).toBe(3)
    expect(countPageChanges(page('a'), changes)).toBe(2)
    expect(countPageChanges(page('c'), changes)).toBe(0)
    expect(countPageChanges(page('a b c'), { blocks: {} })).toBe(0)
  })
})

describe('the block registry', () => {
  const definition = (id: string) => ({ id, Component: () => null, demo: () => ({}) })

  it('holds the seven blocks of the contract under their ids', () => {
    // After wave 4 every id of the contract has its folder: a block that fails to register shows here.
    expect([...blockRegistry.keys()].sort()).toEqual([...blockIds].sort())
    for (const id of blockIds) expect(blockRegistry.get(id)?.id).toBe(id)
    // Only ids of the contract are ever registered.
    for (const id of blockRegistry.keys()) expect(blockIds as readonly string[]).toContain(id)
  })

  it('takes a definition whatever its export is called, and ignores the other exports', () => {
    const registry = collectBlocks({
      '/src/blocks/text/index.ts': { definition: definition('block.text'), TextBlock: () => null, items: { body: 'body' } },
      '/src/blocks/list/index.ts': { default: definition('block.list') },
      '/src/blocks/table/index.ts': { tableBlock: definition('block.table'), again: undefined },
    })
    expect([...registry.keys()].sort()).toEqual(['block.list', 'block.table', 'block.text'])
  })

  it('takes one definition exported under two names once', () => {
    const text = definition('block.text')
    expect(collectBlocks({ '/src/blocks/text/index.ts': { definition: text, default: text } }).size).toBe(1)
  })

  it('refuses two definitions of one id, a definition in a folder of another name, and a folder that defines nothing', () => {
    expect(() =>
      collectBlocks({ '/src/blocks/text/index.ts': { a: definition('block.text'), b: definition('block.text') } }),
    ).toThrow(/already registered/)
    expect(() => collectBlocks({ '/src/blocks/note/index.ts': { definition: definition('block.text') } })).toThrow(/folder of a block is its name/)
    expect(() => collectBlocks({ '/src/blocks/text/index.ts': { TextBlock: () => null } })).toThrow(/exports a BlockDefinition/)
  })

  it('a definition has an id of the contract, a component and a demo', () => {
    expect(isBlockDefinition(definition('block.text'))).toBe(true)
    expect(isBlockDefinition(definition('block.chart'))).toBe(false)
    expect(isBlockDefinition({ id: 'block.text', Component: () => null })).toBe(false)
    expect(isBlockDefinition({ id: 'block.text', demo: () => ({}) })).toBe(false)
    expect(isBlockDefinition(null)).toBe(false)
    expect(isBlockDefinition('block.text')).toBe(false)
  })
})
