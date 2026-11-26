import { Stack } from '@/components/layout'
import { useT } from '@/i18n'

import { Field } from './Field'
import { Input } from './Input'

export default function FieldDemo() {
  const t = useT('inputs')
  return (
    <Stack gap="lg">
      <Field label={t('field.demo.name')} description={t('field.demo.nameHelp')}>
        <Input placeholder={t('field.demo.placeholder')} />
      </Field>
      <Field label={t('field.demo.phone')} error={t('field.demo.phoneError')}>
        <Input type="tel" defaultValue="5555" />
      </Field>
      <Field label={t('field.demo.long')} description={t('field.demo.nameHelp')}>
        <Input />
      </Field>
    </Stack>
  )
}
