import { useState } from 'react'

import { DemoGroup } from '@/components/actions/demo-parts'
import { useT } from '@/i18n'

import { WorkflowCanvas, type WorkflowCanvasNode } from './WorkflowCanvas'

const edges = [
  { id: 'trigger>source', from: 'trigger', to: 'source' },
  { id: 'source>step', from: 'source', to: 'step' },
  { id: 'step>action', from: 'step', to: 'action' },
]

/** Four nodes in flow order, with their connection points (`WorkflowHandle`) and the three zoom buttons. */
export default function WorkflowCanvasDemo() {
  const t = useT('workflow')
  const [opened, setOpened] = useState<string | null>(null)
  const nodes: WorkflowCanvasNode[] = [
    { id: 'trigger', kind: 'trigger', label: t('demo.node.trigger'), lines: [t('demo.node.trigger.rule')], connectsTo: [t('demo.node.source')] },
    { id: 'source', kind: 'source', label: t('demo.node.source'), lines: [t('demo.node.source.line')], connectsTo: [t('demo.node.step')] },
    { id: 'step', kind: 'step', label: t('demo.node.step'), lines: [t('demo.node.step.line')], connectsTo: [t('demo.node.action')] },
    { id: 'action', kind: 'action', label: t('demo.node.action'), lines: [t('demo.node.action.line')], mode: 'autonomous' },
  ]
  const name = nodes.find((node) => node.id === opened)?.label
  return (
    <DemoGroup caption={t('demo.canvas.caption')}>
      <WorkflowCanvas nodes={nodes} edges={edges} selectedId={opened} onOpenNode={setOpened} />
      <p role="status">{name ? t('demo.canvas.opened', { name }) : t('demo.canvas.none')}</p>
    </DemoGroup>
  )
}
