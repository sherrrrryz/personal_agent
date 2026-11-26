import { InfoIcon } from 'lucide-react'
import type { ReactNode } from 'react'

import { BlockRenderer, useModulePins } from '@/block-renderer'
import { noChanges } from '@/blocks/types'
import { Alert, AlertDescription, AlertTitle } from '@/components/feedback'
import { useLocale, useT } from '@/i18n'
import { failureWords, ModuleFrame, type RouteModule } from '@/module'
import { useActions, useResource, useRunState, useRuntimeState } from '@/runtime'

const noPage = { blocks: [] }

/**
 * The `page` view of a module (spec part 2 § Module frame): the frame, and in
 * it the page its workflow emits — `BlockRenderer` over
 * `definition.page(view, preview)`. The four data states are the renderer's
 * `DataState`; a failure that kept the last good page, or part of it, shows
 * that page under a note saying so.
 */
export function ModulePage({ module, definition, basePath, children }: Omit<RouteModule, 'stub'> & { children?: ReactNode }) {
  const t = useT('module')
  const { locale } = useLocale()
  const state = useRuntimeState()
  const actions = useActions()
  const run = useRunState(module.id)
  const pins = useModulePins(module.id)
  const answer = useResource({ kind: 'module', moduleId: module.id })

  const view = 'data' in answer ? answer.data?.view : undefined
  const page = view ? definition.page(view, state.preview, { locale }) : noPage
  const failed = answer.state === 'error' ? answer : null
  const kept = failed !== null && view !== undefined

  return (
    <ModuleFrame module={module} view="page" basePath={basePath}>
      {children}
      {kept && (
        // A note on what follows, not an alarm: the frame's status region has already said the run failed.
        <Alert role={undefined} data-page-kept={failed.stale ? 'stale' : 'partial'}>
          <InfoIcon aria-hidden="true" />
          <AlertTitle>{t(failed.stale ? 'page.stale.title' : 'page.partial.title')}</AlertTitle>
          <AlertDescription>{t(failed.stale ? 'page.stale.body' : 'page.partial.body')}</AlertDescription>
        </Alert>
      )}
      <BlockRenderer
        page={page}
        state={answer.state === 'loading' ? 'loading' : failed && !kept ? 'error' : 'ready'}
        changes={run.last?.changes ?? noChanges}
        {...pins}
        onAction={definition.onAction && view ? (event) => definition.onAction?.(event, actions, view) : undefined}
        errorTitle={t('page.error.title')}
        error={failed ? failureWords(failed.reason, state, locale, t).text : undefined}
        onRetry={() => void actions.runModule(module.id)}
      />
    </ModuleFrame>
  )
}
