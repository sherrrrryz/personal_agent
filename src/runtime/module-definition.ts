import type { BlockActionEvent, PageDescription } from '@/blocks/types'
import type { Locale } from '@/i18n'

import type { PreviewId, RuntimeState } from './model'
import type { RuntimeActions } from './store'

// The output side of a module (spec part 2 § Fake workflow runtime, "A
// module's two halves"): what `src/modules/<ia-id>/module.ts` (part 3)
// default-exports and the module frame (`src/module/`) calls. The story facts
// stay in `src/fixtures/`; a module with no `module.ts` renders the stub
// pattern.

/** What a page builder needs besides the state: the reader's language, to resolve the fixtures' two-locale texts. */
export type PageContext = { locale: Locale }

export type ModuleDefinition = {
  /** The IA id the definition is for. A promoted sub-module keeps its definition: look it up by id, then by alias. */
  id: string
  /**
   * The page the workflow emits. `view` is the `view` of the `module`
   * resource — already the long or the empty variant under those previews —
   * and `preview` says which state is being shown, so the builder can emit
   * `block.empty` for 空.
   */
  page(view: RuntimeState, preview: PreviewId, context: PageContext): PageDescription
  /** An action of one of the page's blocks was used; change the state through `actions` only. */
  onAction?(event: BlockActionEvent, actions: RuntimeActions, view: RuntimeState): void
}
