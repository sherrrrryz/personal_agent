import { useState } from 'react'
import { Link } from 'react-router'

import { Button } from '@/components/actions'
import { Collapsible, CollapsibleContent, CollapsibleTrigger, Separator } from '@/components/containers'
import { BehaviourModeBadge } from '@/components/data-display'
import { DataState, Skeleton } from '@/components/feedback'
import { BehaviourModePicker } from '@/components/inputs'
import { Page, Stack } from '@/components/layout'
import { taskKindNames } from '@/fixtures'
import { useLocale, useT } from '@/i18n'
import type { BehaviourMode } from '@/lib/vocab'
import {
  actionsOfKind,
  effectiveMode,
  isCapped,
  taskKinds,
  useActions,
  useResource,
  useRuntimeState,
  viewOf,
  type Module,
  type RuntimeState,
  type TaskKind,
  type WfNode,
} from '@/runtime'
import { modulePath } from '@/shell'

const linkClass = 'underline underline-offset-4 wrap-anywhere'

/** How many actions a row shows before 展开全部. */
const SHOWN = 5

type Affected = { module: Module; node: WfNode }

/**
 * `settings.ai-modes` — one row per kind of task: the ceiling she sets
 * (D-22), with a fourth choice 未设置, and under it the workflow actions the
 * setting applies to, each with the mode it now really runs in.
 *
 * Under 出错 the settings cannot be read: the page says so and shows the last
 * state it has; a choice made then cannot be saved — it falls back to the
 * earlier one, with the error as text beside the field.
 */
export function AiModesPage() {
  const [attempt, setAttempt] = useState(0)
  return <AiModes key={attempt} onRetry={() => setAttempt((count) => count + 1)} />
}

function AiModes({ onRetry }: { onRetry: () => void }) {
  const t = useT('settings')
  const { locale } = useLocale()
  const actions = useActions()
  const state = useRuntimeState()
  const answer = useResource({ kind: 'mode-settings' })
  const [errors, setErrors] = useState<Partial<Record<TaskKind, string>>>({})

  const failed = answer.state === 'error'
  // The workflows as the preview shows them: the long variant has the row that caps twelve actions.
  const view = viewOf(state)
  const settings = failed ? state.modeSettings : answer.state === 'loading' ? [] : answer.data

  function choose(taskKind: TaskKind, value: BehaviourMode | 'unset') {
    if (failed) {
      setErrors({ ...errors, [taskKind]: t('modes.save.error') })
      return
    }
    setErrors({ ...errors, [taskKind]: undefined })
    actions.setCeiling({ taskKind, ceiling: value === 'unset' ? null : value })
  }

  const rows = (
    <Stack gap="lg">
      {taskKinds.map((taskKind, index) => {
        const ceiling = settings.find((setting) => setting.taskKind === taskKind)?.ceiling ?? null
        return (
          <Stack key={taskKind} gap="md" data-task-kind={taskKind}>
            {index > 0 && <Separator />}
            <BehaviourModePicker<'unset'>
              legend={taskKindNames[taskKind][locale]}
              value={ceiling ?? 'unset'}
              onValueChange={(value) => choose(taskKind, value)}
              extraOptions={[{ value: 'unset', label: t('modes.unset'), description: t('modes.unset.meaning') }]}
              error={errors[taskKind]}
            />
            <AffectedActions view={view} affected={actionsOfKind(view, taskKind)} />
          </Stack>
        )
      })}
    </Stack>
  )

  return (
    <Page title={t('modes.title')} description={t('modes.lead')} width="prose">
      <DataState
        state={answer.state === 'loading' ? 'loading' : failed ? 'error' : 'ready'}
        loadingLabel={t('modes.loading')}
        loading={
          <Stack gap="md">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
          </Stack>
        }
        errorTitle={t('modes.error.title')}
        error={t('modes.error.body')}
        onRetry={onRetry}
      >
        {rows}
      </DataState>
      {failed && rows}
    </Page>
  )
}

/** The actions a kind of task covers: the first five, the rest behind 展开全部. */
function AffectedActions({ view, affected }: { view: RuntimeState; affected: Affected[] }) {
  const t = useT('settings')
  const { locale } = useLocale()

  const items = (list: Affected[]) =>
    list.map(({ module, node }) => (
      <li key={`${module.id}:${node.id}`} className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1">
        <Link to={`${modulePath(module.id)}/workflow`} className={linkClass}>
          {t('modes.affected.item', { module: module.name[locale], action: node.label[locale] })}
        </Link>
        <BehaviourModeBadge mode={effectiveMode(view, node)} />
        {isCapped(view, node) && <span className="text-sm text-muted-foreground">{t('modes.capped')}</span>}
      </li>
    ))
  const listClass = 'flex min-w-0 flex-col gap-2'

  return (
    <Stack gap="sm">
      <p className="text-sm font-medium">{t('modes.affected')}</p>
      {affected.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t('modes.affected.none')}</p>
      ) : (
        <>
          <ul className={listClass}>{items(affected.slice(0, SHOWN))}</ul>
          {affected.length > SHOWN && (
            <Collapsible className="flex flex-col items-start gap-2">
              <CollapsibleTrigger
                render={<Button variant="secondary" size="sm">{t('modes.showAll', { count: affected.length })}</Button>}
              />
              <CollapsibleContent className="w-full">
                <ul className={listClass}>{items(affected.slice(SHOWN))}</ul>
              </CollapsibleContent>
            </Collapsible>
          )}
        </>
      )}
    </Stack>
  )
}
