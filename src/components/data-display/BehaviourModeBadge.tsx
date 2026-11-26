import { Badge } from '@/components/ui/badge'
import { useT } from '@/i18n'
import { behaviourMode, type BehaviourMode } from '@/lib/vocab'

import { vocabBadgeClass } from './vocab-badge'

export type BehaviourModeBadgeProps = {
  /** The mode to show. Under a ceiling, pass the mode that applies (`capMode`). */
  mode: BehaviourMode
}

/**
 * Which behaviour mode applies to something: the mode's icon and its name,
 * from the shared vocabulary, so the mode is never carried by colour. Plain
 * text with no role — inside a link or a button it is part of that name.
 */
export function BehaviourModeBadge({ mode }: BehaviourModeBadgeProps) {
  const t = useT('common')
  const { icon: Icon, nameKey } = behaviourMode[mode]
  return (
    <Badge variant="outline" className={vocabBadgeClass} data-mode={mode}>
      <Icon aria-hidden="true" data-icon="inline-start" />
      {t(nameKey)}
    </Badge>
  )
}
