import { useT } from '@/i18n'

import { DemoBox } from './demo-box'
import { Section, type SectionLevel } from './Section'
import { Stack } from './Stack'

const levels: SectionLevel[] = [3, 4]

export default function SectionDemo() {
  const t = useT('dev')
  return (
    <Stack gap="lg">
      {levels.map((level) => (
        <Section key={level} level={level} title={t('layout.section.level', { level })}>
          <p>{t('sample.long')}</p>
        </Section>
      ))}
      <Section level={4} title={t('sample.longTitle')} actions={<DemoBox>{t('sample.action')}</DemoBox>}>
        <p>{t('sample.long')}</p>
      </Section>
    </Stack>
  )
}
