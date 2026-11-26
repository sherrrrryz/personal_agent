import { useEffect, useRef } from 'react'

import { Button } from '@/components/actions'
import { WorkflowNode, type WorkflowCanvasNode } from '@/components/workflow'
import { useT } from '@/i18n'

export type StepListProps = {
  /** The same nodes the canvas gets, in the same (flow) order. */
  nodes: readonly WorkflowCanvasNode[]
  selectedId?: string | null
  /** A step to scroll into view when the list appears — the `?node=` deep link. */
  revealId?: string | null
  onOpenNode: (id: string) => void
}

/**
 * 步骤列表 — the workflow as an ordered list (spec part 3 § Accessibility):
 * the canvas's equal for a screen reader and for reading top to bottom. Every
 * item is the node itself, drawn by the same `WorkflowNode` with the same
 * words, and a button with the node's name that opens the same inspector.
 * What a step leads to is its last line, as on the canvas.
 */
export function StepList({ nodes, selectedId = null, revealId = null, onOpenNode }: StepListProps) {
  const t = useT('workflow')
  const list = useRef<HTMLOListElement>(null)

  useEffect(() => {
    if (!revealId) return
    list.current?.querySelector(`[data-step="${CSS.escape(revealId)}"]`)?.scrollIntoView({ block: 'center' })
  }, [revealId])

  return (
    <ol ref={list} aria-label={t('list.label')} className="flex min-w-0 flex-col gap-3" data-slot="workflow-step-list">
      {nodes.map(({ id, ...node }) => {
        const kind = t(`kind.${node.kind}`)
        return (
          <li key={id} data-step={id} aria-current={id === selectedId ? 'true' : undefined} className="min-w-0">
            <WorkflowNode
              {...node}
              selected={id === selectedId}
              action={
                <Button
                  variant="secondary"
                  size="sm"
                  aria-label={t('list.open.name', { name: t('node.name', { kind, label: node.label }) })}
                  data-step-open={id}
                  onClick={() => onOpenNode(id)}
                >
                  {t('list.open')}
                </Button>
              }
            />
          </li>
        )
      })}
    </ol>
  )
}
