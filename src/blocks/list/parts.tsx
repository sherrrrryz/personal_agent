import { ChevronRight } from 'lucide-react'
import type { ReactNode } from 'react'
import { Link } from 'react-router'

import { Button } from '@/components/actions'
import { focusRing } from '@/components/actions/focus-ring'
import {
  BehaviourModeBadge,
  ChangeMarker,
  Item,
  ItemContent,
  ItemDescription,
  ItemMedia,
  ItemTitle,
} from '@/components/data-display'
import { Badge, Empty, EmptyHeader, EmptyTitle } from '@/components/feedback'
import { useT } from '@/i18n'
import type { ChangeKind } from '@/lib/vocab'

import type { BlockAction, BlockBadge } from '../types'

// What the four data blocks share (package S10): a link, the badges and the
// actions of an item, an entry row, the empty state. They live here because
// every folder under `src/blocks/` is a block of its own; `block.schedule`
// and `block.table` import from this file.

// A link standing in a title or a cell: as high as a target, underlined, in full.
const linkClass = `inline-flex items-center rounded-sm text-start underline underline-offset-4 wrap-anywhere ${focusRing}`

/** A link to another screen of the prototype, from a title or a table cell. */
export function BlockItemLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link to={href} className={linkClass}>
      {children}
    </Link>
  )
}

/** An item's badges. A badge that says a behaviour mode is the shared `BehaviourModeBadge`. */
export function BlockBadges({ badges }: { badges: BlockBadge[] }) {
  return badges.map((badge) =>
    badge.mode ? (
      <BehaviourModeBadge key={`${badge.mode}:${badge.label}`} mode={badge.mode} />
    ) : (
      <Badge key={badge.label} variant="secondary">
        {badge.label}
      </Badge>
    ),
  )
}

export type BlockActionsProps = {
  itemId: string
  /** What the actions act on; it completes each button's name. */
  itemTitle: string
  actions: BlockAction[]
  onAction?: (actionId: string, itemId: string) => void
}

/** An item's actions as buttons; the one marked `primary` is the primary button. */
export function BlockActions({ itemId, itemTitle, actions, onAction }: BlockActionsProps) {
  const t = useT('data-blocks')
  return actions.map((action) => (
    <Button
      key={action.id}
      size="sm"
      variant={action.primary ? 'primary' : 'secondary'}
      disabled={action.disabled}
      // The visible label first, then the item: a row of "Start" buttons is told apart.
      aria-label={t('action.of', { action: action.label, item: itemTitle })}
      onClick={() => onAction?.(action.id, itemId)}
    >
      {action.label}
    </Button>
  ))
}

// The actions of an entry take a row of their own under the text until the
// entry's container — the list, or one column of a schedule — reaches the
// `@md` step (28rem); from there they stand beside the text. The kit's
// `ItemActions` only wraps when the text has given all its room away.
const actionsClass = 'flex basis-full flex-wrap items-center gap-2 @md:basis-auto'

export type BlockEntryProps = {
  id: string
  title: string
  /** A line above the title: a slot's time. */
  lead?: ReactNode
  meta: string
  badges?: BlockBadge[]
  actions?: BlockAction[]
  href?: string
  /** What the last run did to this item. */
  change?: ChangeKind
  onAction?: (actionId: string, itemId: string) => void
}

/**
 * One item of a list or a schedule, inside an `ItemGroup` that sits in a
 * size container (`@container`). With `href` and no action the whole row is
 * the link; with actions the row is plain, its title is the link and the
 * actions are buttons, under the text while the container is narrow.
 */
export function BlockEntry({ id, title, lead, meta, badges = [], actions = [], href, change, onAction }: BlockEntryProps) {
  const rowIsLink = href !== undefined && actions.length === 0
  return (
    <Item variant="outline" size="sm" render={rowIsLink ? <Link to={href} /> : undefined} data-item={id}>
      <ItemContent>
        {lead !== undefined && <p className="text-sm text-muted-foreground">{lead}</p>}
        <ItemTitle>
          {href !== undefined && !rowIsLink ? <BlockItemLink href={href}>{title}</BlockItemLink> : title}
          {change && <ChangeMarker kind={change} />}
          <BlockBadges badges={badges} />
        </ItemTitle>
        {meta !== '' && <ItemDescription>{meta}</ItemDescription>}
      </ItemContent>
      {actions.length > 0 && (
        <div data-slot="block-entry-actions" className={actionsClass}>
          <BlockActions itemId={id} itemTitle={title} actions={actions} onAction={onAction} />
        </div>
      )}
      {rowIsLink && (
        <ItemMedia variant="icon">
          <ChevronRight aria-hidden="true" />
        </ItemMedia>
      )}
    </Item>
  )
}

/** The empty state of a block: the kit's `Empty` with the block's own sentence. */
export function BlockEmpty({ title }: { title: string }) {
  return (
    <Empty>
      <EmptyHeader>
        <EmptyTitle>{title}</EmptyTitle>
      </EmptyHeader>
    </Empty>
  )
}
