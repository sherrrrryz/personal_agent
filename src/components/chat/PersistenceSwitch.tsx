import { useId, useRef, useState, type FormEvent } from 'react'

import { Button } from '@/components/actions'
import { AlertDialog } from '@/components/containers'
import { Field, Input, Select, Switch } from '@/components/inputs'
import { Inline } from '@/components/layout'
import { useT } from '@/i18n'

export type PersistenceParent = { value: string; label: string }

export type PersistenceSwitchProps = {
  /** Whether the conversation is a sub-module already. The surface holds this; the switch never flips by itself. */
  persistent: boolean
  /** The name the confirmation is prefilled with. */
  defaultName: string
  /** The modules the sub-module may belong to; at least one. */
  parents: ReadonlyArray<PersistenceParent>
  /** The module the confirmation is prefilled with — the screen's. Default: the first. */
  defaultParent?: string
  /** She confirmed: create the sub-module. The surface then sets `persistent` (or navigates away). */
  onCreate: (input: { name: string; parentId: string }) => void
  /** She confirmed turning it off: archive the sub-module. */
  onArchive: () => void
  /** The sub-module the conversation became — named in the description and in the question asked before archiving. */
  moduleName?: string
  disabled?: boolean
}

/**
 * One-off or persistent (D-08). Turning it on asks first, in place, for the
 * name and the parent module; turning it off asks before archiving. Either
 * question answered with "cancel" leaves everything as it was.
 */
export function PersistenceSwitch({
  persistent,
  defaultName,
  parents,
  defaultParent,
  onCreate,
  onArchive,
  moduleName,
  disabled = false,
}: PersistenceSwitchProps) {
  const t = useT('chat-components')
  const common = useT('common')
  const headingId = useId()
  const root = useRef<HTMLDivElement>(null)
  const [confirming, setConfirming] = useState(false)
  const [asking, setAsking] = useState(false)
  const [name, setName] = useState(defaultName)
  const [parentId, setParentId] = useState(defaultParent ?? parents[0]?.value ?? '')
  const [nameMissing, setNameMissing] = useState(false)

  // Created from outside while the confirmation was open: the question is answered.
  if (persistent && confirming) setConfirming(false)

  function toSwitch() {
    root.current?.querySelector<HTMLElement>('[role="switch"]')?.focus()
  }

  function onCheckedChange(checked: boolean) {
    if (persistent) {
      if (!checked) setAsking(true)
      return
    }
    if (checked) {
      setName(defaultName)
      setParentId(defaultParent ?? parents[0]?.value ?? '')
      setNameMissing(false)
    }
    setConfirming(checked)
  }

  function create(event: FormEvent) {
    event.preventDefault()
    const trimmed = name.trim()
    if (trimmed === '') {
      setNameMissing(true)
      return
    }
    // The form is about to leave; focus goes back to the switch that opened it.
    toSwitch()
    setConfirming(false)
    onCreate({ name: trimmed, parentId })
  }

  function cancel() {
    toSwitch()
    setConfirming(false)
  }

  const description = persistent
    ? moduleName
      ? t('persistence.description.named', { name: moduleName })
      : t('persistence.description.on')
    : t('persistence.description.off')

  return (
    <div
      ref={root}
      data-slot="persistence-switch"
      data-state={persistent ? 'persistent' : confirming ? 'confirming' : 'one-off'}
      className="flex min-w-0 flex-col gap-3"
    >
      <Switch
        label={t('persistence.label')}
        description={description}
        checked={persistent || confirming}
        onCheckedChange={onCheckedChange}
        disabled={disabled}
      />
      {confirming && !persistent && (
        <form onSubmit={create} noValidate>
          <div role="group" aria-labelledby={headingId} className="flex min-w-0 flex-col gap-4 rounded-lg border p-3">
            <p id={headingId} className="text-sm font-medium">
              {t('persistence.confirm.title')}
            </p>
            <Field label={t('persistence.confirm.name')} error={nameMissing ? t('persistence.confirm.nameRequired') : undefined}>
              <Input
                value={name}
                required
                onChange={(event) => {
                  setName(event.target.value)
                  if (event.target.value.trim() !== '') setNameMissing(false)
                }}
              />
            </Field>
            <Field label={t('persistence.confirm.parent')}>
              <Select options={parents} value={parentId} onValueChange={setParentId} />
            </Field>
            <Inline>
              <Button type="submit">{t('persistence.confirm.create')}</Button>
              <Button variant="secondary" onClick={cancel}>
                {common('action.cancel')}
              </Button>
            </Inline>
          </div>
        </form>
      )}
      <AlertDialog
        open={asking}
        onOpenChange={setAsking}
        title={moduleName ? t('persistence.archive.titleNamed', { name: moduleName }) : t('persistence.archive.title')}
        description={t('persistence.archive.body')}
        confirmLabel={t('persistence.archive.confirm')}
        confirmVariant="danger"
        onConfirm={onArchive}
      />
    </div>
  )
}
