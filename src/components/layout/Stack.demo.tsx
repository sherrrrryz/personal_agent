import { useT } from '@/i18n'

import { DemoBox } from './demo-box'
import { gaps } from './gap'
import { Grid } from './Grid'
import { Section } from './Section'
import { Stack } from './Stack'

export default function StackDemo() {
  const t = useT('dev')
  return (
    <Section level={4} title={t('layout.stack.gaps')}>
      <Grid min="3xs">
        {gaps.map((gap) => (
          <Stack key={gap} gap={gap}>
            <code>{gap}</code>
            <DemoBox>{t('sample.item', { n: 1 })}</DemoBox>
            <DemoBox>{t('sample.item', { n: 2 })}</DemoBox>
          </Stack>
        ))}
      </Grid>
    </Section>
  )
}
