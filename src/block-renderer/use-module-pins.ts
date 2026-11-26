import { useCallback } from 'react'

import { useActions, useRuntimeState } from '@/runtime'

import type { Pins } from './arrange'

const noPins: Pins = {}

/**
 * A module's pins from the runtime, in the shape `BlockRenderer` takes:
 * `<BlockRenderer page={page} {...useModulePins(module.id)} />`. The pins are
 * stored per module (`pa.pins`) and survive a scene jump and a reload.
 */
export function useModulePins(moduleId: string): { pins: Pins; onTogglePin: (blockKey: string, index: number) => void } {
  const pins = useRuntimeState((state) => state.pins[moduleId])
  const { togglePin } = useActions()
  const onTogglePin = useCallback(
    (blockKey: string, index: number) => togglePin({ moduleId, blockKey, index }),
    [moduleId, togglePin],
  )
  return { pins: pins ?? noPins, onTogglePin }
}
