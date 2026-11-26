import { DemoGroup } from '@/components/actions/demo-parts'
import { Inline, Stack } from '@/components/layout'
import { useT } from '@/i18n'
import { changeKinds } from '@/lib/vocab'

import { ChangeMarker } from './ChangeMarker'

export default function ChangeMarkerDemo() {
  const t = useT('feedback')
  return (
    <Stack gap="lg">
      <DemoGroup caption={t('demo.variants')}>
        <Inline>
          {changeKinds.map((kind) => (
            <ChangeMarker key={kind} kind={kind} />
          ))}
        </Inline>
      </DemoGroup>
      <DemoGroup caption={t('demo.inUse')}>
        <Inline>
          <span className="font-medium">{t('changeMarker.demo.item')}</span>
          <ChangeMarker kind="updated" />
        </Inline>
      </DemoGroup>
    </Stack>
  )
}
