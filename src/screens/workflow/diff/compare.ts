import type { WorkflowDiff } from '@/components/workflow'
import { versionOf, type WfEdge, type WfNode, type Workflow } from '@/runtime'

import type { EditorDiff, EditorShown } from '../slots'

// What a comparison of two versions of a workflow finds (spec part 3
// § Workflow editor, "Diff"). A node or a connector is the same thing in both
// versions when it has the same id; it is `changed` when anything it holds
// differs.

type Graph = { nodes: readonly WfNode[]; edges: readonly WfEdge[] }

export type Comparison = {
  /** The version the marks are measured against, and the one that is shown. */
  base: Graph & { n: number }
  target: Graph & { n: number | 'proposed' }
}

/** The version before `n` — the highest lower number — or `null` for the first. */
export function previousOf(workflow: Workflow, n: number): number | null {
  const lower = workflow.versions.map((version) => version.n).filter((each) => each < n)
  return lower.length > 0 ? Math.max(...lower) : null
}

/** The number of the version `shown` puts on screen; the version in force for `null` and for a draft that is gone. */
export function shownNumber(workflow: Workflow, shown: EditorShown): number {
  return typeof shown.version === 'number' && workflow.versions.some((version) => version.n === shown.version) ? shown.version : workflow.current
}

/** Whether `shown` is the change waiting for approval — and that change still exists. */
export const showsProposal = (workflow: Workflow, shown: EditorShown): boolean => shown.version === 'proposed' && workflow.proposed !== undefined

/** The two versions `shown` compares, or `null` when it compares nothing. */
export function comparisonOf(workflow: Workflow, shown: EditorShown): Comparison | null {
  if (showsProposal(workflow, shown) && workflow.proposed) {
    return { base: versionOf(workflow), target: { n: 'proposed', nodes: workflow.proposed.nodes, edges: workflow.proposed.edges } }
  }
  if (shown.compareTo === null || !workflow.versions.some((version) => version.n === shown.compareTo)) return null
  return { base: versionOf(workflow, shown.compareTo), target: versionOf(workflow, shownNumber(workflow, shown)) }
}

const same = (one: unknown, other: unknown) => JSON.stringify(one) === JSON.stringify(other)

function marks<Item extends { id: string }>(base: readonly Item[], target: readonly Item[]): Record<string, WorkflowDiff> {
  const before = new Map(base.map((item) => [item.id, item]))
  const found: Record<string, WorkflowDiff> = {}
  for (const item of target) {
    const earlier = before.get(item.id)
    if (!earlier) found[item.id] = 'added'
    else if (!same(earlier, item)) found[item.id] = 'changed'
  }
  return found
}

/** The marks of the nodes and connectors of the shown version: exactly the added and the changed ones. */
export function diffOf(workflow: Workflow, shown: EditorShown): EditorDiff {
  const comparison = comparisonOf(workflow, shown)
  if (!comparison) return { nodes: {}, edges: {} }
  return { nodes: marks(comparison.base.nodes, comparison.target.nodes), edges: marks(comparison.base.edges, comparison.target.edges) }
}

export type Change =
  | { what: 'node'; change: 'added' | 'changed' | 'removed'; node: WfNode }
  | { what: 'edge'; change: 'added' | 'changed' | 'removed'; edge: WfEdge; from: WfNode | undefined; to: WfNode | undefined }

/** Every difference in the order 变更摘要 lists it: nodes, then connectors; added, changed, removed. */
export function changesOf({ base, target }: Comparison): Change[] {
  const nodeMarks = marks(base.nodes, target.nodes)
  const edgeMarks = marks(base.edges, target.edges)
  const nodeOf = (graph: Graph, id: string) => graph.nodes.find((node) => node.id === id)
  const edgeChange = (graph: Graph, edge: WfEdge, change: 'added' | 'changed' | 'removed'): Change => ({
    what: 'edge',
    change,
    edge,
    from: nodeOf(graph, edge.from),
    to: nodeOf(graph, edge.to),
  })
  const order = { added: 0, changed: 1, removed: 2 }
  const nodes: Change[] = [
    ...target.nodes.flatMap((node): Change[] => {
      const mark = nodeMarks[node.id]
      return mark === 'added' || mark === 'changed' ? [{ what: 'node', change: mark, node }] : []
    }),
    ...base.nodes.filter((node) => !nodeOf(target, node.id)).map((node): Change => ({ what: 'node', change: 'removed', node })),
  ]
  const edges: Change[] = [
    ...target.edges.flatMap((edge) => {
      const mark = edgeMarks[edge.id]
      return mark === 'added' || mark === 'changed' ? [edgeChange(target, edge, mark)] : []
    }),
    ...base.edges.filter((edge) => !target.edges.some((each) => each.id === edge.id)).map((edge) => edgeChange(base, edge, 'removed')),
  ]
  const byChange = (one: Change, other: Change) => order[one.change] - order[other.change]
  return [...nodes.sort(byChange), ...edges.sort(byChange)]
}
