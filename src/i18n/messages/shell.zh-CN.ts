import type { Translation } from '../types'
import type en from './shell.en'

const messages: Translation<typeof en> = {
  skip: '跳到主要内容',

  'nav.label': '功能导航',
  'nav.base': '基础',
  'nav.profession': '我的店 · 宠物美容',
  'nav.topics': '话题',
  'nav.footer': '设置与偏好',
  'nav.settings': '设置',
  'nav.awaiting': { other: '{count} 项等待你确认' },


  'device.label': '原型控制 · 时间推进：{scene}',
  'device.prev': '上一幕',
  'device.next': '下一幕',
  'device.restart': '重新开始（回到首次使用）',
  'device.preview': '状态预览',
  'device.previewing': '原型控制：正在预览「{state}」状态',
  'device.restore': '恢复正常',
  'device.jumped': '已跳到「{scene}」',
  'device.restarted': '已重新开始：回到首次使用',
  'device.restored': '预览已结束：各页面恢复显示自己的状态',

  'preview.normal': '正常',
  'preview.empty': '空',
  'preview.loading': '加载中',
  'preview.error': '出错',
  'preview.long': '超长内容',

  'demo.title': '外壳演示',
  'demo.description': '单独展示应用外壳：侧边栏、页头、原型控制，以及最下面一行的对话栏。',
  'demo.parts.title': '可以看什么',
  'demo.parts.sidebar': '窗口宽时侧边栏完整展开，中等宽度时收成图标栏，窗口窄时收到画面之外、需要时再滑出。页头最前面的按钮用来切换。',
  'demo.parts.device': '页头末尾的原型控制可以在各幕之间跳转，也可以让每个页面强制显示某种状态。强制状态期间，页头下方会有一行提示，直到恢复正常。',
  'demo.parts.bar': '这块区域下方的一行是对话栏的位置。它是布局中的一行，不会盖住页面：这块区域自己滚动。',
  'demo.modules.title': '改动功能',
  'demo.modules.note': '每个按钮调用一个更新时操作，侧边栏会立刻显示变化。',
  'demo.modules.rename': '重命名「预约」',
  'demo.modules.renamed': '预约与到店（已重命名）',
  'demo.modules.add': '添加一个功能',
  'demo.modules.added': '会员',
  'demo.modules.remove': '移除「排班」',
  'demo.modules.sub': '在「预约」下添加子功能',
  'demo.modules.subName': '老顾客的生日提醒',
  'demo.route.title': '在页面之间移动',
  'demo.route.note': '点开链接后，焦点会移到新页面的标题上，标签页的标题也随之更新。',
  'demo.route.next': '打开第二页',
  'demo.route.back': '回到外壳演示',
  'demo.second.title': '第二页',
  'demo.second.description': '点开链接后，焦点落在这个标题上。',
  'demo.filler.title': '长内容',
  'demo.filler.text': '这段文字只是为了让页面比窗口更长：这块区域滚动时，页头和底部那一行都留在原处。第 {count} 段。',
}

export default messages
