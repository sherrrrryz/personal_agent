import { Badge } from '@/components/ui/badge'
import { useT } from '@/i18n'
import { changeKind, type ChangeKind } from '@/lib/vocab'

import { vocabBadgeClass } from './vocab-badge'

export type ChangeMarkerProps = {
  /** What happened to the thing it stands beside since the user last looked. */
  kind: ChangeKind
}

/**
 * Marks something as new, updated or removed: the kind's icon and its word,
 * from the shared vocabulary, so the change is never carried by colour. Plain
 * text with no role — inside a link or a heading it is part of that name.
 */
export function ChangeMarker({ kind }: ChangeMarkerProps) {
  const t = useT('common')
  const { icon: Icon, labelKey } = changeKind[kind]
  return (
    <Badge variant="outline" className={vocabBadgeClass} data-change={kind}>
      <Icon aria-hidden="true" data-icon="inline-start" />
      {t(labelKey)}
    </Badge>
  )
}
