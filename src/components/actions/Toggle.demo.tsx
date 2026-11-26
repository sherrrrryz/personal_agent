import { BellOff, Pin, Star } from 'lucide-react'

import { Inline } from '@/components/layout'
import { useT } from '@/i18n'

import { Toggle } from './Toggle'

export default function ToggleDemo() {
  const t = useT('inputs')
  return (
    <Inline>
      <Toggle defaultPressed>
        <Pin aria-hidden="true" />
        {t('toggle.demo.pin')}
      </Toggle>
      <Toggle>
        <BellOff aria-hidden="true" />
        {t('toggle.demo.mute')}
      </Toggle>
      <Toggle variant="ghost" size="sm" aria-label={t('toggle.demo.star')}>
        <Star aria-hidden="true" />
      </Toggle>
      <Toggle disabled>{t('button.demo.disabled')}</Toggle>
      <Toggle disabled defaultPressed>
        {t('button.demo.disabled')}
      </Toggle>
    </Inline>
  )
}
