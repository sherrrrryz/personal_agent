import type { ChangeSet } from '@/blocks/types'

// Where each block of a page goes — the part of `BlockRenderer` that is
// arithmetic, kept apart so it is tested without a DOM.

/** A module's pins: block `key` → the position it was pinned at (`RuntimeState.pins[moduleId]`). */
export type Pins = Readonly<Record<string, number>>

/**
 * The order the page is drawn in (D-12, pinning "in place"). The description
 * gives the workflow's order; a pinned block keeps the position it was pinned
 * at, whatever a later workflow edit did to the order, and the others flow
 * around it in the workflow's order. A pin whose block is gone is ignored; a
 * pin past the end of a page that became shorter takes the last free place.
 */
export function arrangeBlocks<Block extends { key: string }>(blocks: readonly Block[], pins: Pins = {}): Block[] {
  const slots: Array<Block | undefined> = Array.from({ length: blocks.length })
  const pinned = blocks
    .filter((block) => Number.isInteger(pins[block.key]))
    .sort((a, b) => pins[a.key] - pins[b.key])
  for (const block of pinned) {
    const wanted = Math.min(Math.max(pins[block.key], 0), blocks.length - 1)
    let index = wanted
    // Two pins on one place (a block pinned, then another moved onto it): the next free one, else the one before.
    while (index < slots.length && slots[index]) index += 1
    if (index === slots.length) {
      index = wanted
      while (index >= 0 && slots[index]) index -= 1
    }
    slots[index] = block
  }
  const flowing = blocks.filter((block) => !pinned.includes(block))
  return slots.map((slot) => slot ?? flowing.shift()!)
}

/**
 * How wide each block is drawn once the renderer is wide enough to pair:
 * two `half` blocks that follow each other share a row; a `half` block with
 * no partner beside it takes the row, so no row is half empty.
 */
export function pairSpans(blocks: ReadonlyArray<{ span: 'full' | 'half' }>): Array<'full' | 'half'> {
  const spans: Array<'full' | 'half'> = []
  for (let index = 0; index < blocks.length; index += 1) {
    if (blocks[index].span === 'half' && blocks[index + 1]?.span === 'half') {
      spans.push('half', 'half')
      index += 1
    } else {
      spans.push('full')
    }
  }
  return spans
}

/**
 * What the summary line counts (本次运行：3 处更新): the marked items of the
 * blocks on the page, and one for a block the set names without an item —
 * its title is marked, so it is one change.
 */
export function countPageChanges(blocks: ReadonlyArray<{ key: string }>, changes: ChangeSet): number {
  return blocks.reduce((total, block) => {
    const marked = changes.blocks[block.key]
    return marked ? total + Math.max(1, Object.keys(marked).length) : total
  }, 0)
}
