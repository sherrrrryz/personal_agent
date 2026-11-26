import type { Translation } from '../types'
import type en from './inputs.en'

const messages: Translation<typeof en> = {
  'modePicker.limit': '你的设置在这里最多允许「{mode}」，所以不能选择自主程度更高的模式。',

  'demo.variants': '样式',
  'demo.sizes': '尺寸',
  'demo.states': '状态',
  'demo.wrapping': '长文本',
  'demo.surfaces': '在各个底色上',

  'button.demo.primary': '保存更改',
  'button.demo.secondary': '预览',
  'button.demo.ghost': '跳过',
  'button.demo.danger': '删除预约',
  'button.demo.link': '查看全部预约',
  'button.demo.small': '添加备注',
  'button.demo.add': '添加',
  'button.demo.withIcon': '新建预约',
  'button.demo.disabled': '暂不可用',
  'button.demo.startLoading': '显示进行中状态',
  'button.demo.stopLoading': '结束进行中状态',
  'button.demo.long': '一段足够长的按钮文字，在空间不够时会换成多行显示，而不会被截断',
}

export default messages
