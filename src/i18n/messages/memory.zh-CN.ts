import type { Translation } from '../types'
import type en from './memory.en'

const messages: Translation<typeof en> = {
  title: '记忆',
  'tabs.label': '记忆表',

  'cell.none': '尚无数据',
  'flag.yes': '是',
  'flag.no': '否',
  'table.empty': '暂无记录',

  'breeds.basis.seed': '你的经验',
  'breeds.basis.average': { other: '{count} 只的平均' },
  'breeds.observed': { other: '约 {average}（{count} 只，{min} – {max}）' },
  'dogs.applied': '{duration}（{basis}）',

  'readers.title': '谁在读这份记忆',
  'readers.shared': '记忆在你的整个工作台里是共享的：任何模块都可以读取别的模块学到的内容。这里没有需要打开或关闭的开关。',
  'readers.none': '目前还没有别的模块读取这份记忆。',
  'readers.reads': '读取：{tables}',
  'readers.separator': '、',

  'empty.title': '这个模块还没有记住任何东西',
  'empty.body': '它的工作流学到的内容会以表格的形式出现在这里。',

  loading: '正在载入记忆…',
  'error.title': '无法载入记忆',
  'error.body': '记忆表没有送达。没有任何内容被更改，上方的链接照常可用，你可以再试一次。',
}

export default messages
