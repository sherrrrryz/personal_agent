import { Stack } from '@/components/layout'
import { useT } from '@/i18n'

import { LocaleSelect } from './LocaleSelect'

export default function LocaleSelectDemo() {
  const t = useT('navigation')
  return (
    <Stack gap="sm">
      <LocaleSelect />
      <p className="text-sm text-muted-foreground">{t('demo.locale.note')}</p>
    </Stack>
  )
}
