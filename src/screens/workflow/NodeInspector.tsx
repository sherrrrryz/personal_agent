import { useState } from 'react'

import { Button } from '@/components/actions'
import { Sheet } from '@/components/containers'
import { toast } from '@/components/feedback'
import { BehaviourModePicker, Field, Input, InputGroup, Select, Switch } from '@/components/inputs'
import { Stack } from '@/components/layout'
import type { WorkflowCanvasNode } from '@/components/workflow'
import { useIsMobile } from '@/hooks/use-mobile'
import { locales, translate, useLocale, useT, type Locale, type MessageKey, type MessageParams } from '@/i18n'
import { behaviourMode, type BehaviourMode } from '@/lib/vocab'
import { ceilingFor, useActions, useRuntimeState, type Text, type WfNode, type WfParam, type Workflow } from '@/runtime'

import { weekdayOf, weekdays, type Weekday } from './node-view'

// The node inspector (spec part 3 § Workflow editor, "Inspector"): a sheet
// with what the node's kind lets her adjust. 保存 goes through
// `saveNodeParams` and so always makes a new version with its reason in
// words; 取消, Escape and the close button discard.

const timePattern = /^([01]\d|2[0-3]):[0-5]\d$/

/** A sentence in both locales (D-17): a version's reason is story data, read in either language later. */
function inBoth(key: MessageKey<'workflow'>, params: (locale: Locale) => MessageParams): Text {
  const [zh, en] = locales.map((locale) => translate(locale, 'workflow', key, params(locale)))
  return { 'zh-CN': zh, en }
}

type Draft = { params: Record<string, string | boolean>; mode: BehaviourMode | undefined }

const draftOf = (node: WfNode): Draft => ({
  params: Object.fromEntries(Object.entries(node.params).map(([name, value]) => [name, typeof value === 'boolean' ? value : String(value)])),
  mode: node.mode,
})

/** The error key of a field as typed, or `null` when it can be saved. */
function errorOf(name: string, typedValue: string | boolean, original: WfParam): MessageKey<'workflow'> | null {
  if (typeof typedValue === 'boolean' || name === 'weekday') return null
  if (name === 'time') return timePattern.test(typedValue) ? null : 'field.time.error'
  if (typeof original === 'number') return /^[1-9]\d*$/.test(typedValue.trim()) ? null : 'field.number.error'
  return typedValue.trim() === '' ? 'field.text.error' : null
}

const parsed = (typedValue: string | boolean, original: WfParam): WfParam =>
  typeof typedValue === 'boolean' ? typedValue : typeof original === 'number' ? Number(typedValue) : typedValue

export type NodeInspectorProps = {
  workflow: Workflow
  /** The node as the workflow holds it, and as the views show it. */
  node: WfNode
  view: WorkflowCanvasNode
  open: boolean
  onOpenChange: (open: boolean) => void
  /** An old version or a proposed change: everything is shown, nothing can be saved. */
  readOnly?: boolean
}

export function NodeInspector({ workflow, node, view, open, onOpenChange, readOnly = false }: NodeInspectorProps) {
  const t = useT('workflow')
  const common = useT('common')
  const { locale } = useLocale()
  const compact = useIsMobile()
  const actions = useActions()
  const ceiling = useRuntimeState((state) => (node.taskKind ? ceilingFor(state, node.taskKind) : null))
  const [draft, setDraft] = useState(() => draftOf(node))
  const [checked, setChecked] = useState(false)

  const names = Object.keys(node.params)
  const fixedKind = node.kind === 'source' || node.kind === 'output' || node.kind === 'memory' ? node.kind : null
  const fixed = fixedKind !== null
  const adjustable = !fixed && (names.length > 0 || node.kind === 'action')
  const errors = Object.fromEntries(names.map((name) => [name, errorOf(name, draft.params[name], node.params[name])]))
  const setParam = (name: string, value: string | boolean) => setDraft((previous) => ({ ...previous, params: { ...previous.params, [name]: value } }))

  function save() {
    setChecked(true)
    if (Object.values(errors).some(Boolean)) return
    const changed = names.filter((name) => parsed(draft.params[name], node.params[name]) !== node.params[name])
    const modeChanged = draft.mode !== undefined && draft.mode !== node.mode
    if (changed.length === 0 && !modeChanged) return onOpenChange(false)

    const params = Object.fromEntries(changed.map((name) => [name, parsed(draft.params[name], node.params[name])]))
    const label = (each: Locale) => node.label[each]
    const day = weekdayOf(draft.params.weekday)
    let reason: Text
    if (changed.includes('time') || changed.includes('weekday')) {
      reason = day
        ? inBoth('reason.weekly', (each) => ({ label: label(each), weekday: translate(each, 'workflow', `weekday.${day}`), time: String(draft.params.time) }))
        : inBoth('reason.daily', (each) => ({ label: label(each), time: String(draft.params.time) }))
    } else if (changed.includes('thresholdMinutes')) {
      reason = inBoth('reason.threshold', (each) => ({ label: label(each), minutes: String(params.thresholdMinutes) }))
    } else if (modeChanged && draft.mode) {
      const { nameKey } = behaviourMode[draft.mode]
      reason = inBoth('reason.mode', (each) => ({ label: label(each), mode: translate(each, 'common', nameKey) }))
    } else {
      reason = inBoth('reason.params', (each) => ({ label: label(each) }))
    }

    const n = Math.max(...workflow.versions.map((version) => version.n)) + 1
    const saved = actions.saveNodeParams({
      workflowId: workflow.id,
      nodeId: node.id,
      params: changed.length > 0 ? params : undefined,
      mode: modeChanged ? draft.mode : undefined,
      reason,
    })
    if (saved) toast(t('saved', { n }), { kind: 'success', description: reason[locale] })
    onOpenChange(false)
  }

  const canSave = adjustable && !readOnly
  return (
    <Sheet
      open={open}
      onOpenChange={onOpenChange}
      side={compact ? 'bottom' : 'end'}
      title={t('node.name', { kind: t(`kind.${node.kind}`), label: node.label[locale] })}
      description={
        readOnly ? t('inspector.readOnly.version') : adjustable ? t('inspector.description') : t(`inspector.readOnly.${fixedKind ?? 'none'}`)
      }
      footer={
        canSave ? (
          <>
            <Button onClick={save}>{common('action.save')}</Button>
            <Button variant="secondary" onClick={() => onOpenChange(false)}>
              {common('action.cancel')}
            </Button>
          </>
        ) : undefined
      }
    >
      <Stack gap="md">
        {view.lines?.map((line) => (
          <p key={line}>{line}</p>
        ))}
        {!fixed &&
          names.map((name) => {
            const value = draft.params[name]
            const error = checked && errors[name] ? t(errors[name]) : undefined
            if (typeof value === 'boolean') {
              return (
                <Switch
                  key={name}
                  label={t('field.param', { name })}
                  checked={value}
                  onCheckedChange={(next) => setParam(name, next)}
                  disabled={readOnly}
                />
              )
            }
            if (name === 'weekday') {
              return (
                <Field key={name} label={t('field.weekday')} disabled={readOnly}>
                  <Select<Weekday>
                    options={weekdays.map((day) => ({ value: day, label: t(`weekday.${day}`) }))}
                    value={weekdayOf(value)}
                    onValueChange={(next) => setParam(name, next)}
                    disabled={readOnly}
                  />
                </Field>
              )
            }
            if (name === 'time') {
              return (
                <Field key={name} label={t('field.time')} error={error} disabled={readOnly}>
                  <Input type="time" value={value} onChange={(event) => setParam(name, event.target.value)} />
                </Field>
              )
            }
            const numeric = typeof node.params[name] === 'number'
            const input = (
              <Input
                type={numeric ? 'number' : 'text'}
                inputMode={numeric ? 'numeric' : undefined}
                value={value}
                onChange={(event) => setParam(name, event.target.value)}
              />
            )
            return (
              <Field
                key={name}
                label={name === 'thresholdMinutes' ? t('field.threshold') : t('field.param', { name })}
                error={error}
                disabled={readOnly}
              >
                {name.endsWith('Minutes') ? <InputGroup end={t('field.minutes')}>{input}</InputGroup> : input}
              </Field>
            )
          })}
        {node.kind === 'action' && (
          <BehaviourModePicker
            legend={t('field.mode')}
            description={t('field.mode.description')}
            value={draft.mode ?? 'assisted'}
            onValueChange={(mode) => setDraft((previous) => ({ ...previous, mode }))}
            ceiling={ceiling ?? undefined}
            disabled={readOnly}
          />
        )}
      </Stack>
    </Sheet>
  )
}
