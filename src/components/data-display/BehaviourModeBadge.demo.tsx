import { DemoGroup } from '@/components/actions/demo-parts'
import { Inline, Stack } from '@/components/layout'
import { useT } from '@/i18n'
import { behaviourModes } from '@/lib/vocab'

import { BehaviourModeBadge } from './BehaviourModeBadge'

export default function BehaviourModeBadgeDemo() {
  const t = useT('feedback')
  return (
    <Stack gap="lg">
      <DemoGroup caption={t('demo.variants')}>
        <Inline>
          {behaviourModes.map((mode) => (
            <BehaviourModeBadge key={mode} mode={mode} />
          ))}
        </Inline>
      </DemoGroup>
      <DemoGroup caption={t('demo.inUse')}>
        <Inline>
          <span className="font-medium">{t('modeBadge.demo.inUse')}</span>
          <BehaviourModeBadge mode="assisted" />
        </Inline>
      </DemoGroup>
      <DemoGroup caption={t('modeBadge.demo.narrow')}>
        <div className="flex w-16 flex-col items-start gap-2 rounded-md border p-1">
          {behaviourModes.map((mode) => (
            <BehaviourModeBadge key={mode} mode={mode} />
          ))}
        </div>
      </DemoGroup>
    </Stack>
  )
}
