import { collectSettingsPanels, type ModuleSettingsPanels } from '@/module'

// The glob registry of 功能设置's parts (D-52): every
// `src/screens/<area>/settings-panel.tsx` exports `settingsPanel` — 流程 from
// `workflow/`, 资料 from `memory/`. Nobody edits a central table.
export const settingsPanels: ModuleSettingsPanels = collectSettingsPanels(
  import.meta.glob('/src/screens/*/settings-panel.tsx', { eager: true }),
)
