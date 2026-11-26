import { Stack } from '@/components/layout'
import { Progress, ProgressLabel, ProgressValue } from '@/components/ui/progress'
import { useLocale, useT } from '@/i18n'

export default function ProgressDemo() {
  const t = useT('feedback')
  const { locale } = useLocale()
  return (
    <Stack gap="lg">
      <Progress value={2} max={3} locale={locale}>
        <ProgressLabel>{t('progress.demo.label')}</ProgressLabel>
        <ProgressValue />
      </Progress>
      <Progress value={80} locale={locale}>
        <ProgressLabel>{t('progress.demo.done')}</ProgressLabel>
        <ProgressValue />
      </Progress>
      <Progress value={null}>
        <ProgressLabel>{t('progress.demo.indeterminate')}</ProgressLabel>
      </Progress>
    </Stack>
  )
}
