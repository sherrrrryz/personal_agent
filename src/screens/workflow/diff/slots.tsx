import type { EditorSlots } from '../slots'

import { diffOf } from './compare'
import { DiffActions, DiffSummary } from './DiffControls'

// The editor's comparison (spec part 3 § Workflow editor, "Diff"): the switch
// in the version line, 变更摘要 and the pending proposal above the view, and
// the marks the canvas and 步骤列表 draw. Found by glob (`../slots.ts`).
export const editorSlots: EditorSlots = { versionActions: DiffActions, beforeView: DiffSummary, diffOf }
