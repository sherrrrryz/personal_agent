import { ClockIcon } from 'lucide-react'

import { useT } from '@/i18n'

import { Tabs } from './Tabs'

export default function TabsDemo() {
  const t = useT('navigation')
  return (
    <Tabs
      aria-label={t('demo.tabs.name')}
      tabs={[
        { value: 'breeds', label: t('demo.tabs.breeds'), content: <p>{t('demo.tabs.breedsBody')}</p> },
        { value: 'dogs', label: t('demo.tabs.dogs'), icon: <ClockIcon />, content: <p>{t('demo.tabs.dogsBody')}</p> },
        { value: 'archive', label: t('demo.tabs.archive'), disabled: true, content: null },
      ]}
    />
  )
}
