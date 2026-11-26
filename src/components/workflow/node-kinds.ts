/** The seven kinds of node a workflow is made of (D-10). */
export const workflowNodeKinds = ['trigger', 'source', 'step', 'condition', 'action', 'output', 'memory'] as const
export type WorkflowNodeKind = (typeof workflowNodeKinds)[number]

/**
 * What a comparison says about a node or a connector. C3 only carries it
 * (`data-diff`); package C6 draws it — a `ChangeMarker` and a border style.
 */
export type WorkflowDiff = 'added' | 'changed' | 'none'
