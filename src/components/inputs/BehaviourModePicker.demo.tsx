import { useState } from 'react'

import { Stack } from '@/components/layout'
import { useT } from '@/i18n'
import type { BehaviourMode } from '@/lib/vocab'

import { BehaviourModePicker } from './BehaviourModePicker'

export default function BehaviourModePickerDemo() {
  const t = useT('inputs')
  const [setting, setSetting] = useState<BehaviourMode | 'unset'>('unset')
  const [mode, setMode] = useState<BehaviourMode>('autonomous')
  return (
    <Stack gap="lg">
      {/* As on the settings screen: the three modes and "not set". */}
      <BehaviourModePicker
        legend={t('modePicker.demo.free')}
        description={t('modePicker.demo.freeHelp')}
        extraOptions={[{ value: 'unset', label: t('modePicker.demo.unset'), description: t('modePicker.demo.unsetHelp') }]}
        value={setting}
        onValueChange={setSetting}
      />
      {/* Under a ceiling: the value above it is shown as the ceiling, and the reason is text. */}
      <BehaviourModePicker
        legend={t('modePicker.demo.capped')}
        description={t('modePicker.demo.cappedHelp')}
        ceiling="assisted"
        value={mode}
        onValueChange={setMode}
      />
      <BehaviourModePicker
        legend={t('modePicker.demo.lowest')}
        ceiling="deferred"
        defaultValue="assisted"
        error={t('modePicker.demo.error')}
      />
      <BehaviourModePicker legend={t('modePicker.demo.disabled')} defaultValue="autonomous" disabled />
    </Stack>
  )
}
