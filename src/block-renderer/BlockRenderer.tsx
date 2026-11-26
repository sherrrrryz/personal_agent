import { CircleAlert, Pin } from 'lucide-react'
import { useEffect, useState, type ComponentType, type ReactNode } from 'react'

import type {
  BlockActionEvent,
  BlockChanges,
  BlockComponentProps,
  BlockDataState,
  ChangeSet,
  PageBlock,
  PageDescription,
} from '@/blocks/types'
import { noChanges } from '@/blocks/types'
import { Toggle } from '@/components/actions'
import { ChangeMarker } from '@/components/data-display'
import { Alert, AlertDescription, AlertTitle, DataState, Empty, EmptyDescription, EmptyHeader, EmptyTitle } from '@/components/feedback'
import { Section, type SectionLevel } from '@/components/layout'
import { useT } from '@/i18n'

import { arrangeBlocks, countPageChanges, pairSpans, type Pins } from './arrange'
import { blockRegistry, type BlockRegistry } from './registry'

export type BlockRendererProps = {
  /** What the workflow emitted. The order is the workflow's; pins may move blocks out of it. */
  page: PageDescription
  /** The state of the page as a whole. `ready` with no block is shown as `empty`. */
  state?: BlockDataState
  /** The state of single blocks, by `key`, when part of a page failed or is still loading. Default `ready`. */
  blockStates?: Readonly<Record<string, BlockDataState>>
  /** What the last run changed. The next run replaces it; `noChanges` marks nothing. */
  changes?: ChangeSet
  /** The module's pins: block `key` → the position it keeps. */
  pins?: Pins
  /** Shows a pin toggle on every block; called with the block and the position it has at that moment. */
  onTogglePin?: (blockKey: string, index: number) => void
  /** An action of an item of a block was used. Without it the blocks show their actions as not available. */
  onAction?: (event: BlockActionEvent) => void
  /** Heading level of the block titles, by the renderer's place in the page outline. */
  level?: SectionLevel
  /** While the page is `empty`: the screen's own words. Default: a general statement. */
  empty?: ReactNode
  /** While the page is `error`: the title, the reason in the screen's words, and the retry. */
  errorTitle?: ReactNode
  error?: ReactNode
  onRetry?: () => void
  /** The blocks that may be drawn. Default: every block under `src/blocks/`. */
  registry?: BlockRegistry
}

// One column; two from the `@2xl` container step — the renderer asks
// how wide *it* is, so the same page pairs in `main` and stacks in the chat panel.
const gridClass = 'grid grid-cols-1 gap-x-6 gap-y-8 @2xl:grid-cols-2'
const spanClass = { full: 'min-w-0 @2xl:col-span-2', half: 'min-w-0' } as const

const unmarked: BlockChanges = {}

// The ids already reported to the developer: one line per id, not one per render.
const reported = new Set<string>()

/** In the place of a block whose id no block registered: says so, and tells the developer. */
function UnknownBlock({ id }: { id: string }) {
  const t = useT('blocks')
  useEffect(() => {
    if (!import.meta.env.DEV || reported.has(id)) return
    reported.add(id)
    console.error(`BlockRenderer: no block is registered as "${id}" (src/blocks/<name>/index.ts)`)
  }, [id])
  return (
    <Alert variant="destructive" data-unknown-block={id}>
      <CircleAlert aria-hidden="true" />
      <AlertTitle>{t('renderer.unknown.title')}</AlertTitle>
      <AlertDescription>
        {t('renderer.unknown.body')} <code className="wrap-anywhere">{id}</code>
      </AlertDescription>
    </Alert>
  )
}

/**
 * Draws a `PageDescription` (D-12): each block in a `section` named by its
 * title, `half` blocks side by side once the renderer itself reaches the `@2xl` step,
 * pinned blocks at the position they were pinned at, and what the last run
 * changed marked on the titles and counted in one line.
 */
export function BlockRenderer({
  page,
  state = 'ready',
  blockStates,
  changes = noChanges,
  pins,
  onTogglePin,
  onAction,
  level = 2,
  empty,
  errorTitle,
  error,
  onRetry,
  registry = blockRegistry,
}: BlockRendererProps) {
  const t = useT('blocks')
  const [announcement, setAnnouncement] = useState('')

  const blocks = arrangeBlocks(page.blocks, pins)
  const spans = pairSpans(blocks)
  const changed = countPageChanges(blocks, changes)
  const shown: BlockDataState = state === 'ready' && blocks.length === 0 ? 'empty' : state

  function togglePin(block: PageBlock, index: number, pinned: boolean) {
    setAnnouncement(t(pinned ? 'pin.announce.off' : 'pin.announce.on', { title: block.title }))
    onTogglePin?.(block.key, index)
  }

  return (
    <div data-slot="block-renderer" className="@container min-w-0">
      <DataState
        state={shown}
        errorTitle={errorTitle ?? t('renderer.error.title')}
        error={error ?? t('renderer.error.reason')}
        onRetry={onRetry}
        empty={
          empty ?? (
            <Empty className="border">
              <EmptyHeader>
                <EmptyTitle>{t('renderer.empty.title')}</EmptyTitle>
                <EmptyDescription>{t('renderer.empty.body')}</EmptyDescription>
              </EmptyHeader>
            </Empty>
          )
        }
      >
        <div className="flex min-w-0 flex-col gap-6">
          {/* Always there, so that the count of a new run is announced when it arrives. */}
          <div role="status" data-slot="block-changes">
            {changed > 0 && <p className="text-sm text-muted-foreground">{t('renderer.changes', { count: changed })}</p>}
          </div>
          <div className={gridClass}>
            {blocks.map((block, index) => {
              const definition = registry.get(block.block)
              const pinned = pins !== undefined && Number.isInteger(pins[block.key])
              const marked = changes.blocks[block.key]
              // The registry pairs each id with the component of that id; the page's `block` chose it.
              const Component = definition?.Component as ComponentType<BlockComponentProps> | undefined
              return (
                <div
                  key={block.key}
                  className={spanClass[spans[index]]}
                  data-block={block.block}
                  data-block-key={block.key}
                  data-span={spans[index]}
                  data-pinned={pinned || undefined}
                >
                  <Section
                    level={level}
                    title={
                      marked ? (
                        <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
                          <span className="min-w-0 wrap-break-word">{block.title}</span>{' '}
                          <ChangeMarker kind="updated" />
                        </span>
                      ) : (
                        block.title
                      )
                    }
                    actions={
                      onTogglePin && (
                        <Toggle
                          size="sm"
                          pressed={pinned}
                          onPressedChange={() => togglePin(block, index, pinned)}
                          aria-label={t('pin.label', { title: block.title })}
                        >
                          <Pin aria-hidden="true" />
                          {t('pin.short')}
                        </Toggle>
                      )
                    }
                  >
                    {Component ? (
                      <Component
                        props={block.props}
                        changes={marked ?? unmarked}
                        state={blockStates?.[block.key] ?? 'ready'}
                        onAction={onAction && ((actionId, itemId) => onAction({ blockKey: block.key, actionId, itemId }))}
                      />
                    ) : (
                      <UnknownBlock id={block.block} />
                    )}
                  </Section>
                </div>
              )
            })}
          </div>
        </div>
      </DataState>
      {/* What pinning did, said without moving focus; the toggle itself carries the state (`aria-pressed`). */}
      <p role="status" className="sr-only" data-slot="block-pin-status">
        {announcement}
      </p>
    </div>
  )
}
