import { CalendarDays, Plus } from 'lucide-react'

import { Button } from '@/components/actions'
import { Stack } from '@/components/layout'
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'
import { useT } from '@/i18n'

export default function EmptyDemo() {
  const t = useT('feedback')
  return (
    <Stack gap="lg">
      <Empty className="border">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <CalendarDays aria-hidden="true" />
          </EmptyMedia>
          <EmptyTitle>{t('empty.demo.title')}</EmptyTitle>
          <EmptyDescription>{t('empty.demo.body')}</EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button variant="secondary">
            <Plus aria-hidden="true" />
            {t('empty.demo.action')}
          </Button>
        </EmptyContent>
      </Empty>
      <Empty className="border">
        <EmptyHeader>
          <EmptyTitle>{t('empty.demo.plainTitle')}</EmptyTitle>
          <EmptyDescription>{t('empty.demo.plainBody')}</EmptyDescription>
        </EmptyHeader>
      </Empty>
    </Stack>
  )
}
