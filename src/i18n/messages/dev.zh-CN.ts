import type { Translation } from '../types'
import type en from './dev.en'

const messages: Translation<typeof en> = {
  'gallery.title': '组件库',
  'gallery.intro': '每个已登记的组件及其演示。不属于产品本身。',
  'gallery.families': '组件分类',
  'gallery.all': '全部',
  'gallery.empty': '这个分类还没有演示。',
  'gallery.count': { other: '{count} 个演示' },

  'family.layout': '布局',
  'family.actions': '操作',
  'family.inputs': '输入',
  'family.navigation': '导航',
  'family.containers': '容器',
  'family.feedback': '反馈',
  'family.data-display': '数据展示',
  'family.chat': '对话',
  'family.blocks': '区块',
  'family.data-blocks': '数据区块',
  'family.module': '模块框架',
  'family.workflow': '工作流',

  'sample.item': '条目 {n}',
  'sample.short': '短文本',
  'sample.long': '一段比较长的文字，在窄屏和大字号下需要换成好几行显示，而且不能被截断。',
  'sample.longTitle': '一个足够长、会在操作按钮旁边换行的分区标题',
  'sample.action': '操作',

  'layout.page.prose': '阅读宽度',
  'layout.page.wide': '宽',
  'layout.page.full': '全宽',
  'layout.stack.gaps': '间距档位',
  'layout.inline.wrap': '空间不够时换行',
  'layout.inline.between': '推到两端',
  'layout.grid.columns': '列数随网格自身的宽度变化',
  'layout.grid.span': '占满整行的条目',
  'layout.section.level': '带 {level} 级标题的分区',
}

export default messages
