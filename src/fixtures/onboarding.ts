import type { Message } from '@/runtime/model'
import { tx, type Text } from '@/runtime/text'

// The profession interview of `onboarding.profession` (spec part 3 § Screens
// and flows): the AI asks four things in turn, her scripted answers are the
// suggestion buttons, and the AI closes with a summary. It happens before
// the first scene, so it is not part of any snapshot.

export const interview: {
  questions: Array<{ id: string; question: Text; answer: Text }>
  summary: Text
} = {
  questions: [
    {
      id: 'work',
      question: tx('你好，我先了解一下你的工作。你是做什么的？', 'Hello — let me get to know your work first. What do you do?'),
      answer: tx('我开了一家宠物美容店，我是店长，叫周岚。', 'I run a pet-grooming shop. I am the manager; my name is Zhou Lan.'),
    },
    {
      id: 'organisation',
      question: tx('店里的工作是怎么安排的？有几个人，怎么分工？', 'How is the work in the shop organised? How many of you are there, and who does what?'),
      answer: tx(
        '连我三个人：我和两位美容师小陈、阿杰。顾客先预约，我按美容师排时间；店里也卖香波、狗粮这些商品。',
        'Three of us: me and two groomers, Xiao Chen and A-Jie. Customers book ahead and I fit each booking into a groomer’s day; we also sell shampoo, dog food and the like.',
      ),
    },
    {
      id: 'recurring',
      question: tx('哪些事是每天或每周都要重复做的？', 'What do you have to do again every day or every week?'),
      answer: tx(
        '每天晚上给第二天的顾客发预约确认，每周排一次班，库存低了要补货。',
        'Every evening I confirm the next day’s bookings with the customers, once a week I plan the rota, and I restock when something runs low.',
      ),
    },
    {
      id: 'records',
      question: tx('每只狗你会记些什么？现在用哪些工具？', 'What do you keep track of for each dog, and which tools do you use today?'),
      answer: tx(
        '品种、毛长、体型、主人，还有性格和每次来做了多久。预约记在日历里，和顾客用微信联系，收款用收款码。',
        'Breed, coat, size and owner, plus temperament and how long each visit took. Bookings are in my calendar, I talk to customers on WeChat, and I take payment by QR code.',
      ),
    },
  ],
  summary: tx(
    '明白了。你是宠物美容店的店长，和小陈、阿杰一起按预约给狗做美容，也卖商品；每晚确认预约、每周排班、按库存补货；每只狗有自己的档案。我建议从四个功能开始：预约、顾客与宠物、商品与库存、排班。下一步你可以调整它们。',
    'Understood. You manage a pet-grooming shop; with Xiao Chen and A-Jie you groom dogs by appointment and sell products; you confirm bookings every evening, plan the rota every week and restock by stock level; every dog has its own file. I suggest starting with four features: Appointments, Clients and pets, Products and stock, Shifts. You can adjust them in the next step.',
  ),
}

/** The evening the interview takes place: just before the first scene. */
const interviewAt = '2026-11-01T19:30'

/**
 * The interview as chat messages when she has given `answered` answers
 * (0…4): the questions so far, her answers, and — after the fourth — the
 * summary. `0` is the screen's empty state: the first question is already there.
 */
export function interviewMessages(answered: number = interview.questions.length): Message[] {
  const say = (id: string, author: Message['author'], text: Text): Message => ({ id, author, text, at: interviewAt, status: 'done' })
  const messages: Message[] = []
  interview.questions.forEach((each, index) => {
    if (index > answered) return
    messages.push(say(`interview-${each.id}-question`, 'ai', each.question))
    if (index < answered) messages.push(say(`interview-${each.id}-answer`, 'user', each.answer))
  })
  if (answered >= interview.questions.length) messages.push(say('interview-summary', 'ai', interview.summary))
  return messages
}
