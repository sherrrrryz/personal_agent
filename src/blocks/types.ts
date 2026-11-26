import type { ComponentType } from 'react'

import type { Locale } from '@/i18n'
import type { BehaviourMode, ChangeKind } from '@/lib/vocab'

// The block contract (spec part 2 § Fake workflow runtime, "Block contract";
// D-12). A workflow's output is a `PageDescription` that may name only the
// seven registered blocks. The renderer (`src/block-renderer/`), the blocks
// (`src/blocks/<name>/`), the module frame and every `module.ts` build against
// this file, so none of them waits for another's types.
//
// Every string in a block's props is already in the reader's language: the
// page builder resolves the fixtures' two-locale texts before it emits. Times
// are story times as local ISO strings (`2026-11-05T14:00`), durations are
// minutes; a block formats them with `useFormat()`.

/** The four states of a data surface (`DataState`, part 1). */
export type BlockDataState = 'ready' | 'loading' | 'empty' | 'error'

/** One thing a person can do on an item. The block shows it; the module's handler runs it. */
export type BlockAction = {
  /** Stable within the item: `start`, `finish`, `accept`. */
  id: string
  label: string
  /** The item's main action; at most one per item. */
  primary?: boolean
  disabled?: boolean
}

export type BlockBadge = {
  label: string
  /** Set when the badge says a behaviour mode — the block then uses the mode's icon. */
  mode?: BehaviourMode
}

export type BlockLink = { label: string; href: string }

/** `block.summary` — a wrapping row of key figures. */
export type SummaryBlockProps = {
  items: Array<{ id: string; label: string; value: string; delta?: string }>
}

/** `block.list` — items with title, meta, badges and actions. */
export type ListBlockProps = {
  items: Array<{
    id: string
    title: string
    meta: string
    badges: BlockBadge[]
    actions?: BlockAction[]
    href?: string
  }>
}

/** A cell is its text, optionally a link (a dog's name to its file) and a note under it. */
export type TableBlockCell = string | { text: string; href?: string; note?: string }

/** `block.table` — columns × rows; scrolls sideways inside itself. */
export type TableBlockProps = {
  caption: string
  columns: Array<{ id: string; label: string; align?: 'start' | 'end' }>
  rows: Array<{ id: string; cells: Record<string, TableBlockCell> }>
}

/** `block.schedule` — time slots by resource, over a day or a week. */
export type ScheduleBlockProps = {
  /** `start` is the first day (`2026-11-05`); a week shows `days` days from it. */
  range: { kind: 'day' | 'week'; start: string; days: number }
  resources: Array<{ id: string; label: string }>
  slots: Array<{
    id: string
    resourceId: string
    start: string
    end: string
    title: string
    meta: string
    badges?: BlockBadge[]
    actions?: BlockAction[]
    href?: string
  }>
}

export type ProposalPartState = 'pending' | 'accepted' | 'rejected'

/** `block.proposal` (`ProposalCard`) — an AI proposal in parts, each 接受 / 拒绝. */
export type ProposalBlockProps = {
  mode: BehaviourMode
  /** A lead-in above the parts, when the proposal has one. */
  summary?: string
  parts: Array<{ id: string; text: string; state: ProposalPartState }>
  /** The module the proposal comes from. */
  source: { label: string; href?: string }
}

/** `block.text` — a short AI-written note with links. */
export type TextBlockProps = { body: string; links?: BlockLink[] }

/** `block.empty` — an empty page with one next step. */
export type EmptyBlockProps = { title: string; body: string; action?: BlockLink }

/** The seven registered blocks and the props of each. */
export type BlockPropsMap = {
  'block.summary': SummaryBlockProps
  'block.list': ListBlockProps
  'block.table': TableBlockProps
  'block.schedule': ScheduleBlockProps
  'block.proposal': ProposalBlockProps
  'block.text': TextBlockProps
  'block.empty': EmptyBlockProps
}

export type BlockId = keyof BlockPropsMap

export const blockIds = [
  'block.summary',
  'block.list',
  'block.table',
  'block.schedule',
  'block.proposal',
  'block.text',
  'block.empty',
] as const satisfies readonly BlockId[]

/** One block of a page: `key` is stable per module (pins and change sets refer to it). */
export type PageBlock<Id extends BlockId = BlockId> = {
  [Each in Id]: {
    key: string
    block: Each
    title: string
    span: 'full' | 'half'
    props: BlockPropsMap[Each]
  }
}[Id]

/** What a workflow's output nodes emit. The order is the workflow's. */
export type PageDescription = { blocks: PageBlock[] }

/** What changed in one block: the items by id. An entry with no item still marks the block's title. */
export type BlockChanges = Record<string, ChangeKind>

/**
 * What one run changed, per block `key` and per item id. An item id is the id
 * the block's props give the item (a row, a slot, a proposal part).
 */
export type ChangeSet = { blocks: Record<string, BlockChanges> }

export const noChanges: ChangeSet = { blocks: {} }

/** How many items a change set marks — the frame's summary line counts these. */
export function countChanges(changes: ChangeSet): number {
  return Object.values(changes.blocks).reduce((total, block) => total + Object.keys(block).length, 0)
}

/** What a block component receives. It renders no title and sets no outer margin. */
export type BlockComponentProps<Id extends BlockId = BlockId> = {
  props: BlockPropsMap[Id]
  /** The items of this block the last run changed; empty when none. */
  changes: BlockChanges
  state: BlockDataState
  /** An action of an item was used: `(action.id, item.id)`. The renderer adds the block's key. */
  onAction?: (actionId: string, itemId: string) => void
}

/** What a module's handler is told when an action of one of its blocks is used. */
export type BlockActionEvent = { blockKey: string; actionId: string; itemId: string }

/** Sample content for the gallery and `/dev/frame`: usual, long, and what a run changed. */
export type BlockDemo<Id extends BlockId = BlockId> = {
  title: string
  props: BlockPropsMap[Id]
  long: BlockPropsMap[Id]
  changes: BlockChanges
}

/** What `src/blocks/<name>/index.ts` exports. The demo's text comes from the block package's namespace. */
export type BlockDefinition<Id extends BlockId = BlockId> = {
  id: Id
  Component: ComponentType<BlockComponentProps<Id>>
  demo: (locale: Locale) => BlockDemo<Id>
}
