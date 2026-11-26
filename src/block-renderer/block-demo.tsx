import { useMemo, useState, type ComponentType } from 'react'

import type { BlockComponentProps, BlockDefinition, BlockId, BlockPropsMap } from '@/blocks/types'
import { Button, Toggle, ToggleGroup, ToggleGroupItem } from '@/components/actions'
import { DemoGroup } from '@/components/actions/demo-parts'
import { Inline, Stack } from '@/components/layout'
import { useLocale, useT } from '@/i18n'

import { dataStateOf, demoStates, initialDemoState, type DemoState } from './demo-state'

// Helpers of the block demos on `/dev/components` — not components of the
// system. Imported by file from `src/blocks/<name>/*.demo.tsx`.

type Acted = Record<string, string>

/**
 * One block in each of its states, picked by the reader, with what a run
 * changed marked or not. `apply` makes the demo answer its actions: it
 * returns the props after the actions used so far (`item id → action id`);
 * with it a read-only copy is shown too.
 */
export function BlockStatesDemo<Id extends BlockId>({
  definition,
  apply,
}: {
  definition: BlockDefinition<Id>
  apply?: (props: BlockPropsMap[Id], acted: Acted) => BlockPropsMap[Id]
}) {
  const t = useT('blocks')
  const { locale } = useLocale()
  const demo = useMemo(() => definition.demo(locale), [definition, locale])
  const [state, setState] = useState<DemoState>(initialDemoState)
  const [marked, setMarked] = useState(true)
  const [acted, setActed] = useState<Acted>({})

  const Component = definition.Component as ComponentType<BlockComponentProps<Id>>
  const content = state === 'long' ? demo.long : demo.props
  const props = apply ? apply(content, acted) : content
  const changes = marked ? demo.changes : {}

  return (
    <Stack gap="lg">
      <Inline>
        <ToggleGroup aria-label={t('demo.pick')} required value={state} onValueChange={(next) => next && setState(next)}>
          {demoStates.map((value) => (
            <ToggleGroupItem key={value} value={value}>
              {t(`demo.state.${value}`)}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
        <Toggle pressed={marked} onPressedChange={setMarked}>
          {t('demo.marks')}
        </Toggle>
        {apply && (
          <Button variant="secondary" onClick={() => setActed({})}>
            {t('demo.reset')}
          </Button>
        )}
      </Inline>
      <Component
        props={props}
        changes={changes}
        state={dataStateOf(state)}
        onAction={apply ? (actionId, itemId) => setActed((before) => ({ ...before, [itemId]: actionId })) : undefined}
      />
      {apply && (state === 'ready' || state === 'long') && (
        <DemoGroup caption={t('demo.readOnly')}>
          <Component props={props} changes={changes} state="ready" />
        </DemoGroup>
      )}
    </Stack>
  )
}
