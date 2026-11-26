import { useState } from 'react'

import { DemoGroup } from '@/components/actions/demo-parts'
import { Stack } from '@/components/layout'
import { useT } from '@/i18n'

import { PersistenceSwitch } from './PersistenceSwitch'

export default function PersistenceSwitchDemo() {
  const t = useT('chat-components')
  const parents = [
    { value: 'appointments', label: t('demo.persistence.parent1') },
    { value: 'customers', label: t('demo.persistence.parent2') },
    { value: 'rota', label: t('demo.persistence.parent3') },
  ]
  const [created, setCreated] = useState<{ name: string; parentId: string } | null>(null)
  const [result, setResult] = useState(t('demo.persistence.nothing'))
  const [kept, setKept] = useState(true)
  return (
    <Stack gap="lg">
      <DemoGroup caption={t('demo.persistence.oneOff')}>
        <PersistenceSwitch
          persistent={created !== null}
          moduleName={created?.name}
          defaultName={t('demo.persistence.name')}
          parents={parents}
          defaultParent="appointments"
          onCreate={(input) => {
            setCreated(input)
            const parent = parents.find((each) => each.value === input.parentId)?.label ?? ''
            setResult(t('demo.persistence.created', { name: input.name, parent }))
          }}
          onArchive={() => {
            setCreated(null)
            setResult(t('demo.persistence.archived'))
          }}
        />
        <p role="status" className="text-sm text-muted-foreground">
          {result}
        </p>
      </DemoGroup>
      <DemoGroup caption={t('demo.persistence.persistent')}>
        <PersistenceSwitch
          persistent={kept}
          moduleName={t('demo.persistence.name')}
          defaultName={t('demo.persistence.name')}
          parents={parents}
          onCreate={() => setKept(true)}
          onArchive={() => setKept(false)}
        />
      </DemoGroup>
      <DemoGroup caption={t('demo.persistence.disabled')}>
        <PersistenceSwitch
          disabled
          persistent={false}
          defaultName={t('demo.persistence.name')}
          parents={parents}
          onCreate={() => undefined}
          onArchive={() => undefined}
        />
      </DemoGroup>
    </Stack>
  )
}
