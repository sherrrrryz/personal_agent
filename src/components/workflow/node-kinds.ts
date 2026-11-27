/** The seven kinds of node a workflow is made of (D-10). */
export const workflowNodeKinds = ['trigger', 'source', 'step', 'condition', 'action', 'output', 'memory'] as const
export type WorkflowNodeKind = (typeof workflowNodeKinds)[number]

/**
 * What a comparison says about a node or a connector (`mode: diff`): drawn as
 * a `ChangeMarker` and a border style on a node, as the marker's word and a
 * dashed line on a connector.
 */
export type WorkflowDiff = 'added' | 'changed' | 'none'

/** The word a compared node or connector carries, as a kind of the shared change vocabulary. */
export const diffChange = { added: 'new', changed: 'updated' } as const
