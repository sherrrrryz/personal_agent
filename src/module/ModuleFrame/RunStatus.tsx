import { CircleAlertIcon, CircleCheckIcon, CircleDashedIcon } from 'lucide-react'
import { Link } from 'react-router'

import { Button } from '@/components/actions'
import { Alert, AlertDescription, AlertTitle, Spinner } from '@/components/feedback'
import { useFormat, useLocale, useT } from '@/i18n'
import { toDate, useRuntimeState, type RunState } from '@/runtime'

import { failureWords } from './failure'
import { linkClass } from './link-class'

/**
 * The run-state line of the `page` view: never-run, ok, running or failed —
 * an icon and words, never colour alone — then when it runs next. A failure
 * adds the reason in words and the way to fix it. The whole is one status
 * region, so a run that ends is announced without moving focus.
 *
 * Since D-50 the line is read in 模块设置; on the page the region stays,
 * `quiet`: its line out of sight (still announced), only a failure shown.
 * In 模块设置 it is not a region (`announce: false`) — the page's says it.
 */
export function RunStatus({
  run,
  onRetry,
  quiet = false,
  announce = true,
}: {
  run: RunState
  onRetry: () => void
  quiet?: boolean
  announce?: boolean
}) {
  const t = useT('module')
  const format = useFormat()
  const { locale } = useLocale()
  const state = useRuntimeState()
  const at = (time: string) => format.dateTime(toDate(time))

  const line = {
    'never-run': { icon: <CircleDashedIcon aria-hidden="true" className="size-4 shrink-0" />, text: t('run.never') },
    ok: {
      icon: <CircleCheckIcon aria-hidden="true" className="size-4 shrink-0" />,
      text: run.last ? t('run.ok', { time: at(run.last.at) }) : t('run.never'),
    },
    running: { icon: <Spinner role={undefined} aria-hidden="true" className="shrink-0" />, text: t('run.running') },
    failed: {
      icon: <CircleAlertIcon aria-hidden="true" className="size-4 shrink-0" />,
      text: run.last ? t('run.failed', { time: at(run.last.at) }) : t('run.failedNow'),
    },
  }[run.status]
  const failure = run.status === 'failed' ? failureWords(run.reason, state, locale, t) : null

  return (
    <div
      role={announce ? 'status' : undefined}
      data-run-status={run.status}
      // Quiet and not failed: the whole region is out of sight and takes no room in the page's flow.
      className={quiet && run.status !== 'failed' ? 'sr-only' : 'flex min-w-0 flex-col gap-2'}
    >
      <div className={`flex min-w-0 flex-col gap-1 ${quiet ? 'sr-only' : ''}`}>
        <p className="flex min-w-0 items-center gap-2 font-medium">
          {line.icon}
          <span className="min-w-0 wrap-break-word">{line.text}</span>
        </p>
        <p className="text-sm text-muted-foreground">
          {run.nextRunAt ? t('run.next', { time: at(run.nextRunAt) }) : t('run.next.none')}
        </p>
      </div>
      {failure && (
        // The status region says it politely; the kit's assertive `alert` role would say it twice.
        <Alert role={undefined} variant="destructive" data-run-failure={run.reason?.code ?? ''}>
          <CircleAlertIcon aria-hidden="true" />
          <AlertTitle>{t('failure.title')}</AlertTitle>
          <AlertDescription>{failure.text}</AlertDescription>
          {failure.fix && (
            // In the text's column and the surface's own foreground: inside the description
            // the control would inherit its fainter colour (`DataState` does the same).
            <div className="col-start-2 pt-2 text-card-foreground">
              {'retry' in failure.fix ? (
                <Button variant="secondary" size="sm" onClick={onRetry}>
                  {failure.fix.label}
                </Button>
              ) : (
                <Link to={failure.fix.to} className={linkClass}>
                  {failure.fix.label}
                </Link>
              )}
            </div>
          )}
        </Alert>
      )}
    </div>
  )
}
