import { useState } from 'react'
import { useNavigate } from 'react-router'

import { BlockItemLink } from '@/blocks/list/parts'
import { Button } from '@/components/actions'
import { Sheet } from '@/components/containers'
import { Field, Input } from '@/components/inputs'
import { Stack } from '@/components/layout'
import { appointmentStatus, column, nodeId, tableId } from '@/fixtures/keys'
import { useFormat, useLocale } from '@/i18n'
import { numberCell, rowOf, stringCell, tableOf, toDate, useActions, useRuntimeState } from '@/runtime'
import { modulePath, useCameFrom } from '@/shell'

import { durationModuleId, pageTools, petPath } from './page-tools'

const a = column.appointments

/**
 * The appointment sheet (spec part 3, `profession.appointments`): the dog
 * with a link to its file, the estimate and what it rests on with a link to
 * the step that decides it, then 开始 → 已开始 10:00 → 实际耗时 → 完成.
 * 开始 is kept here only — the runtime has no started booking; 完成 records
 * the actual duration and runs the workflows that report it.
 */
export function AppointmentSheet({ moduleId, appointmentId, basePath }: { moduleId: string; appointmentId: string; basePath: string }) {
  const { locale } = useLocale()
  const format = useFormat()
  const navigate = useNavigate()
  const cameFrom = useCameFrom()
  const actions = useActions()
  // The booking as it is, never forced by 状态预览: the address must open whatever is being previewed.
  const state = useRuntimeState()
  const tools = pageTools(state, locale)
  const { t } = tools
  const table = tableOf(state, tableId.appointments)
  const row = rowOf(table, appointmentId)
  const estimate = numberCell(row, a.estimate) ?? 0
  const [startedAt, setStartedAt] = useState<string | null>(null)
  const [minutes, setMinutes] = useState(String(estimate))
  const [invalid, setInvalid] = useState(false)
  if (!row) return null

  const dog = stringCell(row, a.dog) ?? ''
  const start = stringCell(row, a.start)
  const status = row.cells[a.status]
  const actual = numberCell(row, a.actual)
  const extra = numberCell(row, a.extra)
  const duration = durationModuleId(state)
  // Closing returns to the page it was opened from (D-53): back, when that is where she came from, so that
  // 返回 afterwards does not open the sheet again; else the page, in place of the sheet's address.
  const close = () => void (cameFrom === basePath ? navigate(-1) : navigate(basePath, { replace: true }))

  const finish = () => {
    const value = Number(minutes)
    if (!Number.isInteger(value) || value <= 0) return setInvalid(true)
    actions.recordActualDuration({ appointmentId, minutes: value })
    // The run reports the change, so the page marks the slot; 服务时长 rewrites its own page from the new record.
    void actions.runModule(moduleId)
    if (duration) void actions.runModule(duration)
    close()
  }

  return (
    <Sheet
      open
      onOpenChange={(open) => {
        if (!open) close()
      }}
      title={tools.dogLabel(dog)}
      description={
        start
          ? t('sheet.description', {
              time: format.dateTime(toDate(start)),
              groomer: tools.cell(table, row, a.groomer),
              service: tools.cell(table, row, a.service),
            })
          : t('sheet.requested')
      }
      footer={
        status === appointmentStatus.booked &&
        (startedAt === null ? (
          <Button onClick={() => setStartedAt(state.storyTime)}>{t('sheet.start')}</Button>
        ) : (
          <Button onClick={finish}>{t('sheet.finish')}</Button>
        ))
      }
    >
      <Stack gap="md" data-appointment={appointmentId}>
        <p>
          <BlockItemLink href={petPath(dog)}>{t('sheet.dog', { name: tools.dogName(dog) })}</BlockItemLink>
        </p>
        <p>
          {t('estimate.words', { duration: format.duration(estimate), basis: tools.basisWords(stringCell(row, a.basis)) })}
          {extra ? ` (${t('estimate.extra', { duration: format.duration(extra) })})` : null}
        </p>
        <p>
          <BlockItemLink href={duration ? `${modulePath(duration)}/workflow?node=${extra ? nodeId.firstVisit : nodeId.estimate}` : `${modulePath(moduleId)}/workflow`}>
            {t('sheet.why')}
          </BlockItemLink>
        </p>
        {status === appointmentStatus.done && actual !== null && <p role="status">{t('sheet.done', { duration: format.duration(actual) })}</p>}
        {status === appointmentStatus.booked && startedAt !== null && (
          <>
            <p role="status">{t('sheet.started', { time: format.time(toDate(startedAt)) })}</p>
            <Field label={t('sheet.actual.label')} description={t('sheet.actual.description')} error={invalid ? t('sheet.actual.error') : undefined}>
              <Input
                type="number"
                inputMode="numeric"
                min={1}
                value={minutes}
                onChange={(event) => {
                  setMinutes(event.target.value)
                  setInvalid(false)
                }}
              />
            </Field>
          </>
        )}
      </Stack>
    </Sheet>
  )
}
