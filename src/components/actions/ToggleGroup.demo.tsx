import { Stack } from '@/components/layout'
import { useT } from '@/i18n'

import { DemoGroup } from './demo-parts'
import { ToggleGroup, ToggleGroupItem } from './ToggleGroup'

export default function ToggleGroupDemo() {
  const t = useT('inputs')
  return (
    <Stack gap="lg">
      <DemoGroup caption={t('toggleGroup.demo.view')}>
        <ToggleGroup aria-label={t('toggleGroup.demo.view')} defaultValue="week" required>
          <ToggleGroupItem value="day">{t('toggleGroup.demo.day')}</ToggleGroupItem>
          <ToggleGroupItem value="week">{t('toggleGroup.demo.week')}</ToggleGroupItem>
          <ToggleGroupItem value="month">{t('toggleGroup.demo.month')}</ToggleGroupItem>
        </ToggleGroup>
      </DemoGroup>
      <DemoGroup caption={t('toggleGroup.demo.days')}>
        <ToggleGroup aria-label={t('toggleGroup.demo.days')} multiple defaultValue={['weekdays', 'saturday']}>
          <ToggleGroupItem value="weekdays">{t('toggleGroup.demo.weekdays')}</ToggleGroupItem>
          <ToggleGroupItem value="saturday">{t('toggleGroup.demo.saturday')}</ToggleGroupItem>
          <ToggleGroupItem value="sunday">{t('toggleGroup.demo.sunday')}</ToggleGroupItem>
          <ToggleGroupItem value="never" disabled>
            {t('button.demo.disabled')}
          </ToggleGroupItem>
        </ToggleGroup>
      </DemoGroup>
    </Stack>
  )
}
