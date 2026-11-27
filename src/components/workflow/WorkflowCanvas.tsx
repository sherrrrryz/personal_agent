import {
  MarkerType,
  ReactFlow,
  ReactFlowProvider,
  useReactFlow,
  type Edge,
  type Node,
  type NodeProps,
  type OnNodesChange,
} from '@xyflow/react'
import { MaximizeIcon, ZoomInIcon, ZoomOutIcon } from 'lucide-react'
import { useCallback, useEffect, useId, useMemo, useRef, useState, type KeyboardEvent } from 'react'

// The library's own stylesheet, from the package (D-16) — then ours, which only points its variables at tokens.
import '@xyflow/react/base.css'
import './flow.css'

import { Button } from '@/components/actions'
import { focusRing } from '@/components/actions/focus-ring'
import { useT } from '@/i18n'
import { behaviourMode, changeKind } from '@/lib/vocab'

import { rankLayout, type Size } from './layout'
import { diffChange, type WorkflowDiff } from './node-kinds'
import { WorkflowHandle } from './WorkflowHandle'
import { WorkflowNode, type WorkflowNodeProps } from './WorkflowNode'

export type WorkflowCanvasNode = Omit<WorkflowNodeProps, 'selected' | 'action' | 'connectsId'> & { id: string }
export type WorkflowCanvasEdge = { id: string; from: string; to: string; diff?: WorkflowDiff }

export type WorkflowCanvasProps = {
  /** The nodes **in flow order** (`flowOrder`): the canvas tabs through them in the order given. */
  nodes: readonly WorkflowCanvasNode[]
  edges: readonly WorkflowCanvasEdge[]
  /**
   * `view`: the workflow as it is. `diff`: a comparison — every node and edge
   * carries its `diff`: a marked node shows a `ChangeMarker` and a border of
   * its own style and ends its name with the change; a marked connector is
   * dashed and carries the same word (`flow.css`).
   */
  mode?: 'view' | 'diff'
  /** The node shown as selected. */
  selectedId?: string | null
  /** A node to bring to the middle of the view once the canvas is laid out — the `?node=` deep link. */
  revealId?: string | null
  /** A node was pressed, or Enter or Space was pressed on it. */
  onOpenNode?: (id: string) => void
}

type FlowNode = Node<WorkflowCanvasNode & { connectsId: string }, 'workflow'>

/** The library's node wrapper around ours: the two connection points and the card, at the node width. */
function CanvasNode({ data, selected }: NodeProps<FlowNode>) {
  const { id: _id, ...node } = data
  return (
    <div className="w-56">
      <WorkflowHandle type="target" />
      <WorkflowNode {...node} selected={selected} />
      <WorkflowHandle type="source" />
    </div>
  )
}

const nodeTypes = { workflow: CanvasNode }
const origin = { x: 0, y: 0 }
// The library's id of the text every node is described by (its `A11yDescriptions`).
const describedBy = (flowId: string) => `react-flow__node-desc-${flowId}`

/**
 * The node canvas of the workflow editor, on `@xyflow/react` (D-16): pan and
 * zoom only. Nodes cannot be dragged, connected or deleted (D-10) — they are
 * read, and opened to be adjusted.
 *
 * Keyboard: Tab goes through the nodes in the order given, then — past the
 * library's own attribution link, which stays: hiding it asks for a paid plan
 * — to the three zoom buttons and on; a focused node off-screen is panned into view (the
 * library's); Enter or Space on a node calls `onOpenNode`. Connectors take no
 * focus: each node says in words what it leads to.
 */
export function WorkflowCanvas(props: WorkflowCanvasProps) {
  return (
    <ReactFlowProvider>
      <Canvas {...props} />
    </ReactFlowProvider>
  )
}

function Canvas({ nodes, edges, mode = 'view', selectedId = null, revealId = null, onOpenNode }: WorkflowCanvasProps) {
  const t = useT('workflow')
  const common = useT('common')
  const flowId = useId()
  const flow = useReactFlow()
  const probe = useRef<HTMLDivElement>(null)
  const [sizes, setSizes] = useState<Record<string, Size>>({})
  const [gap, setGap] = useState(0)

  const onNodesChange: OnNodesChange<FlowNode> = (changes) => {
    const measured = changes.getByType('dimensions').filter((change) => change.dimensions)
    if (measured.length === 0) return
    // The gap is a step of the spacing scale, read from a box that is drawn with it.
    setGap(probe.current?.offsetWidth ?? 0)
    setSizes((previous) => {
      const next = { ...previous }
      let changed = false
      for (const { id, dimensions } of measured) {
        if (!dimensions) continue
        if (next[id]?.width === dimensions.width && next[id]?.height === dimensions.height) continue
        next[id] = { width: dimensions.width, height: dimensions.height }
        changed = true
      }
      return changed ? next : previous
    })
  }

  const ready = nodes.every((node) => sizes[node.id] !== undefined)
  // What the layout depends on, as a string: a new position is computed only when one of these changes.
  const layoutKey = ready
    ? [gap, ...nodes.map((node) => `${node.id}:${sizes[node.id].width}x${sizes[node.id].height}`), ...edges.map((edge) => edge.id)].join('|')
    : null
  const positions = useMemo(
    () => (layoutKey === null ? null : rankLayout(nodes.map((node) => node.id), edges, sizes, gap)),
    // `layoutKey` stands for the four values it is built from.
    // oxlint-disable-next-line react-hooks/exhaustive-deps
    [layoutKey],
  )

  // In a comparison the node's name ends with what happened to it, and a marked connector carries the same word.
  const diffWord = useCallback((diff: WorkflowDiff | undefined) => (diff && diff !== 'none' ? common(changeKind[diffChange[diff]].labelKey) : null), [common])
  const withDiff = useCallback(
    (name: string, diff: WorkflowDiff | undefined) => {
      const change = diffWord(diff)
      return change ? t('node.name.diff', { name, change }) : name
    },
    [diffWord, t],
  )

  const flowNodes = useMemo<FlowNode[]>(
    () =>
      nodes.map((node) => {
        const connectsId = `${flowId}-${node.id}-connects`
        const kind = t(`kind.${node.kind}`)
        return {
          id: node.id,
          type: 'workflow' as const,
          position: positions?.[node.id] ?? origin,
          measured: sizes[node.id],
          data: { ...node, connectsId },
          selected: node.id === selectedId,
          className: `rounded-xl ${focusRing}`,
          ariaLabel: withDiff(
            node.mode === undefined
              ? t('node.name', { kind, label: node.label })
              : t('node.name.mode', { kind, label: node.label, mode: common(behaviourMode[node.mode].nameKey) }),
            node.diff,
          ),
          domAttributes: {
            'aria-describedby': node.connectsTo?.length ? `${describedBy(flowId)} ${connectsId}` : describedBy(flowId),
            'aria-current': node.id === selectedId ? ('true' as const) : undefined,
          },
        }
      }),
    [nodes, positions, sizes, selectedId, flowId, t, common, withDiff],
  )

  const flowEdges = useMemo<Edge[]>(
    () =>
      edges.map((edge) => ({
        id: edge.id,
        source: edge.from,
        target: edge.to,
        markerEnd: { type: MarkerType.ArrowClosed },
        focusable: false,
        selectable: false,
        className: edge.diff && edge.diff !== 'none' ? `workflow-edge-${edge.diff}` : undefined,
        label: diffWord(edge.diff) ?? undefined,
      })),
    [edges, diffWord],
  )

  // Once laid out — and again when the layout changes: the whole flow in view, or the node asked for in the middle.
  useEffect(() => {
    if (positions === null) return
    const target = revealId ? positions[revealId] : undefined
    const size = revealId ? sizes[revealId] : undefined
    if (target && size) void flow.setCenter(target.x + size.width / 2, target.y + size.height / 2, { zoom: 1 })
    else void flow.fitView(fitOptions)
    // `positions` changes exactly when the layout does; `sizes` and `flow` are read, not followed.
    // oxlint-disable-next-line react-hooks/exhaustive-deps
  }, [positions, revealId])

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key !== 'Enter' && event.key !== ' ') return
    // Only a key pressed on the node itself: a link inside it keeps its own Enter.
    const target = event.target as HTMLElement
    if (!target.classList.contains('react-flow__node')) return
    event.preventDefault()
    if (target.dataset.id) onOpenNode?.(target.dataset.id)
  }

  return (
    <section aria-label={t('canvas.label')} className="flex min-w-0 flex-col gap-2" data-slot="workflow-canvas" data-mode={mode}>
      {/* The box the flow pans inside (spec part 3 § Responsive): what is panned out of it is cut off by design. */}
      {/* oxlint-disable-next-line jsx-a11y/no-static-element-interactions -- the keys belong to the focusable nodes inside */}
      <div
        className={`relative h-120 max-h-dvh min-w-0 rounded-xl border ${positions === null ? 'invisible' : ''}`}
        data-slot="workflow-canvas-view"
        data-matrix-allow="clip"
        onKeyDown={onKeyDown}
      >
        <div ref={probe} aria-hidden="true" className="invisible absolute size-8" />
        <ReactFlow<FlowNode>
          id={flowId}
          aria-label={t('canvas.label')}
          nodes={flowNodes}
          edges={flowEdges}
          nodeTypes={nodeTypes}
          onNodesChange={onNodesChange}
          onNodeClick={(event, node) => {
            if (!(event.target as HTMLElement).closest('a')) onOpenNode?.(node.id)
          }}
          nodesDraggable={false}
          nodesConnectable={false}
          nodesFocusable
          edgesFocusable={false}
          edgesReconnectable={false}
          elementsSelectable={false}
          deleteKeyCode={null}
          selectionKeyCode={null}
          multiSelectionKeyCode={null}
          zoomOnDoubleClick={false}
          // The wheel scrolls the page, never the canvas: zooming is the buttons' (and a pinch).
          zoomOnScroll={false}
          preventScrolling={false}
          minZoom={zoomRange.min}
          maxZoom={zoomRange.max}
          ariaLabelConfig={{
            'node.a11yDescription.default': t('canvas.nodeHint'),
            'node.a11yDescription.keyboardDisabled': t('canvas.nodeHint'),
            'handle.ariaLabel': t('canvas.handle'),
          }}
        />
      </div>
      <div role="group" aria-label={t('canvas.zoom.label')} className="flex flex-wrap gap-2">
        <Button variant="secondary" size="sm" onClick={() => void flow.zoomIn()}>
          <ZoomInIcon aria-hidden="true" />
          {t('canvas.zoomIn')}
        </Button>
        <Button variant="secondary" size="sm" onClick={() => void flow.zoomOut()}>
          <ZoomOutIcon aria-hidden="true" />
          {t('canvas.zoomOut')}
        </Button>
        <Button variant="secondary" size="sm" onClick={() => void flow.fitView(fitOptions)}>
          <MaximizeIcon aria-hidden="true" />
          {t('canvas.fit')}
        </Button>
      </div>
    </section>
  )
}

// Zoom factors, not sizes: how far the view may be scaled. Fitting shows the whole flow and never enlarges it
// past its own size; a workflow too long to read at that scale is zoomed and panned, or read in 步骤列表.
const zoomRange = { min: 0.2, max: 2 }
const fitOptions = { minZoom: zoomRange.min, maxZoom: 1 }
