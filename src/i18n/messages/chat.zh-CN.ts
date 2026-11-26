import type { Translation } from '../types'
import type en from './chat.en'

const messages: Translation<typeof en> = {
  'bar.label': '与 AI 对话',
  'bar.placeholder': '问问这个页面，或说说你要做什么',
  'bar.suggestions': '可以这样问',

  'panel.heading': '关于：{screen}',
  'panel.screen.view': '{module} · {view}',
  'panel.screen.unnamed': '当前页面',
  'panel.log': '这段对话',
  'panel.openThread': '在专门对话中打开',
  'panel.close': '关闭',
  'panel.archived': '已归档到话题「{topic}」',
  'panel.archived.open': '查看话题',

  'attachment.caption': { other: '{name}，共 {count} 行' },
  'attachment.noData': '尚无数据',

  'thread.label': '在这段对话中回复',
  'thread.untitled': '对话',
  'thread.topic': '话题：{topic}',
  'thread.module': '模块：{module}',
  'thread.details': '关于这段对话',
  'thread.error': '消息没有载入成功。内容没有丢失，请重试。',

  'recent.label': '最近对话',
  'recent.row': '{title} · {topic} · {when}',
  'recent.rowPlain': '{title} · {when}',
  'recent.persistent': '长期',
  'recent.all': '全部话题',
  'recent.loading': '正在载入最近对话…',
  'recent.empty': '还没有对话',
  'recent.error.title': '无法载入',
  'recent.error.body': '你的对话仍保存在「话题」里。',
  'recent.now': '刚刚',

  'demo.title': '对话演示',
  'demo.description': '外壳里的对话栏和最近对话。在下面问一句：回答在对话栏上方展开，这个页面仍然可以操作。',
  'demo.behind.title': '面板后面的页面',
  'demo.behind.note': '展开面板后再按这个按钮：它照常计数。',
  'demo.behind.action': '计一次',
  'demo.behind.count': { other: '已按 {count} 次。' },
  'demo.filler.title': '足够滚动的文字',
  'demo.filler.text': '第 {n} 段。页面在对话栏上方滚动；对话栏和它的面板不会盖住页面。',
}

export default messages
