import { XIcon } from 'lucide-react'
import { Button } from '@/components/actions'
import { useT } from '@/i18n'

/** The close control of an overlay: our `Button`, named in the user's language. Goes in the kit's `Close` as `render`. */
export function CloseButton(passed: Record<string, unknown>) {
  const t = useT('navigation')
  return (
    // `passed`: what the kit's `Close` hands the element it renders — its press handler and ref.
    <Button {...passed} variant="ghost" size="icon" aria-label={t('overlay.close')}>
      <XIcon aria-hidden="true" />
    </Button>
  )
}
