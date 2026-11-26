import type { ReactNode } from 'react'

/** A bordered box standing in for content in the layout demos. Not a component of the system. */
export function DemoBox({ children }: { children: ReactNode }) {
  return <div className="rounded-md border bg-card p-3 text-card-foreground">{children}</div>
}
