import { createContext, useContext, type ComponentProps } from 'react'

import {
  Item as KitItem,
  ItemActions as KitItemActions,
  ItemContent as KitItemContent,
  ItemDescription as KitItemDescription,
  ItemGroup as KitItemGroup,
  ItemTitle as KitItemTitle,
} from '@/components/ui/item'

export { ItemMedia } from '@/components/ui/item'

type Bare<Props> = Omit<Props, 'className' | 'style'>

/** True for the items directly inside an `ItemGroup`: each of them is a list item. */
const InGroup = createContext(false)

export type ItemGroupProps = Bare<ComponentProps<typeof KitItemGroup>>

/** A list of items. Each `Item` inside it is announced as a list item. */
export function ItemGroup({ children, ...rest }: ItemGroupProps) {
  return (
    <KitItemGroup {...rest}>
      <InGroup value={true}>{children}</InGroup>
    </KitItemGroup>
  )
}

type KitItemProps = Bare<ComponentProps<typeof KitItem>>

export type ItemProps = Omit<KitItemProps, 'variant'> & {
  /**
   * The kit's three, and `card` (D-54): the kit's `outline` row filled with
   * the card surface — white in light mode — so it reads as a card on a
   * backdrop that shows through a transparent row (the onboarding gradient).
   */
  variant?: KitItemProps['variant'] | 'card'
}

/**
 * One record as a row: media, a title and a description, actions. With
 * `render` set to a link the whole row is that link — then nothing inside it
 * is interactive. At least the target size high; its text wraps.
 */
export function Item({ children, variant, ...rest }: ItemProps) {
  const inGroup = useContext(InGroup)
  const item = (
    <KitItem {...rest} variant={variant === 'card' ? 'outline' : variant} className={variant === 'card' ? 'bg-card text-start' : 'text-start'}>
      <InGroup value={false}>{children}</InGroup>
    </KitItem>
  )
  // The kit's group is a `list`, but its item has no role: the list would have no items.
  return inGroup ? <div role="listitem">{item}</div> : item
}

export type ItemContentProps = Bare<ComponentProps<typeof KitItemContent>>

/** The text column. It keeps a readable width: the actions move below it before it narrows further. */
export function ItemContent(props: ItemContentProps) {
  return <KitItemContent {...props} className="min-w-24 wrap-anywhere" />
}

export type ItemTitleProps = Bare<ComponentProps<typeof KitItemTitle>>

/** The title, in full: the kit cuts it after one line. A badge or a marker may stand beside the text. */
export function ItemTitle(props: ItemTitleProps) {
  return <KitItemTitle {...props} className="line-clamp-none flex flex-wrap" />
}

export type ItemDescriptionProps = Bare<ComponentProps<typeof KitItemDescription>>

/** The description, in full: the kit cuts it after two lines. */
export function ItemDescription(props: ItemDescriptionProps) {
  return <KitItemDescription {...props} className="line-clamp-none" />
}

export type ItemActionsProps = Bare<ComponentProps<typeof KitItemActions>>

/** The controls of a row; they wrap among themselves and, when the row is narrow, move below the text. */
export function ItemActions(props: ItemActionsProps) {
  return <KitItemActions {...props} className="flex-wrap" />
}
