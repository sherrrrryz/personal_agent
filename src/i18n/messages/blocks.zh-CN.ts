import type { Translation } from '../types'
import type en from './blocks.en'

const messages: Translation<typeof en> = {
  'renderer.changes': { other: '本次运行：{count} 处更新' },
  'renderer.empty.title': '这个页面还没有内容',
  'renderer.empty.body': '工作流运行后，它输出的内容会出现在这里。',
  'renderer.error.title': '无法载入这个页面',
  'renderer.error.reason': '工作流的输出没有送达。没有任何内容被更改，你可以再试一次。',
  'renderer.unknown.title': '无法显示这个区块',
  'renderer.unknown.body': '工作流输出了一个未注册的区块类型：',

  'pin.short': '固定',
  'pin.label': '固定「{title}」',
  'pin.announce.on': '已固定「{title}」。以后布局调整时，它留在现在的位置。',
  'pin.announce.off': '已取消固定「{title}」。它会随布局移动。',

  'text.links': '相关链接',
  'text.empty.title': '还没有说明',
  'text.error.title': '这段说明没有写出来',
  'text.error.reason': '生成这段文字时出错了。页面上的其他内容不受影响。',

  'empty.error.title': '无法载入这一部分',
  'empty.error.reason': '内容没有送达。没有任何内容被更改。',

  'proposal.from': '来自',
  'proposal.parts': '建议的各项',
  'proposal.accept': '接受',
  'proposal.reject': '拒绝',
  'proposal.state.accepted': '已接受',
  'proposal.state.rejected': '已拒绝',
  'proposal.state.pending': '待你决定',
  'proposal.remaining': { other: '还有 {count} 项待你决定。' },
  'proposal.done': '全部已处理：接受 {accepted} 项，拒绝 {rejected} 项。',
  'proposal.empty.title': '没有待你决定的建议',
  'proposal.error.title': '无法载入这条建议',
  'proposal.error.reason': '建议的内容没有送达。没有任何内容被更改。',

  'demo.pick': '显示的状态',
  'demo.state.ready': '正常',
  'demo.state.loading': '载入中',
  'demo.state.empty': '空',
  'demo.state.error': '出错',
  'demo.state.long': '超长内容',
  'demo.marks': '标出上次运行的变化',
  'demo.reset': '重新开始',
  'demo.readOnly': '没有操作处理时：只读',

  'demo.renderer.page': '由全部已注册区块组成的页面',
  'demo.renderer.run': '模拟一次运行',
  'demo.renderer.reorder': '调整工作流的输出顺序',
  'demo.renderer.order': '工作流输出的顺序：{order}',
  'demo.renderer.narrow': '容器较窄时：半宽区块上下排列',
  'demo.renderer.wide': '容器够宽时：半宽区块左右成对',
  'demo.renderer.unknown': '没有注册过的区块类型',
  'demo.renderer.unknownTitle': '月度图表',
  'demo.renderer.noteNarrow': '说明（窄）',
  'demo.renderer.linksNarrow': '下一步（窄）',
  'demo.renderer.noteWide': '说明（宽）',
  'demo.renderer.linksWide': '下一步（宽）',
  'demo.renderer.pairBody': '这周金毛平均用时 3 小时 45 分。',
  'demo.renderer.pairNext': '周一的复盘会告诉你品种表要不要调整。',

  'demo.text.title': '关于这周的时长',
  'demo.text.body':
    '这周做完的五只金毛平均用了 3 小时 45 分，比你品种表里的 4 小时短。\n\n大福不太配合，用了 4 小时 10 分；豆豆最快，3 小时 20 分。周一的复盘会告诉你品种表要不要调整。',
  'demo.text.link1': '打开品种时长表',
  'demo.text.link2': '打开豆豆的档案',
  'demo.text.longBody':
    '这周做完的五只金毛平均用了 3 小时 45 分，比你品种表里的 4 小时短。最短的一次 3 小时 20 分，最长的一次 4 小时 10 分。\n\n大福这次还是不太配合，中途歇了两回，所以比品种表多用了 10 分钟。豆豆、麦芽、奶茶和另一只金毛都提前做完；对这四只来说，品种表每次都多留了 15 到 40 分钟。\n\n比熊雪球用了 2 小时 10 分，品种表是 2 小时；那只边牧用了 3 小时 05 分，品种表是 3 小时。各只有一次记录，还不足以改动什么，所以这两行保持原样。\n\n柯基和法斗还没有做完的预约，它们那两行仍然用你自己的估计。第一次做完后，实测一栏就会有数；适用时长只有在你接受建议之后才会变。\n\n目前什么都没有改。周一早上 9 点，每周复盘会把实测平均和品种表逐行对比；差距在多次到店后依然存在的，会提出新的适用时长，由你逐行接受或拒绝。',
  'demo.text.longLink3': '打开这周已完成预约的列表，里面有每一单的预计时长和实际时长',
  'demo.text.longLink4': '打开每周复盘的工作流',
  'demo.text.longLink5': '打开记录这些时长的记忆表',

  'demo.empty.title': '待办',
  'demo.empty.heading': '今天没有待办',
  'demo.empty.body': '店里的待办会出现在这里：你自己记下的，以及其他模块转过来的。',
  'demo.empty.action': '去看今天的预约',
  'demo.empty.longHeading': '今天没有待办，昨天和周末也没有留下任何需要接着处理的事情',
  'demo.empty.longBody':
    '店里的待办会出现在这里：你自己记下的；顾客迟迟没有确认时，预约模块转过来的；洗毛液快用完时，库存模块提出的；还有每周复盘留给你的。它们都没有事情找你的时候，这个页面就是空的。',
  'demo.empty.longAction': '去看今天的预约，以及还在等待安排时间的预约',

  'demo.proposal.title': '周六排班调整建议',
  'demo.proposal.source': '排班',
  'demo.proposal.summary': '周六有两只金毛连着来。按品种表每只要 4 小时，小陈一个人排不开。',
  'demo.proposal.part1': '把豆豆的预约从 10:00 挪到 9:00',
  'demo.proposal.part2': '周六请阿杰多上 2 小时',
  'demo.proposal.part3': '给大福的主人发消息，确认新的时间',
  'demo.proposal.longPart4':
    '把 13:00 到 14:00 这一小时给两位美容师都空出来；万一有预约超时（大福常常这样），就不会把当天后面的预约全部往后推',
  'demo.proposal.longPart5': '把雪球的洗澡从周六 15:00 挪到周日 10:00，小陈那时有 2 小时 30 分的空档',
  'demo.proposal.longPart6': '把改时间的事告诉雪球的主人，请对方在周五晚上之前确认',
  'demo.proposal.longPart7': '布丁第一次到店，和所有首次到店一样多留 30 分钟',
  'demo.proposal.longPart8': '周六之前订两瓶长毛洗毛液，现在只剩一瓶',
}

export default messages
