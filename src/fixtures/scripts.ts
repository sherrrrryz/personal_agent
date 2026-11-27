import type { ChatScript, MessageAttachment, Snapshot } from '@/runtime/model'
import { tx } from '@/runtime/text'
import { addDays, datePart } from '@/runtime/time'

import { col, row } from './build'
import { column, moduleId, nodeId, tableId } from './keys'
import { breedTypes } from './vocabulary'

// The scripted chat (spec part 2 § Fake workflow runtime, "Scripted chat").
// Anything she types that is not one of these prompts gets the canned reply.
// A reply is replayed as a process (D-45): `steps` are what the AI does before
// it answers — only what the story already says it does.

/** 原型只演示脚本中的对话 — the one honest reply to anything unscripted. */
export const cannedReply = tx('原型只演示脚本中的对话。', 'This prototype only plays the scripted conversations.')

/** Where an unscripted conversation is filed. */
export const miscTopic = { id: 'misc', title: tx('其他对话', 'Other conversations'), moduleIds: [] as string[] }

/** The ids of the scripts, for scene builders and tests. */
export const scriptId = {
  confirmations: 'tomorrow-confirmations',
  hero: 'hero-duration-rule',
  anniversary: 'shop-anniversary',
  review: 'move-weekly-review',
} as const

/** The topic the AI files the hero conversation under (stage 5 of the hero flow). */
const durationTopic = {
  id: 'duration-rule',
  title: tx('服务时长规则', 'Service duration rule'),
  summary: tx(
    '你按品种和毛长给了一条估时规则：长毛大型 4 小时，短毛小型 2 小时，其他 3 小时。它成为长期功能「服务时长」，并按每只狗的实际耗时继续学习。',
    'You gave a rule for estimating time by breed and coat: long-haired large dogs 4 hours, short-haired small dogs 2 hours, others 3 hours. It became the standing feature “Service duration” and keeps learning from the time each dog actually takes.',
  ),
  moduleIds: [moduleId.appointments],
}

/** Tomorrow's bookings as a table attached to a reply. */
function tomorrowsBookings(state: Snapshot): MessageAttachment[] {
  const appointments = state.memory.find((table) => table.id === tableId.appointments)
  if (!appointments) return []
  const tomorrow = addDays(datePart(state.storyTime), 1)
  const c = column.appointments
  const shown = [c.dog, c.start, c.groomer]
  return [
    {
      kind: 'table',
      name: tx('明天的预约', 'Tomorrow’s bookings'),
      titleColumn: c.dog,
      columns: appointments.columns.filter((each) => shown.includes(each.id as (typeof shown)[number])),
      rows: appointments.rows
        .filter((each) => String(each.cells[c.start]).startsWith(tomorrow))
        .map((each) => row(each.id, Object.fromEntries(shown.map((id) => [id, each.cells[id]])))),
    },
  ]
}

/** Her rule of thumb, restated by the AI as a small table. */
function ruleTable(): MessageAttachment[] {
  return [
    {
      kind: 'table',
      name: tx('按类型的大致时长', 'Rough time by type'),
      titleColumn: 'type',
      columns: [col('type', 'text', '类型', 'Type'), col('minutes', 'duration', '大致时长', 'Rough time')],
      rows: Object.entries(breedTypes).map(([code, type]) => row(code, { type: type.name, minutes: type.minutes })),
    },
  ]
}

export const chatScripts: readonly ChatScript[] = [
  {
    id: scriptId.confirmations,
    scenes: ['e1'],
    prompt: tx('明天有哪些预约？帮我给顾客发确认。', 'What is booked for tomorrow? Send the customers a confirmation for me.'),
    surface: 'in-place',
    topic: {
      id: 'confirmations',
      title: tx('预约确认', 'Booking confirmations'),
      summary: tx(
        '你让 AI 查看第二天的预约并给顾客发确认。这件事之后设成了长期功能「预约确认」，每晚 19:00 自动更新。',
        'You asked the AI to look up the next day’s bookings and confirm them with the customers. It later became the standing feature “Booking confirmations”, which updates every evening at 19:00.',
      ),
      moduleIds: [moduleId.appointments],
    },
    title: tx('明天的预约确认', 'Tomorrow’s confirmations'),
    template: 'confirmations',
    steps: [
      tx('查看明天的预约', 'Looking up tomorrow’s bookings'),
      tx('给每位顾客发确认消息', 'Sending each customer a confirmation'),
    ],
    reply: tx(
      '明天的预约见下表。我已经给每位顾客发了一条确认消息。如果你想每天晚上都这样做，可以把这次对话设为长期。',
      'Tomorrow’s bookings are in the table below. I have sent each customer a confirmation. If you want this done every evening, keep this conversation as a feature.',
    ),
    attachments: tomorrowsBookings,
  },
  {
    id: scriptId.hero,
    scenes: ['s0'],
    prompt: tx(
      '我给长毛大狗做一次要 4 小时，短毛小狗 2 小时左右。以后帮我按狗的品种和毛长估时间，预约和排班都按这个来。',
      'A long-haired large dog takes me 4 hours, a short-haired small one about 2. From now on, estimate the time from the dog’s breed and coat, and plan bookings and shifts by it.',
    ),
    surface: 'in-place',
    topic: durationTopic,
    title: tx('按品种和毛长估时间', 'Estimate time by breed and coat'),
    template: 'duration',
    steps: [
      tx('读取顾客与宠物档案（品种、毛长、体型）', 'Reading the customer and pet files (breed, coat, size)'),
      tx('把你的经验整理成时长表', 'Putting your rule of thumb into a table'),
    ],
    reply: tx(
      '明白了。我把你的经验整理成下面这张表：长毛大型 4 小时，短毛小型 2 小时，其他 3 小时。同一个品种的狗差别也可能很大，所以我还会按名字记录每只狗的实际耗时。这听起来是一条长期规则——要不要把它设为长期，以后预约和排班都按它来？',
      'Understood. I have put your rule of thumb into the table below: long-haired large dogs 4 hours, short-haired small dogs 2 hours, others 3 hours. Dogs of one breed can differ a lot, so I will also record each dog’s actual time by name. This sounds like a standing rule — shall I keep it as a feature, so bookings and shifts follow it from now on?',
    ),
    attachments: ruleTable,
    proposal: () => ({
      moduleId: moduleId.appointments,
      mode: 'assisted',
      title: tx('把这条规则设为长期', 'Keep this rule as a feature'),
      parts: [
        {
          id: 'persist',
          text: tx(
            '在「预约」下创建长期功能「服务时长」，按品种表和每只狗的记录估算时长？',
            'Create the feature “Service duration” under Appointments, estimating from the breed table and each dog’s record?',
          ),
          state: 'pending',
        },
      ],
      onAccept: { action: 'createSubModule', input: { parentId: moduleId.appointments, template: 'duration' } },
    }),
  },
  {
    id: scriptId.anniversary,
    scenes: ['s0'],
    prompt: tx('帮我想想下个月的店庆活动怎么做', 'Help me think through next month’s shop anniversary event'),
    surface: 'thread',
    topic: {
      id: 'anniversary',
      title: tx('店庆活动', 'Shop anniversary'),
      summary: tx(
        '你在筹划下个月的店庆。AI 给了三个方向：老顾客回馈、新客体验价、当天的拍照角。还没有定下来。',
        'You are planning next month’s shop anniversary. The AI offered three directions: rewards for regulars, a trial price for new customers, a photo corner on the day. Nothing is decided yet.',
      ),
      moduleIds: [],
    },
    title: tx('店庆活动怎么做', 'Planning the shop anniversary'),
    steps: [tx('整理可以展开的方向', 'Drafting directions to start from')],
    reply: tx(
      '可以从三个方向想：一、老顾客回馈——来过三次以上的狗狗当月洗护九折；二、新客体验价——第一次来的小型犬洗澡 68 元；三、店庆当天设一个拍照角，照片发给主人。你想先把哪一个展开？',
      'Three directions to start from: first, rewards for regulars — dogs with three or more visits get 10% off grooming that month; second, a trial price for new customers — a first bath for a small dog at ¥68; third, a photo corner on the day, with the pictures sent to the owners. Which one shall we work out first?',
    ),
  },
  {
    id: scriptId.review,
    scenes: ['s1', 's2', 's3', 's4', 's5'],
    prompt: tx('把每周复盘改到周一早上 9 点', 'Move the weekly review to Monday at 9 in the morning'),
    surface: 'in-place',
    topic: durationTopic,
    title: tx('复盘时间改到周一早上', 'Weekly review moved to Monday morning'),
    // Only in the workflow editor of a module whose workflow has the review trigger.
    where: (state, context) =>
      context.view === 'workflow' &&
      state.workflows.some(
        (workflow) =>
          workflow.moduleId === context.moduleId &&
          workflow.versions.some((version) => version.n === workflow.current && version.nodes.some((node) => node.id === nodeId.review)),
      ),
    steps: [
      tx('读取这个流程的当前版本', 'Reading the current version of this process'),
      tx('找到开始条件「每周一复盘」', 'Finding the start condition “Review every Monday”'),
    ],
    reply: tx(
      '可以。这会把「每周一复盘」的时间从 18:00 改为 09:00，其他步骤不变。你确认后，流程会保存为一个新版本。',
      'Yes. This moves “Review every Monday” from 18:00 to 09:00 and leaves every other step as it is. Once you confirm, the process is saved as a new version.',
    ),
    proposal: (state, context) => {
      const workflow = state.workflows.find((each) => each.moduleId === context.moduleId)
      if (!workflow || !context.moduleId) return null
      return {
        moduleId: context.moduleId,
        mode: 'assisted',
        title: tx('修改复盘时间', 'Change the review time'),
        parts: [{ id: 'time', text: tx('把「每周一复盘」改为周一 09:00？', 'Move “Review every Monday” to Monday 09:00?'), state: 'pending' }],
        onAccept: {
          action: 'saveNodeParams',
          input: {
            workflowId: workflow.id,
            nodeId: nodeId.review,
            params: { weekday: 1, time: '09:00' },
            reason: tx('AI 按你的要求把复盘时间改为周一 09:00', 'The AI moved the review to Monday 09:00 at your request'),
            author: 'ai',
          },
        },
      }
    },
  },
]
