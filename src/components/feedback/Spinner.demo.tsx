import { DemoGroup } from '@/components/actions/demo-parts'
import { Stack } from '@/components/layout'
import { Spinner } from '@/components/ui/spinner'
import { useT } from '@/i18n'

export default function SpinnerDemo() {
  const t = useT('feedback')
  return (
    <Stack gap="lg">
      <DemoGroup caption={t('spinner.demo.named')}>
        <Spinner aria-label={t('spinner.demo.label')} />
      </DemoGroup>
      <DemoGroup caption={t('spinner.demo.beside')}>
        <p className="flex items-center gap-2">
          <Spinner role={undefined} aria-hidden="true" className="shrink-0" />
          {t('spinner.demo.text')}
        </p>
      </DemoGroup>
    </Stack>
  )
}
