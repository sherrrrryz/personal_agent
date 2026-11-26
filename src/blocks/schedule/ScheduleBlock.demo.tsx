import { DemoGroup } from '@/components/actions/demo-parts'
import { useLocale, useT } from '@/i18n'

import { BlockDemoView } from '../list/demo-view'

import { scheduleBlock } from './index'

export default function ScheduleBlockDemo() {
  const t = useT('data-blocks')
  const { locale } = useLocale()
  const { Component } = scheduleBlock
  const demo = scheduleBlock.demo(locale)
  return (
    <BlockDemoView definition={scheduleBlock}>
      {/* Containers on both sides of the two steps; the block above is as wide as the page. */}
      <DemoGroup caption={t('demo.narrow')}>
        <div data-demo-width="narrow" className="max-w-sm">
          <Component props={demo.props} changes={{}} state="ready" />
        </div>
      </DemoGroup>
      <DemoGroup caption={t('demo.medium')}>
        <div data-demo-width="medium" className="max-w-xl">
          <Component props={demo.props} changes={{}} state="ready" />
        </div>
      </DemoGroup>
    </BlockDemoView>
  )
}
