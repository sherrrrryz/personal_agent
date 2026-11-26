import { Button } from '@/components/actions'
import { Field, Input } from '@/components/inputs'
import { Inline, Stack } from '@/components/layout'
import { useT } from '@/i18n'

import { Dialog } from './Dialog'

export default function DialogDemo() {
  const t = useT('navigation')
  return (
    <Inline>
      <Dialog
        trigger={<Button variant="secondary">{t('demo.dialog.open')}</Button>}
        title={t('demo.dialog.title')}
        description={t('demo.dialog.description')}
        footer={
          <>
            <Button variant="ghost">{t('demo.dialog.later')}</Button>
            <Button>{t('demo.dialog.confirm')}</Button>
          </>
        }
      >
        <Stack gap="md">
          <p>{t('demo.dialog.body')}</p>
          <Field label={t('demo.dialog.field')}>
            <Input />
          </Field>
        </Stack>
      </Dialog>
      <Dialog trigger={<Button variant="secondary">{t('demo.dialog.long')}</Button>} title={t('demo.dialog.longTitle')}>
        <Stack gap="md">
          {Array.from({ length: 8 }, (_, index) => (
            <p key={index}>{t('demo.dialog.paragraph')}</p>
          ))}
        </Stack>
      </Dialog>
    </Inline>
  )
}
