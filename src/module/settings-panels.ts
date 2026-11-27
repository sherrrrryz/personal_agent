import { createContext, useContext, type ComponentType } from 'react'

import type { Module } from '@/runtime'

/** The two parts of 功能设置 that other areas draw (D-52): 流程 and 资料. */
export type SettingsPanelId = 'workflow' | 'memory'

export type SettingsPanelProps = {
  /** The module 功能设置 is open for. */
  module: Module
  /** Where its views start from: `/m/<ia-id>`, or a demo's `basePath`. */
  basePath: string
}

/**
 * One part of 功能设置, as `src/screens/<area>/settings-panel.tsx` exports it:
 * `export const settingsPanel: ModuleSettingsPanel`. The frame cannot import
 * the screens (they import the frame), so the app gathers the files and hands
 * them down through `ModuleSettingsPanelsContext`.
 */
export type ModuleSettingsPanel = { id: SettingsPanelId; Panel: ComponentType<SettingsPanelProps> }

export type ModuleSettingsPanels = Partial<Record<SettingsPanelId, ComponentType<SettingsPanelProps>>>

/** Empty outside the app (a test of the frame alone): 功能设置 then links to the full views instead. */
export const ModuleSettingsPanelsContext = createContext<ModuleSettingsPanels>({})

export function useModuleSettingsPanels(): ModuleSettingsPanels {
  return useContext(ModuleSettingsPanelsContext)
}

type PanelFile = { settingsPanel?: unknown }

const isPanel = (value: unknown): value is ModuleSettingsPanel =>
  typeof value === 'object' &&
  value !== null &&
  ((value as ModuleSettingsPanel).id === 'workflow' || (value as ModuleSettingsPanel).id === 'memory') &&
  typeof (value as ModuleSettingsPanel).Panel === 'function'

/** The panels of every area's `settings-panel.tsx`; throws at start-up on a malformed or a doubled file. */
export function collectSettingsPanels(files: Record<string, unknown>): ModuleSettingsPanels {
  const panels: ModuleSettingsPanels = {}
  for (const [path, file] of Object.entries(files)) {
    const panel = (file as PanelFile | null)?.settingsPanel
    if (!isPanel(panel)) throw new Error(`${path}: a settings-panel.tsx exports \`settingsPanel\`: { id: 'workflow' | 'memory', Panel }`)
    if (panels[panel.id]) throw new Error(`${path}: the 功能设置 panel '${panel.id}' is defined twice`)
    panels[panel.id] = panel.Panel
  }
  return panels
}
