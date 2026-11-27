import type { ModuleSettingsPanel } from '@/module'

import { WorkflowPanel } from './WorkflowEditor'

// 功能设置's 流程 part (D-52): the editor itself, under the update state.
export const settingsPanel: ModuleSettingsPanel = { id: 'workflow', Panel: WorkflowPanel }
