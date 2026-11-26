import { Check } from 'lucide-react'

import { DemoGroup } from '@/components/actions/demo-parts'
import { Inline, Stack } from '@/components/layout'
import { Badge } from '@/components/ui/badge'
import { useT } from '@/i18n'

export default function BadgeDemo() {
  const t = useT('feedback')
  return (
    <Stack gap="lg">
      <DemoGroup caption={t('demo.variants')}>
        <Inline>
          <Badge>{t('badge.demo.default')}</Badge>
          <Badge variant="secondary">{t('badge.demo.secondary')}</Badge>
          <Badge variant="outline">{t('badge.demo.outline')}</Badge>
          <Badge variant="destructive">{t('badge.demo.destructive')}</Badge>
          <Badge variant="outline">
            <Check aria-hidden="true" data-icon="inline-start" />
            {t('badge.demo.withIcon')}
          </Badge>
        </Inline>
      </DemoGroup>
      <DemoGroup caption={t('demo.inUse')}>
        <Inline align="center">
          <span className="font-medium">{t('badge.demo.inUseTitle')}</span>
          <Badge variant="outline">{t('badge.demo.default')}</Badge>
        </Inline>
      </DemoGroup>
    </Stack>
  )
}
