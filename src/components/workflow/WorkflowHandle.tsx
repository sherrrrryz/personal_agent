import { Handle, Position } from '@xyflow/react'

export type WorkflowHandleProps = {
  /** `target`: where connectors arrive, on the node's start edge. `source`: where they leave, on its end edge. */
  type: 'target' | 'source'
}

/**
 * The point on a node's edge a connector is drawn to — the library's
 * `Handle`, as the library draws it (D-16). It is a mark, not a control:
 * nothing can be connected in this editor (D-10), so it takes no pointer, no
 * focus and is hidden from assistive technology. What a node leads to is
 * said in words by the node itself.
 *
 * Only for a node inside `WorkflowCanvas`: the library's handle needs its flow.
 */
export function WorkflowHandle({ type }: WorkflowHandleProps) {
  return (
    <Handle
      type={type}
      position={type === 'target' ? Position.Left : Position.Right}
      isConnectable={false}
      aria-hidden="true"
      data-slot="workflow-handle"
    />
  )
}
