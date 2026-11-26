import { useId, type ReactElement, type ReactNode } from 'react'

import {
  DropdownMenu as KitDropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup as KitDropdownMenuGroup,
  DropdownMenuItem as KitDropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup as KitDropdownMenuRadioGroup,
  DropdownMenuRadioItem as KitDropdownMenuRadioItem,
  DropdownMenuSeparator as KitDropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

export type DropdownMenuProps = {
  /** What opens the menu: our `Button`. Its text or `aria-label` names the menu. */
  trigger: ReactElement
  /** Which edge of the trigger the menu lines up with. */
  align?: 'start' | 'end'
  side?: 'bottom' | 'top'
  open?: boolean
  onOpenChange?: (open: boolean) => void
  /** `DropdownMenuItem`, `DropdownMenuGroup`, `DropdownMenuRadioGroup`, `DropdownMenuSeparator`. */
  children: ReactNode
}

// The kit's menu is as wide as its trigger — an icon button gives a sliver.
// Ours is as wide as its items need, never wider than the room there is, and
// separates from the page by a border (no shadow in the placeholder theme).
const contentClass = 'w-auto min-w-48 max-w-(--available-width) border'

/** A list of actions or choices that opens from a button. */
export function DropdownMenu({ trigger, align = 'start', side = 'bottom', open, onOpenChange, children }: DropdownMenuProps) {
  return (
    <KitDropdownMenu open={open} onOpenChange={onOpenChange ? (next) => onOpenChange(next) : undefined}>
      <DropdownMenuTrigger render={trigger} />
      <DropdownMenuContent align={align} side={side} className={contentClass}>
        {children}
      </DropdownMenuContent>
    </KitDropdownMenu>
  )
}

// What `wrapped` adds to an item: the target minimum and text that wraps.
const itemClass = 'min-h-target py-1.5 whitespace-normal aria-[current=page]:font-semibold'
const textClass = 'min-w-0 wrap-anywhere'

export type DropdownMenuItemProps = {
  /** Decorative: the text names the item. */
  icon?: ReactNode
  /** `danger` is told by its words and icon; the grey theme gives it no colour. */
  variant?: 'default' | 'danger'
  disabled?: boolean
  /** The page that is open, in a menu of destinations. */
  current?: boolean
  /** The element that navigates — a router link. Without it the item is an action. */
  render?: ReactElement
  onClick?: () => void
  children: ReactNode
}

/** One action or destination of a menu. */
export function DropdownMenuItem({ icon, variant = 'default', disabled, current, render, onClick, children }: DropdownMenuItemProps) {
  return (
    <KitDropdownMenuItem
      variant={variant === 'danger' ? 'destructive' : 'default'}
      disabled={disabled}
      render={render}
      onClick={onClick}
      aria-current={current ? 'page' : undefined}
      className={itemClass}
    >
      {icon != null && (
        <span aria-hidden="true" className="flex shrink-0">
          {icon}
        </span>
      )}
      <span className={textClass}>{children}</span>
    </KitDropdownMenuItem>
  )
}

/** Items that belong together, under a heading that names them. */
export function DropdownMenuGroup({ label, children }: { label: string; children: ReactNode }) {
  return (
    <KitDropdownMenuGroup>
      <DropdownMenuLabel className="wrap-anywhere">{label}</DropdownMenuLabel>
      {children}
    </KitDropdownMenuGroup>
  )
}

export type DropdownMenuRadioGroupProps<Value extends string = string> = {
  /** The heading; it names the group. */
  label: string
  value: Value
  onValueChange: (value: Value) => void
  /** `DropdownMenuRadioItem`s. */
  children: ReactNode
}

/** One choice of several inside a menu; the chosen item carries a check mark. */
export function DropdownMenuRadioGroup<Value extends string = string>({
  label,
  value,
  onValueChange,
  children,
}: DropdownMenuRadioGroupProps<Value>) {
  const id = useId()
  return (
    <KitDropdownMenuRadioGroup value={value} onValueChange={(next) => onValueChange(next as Value)} aria-labelledby={id}>
      {/* The kit's label only works inside its `Group`; here the radio group is the group. */}
      <div id={id} className="px-1.5 py-1 text-xs font-medium wrap-anywhere text-muted-foreground">
        {label}
      </div>
      {children}
    </KitDropdownMenuRadioGroup>
  )
}

export type DropdownMenuRadioItemProps = {
  value: string
  disabled?: boolean
  /** The language of the text when it differs from the page's. */
  lang?: string
  children: ReactNode
}

/** One option of a `DropdownMenuRadioGroup`. */
export function DropdownMenuRadioItem({ children, ...item }: DropdownMenuRadioItemProps) {
  return (
    <KitDropdownMenuRadioItem {...item} className={itemClass}>
      <span className={textClass}>{children}</span>
    </KitDropdownMenuRadioItem>
  )
}

/** A line between groups of items. */
export function DropdownMenuSeparator() {
  return <KitDropdownMenuSeparator />
}
