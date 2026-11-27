import type { Translation } from '../types'
import type en from './memory.en'

const messages: Translation<typeof en> = {
  title: '资料',
  'tabs.label': '资料表',

  'cell.none': '尚无数据',
  'flag.yes': '是',
  'flag.no': '否',
  'table.empty': '暂无记录',

  'breeds.basis.seed': '你的经验',
  'breeds.basis.average': { other: '{count} 只的平均' },
  'breeds.observed': { other: '约 {average}（{count} 只，{min} – {max}）' },
  'dogs.applied': '{duration}（{basis}）',

  'readers.title': '谁在读这份资料',
  'readers.shared': '资料在你的整个工作台里是共享的：任何功能都可以读取别的功能学到的内容。这里没有需要打开或关闭的开关。',
  'readers.none': '目前还没有别的功能读取这份资料。',
  'readers.reads': '读取：{tables}',
  'readers.separator': '、',

  'empty.title': '这个功能还没有记住任何东西',
  'empty.body': '它的流程学到的内容会以表格的形式出现在这里。',

  loading: '正在载入资料…',
  'error.title': '无法载入资料',
  'error.body': '资料表没有送达。没有任何内容被更改，上方的链接照常可用，你可以再试一次。',
}

export default messages
