import type { SubModuleTemplate } from '@/runtime/model'
import { tx } from '@/runtime/text'

import { chain, col, row, table, wf } from './build'
import { accountId, blockKey, column, moduleId, nodeId, tableId } from './keys'
import { breedBasisNames, breeds, breedType, breedTypes, confirmationStatusNames } from './vocabulary'

// What a sub-module is made of when a conversation becomes persistent (D-08),
// and the placeholder every module without a story gets.

/** Words for a module the user adds herself. */
export const customModule = {
  subName: tx('新的长期事项', 'New standing task'),
  description: tx('尚未连接来源；连接后这里会按工作流更新。', 'No source connected yet; once connected, its workflow keeps this page up to date.'),
}

/** The placeholder workflow of a stub: 手动触发 → 来源：未连接 → 输出. */
export function stubWorkflow() {
  return {
    reason: tx('创建模块时的占位工作流', 'Placeholder workflow from when the module was created'),
    nodes: [
      wf.trigger('manual', tx('手动触发', 'Run by hand'), 'manual'),
      wf.source('source', tx('来源：未连接', 'Source: not connected'), {
        detail: tx('连接账号后才有内容可读。', 'Nothing to read until an account is connected.'),
      }),
      wf.output('output', 'block.empty', 'empty', tx('输出', 'Output')),
    ],
    edges: chain('manual', 'source', 'output'),
  }
}

const breedCodes = Object.fromEntries(Object.entries(breeds))
const typeNames = Object.fromEntries(Object.entries(breedTypes).map(([code, type]) => [code, type.name]))

/** 服务时长 — the hero flow's sub-module (IA-MAP § Prototype flows, stage 1). */
const duration: SubModuleTemplate = {
  slug: 'duration',
  name: tx('服务时长', 'Service duration'),
  description: tx(
    '按品种和每只狗的记录估算美容时长，并从实际耗时中学习。',
    'Estimates grooming time from the breed and each dog’s own record, and learns from the time actually taken.',
  ),
  icon: 'timer',
  reason: tx('由对话「按品种和毛长估时间」创建', 'Created from the conversation “Estimate time by breed and coat”'),
  accounts: [],
  reads: [tableId.dogs, tableId.appointments, tableId.visits],
  build: ({ moduleId: self, parentId }) => ({
    nodes: [
      wf.trigger('booking-changed', tx('预约新建或修改', 'A booking is made or changed'), 'module', {}, { targetModuleId: parentId }),
      wf.trigger(nodeId.review, tx('每周一复盘', 'Review every Monday'), 'schedule', { weekday: 1, time: '18:00' }),
      wf.source('pet-files', tx('顾客与宠物档案（品种、毛长、体型）', 'Client and pet files (breed, coat, size)'), {
        targetModuleId: moduleId.clients,
        tables: [tableId.dogs],
      }),
      wf.step(nodeId.estimate, tx('估算时长', 'Estimate the duration'), {
        detail: tx(
          '来过两次以上：用这只狗的记录；否则：用品种表的大致时长。',
          'Two or more visits: use this dog’s own record; otherwise: use the breed table.',
        ),
      }),
      wf.action(nodeId.setDuration, tx('设置预约时长', 'Set the booking’s duration'), 'autonomous', 'change-appointments', {
        targetModuleId: parentId,
      }),
      wf.action(nodeId.suggestShifts, tx('建议排班调整', 'Suggest shift changes'), 'assisted', 'adjust-shifts', {
        targetModuleId: moduleId.shifts,
      }),
      wf.step('record-actual', tx('记录实际耗时', 'Record the time actually taken'), {
        detail: tx('每次完成后写入这只狗的档案和品种表的实测列。', 'After each visit, written to the dog’s file and the breed table’s measured column.'),
      }),
      wf.condition('deviation', tx('偏差超过 30 分钟', 'Off by more than 30 minutes'), { params: { thresholdMinutes: 30 } }),
      wf.action('propose-rule', tx('提议修改规则', 'Propose a rule change'), 'deferred', 'change-rules', { targetModuleId: self }),
      wf.memory('memory', tx('记忆', 'Memory'), [tableId.breeds, tableId.dogDurations]),
      wf.output('out-summary', 'block.summary', 'summary', tx('学习概况', 'Learning at a glance')),
      wf.output('out-records', 'block.table', blockKey.duration.records, tx('预计与实际', 'Estimated and actual')),
      wf.output('out-rule', 'block.text', 'rule', tx('现在的规则', 'The rule right now')),
    ],
    edges: [
      ...chain('booking-changed', 'pet-files', nodeId.estimate, nodeId.setDuration, nodeId.suggestShifts),
      ...chain(nodeId.setDuration, 'record-actual', 'deviation', 'propose-rule'),
      ...chain(nodeId.review, 'deviation'),
      ...chain('memory', nodeId.estimate),
      ...chain('record-actual', 'memory'),
      ...chain('record-actual', 'out-summary'),
      ...chain('record-actual', 'out-records'),
      ...chain(nodeId.estimate, 'out-rule'),
    ],
    tables: [
      table(
        tableId.breeds,
        self,
        tx('品种大致时长', 'Rough time per breed'),
        [
          col(column.breeds.breed, 'code', '品种', 'Breed', { options: breedCodes }),
          col(column.breeds.type, 'code', '类型', 'Type', { options: typeNames }),
          col(column.breeds.applied, 'duration', '适用时长', 'Time in use'),
          col(column.breeds.basis, 'code', '依据', 'Based on', { options: breedBasisNames }),
          col(column.breeds.observed, 'duration', '实测平均', 'Measured average'),
          col(column.breeds.dogs, 'number', '只数', 'Dogs'),
          col(column.breeds.min, 'duration', '最短', 'Shortest'),
          col(column.breeds.max, 'duration', '最长', 'Longest'),
          col(column.breeds.updatedAt, 'datetime', '更新时间', 'Updated'),
        ],
        Object.entries(breedType).map(([breed, type]) =>
          row(breed, {
            [column.breeds.breed]: breed,
            [column.breeds.type]: type,
            [column.breeds.applied]: breedTypes[type].minutes,
            [column.breeds.basis]: 'seed',
            [column.breeds.observed]: null,
            [column.breeds.dogs]: 0,
            [column.breeds.min]: null,
            [column.breeds.max]: null,
            [column.breeds.updatedAt]: null,
          }),
        ),
        [parentId, moduleId.shifts],
      ),
      table(
        tableId.dogDurations,
        self,
        tx('每只狗的实际耗时', 'Actual time per dog'),
        [
          col(column.dogDurations.dog, 'ref', '狗', 'Dog', { refTable: tableId.dogs }),
          col(column.dogDurations.breed, 'code', '品种', 'Breed', { options: breedCodes }),
          col(column.dogDurations.visits, 'number', '到店次数', 'Visits'),
          col(column.dogDurations.average, 'duration', '平均实际耗时', 'Average actual time'),
          col(column.dogDurations.applied, 'duration', '适用时长', 'Time in use'),
          col(column.dogDurations.note, 'text', '性格备注', 'Temperament notes'),
        ],
        [],
        [parentId, moduleId.clients],
      ),
    ],
  }),
}

/** 预约确认 — the warm-up's sub-module (IA-MAP § Prototype flows, secondary flow). */
const confirmations: SubModuleTemplate = {
  slug: 'confirmations',
  name: tx('预约确认', 'Booking confirmations'),
  description: tx(
    '每晚 19:00 给第二天有预约的顾客发确认；没回复的交给你决定。',
    'Every evening at 19:00, confirms tomorrow’s bookings with each customer; no reply is left for you to decide.',
  ),
  icon: 'send',
  reason: tx('由对话「明天的预约确认」创建', 'Created from the conversation “Tomorrow’s confirmations”'),
  nextRunTime: '19:00',
  accounts: [accountId.wechat],
  reads: [tableId.appointments, tableId.dogs],
  build: ({ moduleId: self, parentId }) => ({
    nodes: [
      wf.trigger('evening', tx('每晚 19:00', 'Every evening at 19:00'), 'schedule', { time: '19:00' }),
      wf.source('tomorrow', tx('明天的预约', 'Tomorrow’s bookings'), { targetModuleId: parentId, tables: [tableId.appointments] }),
      wf.action('send', tx('发确认', 'Send confirmations'), 'autonomous', 'message-customers', { account: accountId.wechat }),
      wf.condition('no-reply', tx('两小时内无回复', 'No reply within two hours'), { params: { thresholdMinutes: 120 } }),
      wf.action('remind-me', tx('无回复则提醒我', 'Tell me when there is no reply'), 'deferred', 'message-customers', {
        targetModuleId: moduleId.notifications,
      }),
      wf.memory('memory', tx('记忆', 'Memory'), [tableId.confirmations]),
      wf.output('out-summary', 'block.summary', 'summary', tx('今晚的确认', 'Tonight’s confirmations')),
      wf.output('out-list', 'block.list', 'customers', tx('每位顾客', 'Each customer')),
      wf.output('out-note', 'block.text', 'note', tx('说明', 'Note')),
    ],
    edges: [
      ...chain('evening', 'tomorrow', 'send', 'no-reply', 'remind-me'),
      ...chain('send', 'memory'),
      ...chain('send', 'out-summary'),
      ...chain('send', 'out-list'),
      ...chain('no-reply', 'out-note'),
    ],
    tables: [
      table(
        tableId.confirmations,
        self,
        tx('确认记录', 'Confirmation log'),
        [
          col('customer', 'text', '顾客', 'Customer'),
          col('dog', 'ref', '狗', 'Dog', { refTable: tableId.dogs }),
          col('appointment', 'ref', '预约', 'Booking', { refTable: tableId.appointments }),
          col('status', 'code', '状态', 'Status', { options: confirmationStatusNames }),
          col('sentAt', 'datetime', '发送时间', 'Sent'),
        ],
        [],
        [moduleId.notifications],
      ),
    ],
  }),
}

export const subModuleTemplates: Record<string, SubModuleTemplate | undefined> = { duration, confirmations }
