import { useMemo, useState } from 'react'

import type { BlockId, ChangeSet, PageBlock, PageDescription } from '@/blocks/types'
import { blockIds, noChanges } from '@/blocks/types'
import { Button, ToggleGroup, ToggleGroupItem } from '@/components/actions'
import { DemoGroup } from '@/components/actions/demo-parts'
import { dataStates, type DataStateValue } from '@/components/feedback'
import { Inline, Stack } from '@/components/layout'
import { useLocale, useT } from '@/i18n'

import type { Pins } from './arrange'
import { initialDemoState } from './demo-state'
import { BlockRenderer } from './BlockRenderer'
import { blockRegistry } from './registry'

// How wide each block is asked to be on the demo page. Whatever is registered is shown, in the contract's order.
const demoSpan: Record<BlockId, 'full' | 'half'> = {
  'block.summary': 'full',
  'block.list': 'half',
  'block.proposal': 'half',
  'block.table': 'full',
  'block.schedule': 'full',
  'block.text': 'half',
  'block.empty': 'half',
}

// The two fixed demo containers, one on each side of the `@2xl` container step: Tailwind's `xl` and `3xl`.
const containerClass = {
  narrow: 'w-full max-w-xl rounded-lg border border-dashed p-4',
  wide: 'w-full max-w-3xl rounded-lg border border-dashed p-4',
} as const

export default function BlockRendererDemo() {
  const t = useT('blocks')
  const { locale } = useLocale()
  const [state, setState] = useState<DataStateValue>(() => {
    const initial = initialDemoState()
    return initial === 'long' ? 'ready' : initial
  })
  const [turned, setTurned] = useState(0)
  // Opens as after a run, so the marked titles and the count are on the page from the start.
  const [ran, setRan] = useState(true)
  const [pins, setPins] = useState<Pins>({})

  const { page, changes } = useMemo(() => {
    const blocks: PageBlock[] = []
    const changed: ChangeSet = { blocks: {} }
    for (const id of blockIds) {
      const definition = blockRegistry.get(id)
      if (!definition) continue
      const demo = definition.demo(locale)
      blocks.push({ key: id, block: id, title: demo.title, span: demoSpan[id], props: demo.props } as PageBlock)
      changed.blocks[id] = demo.changes
    }
    return { page: { blocks }, changes: changed }
  }, [locale])

  // A workflow edit that re-orders the output: the description is rotated by one block each time.
  const emitted: PageDescription = useMemo(() => {
    const by = page.blocks.length === 0 ? 0 : turned % page.blocks.length
    return { blocks: [...page.blocks.slice(by), ...page.blocks.slice(0, by)] }
  }, [page, turned])

  function togglePin(blockKey: string, index: number) {
    setPins((before) => {
      const { [blockKey]: held, ...rest } = before
      return held === undefined ? { ...before, [blockKey]: index } : rest
    })
  }

  const pair = (first: 'noteNarrow' | 'noteWide', second: 'linksNarrow' | 'linksWide'): PageDescription => ({
    blocks: [
      { key: 'note', block: 'block.text', title: t(`demo.renderer.${first}`), span: 'half', props: { body: t('demo.renderer.pairBody') } },
      { key: 'next', block: 'block.text', title: t(`demo.renderer.${second}`), span: 'half', props: { body: t('demo.renderer.pairNext') } },
    ],
  })

  return (
    <Stack gap="xl">
      <DemoGroup caption={t('demo.renderer.page')}>
        <Inline>
          <ToggleGroup aria-label={t('demo.pick')} required value={state} onValueChange={(next) => next && setState(next)}>
            {dataStates.map((value) => (
              <ToggleGroupItem key={value} value={value}>
                {t(`demo.state.${value}`)}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
          {/* Every run replaces what the one before marked: the second press clears, the third marks again. */}
          <Button variant="secondary" onClick={() => setRan((before) => !before)}>
            {t('demo.renderer.run')}
          </Button>
          <Button variant="secondary" onClick={() => setTurned((before) => before + 1)}>
            {t('demo.renderer.reorder')}
          </Button>
        </Inline>
        <p className="text-sm text-muted-foreground">
          {t('demo.renderer.order', { order: emitted.blocks.map((block) => block.title).join(' → ') })}
        </p>
        <BlockRenderer
          level={4}
          page={state === 'empty' ? { blocks: [] } : emitted}
          state={state}
          changes={ran ? changes : noChanges}
          pins={pins}
          onTogglePin={togglePin}
          onRetry={() => setState('ready')}
        />
      </DemoGroup>
      <DemoGroup caption={t('demo.renderer.narrow')}>
        <div className={containerClass.narrow} data-demo-container="narrow">
          <BlockRenderer level={4} page={pair('noteNarrow', 'linksNarrow')} />
        </div>
      </DemoGroup>
      <DemoGroup caption={t('demo.renderer.wide')}>
        <div className={containerClass.wide} data-demo-container="wide">
          <BlockRenderer level={4} page={pair('noteWide', 'linksWide')} />
        </div>
      </DemoGroup>
      <DemoGroup caption={t('demo.renderer.unknown')}>
        <BlockRenderer
          level={4}
          page={{
            blocks: [
              // Not one of the seven ids: what a workflow must never emit, and what the renderer does if one does.
              { key: 'chart', block: 'block.chart', title: t('demo.renderer.unknownTitle'), span: 'full', props: {} } as unknown as PageBlock,
            ],
          }}
        />
      </DemoGroup>
    </Stack>
  )
}
