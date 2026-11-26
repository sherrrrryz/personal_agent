import { flowOrder, type WorkflowCanvasEdge, type WorkflowCanvasNode, type WorkflowDiff } from '@/components/workflow'
import type { Locale, Translate } from '@/i18n'
import { effectiveMode, isCapped, resolveModule, type RuntimeState, type WfEdge, type WfNode } from '@/runtime'
import { modulePath } from '@/shell'

// What a workflow's nodes say on screen (spec part 3 § Workflow editor, "Node
// kinds"): one view of a node for both the canvas and 步骤列表, so the two
// always show the same steps with the same words, in the same order.

type T = Translate<'workflow'>

/** Monday is 1; Sunday is 7 (or 0). */
export const weekdays = ['1', '2', '3', '4', '5', '6', '7'] as const
export type Weekday = (typeof weekdays)[number]
export const weekdayOf = (value: unknown): Weekday | null => {
  const day = value === 0 ? '7' : String(value)
  return (weekdays as readonly string[]).includes(day) ? (day as Weekday) : null
}

/** A schedule's rule in words, from the parameters the inspector adjusts: 每周一 18:00. */
export function scheduleRule(params: WfNode['params'], t: T): string | null {
  if (typeof params.time !== 'string') return null
  const day = weekdayOf(params.weekday)
  return day
    ? t('trigger.rule.weekly', { weekday: t(`weekday.${day}`), time: params.time })
    : t('trigger.rule.daily', { time: params.time })
}

export type NodeViewContext = {
  /** The state as it is — names of modules, accounts and tables, and the user's ceilings. */
  state: RuntimeState
  locale: Locale
  t: T
  /** `/m/<ia-id>` of the module the workflow belongs to. */
  basePath: string
  /** Marks of a comparison, by node id (package C6). */
  diff?: Readonly<Record<string, WorkflowDiff>>
}

function nodeView(node: WfNode, edges: readonly WfEdge[], byId: Map<string, WfNode>, context: NodeViewContext): WorkflowCanvasNode {
  const { state, locale, t, basePath } = context
  const moduleName = (id: string) => resolveModule(state, id)?.module.name[locale] ?? id
  const accountName = (id: string) => state.accounts.find((account) => account.id === id)?.name[locale] ?? id
  const tables = (node.tables ?? []).map((id) => state.memory.find((table) => table.id === id))
  const tableNames = tables.map((table, index) => table?.name[locale] ?? node.tables?.[index] ?? '').join(t('node.separator'))

  const lines: string[] = []
  const links: Array<{ href: string; label: string }> = []
  if (node.detail) lines.push(node.detail[locale])

  switch (node.kind) {
    case 'trigger': {
      if (node.trigger) lines.unshift(t(`trigger.${node.trigger}`))
      const rule = scheduleRule(node.params, t)
      if (rule) lines.push(rule)
      if (node.trigger === 'module' && node.targetModuleId) lines.push(t('trigger.rule.module', { module: moduleName(node.targetModuleId) }))
      break
    }
    case 'source':
      if (node.targetModuleId) {
        lines.push(t('source.module', { module: moduleName(node.targetModuleId) }))
        links.push({ href: modulePath(node.targetModuleId), label: t('source.open', { module: moduleName(node.targetModuleId) }) })
      }
      if (node.account) lines.push(t('source.account', { account: accountName(node.account) }))
      if (tables.length > 0) lines.push(t('source.tables', { tables: tableNames }))
      break
    case 'action':
      if (node.targetModuleId) lines.push(t('action.target', { module: moduleName(node.targetModuleId) }))
      if (node.account) lines.push(t('action.account', { account: accountName(node.account) }))
      break
    case 'output':
      if (node.emits) lines.push(t('output.emits', { title: node.emits.title[locale], block: node.emits.block }))
      links.push({ href: basePath, label: t('output.view') })
      break
    case 'memory': {
      if (tables.length > 0) lines.push(t('memory.tables', { tables: tableNames }))
      const readers = new Set(tables.flatMap((table) => table?.readers ?? []))
      lines.push(t('memory.readers', { count: readers.size }))
      links.push({ href: `${basePath}/memory`, label: t('memory.open') })
      break
    }
    default:
      break
  }
  // What the inspector adjusts is shown as it stands now, so a save is seen on the node.
  for (const [name, value] of Object.entries(node.params)) {
    if (name === 'time' || name === 'weekday') continue
    if (name === 'thresholdMinutes') lines.push(t('condition.threshold', { minutes: String(value) }))
    else lines.push(t('param.line', { name, value: String(value) }))
  }

  return {
    id: node.id,
    kind: node.kind,
    label: node.label[locale],
    lines,
    links,
    mode: node.kind === 'action' ? effectiveMode(state, node) : undefined,
    capped: node.kind === 'action' && isCapped(state, node),
    connectsTo: edges.filter((edge) => edge.from === node.id).flatMap((edge) => byId.get(edge.to)?.label[locale] ?? []),
    diff: context.diff?.[node.id],
  }
}

/** The nodes of a version as both views show them, **in flow order**, and its edges. */
export function workflowView(
  version: { nodes: readonly WfNode[]; edges: readonly WfEdge[] },
  context: NodeViewContext & { edgeDiff?: Readonly<Record<string, WorkflowDiff>> },
): { nodes: WorkflowCanvasNode[]; edges: WorkflowCanvasEdge[] } {
  const byId = new Map(version.nodes.map((node) => [node.id, node]))
  const order = flowOrder(
    version.nodes.map((node) => node.id),
    version.edges,
  )
  return {
    nodes: order.flatMap((id) => {
      const node = byId.get(id)
      return node ? [nodeView(node, version.edges, byId, context)] : []
    }),
    edges: version.edges.map((edge) => ({ id: edge.id, from: edge.from, to: edge.to, diff: context.edgeDiff?.[edge.id] })),
  }
}
