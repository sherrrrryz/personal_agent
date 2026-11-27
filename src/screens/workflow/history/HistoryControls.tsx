import { useState } from 'react'
import { useSearchParams } from 'react-router'

import { Button } from '@/components/actions'
import { Sheet } from '@/components/containers'
import { Alert, AlertAction, AlertDescription, AlertTitle, Badge } from '@/components/feedback'
import { Stack } from '@/components/layout'
import { formatDateTime, useLocale, useT } from '@/i18n'
import { toDate } from '@/runtime'

import { shownNumber, showsProposal } from '../diff/compare'
import { shownCurrent, type EditorSlotProps } from '../slots'

/** The address parameter that opens the sheet with the page: `/m/<ia-id>/workflow?history=open` (the matrix and the flows use it). */
const HISTORY_PARAM = 'history'

/**
 * 历史 in the version line: a sheet listing every version — number, date,
 * who made it (AI / 你) and why — newest first. 查看 opens a version (an old
 * one read-only), 与当前对比 marks on the current version what has changed
 * since that one.
 */
export function HistoryActions({ workflow, onShownChange }: EditorSlotProps) {
  const t = useT('workflow-history')
  const { locale } = useLocale()
  const [search] = useSearchParams()
  const [open, setOpen] = useState(() => search.get(HISTORY_PARAM) === 'open')
  const versions = [...workflow.versions].sort((one, other) => other.n - one.n)

  function show(next: Parameters<typeof onShownChange>[0]) {
    setOpen(false)
    onShownChange(next)
  }

  return (
    <Sheet
      open={open}
      onOpenChange={setOpen}
      trigger={
        <Button variant="secondary" size="sm">
          {t('history.open')}
        </Button>
      }
      title={t('history.title')}
      description={t('history.description')}
    >
      <Stack as="ol" gap="lg" data-slot="workflow-history">
        {versions.map((version) => {
          const current = version.n === workflow.current
          return (
            <li key={version.n} data-version={version.n} className="flex min-w-0 flex-col gap-2">
              <p className="flex flex-wrap items-center gap-2 font-medium">
                {t('history.version', { n: version.n })}
                {current && <Badge variant="outline">{t('history.current')}</Badge>}
              </p>
              <p className="text-sm text-muted-foreground">
                {t('history.meta', { date: formatDateTime(locale, toDate(version.at)), author: t(`history.author.${version.author}`) })}
              </p>
              <p className="wrap-anywhere">{version.reason[locale]}</p>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  aria-label={t('history.view.name', { n: version.n })}
                  onClick={() => show(current ? shownCurrent : { version: version.n, compareTo: null })}
                >
                  {t('history.view')}
                </Button>
                {!current && (
                  <Button
                    variant="secondary"
                    size="sm"
                    aria-label={t('history.compare.name', { n: version.n })}
                    onClick={() => show({ version: null, compareTo: version.n })}
                  >
                    {t('history.compare')}
                  </Button>
                )}
              </div>
            </li>
          )
        })}
      </Stack>
    </Sheet>
  )
}

/** Above the view: the banner of an old version — it is read-only, and how to get back. */
export function OldVersionBanner({ workflow, shown, onShownChange }: EditorSlotProps) {
  const t = useT('workflow-history')
  const n = shownNumber(workflow, shown)
  if (showsProposal(workflow, shown) || n === workflow.current) return null
  return (
    <Alert data-slot="workflow-old-version">
      <AlertTitle>{t('old.title', { n })}</AlertTitle>
      <AlertDescription>{t('old.body', { current: workflow.current })}</AlertDescription>
      <AlertAction>
        <Button variant="secondary" size="sm" onClick={() => onShownChange(shownCurrent)}>
          {t('old.back')}
        </Button>
      </AlertAction>
    </Alert>
  )
}
