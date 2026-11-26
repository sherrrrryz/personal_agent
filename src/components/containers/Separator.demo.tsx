import { Stack } from '@/components/layout'
import { Separator } from '@/components/ui/separator'
import { useT } from '@/i18n'

export default function SeparatorDemo() {
  const t = useT('navigation')
  return (
    <Stack gap="md">
      <Stack gap="sm">
        <p>{t('demo.separator.above')}</p>
        <Separator />
        <p>{t('demo.separator.below')}</p>
      </Stack>
      <div className="flex items-center gap-3">
        <span>{t('demo.separator.start')}</span>
        <Separator orientation="vertical" />
        <span>{t('demo.separator.end')}</span>
      </div>
    </Stack>
  )
}
