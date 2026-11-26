import { useT } from '@/i18n'

import { DemoBox } from './demo-box'
import { Stack } from './Stack'

// `Page` renders the page's one `h1` and the page padding, so it cannot be
// nested inside the gallery page: the gallery itself is the live `Page`
// (width `wide`, with a description). This demo shows the three widths as
// bars of the same measure.
const widths = [
  { key: 'layout.page.prose', measure: 'max-w-prose' },
  { key: 'layout.page.wide', measure: 'max-w-7xl' },
  { key: 'layout.page.full', measure: 'max-w-none' },
] as const

export default function PageDemo() {
  const t = useT('dev')
  return (
    <Stack gap="sm">
      {widths.map(({ key, measure }) => (
        <div key={key} className={measure}>
          <DemoBox>
            <code>{key.split('.').pop()}</code> — {t(key)}
          </DemoBox>
        </div>
      ))}
    </Stack>
  )
}
