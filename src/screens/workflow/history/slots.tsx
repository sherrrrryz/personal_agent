import type { EditorSlots } from '../slots'

import { HistoryActions, OldVersionBanner } from './HistoryControls'

// The editor's version history (spec part 3 § Workflow editor, "History"):
// 历史 and its sheet in the version line, the read-only banner of an old
// version above the view. Found by glob (`../slots.ts`).
export const editorSlots: EditorSlots = { versionActions: HistoryActions, beforeView: OldVersionBanner }
