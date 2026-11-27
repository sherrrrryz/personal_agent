import type { Translation } from '../types'
import type en from './topics.en'

const messages: Translation<typeof en> = {
  'list.title': '话题',
  'list.description': '你和 AI 的每次对话都会自动归到一个话题下。',
  'list.loading': '正在载入话题…',
  'list.empty.title': '还没有话题',
  'list.empty.body': '你和 AI 的每次对话都会自动归到这里。',
  'list.error.title': '无法载入话题',
  'list.error.body': '暂时连不上平台。你的对话都还在，请重试。',
  'card.conversations': { other: '{count} 段对话' },
  'card.lastActivity': '最近活动：{when}',
  'card.subModule': '已成为功能',
  'card.summaryPending': '摘要生成中',

  'topic.summary': 'AI 摘要',
  'topic.summary.basis': { other: '根据 {count} 条对话整理' },
  'topic.summary.at': '更新于 {when}',
  'topic.summary.loading': '正在载入摘要…',
  'topic.summary.pending.title': '摘要生成中',
  'topic.summary.pending.body': 'AI 读完下面的对话后，摘要会出现在这里。',
  'topic.summary.error.title': '摘要没有生成出来',
  'topic.summary.error.body': '下面的对话记录不受影响。重试可以让 AI 再写一次。',
  'topic.modules': '相关功能',
  'topic.records': '对话记录',
  'topic.records.loading': '正在载入对话记录…',
  'topic.record.toggle': '{title} · {date}',
  'topic.record.log': '记录 {n}：{title}',
  'topic.record.surface.in-place': '就地回答',
  'topic.record.surface.thread': '专门对话',
  'topic.record.continue': '继续对话',
  'topic.record.continueNamed': '继续对话：{title}',
  'topic.record.untitled': '对话',
}

export default messages
