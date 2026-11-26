import { Button } from '@/components/actions'
import { Inline } from '@/components/layout'
import { useT } from '@/i18n'

import { Sheet } from './Sheet'

export default function SheetDemo() {
  const t = useT('navigation')
  const rows = (
    <ul className="flex flex-col gap-2">
      <li>{t('demo.sheet.row1')}</li>
      <li>{t('demo.sheet.row2')}</li>
      <li>{t('demo.sheet.row3')}</li>
    </ul>
  )
  return (
    <Inline>
      <Sheet
        trigger={<Button variant="secondary">{t('demo.sheet.end')}</Button>}
        title={t('demo.sheet.title')}
        description={t('demo.sheet.description')}
        footer={<Button variant="secondary">{t('demo.sheet.done')}</Button>}
      >
        {rows}
      </Sheet>
      <Sheet side="bottom" trigger={<Button variant="secondary">{t('demo.sheet.bottom')}</Button>} title={t('demo.sheet.title')}>
        {rows}
      </Sheet>
    </Inline>
  )
}
