// The rank layout of the workflow canvas (spec part 3 § Workflow editor,
// "Canvas"): a node's column is how far it is from a start of the flow, and
// its place in the column follows the order of the workflow's own list.
// Positions are computed from the sizes the browser measured and one gap —
// no coordinate is ever typed, so two nodes cannot overlap whatever their
// text does to their size.

export type FlowEdge = { from: string; to: string }
export type Size = { width: number; height: number }
export type Point = { x: number; y: number }

/**
 * The column of every node: the longest way to it from a node nothing leads
 * to. An edge that closes a loop (记录实际耗时 → 记忆 → 估算时长) is left out of
 * the count, so a loop cannot push its own start further along.
 */
export function rankOf(ids: readonly string[], edges: readonly FlowEdge[]): Map<string, number> {
  const known = new Set(ids)
  const next = new Map<string, string[]>(ids.map((id) => [id, []]))
  for (const edge of edges) {
    if (known.has(edge.from) && known.has(edge.to)) next.get(edge.from)?.push(edge.to)
  }

  // Depth-first from every node in list order: an edge to a node still being walked closes a loop.
  const forward = new Map<string, string[]>(ids.map((id) => [id, []]))
  const state = new Map<string, 'open' | 'done'>()
  const walk = (id: string) => {
    state.set(id, 'open')
    for (const to of next.get(id) ?? []) {
      if (state.get(to) === 'open') continue
      forward.get(id)?.push(to)
      if (!state.has(to)) walk(to)
    }
    state.set(id, 'done')
  }
  for (const id of ids) if (!state.has(id)) walk(id)

  const rank = new Map<string, number>()
  const place = (id: string): number => {
    const found = rank.get(id)
    if (found !== undefined) return found
    let column = 0
    for (const [from, targets] of forward) {
      if (targets.includes(id)) column = Math.max(column, place(from) + 1)
    }
    rank.set(id, column)
    return column
  }
  for (const id of ids) place(id)
  return rank
}

/**
 * Flow order: by column, and inside a column by the place in the workflow's
 * list. The canvas tabs through its nodes in this order and 步骤列表 lists
 * them in it.
 */
export function flowOrder(ids: readonly string[], edges: readonly FlowEdge[]): string[] {
  const rank = rankOf(ids, edges)
  return [...ids].sort((a, b) => (rank.get(a) ?? 0) - (rank.get(b) ?? 0) || ids.indexOf(a) - ids.indexOf(b))
}

/**
 * Where each node goes. Columns run along the inline axis, each as wide as
 * its widest node; the nodes of a column are stacked with the gap between
 * them and the column is centred on the tallest one.
 */
export function rankLayout(
  ids: readonly string[],
  edges: readonly FlowEdge[],
  sizes: Readonly<Record<string, Size | undefined>>,
  gap: number,
): Record<string, Point> {
  const rank = rankOf(ids, edges)
  const columns: string[][] = []
  for (const id of ids) (columns[rank.get(id) ?? 0] ??= []).push(id)

  const heightOf = (column: string[]) =>
    column.reduce((sum, id) => sum + (sizes[id]?.height ?? 0), 0) + gap * Math.max(column.length - 1, 0)
  const tallest = Math.max(0, ...columns.map((column) => (column ? heightOf(column) : 0)))

  const positions: Record<string, Point> = {}
  let x = 0
  for (const column of columns) {
    if (!column) continue
    let y = (tallest - heightOf(column)) / 2
    for (const id of column) {
      positions[id] = { x, y }
      y += (sizes[id]?.height ?? 0) + gap
    }
    // Twice the gap between columns: the connectors need room to turn.
    x += Math.max(0, ...column.map((id) => sizes[id]?.width ?? 0)) + gap * 2
  }
  return positions
}
