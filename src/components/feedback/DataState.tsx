import { CircleAlert } from 'lucide-react'
import { useRef, useState, type ReactNode } from 'react'

import { Button } from '@/components/actions'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Empty, EmptyHeader, EmptyTitle } from '@/components/ui/empty'
import { Skeleton } from '@/components/ui/skeleton'
import { Spinner } from '@/components/ui/spinner'
import { useT } from '@/i18n'

import type { DataStateValue } from './data-states'

export type DataStateProps = {
  /** Which of the four states the data is in. */
  state: DataStateValue
  /** The data, shown while `ready`. */
  children?: ReactNode
  /** While `loading`: a skeleton shaped like the content. Default: three lines. */
  loading?: ReactNode
  /** While `loading`: the status text beside the spinner. Default: the shared "Loading…". */
  loadingLabel?: string
  /** While `empty`: the kit's `Empty`, in the screen's own words. Default: a general title. */
  empty?: ReactNode
  /** While `error`: the title of the alert. Default: a general one. */
  errorTitle?: ReactNode
  /** While `error`: the reason in the screen's own words, and what still works. Default: a general one. */
  error?: ReactNode
  /** While `error`: shows the retry button and is called when it is pressed. */
  onRetry?: () => void
}

// Loading is the one state that shows both parts — the status text and the skeleton — so only it needs a gap.
const loadingLayout = 'flex min-w-0 flex-col gap-4'

/**
 * The four states of a data surface in one place, so that every block, list
 * and panel loads, is empty and fails the same way — and says so to assistive
 * technology. The status region is always present; what a state shows is put
 * into it, which is what makes a change announced politely, without moving
 * focus. The data itself sits beside it, in a region that is `aria-busy`
 * while loading.
 */
export function DataState({ state, children, loading, loadingLabel, empty, errorTitle, error, onRetry }: DataStateProps) {
  const t = useT('feedback')
  const common = useT('common')
  const status = useRef<HTMLDivElement>(null)

  // "Loaded." is said only after a change: a surface that is ready from the start announces nothing.
  const [shown, setShown] = useState(state)
  const [changed, setChanged] = useState(false)
  if (shown !== state) {
    setShown(state)
    setChanged(true)
  }

  function retry() {
    // The button is about to leave the page; focus goes to the status region instead of being lost.
    status.current?.focus()
    onRetry?.()
  }

  return (
    <div data-slot="data-state" data-state={state} className={state === 'loading' ? loadingLayout : 'min-w-0'}>
      <div
        ref={status}
        role="status"
        tabIndex={-1}
        // Never `display: none`, even when empty: a live region has to be there before its text arrives.
        className="min-w-0 rounded-lg outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        {state === 'loading' && (
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <Spinner role={undefined} aria-hidden="true" className="shrink-0" />
            {loadingLabel ?? common('status.loading')}
          </p>
        )}
        {state === 'empty' &&
          (empty ?? (
            <Empty>
              <EmptyHeader>
                <EmptyTitle>{t('dataState.empty.title')}</EmptyTitle>
              </EmptyHeader>
            </Empty>
          ))}
        {state === 'error' && (
          // The status region announces it politely; the kit's assertive `alert` role would say it twice.
          <Alert role={undefined} variant="destructive">
            <CircleAlert aria-hidden="true" />
            <AlertTitle>{errorTitle ?? t('dataState.error.title')}</AlertTitle>
            <AlertDescription>{error ?? t('dataState.error.reason')}</AlertDescription>
            {onRetry && (
              // Under the text, in the text's column, in the surface's own foreground: inside the
              // description the button would inherit its fainter colour and miss 4.5:1 in dark.
              <div className="col-start-2 pt-2 text-card-foreground">
                <Button variant="secondary" size="sm" onClick={retry}>
                  {common('action.retry')}
                </Button>
              </div>
            )}
          </Alert>
        )}
        {state === 'ready' && changed && <p className="sr-only">{t('dataState.loaded')}</p>}
      </div>
      <div data-slot="data-state-content" aria-busy={state === 'loading' || undefined} className="min-w-0">
        {state === 'loading' && (
          // Shapes, not content: hidden from assistive technology, which has the status text.
          <div aria-hidden="true">
            {loading ?? (
              <div className="flex flex-col gap-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
              </div>
            )}
          </div>
        )}
        {state === 'ready' && children}
      </div>
    </div>
  )
}
