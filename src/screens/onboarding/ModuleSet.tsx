import { PlusIcon } from 'lucide-react'
import { useId, useRef, useState, type FormEvent } from 'react'

import { Button } from '@/components/actions'
import { AlertDialog, Dialog } from '@/components/containers'
import { Item, ItemActions, ItemContent, ItemDescription, ItemGroup, ItemTitle } from '@/components/data-display'
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle, toast } from '@/components/feedback'
import { Field, Input, Textarea } from '@/components/inputs'
import { Stack } from '@/components/layout'
import { useLocale, useT } from '@/i18n'
import { useActions, type Module } from '@/runtime'

/** The name-and-purpose form of 重命名 and 添加模块, in a `Dialog`. */
function ModuleDialog({
  open,
  onOpenChange,
  title,
  description,
  initialName,
  withPurpose,
  onSave,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description?: string
  initialName: string
  withPurpose: boolean
  onSave: (input: { name: string; purpose: string }) => void
}) {
  const t = useT('onboarding')
  const formId = useId()
  const [name, setName] = useState(initialName)
  const [purpose, setPurpose] = useState('')
  const [missing, setMissing] = useState(false)

  function submit(event: FormEvent) {
    event.preventDefault()
    if (name.trim() === '') {
      setMissing(true)
      return
    }
    onSave({ name: name.trim(), purpose: purpose.trim() })
    onOpenChange(false)
  }

  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      description={description}
      footer={
        <>
          <Button variant="secondary" onClick={() => onOpenChange(false)}>
            {t('action.cancel')}
          </Button>
          <Button type="submit" form={formId}>
            {t('set.save')}
          </Button>
        </>
      }
    >
      <form id={formId} onSubmit={submit} noValidate>
        <Stack gap="md">
          <Field label={t('set.field.name')} error={missing ? t('set.field.name.error') : undefined}>
            <Input
              value={name}
              onChange={(event) => {
                setName(event.target.value)
                setMissing(false)
              }}
            />
          </Field>
          {withPurpose && (
            <Field label={t('set.field.purpose')} description={t('set.field.purpose.hint')}>
              <Textarea value={purpose} onChange={(event) => setPurpose(event.target.value)} />
            </Field>
          )}
        </Stack>
      </form>
    </Dialog>
  )
}

/**
 * The profession-module set as she edits it — one composition for
 * `onboarding.modules` and `settings.profession` (spec part 3 § Screens):
 * one row per module with what its workflow does, 重命名 in a `Dialog`, 移除,
 * and 添加模块. A removal is undone from a toast in onboarding and confirmed
 * first in settings (`confirmRemoval`). Every change goes to the runtime at
 * once, so the sidebar — where there is one — follows.
 */
export function ModuleSet({
  modules,
  confirmRemoval = false,
  rows = 'outline',
}: {
  modules: Module[]
  confirmRemoval?: boolean
  /** `card`: each row filled with the card surface, on the onboarding gradient (D-52). */
  rows?: 'outline' | 'card'
}) {
  const t = useT('onboarding')
  const { locale } = useLocale()
  const actions = useActions()
  const addButton = useRef<HTMLButtonElement>(null)
  const [renaming, setRenaming] = useState<Module | null>(null)
  const [adding, setAdding] = useState(false)

  function remove(module: Module) {
    const name = module.name[locale]
    // The row is about to leave the page: focus goes to what stays.
    addButton.current?.focus()
    actions.removeModule(module.id)
    toast(
      t('set.removed', { name }),
      confirmRemoval ? {} : { action: { label: t('set.undo'), onClick: () => void actions.addModule({ restore: module.id }) } },
    )
  }

  return (
    <Stack gap="md">
      {modules.length === 0 ? (
        <Empty>
          <EmptyHeader>
            <EmptyTitle>{t('set.empty.title')}</EmptyTitle>
            <EmptyDescription>{t('set.empty.body')}</EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <ItemGroup aria-label={t('set.label')}>
          {modules.map((module) => {
            const name = module.name[locale]
            return (
              <Item key={module.id} variant={rows}>
                <ItemContent>
                  <ItemTitle>{name}</ItemTitle>
                  <ItemDescription>{module.description[locale]}</ItemDescription>
                </ItemContent>
                <ItemActions>
                  <Button variant="secondary" size="sm" aria-label={t('set.rename.name', { name })} onClick={() => setRenaming(module)}>
                    {t('set.rename')}
                  </Button>
                  {confirmRemoval ? (
                    <AlertDialog
                      trigger={
                        <Button variant="secondary" size="sm" aria-label={t('set.remove.name', { name })}>
                          {t('set.remove')}
                        </Button>
                      }
                      title={t('set.remove.confirm.title', { name })}
                      description={t('set.remove.confirm.body')}
                      confirmLabel={t('set.remove')}
                      confirmVariant="danger"
                      onConfirm={() => remove(module)}
                    />
                  ) : (
                    <Button variant="secondary" size="sm" aria-label={t('set.remove.name', { name })} onClick={() => remove(module)}>
                      {t('set.remove')}
                    </Button>
                  )}
                </ItemActions>
              </Item>
            )
          })}
        </ItemGroup>
      )}
      <div>
        <Button ref={addButton} variant="secondary" onClick={() => setAdding(true)}>
          <PlusIcon aria-hidden="true" />
          {t('set.add')}
        </Button>
      </div>
      {renaming && (
        <ModuleDialog
          open
          onOpenChange={(open) => !open && setRenaming(null)}
          title={t('set.rename.title')}
          initialName={renaming.name[locale]}
          withPurpose={false}
          onSave={({ name }) => actions.renameModule({ moduleId: renaming.id, name })}
        />
      )}
      {adding && (
        <ModuleDialog
          open
          onOpenChange={setAdding}
          title={t('set.add.title')}
          description={t('set.add.description')}
          initialName=""
          withPurpose
          onSave={({ name, purpose }) => {
            actions.addModule({ name, description: purpose || undefined })
            toast(t('set.added', { name }))
          }}
        />
      )}
    </Stack>
  )
}
