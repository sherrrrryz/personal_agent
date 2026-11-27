import type { ModuleSettingsPanel } from '@/module'

import { MemorySettingsPanel } from './MemoryView'

// 功能设置's 资料 part (D-52): the tables, under 流程.
export const settingsPanel: ModuleSettingsPanel = { id: 'memory', Panel: MemorySettingsPanel }
