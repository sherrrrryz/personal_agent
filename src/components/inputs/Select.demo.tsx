import { useState } from 'react'

import { Stack } from '@/components/layout'
import { useT } from '@/i18n'

import { Field } from './Field'
import { Select } from './Select'

type Service = 'bath' | 'full' | 'nails' | 'teeth'

export default function SelectDemo() {
  const t = useT('inputs')
  const [service, setService] = useState<Service>('full')
  const options = [
    { value: 'bath', label: t('select.demo.bath') },
    { value: 'full', label: t('select.demo.full') },
    { value: 'nails', label: t('select.demo.nails') },
    { value: 'teeth', label: t('select.demo.unavailable'), disabled: true },
  ] as const
  return (
    <Stack gap="lg">
      <Field label={t('select.demo.label')} description={t('field.demo.nameHelp')}>
        <Select options={options} value={service} onValueChange={setService} />
      </Field>
      <Field label={t('select.demo.label')} error={t('select.demo.error')}>
        <Select options={options} placeholder={t('select.demo.placeholder')} />
      </Field>
      <Field label={t('select.demo.label')} disabled>
        <Select options={options} defaultValue="bath" />
      </Field>
      <Field label={t('select.demo.label')}>
        <Select options={options} defaultValue="nails" readOnly />
      </Field>
    </Stack>
  )
}
