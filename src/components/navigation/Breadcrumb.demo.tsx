import { DemoGroup } from '@/components/actions/demo-parts'
import { Stack } from '@/components/layout'
import { useT } from '@/i18n'

import { Breadcrumb } from './Breadcrumb'

export default function BreadcrumbDemo() {
  const t = useT('navigation')
  const path = [
    { label: t('demo.breadcrumb.shop'), render: <a href="#demo-shop" /> },
    { label: t('demo.breadcrumb.bookings'), render: <a href="#demo-bookings" /> },
    { label: t('demo.breadcrumb.duration') },
  ]
  return (
    <Stack gap="lg">
      <DemoGroup caption={t('demo.breadcrumb.wide')}>
        <Breadcrumb items={path} aria-label={t('demo.breadcrumb.wide')} />
      </DemoGroup>
      <DemoGroup caption={t('demo.breadcrumb.narrow')}>
        {/* A narrow box stands in for the compact header; the breadcrumb answers to its container. */}
        <div className="flex w-56 max-w-full rounded-md border p-1">
          <Breadcrumb items={path} aria-label={t('demo.breadcrumb.narrow')} />
        </div>
      </DemoGroup>
      <DemoGroup caption={t('demo.breadcrumb.single')}>
        <Breadcrumb items={path.slice(0, 1)} />
      </DemoGroup>
    </Stack>
  )
}
