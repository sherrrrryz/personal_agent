import { CircleAlert, Info } from 'lucide-react'

import { Stack } from '@/components/layout'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { useT } from '@/i18n'

// The alerts of a demo are on the page from the start, so they carry no live
// role here: `role="alert"` is for one that appears in answer to something.
export default function AlertDemo() {
  const t = useT('feedback')
  return (
    <Stack gap="md">
      <Alert role={undefined}>
        <Info aria-hidden="true" />
        <AlertTitle>{t('alert.demo.title')}</AlertTitle>
        <AlertDescription>{t('alert.demo.body')}</AlertDescription>
      </Alert>
      <Alert role={undefined} variant="destructive">
        <CircleAlert aria-hidden="true" />
        <AlertTitle>{t('alert.demo.dangerTitle')}</AlertTitle>
        <AlertDescription>{t('alert.demo.dangerBody')}</AlertDescription>
      </Alert>
      <Alert role={undefined}>
        <AlertDescription>{t('alert.demo.plain')}</AlertDescription>
      </Alert>
    </Stack>
  )
}
