import { useT } from '@/i18n'

import { DemoBox } from './demo-box'
import { Inline } from './Inline'
import { Section } from './Section'
import { Stack } from './Stack'

const items = [1, 2, 3, 4, 5, 6, 7, 8]

export default function InlineDemo() {
  const t = useT('dev')
  return (
    <Stack gap="lg">
      <Section level={4} title={t('layout.inline.wrap')}>
        <Inline>
          {items.map((n) => (
            <DemoBox key={n}>{n % 3 === 0 ? t('sample.long') : t('sample.item', { n })}</DemoBox>
          ))}
        </Inline>
      </Section>
      <Section level={4} title={t('layout.inline.between')}>
        <Inline justify="between" align="start" gap="md">
          <DemoBox>{t('sample.short')}</DemoBox>
          <DemoBox>{t('sample.action')}</DemoBox>
        </Inline>
      </Section>
    </Stack>
  )
}
