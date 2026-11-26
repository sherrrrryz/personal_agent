// @vitest-environment node
import { describe, expect, it } from 'vitest'

import { flowOrder, rankLayout, rankOf } from './layout'

const ids = ['start', 'review', 'read', 'estimate', 'set', 'record', 'check', 'memory', 'out']
const edges = [
  { from: 'start', to: 'read' },
  { from: 'read', to: 'estimate' },
  { from: 'estimate', to: 'set' },
  { from: 'set', to: 'record' },
  { from: 'record', to: 'check' },
  { from: 'review', to: 'check' },
  // A loop: what was recorded is read by the next estimate.
  { from: 'record', to: 'memory' },
  { from: 'memory', to: 'estimate' },
  { from: 'record', to: 'out' },
]

describe('the rank layout of the canvas (B-11)', () => {
  it('ranks by the longest way from a start; a loop does not push its own start along', () => {
    const rank = rankOf(ids, edges)
    expect(rank.get('start')).toBe(0)
    expect(rank.get('review')).toBe(0)
    expect(rank.get('estimate')).toBe(2)
    expect(rank.get('check')).toBe(5)
    expect(rank.get('memory')).toBe(5)
  })

  it('flow order is by column, then by the place in the list', () => {
    expect(flowOrder(ids, edges)).toEqual(['start', 'review', 'read', 'estimate', 'set', 'record', 'check', 'memory', 'out'])
    expect(flowOrder(['b', 'a'], [{ from: 'a', to: 'b' }])).toEqual(['a', 'b'])
  })

  it('no two nodes overlap, whatever their sizes', () => {
    const sizes = Object.fromEntries(ids.map((id, index) => [id, { width: 120 + index * 37, height: 60 + ((index * 53) % 140) }]))
    const positions = rankLayout(ids, edges, sizes, 16)
    const boxes = ids.map((id) => ({ id, ...positions[id], ...sizes[id] }))
    for (const a of boxes) {
      for (const b of boxes) {
        if (a.id >= b.id) continue
        const apart = a.x + a.width <= b.x || b.x + b.width <= a.x || a.y + a.height <= b.y || b.y + b.height <= a.y
        expect(apart, `${a.id} and ${b.id}`).toBe(true)
      }
    }
  })
})
