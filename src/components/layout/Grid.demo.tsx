import { useT } from '@/i18n'

import { DemoBox } from './demo-box'
import { Grid, GridItem, type GridMin } from './Grid'
import { Section } from './Section'
import { Stack } from './Stack'

const mins: GridMin[] = ['3xs', 'xs', 'sm', 'lg']
const items = [1, 2, 3, 4, 5]

export default function GridDemo() {
  const t = useT('dev')
  return (
    <Section level={4} title={t('layout.grid.columns')}>
      {mins.map((min) => (
        <Stack key={min} gap="sm">
          <code>{min}</code>
          <Grid min={min}>
            {items.map((n) => (
              <DemoBox key={n}>{n === 2 ? t('sample.long') : t('sample.item', { n })}</DemoBox>
            ))}
            <GridItem span="full">
              <DemoBox>{t('layout.grid.span')}</DemoBox>
            </GridItem>
          </Grid>
        </Stack>
      ))}
    </Section>
  )
}
