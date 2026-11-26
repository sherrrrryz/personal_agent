import { DemoGroup, DemoSurfaces } from '@/components/actions/demo-parts'
import { Stack } from '@/components/layout'
import { useT } from '@/i18n'

import { Field } from './Field'
import { Input } from './Input'

export default function InputDemo() {
  const t = useT('inputs')
  return (
    <Stack gap="lg">
      <DemoGroup caption={t('demo.states')}>
        <Field label={t('field.demo.name')}>
          <Input placeholder={t('field.demo.placeholder')} />
        </Field>
        <Field label={t('field.demo.disabled')} disabled>
          <Input defaultValue="0142" />
        </Field>
        <Field label={t('field.demo.phone')} error={t('field.demo.phoneError')}>
          <Input type="tel" defaultValue="5555" />
        </Field>
        <Field label={t('field.demo.readOnly')}>
          <Input readOnly defaultValue={t('field.demo.readOnlyValue')} />
        </Field>
      </DemoGroup>
      <DemoGroup caption={t('demo.surfaces')}>
        <DemoSurfaces>
          {() => (
            <Field label={t('field.demo.name')}>
              <Input />
            </Field>
          )}
        </DemoSurfaces>
      </DemoGroup>
    </Stack>
  )
}
