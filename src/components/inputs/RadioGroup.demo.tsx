import { Stack } from '@/components/layout'
import { useT } from '@/i18n'

import { RadioGroup } from './RadioGroup'

export default function RadioGroupDemo() {
  const t = useT('inputs')
  const options = [
    { value: 'short', label: t('radio.demo.short'), description: t('radio.demo.shortHelp') },
    { value: 'long', label: t('radio.demo.long'), description: t('radio.demo.longHelp') },
    { value: 'unknown', label: t('radio.demo.unknown'), disabled: true },
  ] as const
  return (
    <Stack gap="lg">
      <RadioGroup legend={t('radio.demo.legend')} description={t('radio.demo.help')} options={options} defaultValue="short" />
      <RadioGroup legend={t('field.demo.long')} options={options} error={t('radio.demo.error')} />
      <RadioGroup legend={t('switch.demo.disabled')} options={options} defaultValue="long" disabled />
    </Stack>
  )
}
