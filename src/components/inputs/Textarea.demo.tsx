import { Stack } from '@/components/layout'
import { useT } from '@/i18n'

import { Field } from './Field'
import { Textarea } from './Textarea'

export default function TextareaDemo() {
  const t = useT('inputs')
  return (
    <Stack gap="lg">
      <Field label={t('field.demo.notes')} description={t('field.demo.notesHelp')}>
        <Textarea defaultValue={t('field.demo.notesValue')} />
      </Field>
      <Field label={t('field.demo.notes')} error={t('field.demo.phoneError')}>
        <Textarea />
      </Field>
      <Field label={t('field.demo.readOnly')}>
        <Textarea readOnly defaultValue={t('field.demo.notesValue')} />
      </Field>
      <Field label={t('field.demo.disabled')} disabled>
        <Textarea />
      </Field>
    </Stack>
  )
}
