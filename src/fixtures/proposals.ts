import { formatDuration } from '@/i18n/format'
import type { MemoryPatch, Proposal, WfEdge, WfNode, WorkflowDraft } from '@/runtime/model'
import { tx, type Text } from '@/runtime/text'

import { wf } from './build'
import { column, firstVisitParam, nodeId, proposalId, tableId } from './keys'

// The proposals the story's workflows raise (the ones a conversation raises
// are in `scripts.ts`): the Monday reviews of 服务时长, the change to its
// workflow, the promotion, and what 建议排班调整 tells 排班.

const hm = (minutes: number): Text => tx(formatDuration('zh-CN', minutes), formatDuration('en', minutes))

/**
 * 建议排班调整 → 排班: open bookings moved by `freed` minutes in all (negative:
 * they take longer). The runtime raises this whenever a rule change moves
 * bookings (`applyEstimates`), and adds the id, the module, the mode and the time.
 */
export function shiftSuggestion(freed: number, shifts: string, at: string): Pick<Proposal, 'title' | 'summary' | 'parts' | 'onAccept'> {
  const amount = hm(Math.abs(freed))
  const done = (id: string, text: Text): { action: 'updateMemory'; input: { patches: MemoryPatch[] } } => ({
    action: 'updateMemory',
    input: { patches: [{ tableId: tableId.notices, rowId: id, insert: true, cells: { text, source: shifts, at } }] },
  })
  if (freed > 0) {
    return {
      title: tx(`时长规则更新后，已排的预约净空出 ${amount['zh-CN']}`, `After the duration change, the booked appointments free up ${amount.en} net`),
      summary: tx('空出来的时间按每个预约调整前后的时长相减算出。', 'The freed time is each booking’s length before the change minus its length now.'),
      parts: [{ id: 'open-slot', text: tx('用空出来的时间加开一个洗澡时段？', 'Open one more bath slot in the freed time?'), state: 'pending' }],
      onAccept: done('notice-shift-slot', tx('排班已调整：加开了一个洗澡时段。', 'Rota changed: one more bath slot is open.')),
    }
  }
  return {
    title: tx(`时长规则更新后，已排的预约多占用 ${amount['zh-CN']}`, `After the duration change, the booked appointments take ${amount.en} more`),
    summary: tx('多出来的时间按每个预约调整前后的时长相减算出。', 'The extra time is each booking’s length now minus its length before the change.'),
    parts: [{ id: 'extend-shift', text: tx('把当天的班顺延，补上多出来的时间？', 'Extend that day’s shift to cover the extra time?'), state: 'pending' }],
    onAccept: done('notice-shift-extended', tx('排班已调整：当天的班顺延了。', 'Rota changed: that day’s shift is extended.')),
  }
}

type StoryProposal = Omit<Proposal, 'at'>

/**
 * `s3` — the third Monday review: one deferred item in two parts. Accepting
 * changes memory at both tiers and nothing in the workflow.
 */
export function reviewProposal(duration: string, at: string): StoryProposal {
  return {
    id: proposalId.review,
    moduleId: duration,
    nodeId: 'propose-rule',
    mode: 'deferred',
    title: tx('每周复盘：金毛的时长和实际差得多', 'Weekly review: Golden Retrievers take a different time than planned'),
    summary: tx(
      '豆豆来了 3 次，平均 3 小时 20 分；大福来了 3 次，平均 4 小时 10 分。你给的 4 小时两头都不准。',
      'Doudou has come 3 times, 3 h 20 min on average; Dafu 3 times, 4 h 10 min on average. Your 4 hours is off in both directions.',
    ),
    parts: [
      { id: 'breed', text: tx('金毛的大致时长改为 3 小时 45 分（5 只的平均）？', 'Change the rough time for Golden Retrievers to 3 h 45 min (the average of 5 dogs)?'), state: 'pending' },
      {
        id: 'dogs',
        text: tx('来过两次以上的狗按自己的记录排：豆豆 3 小时 20 分，大福 4 小时 10 分？', 'Book dogs with two or more visits on their own record: Doudou 3 h 20 min, Dafu 4 h 10 min?'),
        state: 'pending',
      },
    ],
    onAccept: {
      action: 'updateMemory',
      input: {
        patches: [
          { partId: 'breed', tableId: tableId.breeds, rowId: 'golden', cells: { [column.breeds.applied]: 225, [column.breeds.basis]: 'average', [column.breeds.updatedAt]: at } },
          { partId: 'dogs', tableId: tableId.dogDurations, rowId: 'doudou', cells: { [column.dogDurations.applied]: 200 } },
          { partId: 'dogs', tableId: tableId.dogDurations, rowId: 'dafu', cells: { [column.dogDurations.applied]: 250 } },
        ],
      },
    },
  }
}

/** Between `s3` and `s4` — a later review: more dogs have come twice. `own`: dog id → its average. */
export function moreDogsProposal(duration: string, own: Array<{ dog: string; name: Text; minutes: number }>): StoryProposal {
  const list = (locale: 'zh-CN' | 'en') => own.map((each) => `${each.name[locale]} ${hm(each.minutes)[locale]}`).join(locale === 'en' ? ', ' : '，')
  return {
    id: proposalId.moreDogs,
    moduleId: duration,
    nodeId: 'propose-rule',
    mode: 'deferred',
    title: tx('每周复盘：又有几只狗来过两次了', 'Weekly review: more dogs have now come twice'),
    parts: [{ id: 'dogs', text: tx(`这几只也按自己的记录排：${list('zh-CN')}？`, `Book these on their own record too: ${list('en')}?`), state: 'pending' }],
    onAccept: {
      action: 'updateMemory',
      input: { patches: own.map((each) => ({ tableId: tableId.dogDurations, rowId: each.dog, cells: { [column.dogDurations.applied]: each.minutes } })) },
    },
  }
}

/** The condition `s4` adds to the workflow of 服务时长. */
export const firstVisitNode: WfNode = wf.condition(nodeId.firstVisit, tx('第一次来的狗 +30 分钟', 'First visit: +30 minutes'), {
  params: { [firstVisitParam]: 30 },
  detail: tx('这只狗还没有到店记录时，在品种表的时长上加 30 分钟。', 'While the dog has no visit on record, 30 minutes are added to the breed table’s time.'),
})

/** `s4` — the draft of version 2: the workflow as it is plus the one condition and its two edges. */
export function firstVisitDraft(current: { nodes: WfNode[]; edges: WfEdge[] }): WorkflowDraft {
  return {
    reason: tx(
      '复盘发现第一次来的狗平均多用 30 分钟，和品种无关，所以新增条件「第一次来的狗 +30 分钟」',
      'The review found that a first visit takes about 30 minutes longer whatever the breed, so the condition “First visit: +30 minutes” was added',
    ),
    nodes: [...structuredClone(current.nodes), structuredClone(firstVisitNode)],
    edges: [
      ...structuredClone(current.edges),
      { id: `${nodeId.estimate}>${nodeId.firstVisit}`, from: nodeId.estimate, to: nodeId.firstVisit },
      { id: `${nodeId.firstVisit}>${nodeId.setDuration}`, from: nodeId.firstVisit, to: nodeId.setDuration },
    ],
    proposalId: proposalId.firstVisit,
  }
}

/** `s4` — the deferred proposal that carries the approval of the draft. */
export function firstVisitProposal(duration: string, workflowId: string): StoryProposal {
  return {
    id: proposalId.firstVisit,
    moduleId: duration,
    nodeId: 'propose-rule',
    mode: 'deferred',
    title: tx('每周复盘：建议修改流程', 'Weekly review: a change to the process'),
    summary: tx(
      '布丁和年糕第一次来时都比后来多用了约 30 分钟。这和品种无关，每只狗自己的记录也预测不了，所以要写成一条规则。',
      'Buding and Niangao each took about 30 minutes longer on their first visit than later. It does not depend on the breed and no dog’s own record can predict it, so it has to be a rule.',
    ),
    parts: [{ id: 'add', text: tx('在流程里新增条件「第一次来的狗 +30 分钟」？', 'Add the condition “First visit: +30 minutes” to the process?'), state: 'pending' }],
    onAccept: { action: 'approveWorkflowChange', input: { workflowId } },
  }
}

/** From `s4` — 升级建议 in `settings.profession` (D-38). Assisted, so it does not wait in 通知. */
export function promoteProposal(duration: string): StoryProposal {
  return {
    id: proposalId.promote,
    moduleId: duration,
    mode: 'assisted',
    title: tx('把「服务时长」升级为顶层功能', 'Promote “Service duration” to a top-level feature'),
    summary: tx(
      '「服务时长」现在同时被「预约」「排班」「顾客与宠物」读取，已经不只是「预约」的一部分。',
      '“Service duration” is now read by Appointments, Shifts and Clients and pets; it is more than a part of Appointments.',
    ),
    parts: [{ id: 'promote', text: tx('把它移到「我的店」下，和「预约」并列？原来的地址仍然可用。', 'Move it under My shop, beside Appointments? Its old address keeps working.'), state: 'pending' }],
    onAccept: { action: 'promoteSubModule', input: { moduleId: duration } },
  }
}
