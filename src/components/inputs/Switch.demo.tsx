import { Stack } from '@/components/layout'
import { useT } from '@/i18n'

import { Switch } from './Switch'

export default function SwitchDemo() {
  const t = useT('inputs')
  return (
    <Stack gap="sm">
      <Switch label={t('switch.demo.label')} description={t('switch.demo.help')} defaultChecked />
      <Switch label={t('field.demo.long')} />
      <Switch label={t('switch.demo.disabled')} disabled />
      <Switch label={t('switch.demo.readOnly')} readOnly defaultChecked />
    </Stack>
  )
}
