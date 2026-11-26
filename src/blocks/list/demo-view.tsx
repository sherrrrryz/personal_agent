import { useState, type ReactNode } from 'react'

import { ToggleGroup, ToggleGroupItem } from '@/components/actions'
import { DemoGroup } from '@/components/actions/demo-parts'
import { Stack } from '@/components/layout'
import { useLocale, useT } from '@/i18n'

import type { BlockDataState, BlockDefinition, BlockId } from '../types'

// The demo of a data block on `/dev/components` — not a component of the system.

const states = ['ready', 'loading', 'empty', 'error'] as const satisfies readonly BlockDataState[]

/**
 * The state the demo opens in: `ready`, or the one named by `?preview=` — the
 * parameter the matrix adds — so each state can be run through the cells.
 * `loading` keeps the page busy; the harness then waits eight seconds a cell.
 */
function initialState(): BlockDataState {
  const preview = new URLSearchParams(window.location.search).get('preview')
  return states.find((state) => state === preview) ?? 'ready'
}

/**
 * A block by its own `demo`: the usual content with what a run changed, in the
 * state picked above it, then the long content. `children` adds more groups.
 */
export function BlockDemoView<Id extends BlockId>({
  definition,
  children,
}: {
  definition: BlockDefinition<Id>
  children?: ReactNode
}) {
  const t = useT('data-blocks')
  const { locale } = useLocale()
  const [state, setState] = useState<BlockDataState>(initialState)
  const { Component } = definition
  const demo = definition.demo(locale)
  return (
    <Stack gap="lg">
      <ToggleGroup aria-label={t('demo.pick')} required value={state} onValueChange={(next) => next && setState(next)}>
        {states.map((value) => (
          <ToggleGroupItem key={value} value={value}>
            {t(`demo.state.${value}`)}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
      <Component props={demo.props} changes={demo.changes} state={state} />
      <DemoGroup caption={t('demo.long')}>
        <Component props={demo.long} changes={{}} state="ready" />
      </DemoGroup>
      {children}
    </Stack>
  )
}
