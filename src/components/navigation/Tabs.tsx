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

// The kit's list is one fixed line of unbreakable tabs. Ours fills its
// container and lets the tabs run onto further lines.
const listClass = 'flex w-full flex-wrap justify-start gap-1 group-data-horizontal/tabs:h-auto'

// What `wrapped` adds to a tab: the target minimum, height `auto`, a label that wraps.
const tabClass = 'group/tab h-auto min-h-target min-w-target max-w-full py-1.5 text-center whitespace-normal wrap-anywhere'

// "Selected" is a fill in the kit. The bar is a border, so the state survives
// the grey theme and forced colours (D-18).
const selectedBar = 'absolute inset-x-2 bottom-1 hidden border-b-2 border-current group-data-active/tab:block'

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
            <span aria-hidden="true" className={selectedBar} />
          </TabsTrigger>
        ))}
      </TabsList>
      {tabs.map((tab) => (
        <TabsContent key={tab.value} value={tab.value} className={`rounded-md ${focusRing}`}>
          {tab.content}
        </TabsContent>
      ))}
    </KitTabs>
  )
}
