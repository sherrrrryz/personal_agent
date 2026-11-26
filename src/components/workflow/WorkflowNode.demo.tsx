import { DemoGroup } from '@/components/actions/demo-parts'
import { Grid, Stack } from '@/components/layout'
import { useT } from '@/i18n'

import { WorkflowNode } from './WorkflowNode'

/** The seven kinds, each with what it holds; then the selected state and an action held back by a ceiling. */
export default function WorkflowNodeDemo() {
  const t = useT('workflow')
  return (
    <Stack gap="lg">
      <DemoGroup caption={t('demo.kinds.caption')}>
        <Grid min="sm" gap="md">
          <WorkflowNode kind="trigger" label={t('demo.node.trigger')} lines={[t('trigger.schedule'), t('demo.node.trigger.rule')]} connectsTo={[t('demo.node.condition')]} />
          <WorkflowNode
            kind="source"
            label={t('demo.node.source')}
            lines={[t('demo.node.source.line')]}
            links={[{ href: '/dev/components', label: t('demo.node.source.link') }]}
            connectsTo={[t('demo.node.step')]}
          />
          <WorkflowNode kind="step" label={t('demo.node.step')} lines={[t('demo.node.step.line')]} connectsTo={[t('demo.node.action')]} />
          <WorkflowNode kind="condition" label={t('demo.node.condition')} lines={[t('demo.node.condition.line')]} />
          <WorkflowNode kind="action" label={t('demo.node.action')} lines={[t('demo.node.action.line')]} mode="autonomous" />
          <WorkflowNode
            kind="output"
            label={t('demo.node.output')}
            lines={[t('demo.node.output.line')]}
            links={[{ href: '/dev/components', label: t('demo.node.output.link') }]}
          />
          <WorkflowNode
            kind="memory"
            label={t('demo.node.memory')}
            lines={[t('demo.node.memory.line')]}
            links={[{ href: '/dev/components', label: t('demo.node.memory.link') }]}
          />
        </Grid>
      </DemoGroup>
      <DemoGroup caption={t('demo.selected.caption')}>
        <Grid min="sm" gap="md">
          <WorkflowNode kind="step" label={t('demo.node.step')} lines={[t('demo.node.step.line')]} selected />
          <WorkflowNode kind="action" label={t('demo.node.action')} lines={[t('demo.node.action.line')]} mode="assisted" capped />
        </Grid>
      </DemoGroup>
    </Stack>
  )
}
