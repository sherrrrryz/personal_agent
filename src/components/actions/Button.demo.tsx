import { Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'

import { Inline, Stack } from '@/components/layout'
import { useT } from '@/i18n'

import { Button } from './Button'
import { DemoGroup, DemoSurfaces } from './demo-parts'

export default function ButtonDemo() {
  const t = useT('inputs')
  const [loading, setLoading] = useState(false)
  return (
    <Stack gap="lg">
      <DemoGroup caption={t('demo.variants')}>
        <Inline>
          <Button variant="primary">{t('button.demo.primary')}</Button>
          <Button variant="secondary">{t('button.demo.secondary')}</Button>
          <Button variant="ghost">{t('button.demo.ghost')}</Button>
          <Button variant="danger">
            <Trash2 aria-hidden="true" />
            {t('button.demo.danger')}
          </Button>
          <Button variant="link">{t('button.demo.link')}</Button>
        </Inline>
      </DemoGroup>
      <DemoGroup caption={t('demo.sizes')}>
        <Inline>
          <Button size="sm" variant="secondary">
            {t('button.demo.small')}
          </Button>
          <Button size="md" variant="secondary">
            <Plus aria-hidden="true" />
            {t('button.demo.withIcon')}
          </Button>
          <Button size="icon" variant="secondary" aria-label={t('button.demo.add')}>
            <Plus aria-hidden="true" />
          </Button>
        </Inline>
      </DemoGroup>
      <DemoGroup caption={t('demo.states')}>
        <Inline>
          <Button disabled>{t('button.demo.disabled')}</Button>
          <Button loading={loading}>{t('button.demo.primary')}</Button>
          <Button variant="ghost" aria-pressed={loading} onClick={() => setLoading((on) => !on)}>
            {loading ? t('button.demo.stopLoading') : t('button.demo.startLoading')}
          </Button>
        </Inline>
      </DemoGroup>
      <DemoGroup caption={t('demo.wrapping')}>
        <Inline>
          <Button variant="secondary">
            <Plus aria-hidden="true" />
            {t('button.demo.long')}
          </Button>
        </Inline>
      </DemoGroup>
      <DemoGroup caption={t('demo.surfaces')}>
        <DemoSurfaces>{() => <Inline><Button variant="secondary">{t('button.demo.secondary')}</Button><Button variant="danger">{t('button.demo.danger')}</Button></Inline>}</DemoSurfaces>
      </DemoGroup>
    </Stack>
  )
}
