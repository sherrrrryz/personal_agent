import { PlayIcon, PlusIcon } from 'lucide-react'

import { Button } from '@/components/actions'
import { Inline } from '@/components/layout'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { useT } from '@/i18n'

export default function TooltipDemo() {
  const t = useT('navigation')
  return (
    <Inline>
      {/* The tooltip adds a hint; the button is already named without it. */}
      <Tooltip>
        <TooltipTrigger
          render={
            <Button variant="secondary" size="icon" aria-label={t('demo.tooltip.add')}>
              <PlusIcon aria-hidden="true" />
            </Button>
          }
        />
        <TooltipContent>{t('demo.tooltip.addHint')}</TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger
          render={
            <Button variant="secondary">
              <PlayIcon aria-hidden="true" />
              {t('demo.tooltip.run')}
            </Button>
          }
        />
        <TooltipContent side="bottom">{t('demo.tooltip.runHint')}</TooltipContent>
      </Tooltip>
    </Inline>
  )
}
