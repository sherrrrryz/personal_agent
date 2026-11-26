import { ChevronsUpDownIcon } from 'lucide-react'

import { Button } from '@/components/actions'
import { DemoGroup } from '@/components/actions/demo-parts'
import { Stack } from '@/components/layout'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { useT } from '@/i18n'

export default function CollapsibleDemo() {
  const t = useT('navigation')
  const part = (open: boolean) => (
    <Collapsible defaultOpen={open} className="flex flex-col items-start gap-2">
      <CollapsibleTrigger
        render={
          <Button variant="secondary">
            <ChevronsUpDownIcon aria-hidden="true" />
            {t('demo.collapsible.trigger')}
          </Button>
        }
      />
      <CollapsibleContent>
        <p>{t('demo.collapsible.body')}</p>
      </CollapsibleContent>
    </Collapsible>
  )
  return (
    <Stack gap="lg">
      {part(false)}
      <DemoGroup caption={t('demo.collapsible.open')}>{part(true)}</DemoGroup>
    </Stack>
  )
}
