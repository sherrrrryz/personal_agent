import { useState } from 'react'

import { Button } from '@/components/actions'
import { Stack } from '@/components/layout'
import { useT } from '@/i18n'

import { AlertDialog } from './AlertDialog'

export default function AlertDialogDemo() {
  const t = useT('navigation')
  const [count, setCount] = useState(0)
  return (
    <Stack gap="sm">
      <div className="flex">
        <AlertDialog
          trigger={<Button variant="danger">{t('demo.alert.open')}</Button>}
          title={t('demo.alert.title')}
          description={t('demo.alert.description')}
          confirmLabel={t('demo.alert.confirm')}
          confirmVariant="danger"
          onConfirm={() => setCount((before) => before + 1)}
        />
      </div>
      <p className="text-sm text-muted-foreground">{t('demo.alert.result', { count })}</p>
    </Stack>
  )
}
