import type { ComponentType } from 'react'

import { familyOfDemo, nameOfDemo, type Family } from './families'

export type Demo = { family: Family; name: string; path: string; Component: ComponentType }

// The glob registry of demos: every `*.demo.tsx` under `src/` whose default
// export is a component taking no props. Nobody edits a central list.
const files = import.meta.glob<ComponentType>('/src/**/*.demo.tsx', { eager: true, import: 'default' })

export function collectDemos(found: Record<string, ComponentType> = files): Demo[] {
  return Object.entries(found)
    .map(([path, Component]) => {
      const family = familyOfDemo(path)
      if (!family) throw new Error(`${path}: a demo lives in a component family's folder`)
      if (typeof Component !== 'function') throw new Error(`${path}: a demo file default-exports its component`)
      return { family, name: nameOfDemo(path), path, Component }
    })
    .sort((a, b) => a.name.localeCompare(b.name))
}

export const demos = collectDemos()
