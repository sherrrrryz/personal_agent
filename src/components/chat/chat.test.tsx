import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState, type ComponentType, type ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { LocaleProvider, LOCALE_STORAGE_KEY } from '@/i18n'
import { axe } from '@/test/axe'

import { ChatComposer, ChatMessageList, PersistenceSwitch, type ChatMessage } from './index'

// Component evidence for the chat family (R-09): every state of the three
// components, the keyboard path, axe, and each demo in zh-CN.

const zh = (ui: ReactNode) => render(<LocaleProvider>{ui}</LocaleProvider>)
const tokens = (element: Element) => element.className.split(' ')

beforeEach(() => {
  window.localStorage.setItem(LOCALE_STORAGE_KEY, 'zh-CN')
})

describe('ChatComposer', () => {
  it('is a labelled text control with a named send button; the label follows the placement', async () => {
    const { container } = zh(
      <>
        <ChatComposer placement="bar" onSend={() => undefined} />
        <ChatComposer placement="thread" onSend={() => undefined} />
        <ChatComposer placement="onboarding" onSend={() => undefined} />
        <ChatComposer label="关于本周排班" onSend={() => undefined} />
      </>,
    )
    const bar = screen.getByRole('textbox', { name: '问 AI' })
    // The label is visible text, wired to the control; the key hint describes it in every placement.
    expect(screen.getByText('问 AI').tagName).toBe('LABEL')
    expect(bar).toHaveAccessibleDescription('按 Enter 发送，按 Shift+Enter 换行。')
    expect(screen.getByRole('textbox', { name: '回复' })).toHaveAccessibleDescription('按 Enter 发送，按 Shift+Enter 换行。')
    expect(screen.getByRole('textbox', { name: '你的回答' })).toBeInTheDocument()
    expect(screen.getByRole('textbox', { name: '关于本周排班' })).toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: '发送' })).toHaveLength(4)
    // In the bar the hint is kept for assistive technology only: one row less above `main`.
    const hints = screen.getAllByText('按 Enter 发送，按 Shift+Enter 换行。')
    expect(hints.filter((hint) => hint.classList.contains('sr-only'))).toHaveLength(2)
    expect(await axe(container)).toHaveNoViolations()
  })

  it('Enter sends the trimmed text and empties the control; Shift+Enter starts a new line', async () => {
    const onSend = vi.fn()
    zh(<ChatComposer onSend={onSend} />)
    const box = screen.getByRole('textbox', { name: '问 AI' })
    await userEvent.type(box, '  明天有哪些预约？{Shift>}{Enter}{/Shift}帮我发确认。  ')
    expect(onSend).not.toHaveBeenCalled()
    expect(box).toHaveValue('  明天有哪些预约？\n帮我发确认。  ')
    await userEvent.keyboard('{Enter}')
    expect(onSend).toHaveBeenCalledExactlyOnceWith('明天有哪些预约？\n帮我发确认。')
    expect(box).toHaveValue('')
    expect(box).toHaveFocus()
  })

  it('Enter that confirms an input-method candidate does not send', () => {
    const onSend = vi.fn()
    zh(<ChatComposer defaultValue="mingtian" onSend={onSend} />)
    const box = screen.getByRole('textbox', { name: '问 AI' })
    fireEvent.keyDown(box, { key: 'Enter', isComposing: true })
    fireEvent.keyDown(box, { key: 'Enter', keyCode: 229 })
    expect(onSend).not.toHaveBeenCalled()
    fireEvent.keyDown(box, { key: 'Enter' })
    expect(onSend).toHaveBeenCalledExactlyOnceWith('mingtian')
  })

  it('empty: the send button is unavailable but stays in the tab order, and nothing is sent', async () => {
    const onSend = vi.fn()
    zh(<ChatComposer onSend={onSend} />)
    const box = screen.getByRole('textbox', { name: '问 AI' })
    const button = screen.getByRole('button', { name: '发送' })
    expect(button).toHaveAttribute('aria-disabled', 'true')
    // Not the `disabled` attribute: the kit would fade the whole group, as if the composer were off.
    expect(button).not.toHaveAttribute('disabled')
    await userEvent.type(box, '   {Enter}')
    await userEvent.click(button)
    expect(onSend).not.toHaveBeenCalled()
    await userEvent.click(box)
    await userEvent.tab()
    expect(button).toHaveFocus()
    await userEvent.type(box, '好')
    expect(button).toHaveAttribute('aria-disabled', 'false')
  })

  it('the send button sends and gives focus back to the text', async () => {
    const onSend = vi.fn()
    zh(<ChatComposer placement="onboarding" defaultValue="宠物美容店" onSend={onSend} />)
    await userEvent.click(screen.getByRole('button', { name: '发送' }))
    expect(onSend).toHaveBeenCalledExactlyOnceWith('宠物美容店')
    const box = screen.getByRole('textbox', { name: '你的回答' })
    expect(box).toHaveValue('')
    expect(box).toHaveFocus()
  })

  it('sending: the button is busy and keeps its name, the text can be edited, nothing is sent twice', async () => {
    const onSend = vi.fn()
    zh(<ChatComposer defaultValue="发吧" sending onSend={onSend} />)
    const box = screen.getByRole('textbox', { name: '问 AI' })
    const button = screen.getByRole('button', { name: '发送' })
    expect(button).toHaveAttribute('aria-busy', 'true')
    expect(button).toHaveAttribute('aria-disabled', 'true')
    await userEvent.type(box, '！{Enter}')
    await userEvent.click(button)
    expect(onSend).not.toHaveBeenCalled()
    expect(box).toHaveValue('发吧！')
  })

  it('disabled: neither the text nor the button can be used', async () => {
    const onSend = vi.fn()
    zh(<ChatComposer disabled defaultValue="发吧" onSend={onSend} />)
    expect(screen.getByRole('textbox', { name: '问 AI' })).toBeDisabled()
    expect(screen.getByRole('button', { name: '发送' })).toBeDisabled()
    await userEvent.click(screen.getByRole('button', { name: '发送' }))
    expect(onSend).not.toHaveBeenCalled()
  })

  it('held by the surface: it reports every change and keeps the text until the surface empties it', async () => {
    const onSend = vi.fn()
    const changes: string[] = []
    let box: HTMLTextAreaElement | null = null
    function Surface() {
      const [text, setText] = useState('重试这句')
      return (
        <ChatComposer
          ref={(node) => {
            box = node
          }}
          value={text}
          onValueChange={(next) => {
            changes.push(next)
            setText(next)
          }}
          onSend={onSend}
        />
      )
    }
    zh(<Surface />)
    expect(box).toBe(screen.getByRole('textbox', { name: '问 AI' }))
    await userEvent.type(box!, '吧{Enter}')
    expect(changes).toEqual(['重试这句吧'])
    expect(onSend).toHaveBeenCalledExactlyOnceWith('重试这句吧')
    // Her text stays in the composer: a failed send loses nothing.
    expect(box).toHaveValue('重试这句吧')
  })

  it('grows with the text up to a maximum, with no fixed height', () => {
    const { container } = zh(<ChatComposer onSend={() => undefined} />)
    const form = container.querySelector('[data-slot="chat-composer"]')!
    expect(tokens(form)).toEqual(expect.arrayContaining(['[&_textarea]:max-h-40', '[&_textarea]:min-h-target']))
    expect(tokens(form).filter((token) => /(?:^|:)(?:h|size)-/.test(token))).toEqual([])
  })
})

const conversation: ChatMessage[] = [
  { id: 'u1', author: 'user', text: '明天有哪些预约？', at: '2026-11-21T19:30:00+08:00' },
  { id: 'a1', author: 'ai', text: '明天有五个预约。', at: '2026-11-21T19:30:00+08:00' },
]

describe('ChatMessageList', () => {
  it('is a polite log; each message names its author and its time', async () => {
    const { container } = zh(<ChatMessageList messages={conversation} />)
    const log = screen.getByRole('log', { name: '对话记录' })
    expect(log).toHaveAttribute('aria-live', 'polite')
    const items = within(log).getAllByRole('listitem')
    expect(items).toHaveLength(2)
    expect(items[0]).toHaveTextContent(/^你你.*明天有哪些预约？$/)
    expect(items[1]).toHaveTextContent(/^AIAI.*明天有五个预约。$/)
    // The avatar repeats the name beside it and is hidden from assistive technology.
    expect(within(items[0]).getByText('你', { selector: '[data-slot="item-title"] span' })).toBeVisible()
    expect(items[0].querySelector('[data-slot="avatar"]')).toHaveAttribute('aria-hidden', 'true')
    expect(items[0].querySelector('time')).toHaveAttribute('datetime', '2026-11-21T19:30:00+08:00')
    expect(items[0].querySelector('[data-author="user"]')).not.toBeNull()
    expect(items[1].querySelector('[data-author="ai"]')).not.toBeNull()
    expect(await axe(container)).toHaveNoViolations()
  })

  it('takes other names for the log and the two authors', () => {
    zh(<ChatMessageList label="入门访谈" userName="周岚" aiName="访谈助手" messages={conversation} />)
    const log = screen.getByRole('log', { name: '入门访谈' })
    expect(within(log).getByText('周岚')).toBeInTheDocument()
    expect(within(log).getByText('访谈助手')).toBeInTheDocument()
  })

  it('empty: says so in a status region, in its own words or the surface’s', async () => {
    const { container, rerender } = zh(<ChatMessageList messages={[]} />)
    expect(screen.getByRole('status')).toHaveTextContent('还没有消息你发出的消息和 AI 的回答会出现在这里。')
    expect(screen.queryByRole('log')).toBeNull()
    expect(await axe(container)).toHaveNoViolations()
    rerender(
      <LocaleProvider>
        <ChatMessageList messages={[]} empty={<p>先说说你做什么工作。</p>} />
      </LocaleProvider>,
    )
    expect(screen.getByRole('status')).toHaveTextContent('先说说你做什么工作。')
  })

  it('streaming: the partial text with the status 正在回答, never busy; the finished text is a new element', async () => {
    const streaming: ChatMessage[] = [conversation[0], { id: 'a1', author: 'ai', text: '明天有', status: 'streaming' }]
    const { container, rerender } = zh(<ChatMessageList messages={streaming} />)
    const partial = screen.getByText('明天有')
    // Kept out of the announcements while it grows…
    expect(partial).toHaveAttribute('aria-live', 'off')
    const status = container.querySelector('[data-slot="chat-message-status"]')!
    expect(status).toHaveTextContent('正在回答…')
    expect(status.querySelector('svg')).toHaveAttribute('aria-hidden', 'true')
    // …and the page is not busy: the status says it in words.
    expect(container.querySelector('[aria-busy="true"]')).toBeNull()
    expect(screen.queryByRole('button', { name: '重试' })).toBeNull()
    expect(await axe(container)).toHaveNoViolations()

    rerender(
      <LocaleProvider>
        <ChatMessageList messages={conversation} />
      </LocaleProvider>,
    )
    const whole = screen.getByText('明天有五个预约。')
    // …then said once, whole: a new node in the log, not the old one changed.
    expect(whole).not.toBe(partial)
    expect(whole).not.toHaveAttribute('aria-live')
    expect(container.querySelector('[data-slot="chat-message-status"]')).toBeNull()
  })

  it('a message that has only just begun shows the status alone', () => {
    const { container } = zh(
      <ChatMessageList messages={[conversation[0], { id: 'a1', author: 'ai', text: '', status: 'streaming' }]} />,
    )
    const answer = container.querySelector('[data-status="streaming"]')!
    expect(answer.querySelectorAll('p')).toHaveLength(1)
    expect(answer).toHaveTextContent(/正在回答…$/)
  })

  it('error: a failed answer says so in words with an icon, and retry asks again and keeps focus on the message', async () => {
    const onRetry = vi.fn()
    const failed: ChatMessage[] = [conversation[0], { id: 'a9', author: 'ai', text: '', status: 'failed' }]
    const { container } = zh(<ChatMessageList messages={failed} onRetry={onRetry} />)
    const status = container.querySelector<HTMLElement>('[data-slot="chat-message-status"]')!
    expect(status).toHaveTextContent('回答失败。')
    expect(status.querySelector('svg[aria-hidden="true"]')).not.toBeNull()
    expect(await axe(container)).toHaveNoViolations()
    await userEvent.tab()
    expect(screen.getByRole('button', { name: '重试' })).toHaveFocus()
    await userEvent.keyboard('{Enter}')
    expect(onRetry).toHaveBeenCalledExactlyOnceWith('a9')
    expect(status).toHaveFocus()
  })

  it('readOnly: a record — no retry, and nothing announced', () => {
    const failed: ChatMessage[] = [conversation[0], { id: 'a9', author: 'ai', text: '', status: 'failed' }]
    zh(<ChatMessageList readOnly messages={failed} onRetry={() => undefined} />)
    expect(screen.getByRole('log')).toHaveAttribute('aria-live', 'off')
    expect(screen.getByText('回答失败。')).toBeInTheDocument()
    expect(screen.queryByRole('button')).toBeNull()
  })

  it('without a retry handler a failed answer has no button', () => {
    zh(<ChatMessageList messages={[{ id: 'a9', author: 'ai', text: '', status: 'failed' }]} />)
    expect(screen.queryByRole('button')).toBeNull()
  })

  it('long: sixty messages are all there, in order', () => {
    const sixty: ChatMessage[] = Array.from({ length: 60 }, (_, index) => ({
      id: `m${index}`,
      author: index % 2 === 0 ? 'user' : 'ai',
      text: `第 ${index + 1} 条`,
    }))
    zh(<ChatMessageList messages={sixty} />)
    const items = within(screen.getByRole('log')).getAllByRole('listitem')
    expect(items).toHaveLength(60)
    expect(items[0]).toHaveTextContent('第 1 条')
    expect(items[59]).toHaveTextContent('第 60 条')
  })

  it('long: a 2000-character message is shown whole, wraps anywhere and keeps its line breaks', () => {
    const text = `${'金毛平均三小时四十五分钟'.repeat(166)}\nhttps://example.test/${'a'.repeat(1986 - 21)}`
    expect(text.length).toBeGreaterThanOrEqual(2000)
    zh(<ChatMessageList messages={[{ id: 'm1', author: 'ai', text }]} />)
    const paragraph = screen.getByText((_, element) => element?.tagName === 'P' && element.textContent === text)
    expect(tokens(paragraph)).toEqual(expect.arrayContaining(['whitespace-pre-wrap', 'wrap-anywhere', 'min-w-0']))
    // Nothing cuts it: no clamp, no truncation, no fixed height on the way up to the log.
    for (let element: Element | null = paragraph; element && element.getAttribute('role') !== 'log'; element = element.parentElement) {
      expect(tokens(element).filter((token) => /^(?:truncate|line-clamp-\d|h-\d|max-h-|overflow-hidden)/.test(token))).toEqual([])
    }
  })

  it('draws attachments through the slot and looks inside none', async () => {
    type Attachment = { kind: 'proposal'; proposalId: string }
    const messages: ChatMessage<Attachment>[] = [
      { id: 'a1', author: 'ai', text: '我起草了四条确认。', attachments: [{ kind: 'proposal', proposalId: 'p-1' }, { kind: 'proposal', proposalId: 'p-2' }] },
    ]
    const renderAttachment = vi.fn((attachment: Attachment) => <section aria-label={`提议 ${attachment.proposalId}`} />)
    const { container, rerender } = zh(<ChatMessageList messages={messages} renderAttachment={renderAttachment} />)
    const item = within(screen.getByRole('log')).getByRole('listitem')
    expect(within(item).getByRole('region', { name: '提议 p-1' })).toBeInTheDocument()
    expect(within(item).getByRole('region', { name: '提议 p-2' })).toBeInTheDocument()
    expect(renderAttachment).toHaveBeenCalledWith(messages[0].attachments![0], messages[0])
    expect(await axe(container)).toHaveNoViolations()
    // No slot, no attachment: the list imports no block and cannot draw one itself.
    rerender(
      <LocaleProvider>
        <ChatMessageList messages={messages} />
      </LocaleProvider>,
    )
    expect(container.querySelector('[data-slot="chat-message-attachments"]')).toBeNull()
  })

  it('loading and error are the conversation’s own states: skeleton messages, then 无法载入这段对话 with retry', async () => {
    const onReload = vi.fn()
    const { container, rerender } = zh(<ChatMessageList messages={[]} state="loading" />)
    expect(screen.getByRole('status')).toHaveTextContent('正在载入对话…')
    expect(container.querySelector('[aria-busy="true"] [aria-hidden="true"] [data-slot="skeleton"]')).not.toBeNull()
    rerender(
      <LocaleProvider>
        <ChatMessageList messages={[]} state="error" onReload={onReload} />
      </LocaleProvider>,
    )
    expect(screen.getByRole('status')).toHaveTextContent('无法载入这段对话内容没有丢失，请稍后再试。')
    await userEvent.click(screen.getByRole('button', { name: '重试' }))
    expect(onReload).toHaveBeenCalledOnce()
    expect(await axe(container)).toHaveNoViolations()
  })

  describe('follow', () => {
    const add = (list: ChatMessage[], message: ChatMessage) => [...list, message]
    function setup(props: { readOnly?: boolean; follow?: boolean } = {}) {
      const scrollIntoView = vi.fn()
      const view = zh(<ChatMessageList messages={conversation} {...props} />)
      view.container.querySelector<HTMLElement>('[data-slot="chat-message-list-end"]')!.scrollIntoView = scrollIntoView
      const show = (messages: ChatMessage[]) =>
        view.rerender(
          <LocaleProvider>
            <ChatMessageList messages={messages} {...props} />
          </LocaleProvider>,
        )
      return { scrollIntoView, show }
    }

    it('never scrolls when it first appears; brings a new message and a growing answer into view', () => {
      const { scrollIntoView, show } = setup()
      expect(scrollIntoView).not.toHaveBeenCalled()
      const asked = add(conversation, { id: 'u2', author: 'user', text: '发吧' })
      show(asked)
      expect(scrollIntoView).toHaveBeenCalledTimes(1)
      expect(scrollIntoView).toHaveBeenLastCalledWith({ block: 'nearest' })
      show(add(asked, { id: 'a2', author: 'ai', text: '', status: 'streaming' }))
      show(add(asked, { id: 'a2', author: 'ai', text: '四条确认', status: 'streaming' }))
      show(add(asked, { id: 'a2', author: 'ai', text: '四条确认已准备好。' }))
      expect(scrollIntoView).toHaveBeenCalledTimes(4)
      // The same list again moves nothing.
      show(add(asked, { id: 'a2', author: 'ai', text: '四条确认已准备好。' }))
      expect(scrollIntoView).toHaveBeenCalledTimes(4)
    })

    it('stays still for a record, and when the surface turns it off', () => {
      for (const props of [{ readOnly: true }, { follow: false }]) {
        const { scrollIntoView, show } = setup(props)
        show(add(conversation, { id: 'u2', author: 'user', text: '发吧' }))
        expect(scrollIntoView).not.toHaveBeenCalled()
      }
    })
  })
})

const parents = [
  { value: 'appointments', label: '预约' },
  { value: 'customers', label: '顾客' },
]

describe('PersistenceSwitch', () => {
  it('one-off: a switch named 设为长期 whose description says what turning it on creates', async () => {
    const { container } = zh(
      <PersistenceSwitch persistent={false} defaultName="预约确认" parents={parents} onCreate={() => undefined} onArchive={() => undefined} />,
    )
    const control = screen.getByRole('switch', { name: '设为长期' })
    expect(control).not.toBeChecked()
    expect(control).toHaveAccessibleDescription(/会变成一个子模块：有自己的工作流，可以重复运行。创建前先确认名称和所属模块。/)
    expect(container.querySelector('[data-state="one-off"]')).not.toBeNull()
    expect(screen.queryByRole('group', { name: '创建子模块' })).toBeNull()
    expect(await axe(container)).toHaveNoViolations()
  })

  it('confirming: turning it on asks for name and parent, prefilled, and creates only on 创建', async () => {
    const onCreate = vi.fn()
    const { container } = zh(
      <PersistenceSwitch
        persistent={false}
        defaultName="预约确认"
        parents={parents}
        defaultParent="customers"
        onCreate={onCreate}
        onArchive={() => undefined}
      />,
    )
    const control = screen.getByRole('switch', { name: '设为长期' })
    control.focus()
    await userEvent.keyboard(' ')
    expect(control).toBeChecked()
    expect(container.querySelector('[data-state="confirming"]')).not.toBeNull()
    expect(onCreate).not.toHaveBeenCalled()
    // Focus stays on the switch; the question follows it in the tab order.
    expect(control).toHaveFocus()
    const group = screen.getByRole('group', { name: '创建子模块' })
    const name = within(group).getByRole('textbox', { name: '名称' })
    expect(name).toHaveValue('预约确认')
    expect(within(group).getByRole('combobox', { name: '所属模块' })).toHaveTextContent('顾客')
    expect(await axe(container)).toHaveNoViolations()

    await userEvent.tab()
    expect(name).toHaveFocus()
    await userEvent.clear(name)
    await userEvent.type(name, ' 每晚确认 {Enter}')
    expect(onCreate).toHaveBeenCalledExactlyOnceWith({ name: '每晚确认', parentId: 'customers' })
    // The question is answered: it leaves, and focus is back on the switch.
    expect(screen.queryByRole('group', { name: '创建子模块' })).toBeNull()
    expect(control).toHaveFocus()
  })

  it('confirming: a blank name is refused in words beside the field; 取消 leaves it one-off', async () => {
    const onCreate = vi.fn()
    zh(<PersistenceSwitch persistent={false} defaultName="预约确认" parents={parents} onCreate={onCreate} onArchive={() => undefined} />)
    const control = screen.getByRole('switch', { name: '设为长期' })
    await userEvent.click(control)
    const name = screen.getByRole('textbox', { name: '名称' })
    await userEvent.clear(name)
    await userEvent.click(screen.getByRole('button', { name: '创建' }))
    expect(onCreate).not.toHaveBeenCalled()
    expect(name).toBeInvalid()
    expect(name).toHaveAccessibleDescription('请给子模块起个名称。')
    await userEvent.type(name, '确')
    expect(name).not.toBeInvalid()

    await userEvent.click(screen.getByRole('button', { name: '取消' }))
    expect(screen.queryByRole('group', { name: '创建子模块' })).toBeNull()
    expect(control).not.toBeChecked()
    expect(control).toHaveFocus()
    expect(onCreate).not.toHaveBeenCalled()
    // Asked again, it starts from the prefilled name, not from what was typed.
    await userEvent.click(control)
    expect(screen.getByRole('textbox', { name: '名称' })).toHaveValue('预约确认')
    // Turning the switch off again is the same as cancelling.
    await userEvent.click(control)
    expect(screen.queryByRole('group', { name: '创建子模块' })).toBeNull()
  })

  it('persistent: on, naming what it became; turning it off asks first and archives only on 归档', async () => {
    const onArchive = vi.fn()
    const { container } = zh(
      <PersistenceSwitch
        persistent
        moduleName="预约确认"
        defaultName="预约确认"
        parents={parents}
        onCreate={() => undefined}
        onArchive={onArchive}
      />,
    )
    const control = screen.getByRole('switch', { name: '设为长期' })
    expect(control).toBeChecked()
    expect(control).toHaveAccessibleDescription('这段对话已是子模块「预约确认」。关闭会把它归档，对话仍保留在话题里。')
    expect(container.querySelector('[data-state="persistent"]')).not.toBeNull()

    await userEvent.click(control)
    let dialog = await screen.findByRole('alertdialog', { name: '归档「预约确认」？' })
    expect(dialog).toHaveTextContent('它的对话仍保留在话题里')
    await userEvent.click(within(dialog).getByRole('button', { name: '取消' }))
    await waitFor(() => expect(screen.queryByRole('alertdialog')).toBeNull())
    expect(onArchive).not.toHaveBeenCalled()
    // Still on: the switch never flips by itself.
    expect(control).toBeChecked()

    await userEvent.click(control)
    dialog = await screen.findByRole('alertdialog', { name: '归档「预约确认」？' })
    await userEvent.click(within(dialog).getByRole('button', { name: '归档' }))
    expect(onArchive).toHaveBeenCalledOnce()
    await waitFor(() => expect(screen.queryByRole('alertdialog')).toBeNull())
  })

  it('created from outside while the question is open: the question leaves', () => {
    const props = { defaultName: '预约确认', parents, onCreate: () => undefined, onArchive: () => undefined }
    const { rerender } = zh(<PersistenceSwitch persistent={false} {...props} />)
    fireEvent.click(screen.getByRole('switch', { name: '设为长期' }))
    expect(screen.getByRole('group', { name: '创建子模块' })).toBeInTheDocument()
    rerender(
      <LocaleProvider>
        <PersistenceSwitch persistent {...props} />
      </LocaleProvider>,
    )
    expect(screen.queryByRole('group', { name: '创建子模块' })).toBeNull()
    expect(screen.getByRole('switch', { name: '设为长期' })).toBeChecked()
    expect(screen.getByRole('switch')).toHaveAccessibleDescription('这段对话已是一个子模块。关闭会把它归档，对话仍保留在话题里。')
  })

  it('disabled: cannot be turned', async () => {
    zh(<PersistenceSwitch disabled persistent={false} defaultName="预约确认" parents={parents} onCreate={() => undefined} onArchive={() => undefined} />)
    const control = screen.getByRole('switch', { name: '设为长期' })
    expect(control).toHaveAttribute('aria-disabled', 'true')
    await userEvent.click(control)
    expect(screen.queryByRole('group', { name: '创建子模块' })).toBeNull()
  })
})

describe('the chat demos', () => {
  const demos = Object.entries(import.meta.glob<ComponentType>('./*.demo.tsx', { eager: true, import: 'default' }))

  it('every component of the family has a demo', () => {
    expect(demos.map(([path]) => path).sort()).toEqual(
      ['ChatComposer', 'ChatMessageList', 'PersistenceSwitch'].map((name) => `./${name}.demo.tsx`),
    )
  })

  it.each(demos)('%s renders in zh-CN with no English text or name, never busy, and no axe violation', async (_path, Demo) => {
    const { container } = zh(<Demo />)
    const prose = container.cloneNode(true) as HTMLElement
    for (const code of prose.querySelectorAll('code')) code.remove()
    // "AI" is the product's own word in zh-CN (与 AI 对话), and Enter and Shift are key names, not words.
    const allowed = /AI|Enter|Shift/g
    expect((prose.textContent ?? '').replace(allowed, '')).not.toMatch(/[A-Za-z]{2,}/)
    expect(prose.textContent).toMatch(/\p{Script=Han}/u)
    for (const named of container.querySelectorAll('[aria-label], [title]')) {
      for (const attribute of ['aria-label', 'title']) {
        expect((named.getAttribute(attribute) ?? '').replace(allowed, '')).not.toMatch(/[A-Za-z]{2,}/)
      }
    }
    // A demo that started busy would hold every matrix cell for the harness's eight-second wait.
    expect(container.querySelector('[aria-busy="true"]')).toBeNull()
    expect(await axe(container)).toHaveNoViolations()
  })

  it('the list demo holds the evidence R-09 names: sixty messages, one of 2,000 characters, an attachment', () => {
    const { container } = zh(<ListDemo />)
    const long = screen.getByRole('log', { name: '六十条消息' })
    const items = within(long).getAllByRole('listitem')
    expect(items).toHaveLength(60)
    expect(Math.max(...items.map((item) => item.querySelector('p')?.textContent?.length ?? 0))).toBe(2000)
    // The region around it scrolls, so it can be reached and scrolled by keyboard.
    expect(long.closest('[tabindex="0"]')).toHaveAccessibleName('一段很长的对话')
    expect(container.querySelector('[data-slot="chat-message-attachments"]')).toHaveTextContent('提议：发出四条确认')
  })
})

const ListDemo = Object.values(import.meta.glob<ComponentType>('./ChatMessageList.demo.tsx', { eager: true, import: 'default' }))[0]
