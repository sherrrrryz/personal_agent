import { blockRegistry } from '@/block-renderer'
import type { BlockId, ChangeSet, PageBlock } from '@/blocks/types'
import { blockIds } from '@/blocks/types'
import { translate, type MessageKey } from '@/i18n'
import { tx, type FailureReason, type ModuleDefinition, type Snapshot, type Text, type WfNode } from '@/runtime'

// The made-up module of `/dev/frame` and of the frame's tests: a snapshot the
// runtime can start from (`createRuntime({ initial })`) and the definition
// that emits a page of all seven blocks. Its words come from the `module`
// namespace, so this file holds no text of its own.

export const demoModuleId = 'dev.frame'
export const demoAccountId = 'dev.frame.account'

const both = (key: MessageKey<'module'>): Text => tx(translate('zh-CN', 'module', key), translate('en', 'module', key))

/** How the demo's last run ended: as the story has it, not at all, or failed for a reason. */
export type DemoLastRun = 'ok' | 'never' | Exclude<FailureReason['code'], 'not-found' | 'source-failed'>

export const demoFailures = ['account-expired', 'account-missing', 'platform-unreachable', 'generation-failed'] as const satisfies readonly DemoLastRun[]

function reasonOf(code: (typeof demoFailures)[number]): FailureReason {
  return code === 'account-expired' || code === 'account-missing' ? { code, account: demoAccountId } : { code }
}

// How wide each block is asked to be; the order is the contract's.
const span: Record<BlockId, 'full' | 'half'> = {
  'block.summary': 'full',
  'block.list': 'half',
  'block.table': 'full',
  'block.schedule': 'full',
  'block.proposal': 'half',
  'block.text': 'half',
  'block.empty': 'half',
}

/**
 * The two items the demo's next run reports (R-15): the first item of the
 * list and the first row of the table, by the ids their demo content gives
 * them. Block keys are the block ids.
 */
export function demoPendingChanges(): ChangeSet {
  const list = blockRegistry.get('block.list')?.demo('en').props as { items?: Array<{ id: string }> } | undefined
  const table = blockRegistry.get('block.table')?.demo('en').props as { rows?: Array<{ id: string }> } | undefined
  const changes: ChangeSet = { blocks: {} }
  if (list?.items?.[0]) changes.blocks['block.list'] = { [list.items[0].id]: 'updated' }
  if (table?.rows?.[0]) changes.blocks['block.table'] = { [table.rows[0].id]: 'new' }
  return changes
}

/** A page of every registered block, from each block's own sample content. */
export const demoDefinition: ModuleDefinition = {
  id: demoModuleId,
  page(_view, preview, { locale }) {
    const blocks: PageBlock[] = []
    for (const id of blockIds) {
      const demo = blockRegistry.get(id)?.demo(locale)
      if (!demo) continue
      // 空: what the workflow emits when it has nothing to show — `block.empty` alone.
      if (preview === 'empty' && id !== 'block.empty') continue
      const props = preview === 'long' ? demo.long : demo.props
      blocks.push({ key: id, block: id, title: demo.title, span: preview === 'empty' ? 'full' : span[id], props } as PageBlock)
    }
    return { blocks }
  },
}

/**
 * The demo's state: one module with a two-version workflow, three runs (or
 * none), two deferred proposals, and two changes waiting for the next run.
 */
export function demoSnapshot(last: DemoLastRun = 'ok'): Snapshot {
  const workflowId = 'wf.dev.frame'
  const nodes: WfNode[] = [
    { id: 'trigger', kind: 'trigger', label: both('demo.workflow.trigger'), params: { time: '08:00' }, trigger: 'schedule' },
    { id: 'source', kind: 'source', label: both('demo.workflow.source'), params: {} },
    { id: 'output', kind: 'output', label: both('demo.workflow.output'), params: {} },
  ]
  const edges = [
    { id: 'trigger>source', from: 'trigger', to: 'source' },
    { id: 'source>output', from: 'source', to: 'output' },
  ]
  const failed = demoFailures.find((code) => code === last)
  const run = (n: number, at: string, version: number, trigger: 'schedule' | 'manual', changes: ChangeSet = { blocks: {} }) => ({
    id: `run-dev-${n}`,
    moduleId: demoModuleId,
    at,
    trigger,
    version,
    result: 'ok' as const,
    changes,
  })
  const runs =
    last === 'never'
      ? []
      : [
          run(1, '2026-11-24T08:00', 1, 'schedule', { blocks: { 'block.summary': { first: 'updated' } } }),
          run(2, '2026-11-25T08:00', 2, 'schedule'),
          failed
            ? { ...run(3, '2026-11-26T08:00', 2, 'schedule'), result: 'failed' as const, reason: reasonOf(failed) }
            : run(3, '2026-11-26T08:00', 2, 'schedule'),
        ]

  return {
    scene: 's2',
    storyTime: '2026-11-26T09:30',
    modules: [
      {
        id: demoModuleId,
        kind: 'profession',
        name: both('demo.module.name'),
        description: both('demo.module.description'),
        icon: 'puzzle',
        workflowId,
        memoryTableIds: [],
        aliases: [],
        nextRunAt: last === 'never' ? undefined : '2026-11-27T08:00',
      },
    ],
    workflows: [
      {
        id: workflowId,
        moduleId: demoModuleId,
        current: 2,
        versions: [
          { n: 1, at: '2026-11-20T10:00', author: 'ai', reason: both('demo.workflow.reason'), nodes, edges },
          { n: 2, at: '2026-11-24T18:00', author: 'user', reason: both('demo.workflow.reason'), nodes, edges },
        ],
      },
    ],
    runs,
    memory: [],
    proposals:
      last === 'never'
        ? []
        : [
            {
              id: 'proposal-dev-1',
              moduleId: demoModuleId,
              mode: 'deferred',
              title: both('demo.proposal.first.title'),
              summary: both('demo.proposal.first.summary'),
              parts: [
                { id: 'a', text: both('demo.proposal.first.partA'), state: 'pending' },
                { id: 'b', text: both('demo.proposal.first.partB'), state: 'pending' },
              ],
              onAccept: { action: 'none' },
              at: '2026-11-26T08:00',
            },
            {
              id: 'proposal-dev-2',
              moduleId: demoModuleId,
              mode: 'deferred',
              title: both('demo.proposal.second.title'),
              parts: [{ id: 'a', text: both('demo.proposal.second.part'), state: 'pending' }],
              onAccept: { action: 'none' },
              at: '2026-11-26T08:00',
            },
          ],
    conversations: [],
    topics: [],
    accounts: [{ id: demoAccountId, name: both('demo.account'), group: 'primary', status: 'connected', feeds: [] }],
    modeSettings: [],
    pendingChanges: last === 'never' ? {} : { [demoModuleId]: demoPendingChanges() },
    removedModules: [],
    seq: 100,
  }
}
