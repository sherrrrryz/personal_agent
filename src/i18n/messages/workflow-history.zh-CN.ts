import type { Translation } from '../types'
import type en from './workflow-history.en'

const messages: Translation<typeof en> = {
  'history.open': '历史',
  'history.title': '版本历史',
  'history.description': '这个工作流的每个版本，最新的在最上面，写明是谁改的、为什么改。',
  'history.version': '版本 {n}',
  'history.current': '当前',
  'history.author.ai': 'AI',
  'history.author.user': '你',
  'history.meta': '{date} · 由{author}修改',
  'history.view': '查看',
  'history.view.name': '查看版本 {n}',
  'history.compare': '与当前对比',
  'history.compare.name': '把版本 {n} 与当前版本对比',

  'old.title': '你正在查看版本 {n}——只读',
  'old.body': '当前生效的是版本 {current}。旧版本只能查看，不能修改，也不能恢复。',
  'old.back': '返回当前版本',

  'diff.previous': '与上一版对比',
  'diff.stop': '结束对比',
  'diff.proposed.open': '查看等你批准的修改',
  'diff.proposed.back': '返回当前版本',

  'summary.title': '变更摘要',
  'summary.versions': '版本 {to} 与版本 {from} 相比。',
  'summary.proposed': '等你批准的修改与版本 {from}（当前）相比。',
  'summary.none': '这两个版本没有差别。',
  'summary.node.added': '新增{kind}「{label}」',
  'summary.node.changed': '修改{kind}「{label}」',
  'summary.node.removed': '移除{kind}「{label}」',
  'summary.edge.added': '新增连接：{from} → {to}',
  'summary.edge.changed': '修改连接：{from} → {to}',
  'summary.edge.removed': '移除连接：{from} → {to}',

  'proposal.title': 'AI 建议做这项修改',
  'proposal.approve': '批准',
  'proposal.reject': '拒绝',
  'proposal.approved': '已批准。版本 {n} 现在生效。',
  'proposal.rejected': '已拒绝。工作流仍是版本 {n}。',
}

export default messages
