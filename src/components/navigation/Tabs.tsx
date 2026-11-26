import type { ReactNode } from 'react'

import { focusRing } from '@/components/actions/focus-ring'
import { Tabs as KitTabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

export type TabItem<Value extends string = string> = {
  value: Value
  label: ReactNode
  /** Decorative, before the label. */
  icon?: ReactNode
  disabled?: boolean
  /** The panel this tab shows. */
  content: ReactNode
}

/** A tab list is always named: by `aria-label`, or by the element `aria-labelledby` points at. */
type Naming = { 'aria-label': string; 'aria-labelledby'?: never } | { 'aria-labelledby': string; 'aria-label'?: never }

export type TabsProps<Value extends string = string> = Naming & {
  tabs: ReadonlyArray<TabItem<Value>>
  value?: Value
  /** The first tab unless set. */
  defaultValue?: Value
  onValueChange?: (value: Value) => void
}

// The tabs are drawn as stock shadcn/ui draws them (D-43). The one deviation
// (navigation.md § Deviations from stock): the kit's list is one fixed line,
// which pushes a narrow page sideways; ours is never wider than its container
// and lets tabs that do not fit run onto a further line. Tabs that fit are
// drawn as stock.
const listClass = 'max-w-full flex-wrap group-data-horizontal/tabs:h-auto'
const tabClass: string | undefined = undefined

// The kit removes the outline of the panel, which is a tab stop: without a
// ring a keyboard user loses the focus there. Invisible until focused.
const panelClass = `rounded-md ${focusRing}`

/** Views of one thing, one shown at a time. One tab stop; the arrows move between tabs. */
export function Tabs<Value extends string = string>({ tabs, value, defaultValue, onValueChange, ...naming }: TabsProps<Value>) {
  return (
    <KitTabs
      value={value}
      defaultValue={value === undefined ? (defaultValue ?? tabs[0]?.value) : undefined}
      onValueChange={(next) => onValueChange?.(next as Value)}
    >
      <TabsList {...naming} className={listClass}>
        {tabs.map((tab) => (
          <TabsTrigger key={tab.value} value={tab.value} disabled={tab.disabled} className={tabClass}>
            {tab.icon != null && (
              <span aria-hidden="true" className="flex shrink-0">
                {tab.icon}
              </span>
            )}
            {tab.label}
          </TabsTrigger>
        ))}
      </TabsList>
      {tabs.map((tab) => (
        <TabsContent key={tab.value} value={tab.value} className={panelClass}>
          {tab.content}
        </TabsContent>
      ))}
    </KitTabs>
  )
}
