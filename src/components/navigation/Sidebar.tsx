import { ChevronDownIcon, PanelLeftIcon, XIcon } from 'lucide-react'
import { useId, useState, type ReactElement, type ReactNode } from 'react'

import { Button } from '@/components/actions'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import {
  Sidebar as KitSidebar,
  SidebarContent as KitSidebarContent,
  SidebarFooter as KitSidebarFooter,
  SidebarGroup as KitSidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader as KitSidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarProvider as KitSidebarProvider,
} from '@/components/ui/sidebar'
import { useT } from '@/i18n'

import { SidebarPlacementContext, useSidebar, type SidebarPlacement } from './sidebar-context'

export type SidebarProviderProps = {
  /** Open with labels, or folded into the icon rail. The shell decides it from the size class. */
  open?: boolean
  defaultOpen?: boolean
  onOpenChange?: (open: boolean) => void
  placement?: SidebarPlacement
  /** The `Sidebar`, and beside it whatever it navigates. */
  children: ReactNode
}

/** Holds the sidebar's state; `Sidebar`, `SidebarTrigger` and the page content sit inside it, side by side. */
export function SidebarProvider({ placement = 'viewport', children, ...state }: SidebarProviderProps) {
  return (
    <SidebarPlacementContext value={placement}>
      {/* In the viewport the app stands on the canvas, the floating sidebar and the cards over it (D-50). */}
      <KitSidebarProvider {...state} className={placement === 'inline' ? 'min-h-0' : 'bg-canvas'}>
        {children}
      </KitSidebarProvider>
    </SidebarPlacementContext>
  )
}

export type SidebarProps = {
  /** Names the navigation landmark, and the sheet in the compact size class. */
  'aria-label': string
  /** `SidebarHeader`, `SidebarContent`, `SidebarFooter`. */
  children: ReactNode
}

/**
 * The app's navigation, as stock shadcn/ui draws it (D-43) in the kit's own `floating` variant
 * (D-50: a panel with its background, ring and small shadow, set off the canvas): open, an icon
 * rail, or — in the compact size class — a sheet off the canvas that `SidebarTrigger` opens.
 */
export function Sidebar({ 'aria-label': label, children }: SidebarProps) {
  const t = useT('navigation')
  const { mode, placement, setSheetOpen } = useSidebar()
  const body = (
    <>
      {mode === 'sheet' && (
        <div className="flex justify-end p-2">
          <Button variant="ghost" size="icon" aria-label={t('sidebar.close')} onClick={() => setSheetOpen(false)}>
            <XIcon aria-hidden="true" />
          </Button>
        </div>
      )}
      <nav aria-label={label} className="flex min-h-0 flex-1 flex-col">
        {children}
      </nav>
    </>
  )
  if (placement === 'inline') {
    return (
      <KitSidebar collapsible="none" className={mode === 'rail' ? 'w-(--sidebar-width-icon)' : undefined}>
        {body}
      </KitSidebar>
    )
  }
  return (
    <KitSidebar variant="floating" collapsible="icon" mobileTitle={label}>
      {body}
    </KitSidebar>
  )
}

/**
 * The button that opens the sheet (compact) or folds the sidebar into the rail and back. In the
 * app it sits at the top of the sidebar, in `SidebarHeader`; the page header keeps one only to
 * open the compact sheet (D-53).
 */
export function SidebarTrigger() {
  const t = useT('navigation')
  const { mode, open, sheetOpen, toggle } = useSidebar()
  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label={t('sidebar.toggle')}
      aria-expanded={mode === 'sheet' ? sheetOpen : open}
      onClick={toggle}
    >
      <PanelLeftIcon aria-hidden="true" />
    </Button>
  )
}

/** The top of the sidebar: the product or workspace name. Does not scroll. */
export function SidebarHeader({ children }: { children: ReactNode }) {
  return <KitSidebarHeader>{children}</KitSidebarHeader>
}

/**
 * The bottom of the sidebar: settings, preferences. Does not scroll. Holds
 * `SidebarGroup`s, which bring their own padding — the kit's would double it
 * and push a rail item out of the rail.
 */
export function SidebarFooter({ children }: { children: ReactNode }) {
  return <KitSidebarFooter className="gap-0 p-0">{children}</KitSidebarFooter>
}

/** The scrolling middle: `SidebarGroup`s. The kit stops the rail from scrolling; a short window needs it to. */
export function SidebarContent({ children }: { children: ReactNode }) {
  return <KitSidebarContent className="group-data-[collapsible=icon]:overflow-auto">{children}</KitSidebarContent>
}

type GroupBase = {
  /** The group's heading; it names the list. In the rail it is kept for assistive technology only. */
  label: string
  /** `SidebarItem`s. */
  children: ReactNode
}

type PlainGroup = GroupBase & { collapsible?: false }

type CollapsibleGroup = GroupBase & {
  /** The heading becomes a button that shows and hides the list. */
  collapsible: true
  /** Stands for the whole group in the rail, where pressing it opens the sidebar with the group shown. */
  icon: ReactNode
  open?: boolean
  defaultOpen?: boolean
  onOpenChange?: (open: boolean) => void
}

export type SidebarGroupProps = PlainGroup | CollapsibleGroup

/** Deviations from stock for the group heading, if the matrix forces any (navigation.md § Deviations from stock). */
const groupLabelClass: string | undefined = undefined

/** A titled list of items. */
export function SidebarGroup(props: SidebarGroupProps) {
  const { label, children } = props
  const { mode, setOpen } = useSidebar()
  const id = useId()
  const [own, setOwn] = useState(props.collapsible ? (props.defaultOpen ?? false) : true)

  if (!props.collapsible) {
    return (
      <KitSidebarGroup>
        {mode === 'rail' ? (
          <span id={id} className="sr-only">
            {label}
          </span>
        ) : (
          <SidebarGroupLabel id={id} className={groupLabelClass}>
            {label}
          </SidebarGroupLabel>
        )}
        <SidebarGroupContent>
          <SidebarMenu aria-labelledby={id}>
            {children}
          </SidebarMenu>
        </SidebarGroupContent>
      </KitSidebarGroup>
    )
  }

  const shown = props.open ?? own
  const change = (next: boolean) => {
    setOwn(next)
    props.onOpenChange?.(next)
  }

  if (mode === 'rail') {
    return (
      <KitSidebarGroup>
        <SidebarMenu>
          <SidebarItem
            icon={props.icon}
            label={label}
            onClick={() => {
              setOpen(true)
              change(true)
            }}
          />
        </SidebarMenu>
      </KitSidebarGroup>
    )
  }

  return (
    <Collapsible open={shown} onOpenChange={(next) => change(next)} render={<KitSidebarGroup />}>
      <div className="flex">
        <CollapsibleTrigger
          id={id}
          render={
            <Button variant="ghost" size="sm">
              <ChevronDownIcon aria-hidden="true" className={shown ? 'rotate-180' : undefined} />
              {label}
            </Button>
          }
        />
      </div>
      <CollapsibleContent render={<SidebarGroupContent />}>
        <SidebarMenu aria-labelledby={id}>
          {children}
        </SidebarMenu>
      </CollapsibleContent>
    </Collapsible>
  )
}

// The one deviation from stock for an item (navigation.md § Deviations from
// stock): the kit cuts a label to one line at a fixed height, with nowhere to
// read the rest. Ours keeps the kit's height as a minimum and lets a label
// that does not fit wrap; one that fits is drawn exactly as stock. The kit
// truncates the last `span` with a selector of its own — only `!important`
// reaches it. The rail is untouched: the kit's rail size is `!important`.
const itemClass = 'h-auto min-h-8 py-1.5'
const subItemClass = 'h-auto min-h-7 py-1'
const labelClass = 'whitespace-normal! overflow-visible! wrap-anywhere'

export type SidebarItemProps = {
  /** Decorative: the label names the item. */
  icon: ReactNode
  label: string
  /** A count or short status at the end of the row; part of the item's name. As in the kit, not drawn in the rail. */
  badge?: ReactNode
  /** The item of the page that is open. */
  current?: boolean
  disabled?: boolean
  /** The element that navigates — a router link. Without it the item is a button. */
  render?: ReactElement
  onClick?: () => void
  /** `SidebarSubItem`s — one level. Not shown in the rail. */
  children?: ReactNode
}

/** One destination. Open: icon, label, badge. Rail: the icon, with the label as its name and tooltip. */
export function SidebarItem({ icon, label, badge, current = false, disabled, render, onClick, children }: SidebarItemProps) {
  const { mode } = useSidebar()
  const rail = mode === 'rail'
  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        render={render}
        isActive={current}
        aria-current={current ? 'page' : undefined}
        aria-disabled={disabled || undefined}
        // Only in the rail: an open tooltip, even a hidden one, takes the first Escape — in the sheet that
        // press must close the sheet.
        tooltip={rail ? label : undefined}
        onClick={disabled ? (event) => event.preventDefault() : onClick}
        className={itemClass}
      >
        <span aria-hidden="true" className="flex shrink-0">
          {icon}
        </span>
        {/* The kit truncates the last `span` of a button; the count stays in the item's name. */}
        <span className={rail ? 'sr-only' : labelClass}>
          {label}
          {badge != null && <span className="sr-only"> {badge}</span>}
        </span>
      </SidebarMenuButton>
      {badge != null && !rail && <SidebarMenuBadge aria-hidden="true">{badge}</SidebarMenuBadge>}
      {children != null && !rail && <SidebarMenuSub>{children}</SidebarMenuSub>}
    </SidebarMenuItem>
  )
}

export type SidebarSubItemProps = {
  label: string
  current?: boolean
  /** The link that navigates — a sub-item is always a destination. */
  render: ReactElement
}

/** A destination one level under a `SidebarItem`. */
export function SidebarSubItem({ label, current = false, render }: SidebarSubItemProps) {
  return (
    <SidebarMenuSubItem>
      <SidebarMenuSubButton
        render={render}
        isActive={current}
        aria-current={current ? 'page' : undefined}
        className={subItemClass}
      >
        <span className={labelClass}>{label}</span>
      </SidebarMenuSubButton>
    </SidebarMenuSubItem>
  )
}
