import type { ComponentType } from 'react'

import type { WorkflowDiff } from '@/components/workflow'
import type { Module, Workflow } from '@/runtime'

// ── The editor's extension points for package C6 ────────────────────────────
//
// 历史, 与上一版对比, the diff switch, 变更摘要, the pending proposal's card and
// the read-only banner of an old version are **package C6's**
// (`src/screens/workflow/history/`, `src/screens/workflow/diff/`). The editor
// (package C3) holds *what is shown* and leaves three named places; until a
// slot file exists it renders nothing in them and never leaves the current
// version.
//
// To fill them, C6 adds `history/slots.tsx` and / or `diff/slots.tsx`, each
// exporting `editorSlots: EditorSlots`. Both files are found by glob
// (`WorkflowEditor.tsx`); no file of the editor is edited.

/**
 * What the editor is showing.
 * `version`: `null` = the version in force (it follows the store: a save or
 * an approval moves it on by itself); a number = that version, read-only
 * unless it is the one in force; `'proposed'` = the change waiting for
 * approval (`workflow.proposed`), read-only.
 * `compareTo`: the version it is compared with — `null` = no comparison, the
 * canvas is in `mode: view`; a number = `mode: diff`.
 */
export type EditorShown = { version: number | 'proposed' | null; compareTo: number | null }

/** The editor's start: the version in force, no comparison. */
export const shownCurrent: EditorShown = { version: null, compareTo: null }

export type EditorSlotProps = {
  module: Module
  workflow: Workflow
  shown: EditorShown
  /** Changes what the editor shows — open an old version, switch the comparison on or off. */
  onShownChange: (next: EditorShown) => void
}

export type EditorDiff = {
  /** By node id; a node that is not listed is unchanged. */
  nodes: Readonly<Record<string, WorkflowDiff>>
  /** By edge id. */
  edges: Readonly<Record<string, WorkflowDiff>>
}

export type EditorSlots = {
  /**
   * In the version line, after 版本 n（当前）: the 历史 button and its sheet
   * (`history/`), 与上一版对比 and the diff switch (`diff/`). Rendered inside a
   * wrapping row; bring `Button`s, not layout.
   */
  versionActions?: ComponentType<EditorSlotProps>
  /**
   * Above the view and first in reading order: the banner of an old version,
   * 变更摘要, the pending proposal's `ProposalCard` with 批准 / 拒绝.
   */
  beforeView?: ComponentType<EditorSlotProps>
  /**
   * The marks of the comparison `shown` asks for. The editor passes them to
   * the canvas (`mode: diff`, `diff` on nodes and edges) and to 步骤列表; how
   * a mark is drawn is the `mode: diff` part of `src/components/workflow/`.
   */
  diffOf?: (workflow: Workflow, shown: EditorShown) => EditorDiff
}

type SlotFile = { editorSlots?: EditorSlots }

/** The slot files in the order their places are filled: `history/` first, then `diff/`. */
export function collectSlots(files: Record<string, SlotFile>): EditorSlots[] {
  return Object.entries(files)
    .sort(([a], [b]) => Number(a.includes('/diff/')) - Number(b.includes('/diff/')))
    .flatMap(([, file]) => (file.editorSlots ? [file.editorSlots] : []))
}
