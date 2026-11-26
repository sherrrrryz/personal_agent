import type { BlockId } from '@/blocks/types'
import type { BehaviourMode } from '@/lib/vocab'
import type {
  CellValue,
  ColumnType,
  MemoryColumn,
  MemoryRow,
  MemoryTable,
  TaskKind,
  TriggerKind,
  WfEdge,
  WfNode,
  WfParam,
} from '@/runtime/model'
import { tx, type Text } from '@/runtime/text'

// Short ways to write story data: workflow nodes, edges, memory tables.

type NodeExtra = Partial<Omit<WfNode, 'id' | 'kind' | 'label'>>

const node =
  (kind: WfNode['kind']) =>
  (id: string, label: Text, extra: NodeExtra = {}): WfNode => ({ id, kind, label, params: {}, ...extra })

export const wf = {
  trigger: (id: string, label: Text, trigger: TriggerKind, params: Record<string, WfParam> = {}, extra: NodeExtra = {}) =>
    node('trigger')(id, label, { trigger, params, ...extra }),
  source: node('source'),
  step: node('step'),
  condition: node('condition'),
  action: (id: string, label: Text, mode: BehaviourMode, taskKind: TaskKind, extra: NodeExtra = {}) =>
    node('action')(id, label, { mode, taskKind, ...extra }),
  output: (id: string, block: BlockId, key: string, title: Text) =>
    node('output')(id, title, { emits: { block, key, title } }),
  memory: (id: string, label: Text, tables: string[]) => node('memory')(id, label, { tables }),
}

/** `chain('a', 'b', 'c')` → the edges a → b → c. */
export function chain(...ids: string[]): WfEdge[] {
  return ids.slice(1).map((to, index) => ({ id: `${ids[index]}>${to}`, from: ids[index], to }))
}

export function col(id: string, type: ColumnType, zh: string, en: string, extra: Partial<MemoryColumn> = {}): MemoryColumn {
  return { id, type, label: tx(zh, en), ...extra }
}

export function row(id: string, cells: Record<string, CellValue>): MemoryRow {
  return { id, cells }
}

export function table(
  id: string,
  ownerModuleId: string,
  name: Text,
  columns: MemoryColumn[],
  rows: MemoryRow[],
  readers: string[] = [],
): MemoryTable {
  return { id, ownerModuleId, name, titleColumn: columns[0].id, columns, rows, readers }
}
