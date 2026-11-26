import type { ReactNode } from 'react'

import { Stack } from '@/components/layout'

// Helpers of the demos on `/dev/components` — not components of the system.

/** One captioned group of a demo. A caption, not a heading: the gallery already names the demo. */
export function DemoGroup({ caption, children }: { caption: ReactNode; children: ReactNode }) {
  return (
    <Stack gap="sm">
      <p className="text-sm text-muted-foreground">{caption}</p>
      {children}
    </Stack>
  )
}

const surfaces = [
  { name: 'background', className: 'bg-background text-foreground' },
  { name: 'card', className: 'bg-card text-card-foreground' },
  { name: 'sidebar', className: 'bg-sidebar text-sidebar-foreground' },
] as const

export type DemoSurface = (typeof surfaces)[number]['name']

/**
 * The same control on the three surfaces a focus ring is measured against
 * (`focus-ring.test.tsx`, spec A-13). `data-surface` names each for the measurement.
 */
export function DemoSurfaces({ children }: { children: (surface: DemoSurface) => ReactNode }) {
  return (
    <Stack gap="sm">
      {surfaces.map(({ name, className }) => (
        <div key={name} data-surface={name} className={`flex flex-col gap-2 rounded-md border p-4 ${className}`}>
          <code className="text-sm">{name}</code>
          {children(name)}
        </div>
      ))}
    </Stack>
  )
}
