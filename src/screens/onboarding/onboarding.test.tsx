import { act, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { afterEach, describe, expect, it } from 'vitest'

import { Providers } from '@/app/Providers'
import { buildRoutes } from '@/app/router'
import { toast } from '@/components/feedback'
import { compactQuery } from '@/hooks/use-mobile'
import { LOCALE_STORAGE_KEY } from '@/i18n'
import { createRuntime, RuntimeContext, storageKeys, type Runtime } from '@/runtime'
import { memoryStorage } from '@/runtime/test-support'
import { expandedQuery } from '@/shell/use-media'
import { axe } from '@/test/axe'
import { setMediaQuery } from '@/test/match-media'

import { reentryPath } from './paths'

// B-14 and B-15 of docs/specs/lofi-prototype-screens.md: the three onboarding
// steps on the app's own routes, the first run from `/` to 通知, the states of
// each step under 状态预览, and re-entry from `settings.profession` (D-36).

const answers = [
  '我开了一家宠物美容店，我是店长，叫周岚。',
  '连我三个人：我和两位美容师小陈、阿杰。顾客先预约，我按美容师排时间；店里也卖香波、狗粮这些商品。',
  '每天晚上给第二天的顾客发预约确认，每周排一次班，库存低了要补货。',
  '品种、毛长、体型、主人，还有性格和每次来做了多久。预约记在日历里，和顾客用微信联系，收款用收款码。',
]
const proposed = ['预约', '顾客与宠物', '商品与库存', '排班']

function open(path: string, options: { search?: string; storage?: ReturnType<typeof memoryStorage> | null; locale?: 'zh-CN' | 'en' } = {}) {
  const { search = '', storage = null, locale = 'zh-CN' } = options
  window.localStorage.setItem(LOCALE_STORAGE_KEY, locale)
  act(() => {
    setMediaQuery(compactQuery, false)
    setMediaQuery(expandedQuery, true)
  })
  const runtime: Runtime = createRuntime({ delay: 0, storage, search })
  const router = createMemoryRouter(buildRoutes(), { initialEntries: [path] })
  const view = render(
    <Providers>
      <RuntimeContext value={runtime}>
        <RouterProvider router={router} />
      </RuntimeContext>
    </Providers>,
  )
  return { runtime, router, ...view }
}

const heading = (name: string) => screen.findByRole('heading', { level: 1, name })
const rows = () => within(screen.getByRole('list', { name: '职业模块' })).getAllByRole('listitem')

async function interview() {
  for (const answer of answers) await userEvent.click(await screen.findByRole('button', { name: answer }))
  // The summary has arrived: 继续 is available.
  await waitFor(() => expect(screen.getByRole('button', { name: '继续' })).not.toHaveAttribute('aria-disabled', 'true'))
}

afterEach(() => {
  act(() => toast.dismiss())
})

describe('onboarding, the first run (B-14)', () => {
  it('leads from / through the three steps to 通知, and is not shown again', async () => {
    const storage = memoryStorage()
    const { router, runtime, container } = open('/', { storage })

    // Step 1: `/` opens the interview; the first question is already there.
    await heading('先聊聊你的工作')
    expect(router.state.location.pathname).toBe('/onboarding/profession')
    expect(screen.getByText('第 1 步，共 3 步')).toBeInTheDocument()
    expect(screen.getByText('你好，我先了解一下你的工作。你是做什么的？')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '继续' })).toHaveAttribute('aria-disabled', 'true')
    expect(await axe(container)).toHaveNoViolations()

    // Her four scripted answers; the AI closes naming the four modules.
    await interview()
    expect(await screen.findByText(/我建议从四个模块开始：预约、顾客与宠物、商品与库存、排班。/)).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: '继续' }))

    // Step 2: the four proposed modules, one line each.
    await heading('你的模块')
    expect(screen.getByText('第 2 步，共 3 步')).toBeInTheDocument()
    await waitFor(() => expect(rows()).toHaveLength(4))
    const set = runtime.getState().modules.filter((module) => module.kind === 'profession')
    expect(set.map((module) => module.name['zh-CN'])).toEqual(proposed)
    rows().forEach((row, index) => {
      expect(row).toHaveTextContent(proposed[index])
      expect(row).toHaveTextContent(set[index].description['zh-CN'])
    })

    // Rename.
    await userEvent.click(screen.getByRole('button', { name: '重命名「排班」' }))
    const name = within(await screen.findByRole('dialog', { name: '重命名模块' })).getByRole('textbox', { name: '名称' })
    await userEvent.clear(name)
    await userEvent.type(name, '员工排班{Enter}')
    await waitFor(() => expect(rows()[3]).toHaveTextContent('员工排班'))

    // Remove, then undo from the toast.
    await userEvent.click(screen.getByRole('button', { name: '移除「商品与库存」' }))
    await waitFor(() => expect(rows()).toHaveLength(3))
    await userEvent.click(await screen.findByRole('button', { name: '撤销' }))
    await waitFor(() => expect(rows()).toHaveLength(4))
    expect(rows()[2]).toHaveTextContent('商品与库存')

    // Add.
    await userEvent.click(screen.getByRole('button', { name: '添加模块' }))
    const add = within(await screen.findByRole('dialog', { name: '添加模块' }))
    await userEvent.type(add.getByRole('textbox', { name: '名称' }), '寄养')
    await userEvent.type(add.getByRole('textbox', { name: '它要做什么' }), '记录寄养的狗和天数。')
    await userEvent.click(add.getByRole('button', { name: '保存' }))
    await waitFor(() => expect(rows()).toHaveLength(5))
    expect(rows()[4]).toHaveTextContent('寄养')
    expect(rows()[4]).toHaveTextContent('记录寄养的狗和天数。')
    expect(await axe(container)).toHaveNoViolations()

    await userEvent.click(screen.getByRole('button', { name: '确认并生成' }))

    // Step 3: a connection is simulated, and says so.
    await heading('连接账号')
    expect(screen.getByText('第 3 步，共 3 步')).toBeInTheDocument()
    await userEvent.click(await screen.findByRole('button', { name: /更多/ }))
    await userEvent.click(await screen.findByRole('button', { name: '连接「Google」' }))
    const dialog = await screen.findByRole('dialog', { name: '连接「Google」' })
    expect(dialog).toHaveTextContent('原型：模拟授权')
    await userEvent.click(within(dialog).getByRole('button', { name: '模拟连接' }))
    await waitFor(() => expect(runtime.getState().accounts.find((account) => account.id === 'google')?.status).toBe('connected'))
    expect(container.querySelector('[data-account="google"]')).toHaveTextContent('已连接')
    expect(await axe(container)).toHaveNoViolations()

    // 完成 lands on 通知.
    await userEvent.click(screen.getByRole('button', { name: '完成' }))
    await waitFor(() => expect(router.state.location.pathname).toBe('/m/notifications'))
    expect(storage.items.get(storageKeys.onboarded)).toBe('1')
  })

  it('a reload after onboarding opens 通知, not step 1', async () => {
    const { router } = open('/', { storage: memoryStorage({ [storageKeys.onboarded]: '1' }) })
    await waitFor(() => expect(router.state.location.pathname).toBe('/m/notifications'))
  })

  it('step 1 in its states: a reply arriving, a reply that failed with retry, and the long interview', async () => {
    const loading = open('/onboarding/profession', { search: '?preview=loading' })
    await heading('先聊聊你的工作')
    expect(screen.getByText('正在回答…')).toBeInTheDocument()
    expect(screen.getByText(answers[0])).toBeInTheDocument()
    loading.unmount()

    const failed = open('/onboarding/profession', { search: '?preview=error' })
    await heading('先聊聊你的工作')
    expect(screen.getByText('回答失败。')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: '重试' }))
    // Under 出错 the retry fails again, in the list.
    expect(await screen.findByText('回答失败。')).toBeInTheDocument()
    failed.unmount()

    open('/onboarding/profession', { search: '?preview=long' })
    await heading('先聊聊你的工作')
    expect(within(screen.getByRole('log', { name: '职业访谈' })).getAllByRole('listitem')).toHaveLength(40)
    expect(screen.getByRole('button', { name: '继续' })).not.toHaveAttribute('aria-disabled', 'true')
    expect(screen.getByRole('textbox', { name: '你的回答' })).toBeDisabled()
  })

  it('step 2 in its states: generating, failed with 重试 and 上一步, empty with the reason, twelve modules', async () => {
    const loading = open('/onboarding/modules', { search: '?preview=loading' })
    await heading('你的模块')
    expect(screen.getByText('正在生成模块建议…')).toBeInTheDocument()
    loading.unmount()

    const failed = open('/onboarding/modules', { search: '?preview=error' })
    expect(await screen.findByText('生成失败')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '重试' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '上一步' })).toBeEnabled()
    expect(screen.getByRole('button', { name: '确认并生成' })).toHaveAttribute('aria-disabled', 'true')
    failed.unmount()

    const empty = open('/onboarding/modules', { search: '?preview=empty' })
    expect(await screen.findByText('还没有模块')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '添加模块' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '确认并生成' })).toHaveAccessibleDescription('至少添加一个模块才能继续。')
    empty.unmount()

    open('/onboarding/modules', { search: '?preview=long' })
    await waitFor(() => expect(rows()).toHaveLength(12))
  })

  it('step 3 in its states: reading, a failed authorisation on the row, no account needed, the usual list', async () => {
    const loading = open('/onboarding/accounts', { search: '?preview=loading' })
    await heading('连接账号')
    expect(screen.getByText('正在读取账号…')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '完成' })).toBeEnabled()
    loading.unmount()

    const failed = open('/onboarding/accounts', { search: '?preview=error' })
    expect(await screen.findByText('暂时读不到账号状态')).toBeInTheDocument()
    const wechat = failed.container.querySelector('[data-account="wechat"]') as HTMLElement
    expect(wechat).toHaveTextContent('授权失败')
    expect(within(wechat).getByRole('button', { name: '重试「微信」' })).toHaveTextContent('重试')
    failed.unmount()

    const empty = open('/onboarding/accounts', { search: '?preview=empty' })
    expect(await screen.findByText('不需要连接账号')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '完成' })).toBeEnabled()
    empty.unmount()

    const usual = open('/onboarding/accounts')
    const list = await screen.findByRole('list', { name: '店里在用的工具' })
    expect(list.querySelectorAll('[data-account]')).toHaveLength(3)
    const calendar = usual.container.querySelector('[data-account="calendar"]') as HTMLElement
    expect(calendar).toHaveTextContent('已连接')
    // The modules it feeds, by name.
    expect(within(calendar).getByRole('list', { name: '用于' })).toHaveTextContent('预约')
  })
})

describe('onboarding, re-entry from settings (B-15)', () => {
  it('opens step 1 with 取消, which returns to settings.profession', async () => {
    const { router } = open(reentryPath, { search: '?scene=s2' })
    await heading('先聊聊你的工作')
    expect(screen.getByText('第 1 步，共 3 步')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: '取消' }))
    await waitFor(() => expect(router.state.location.pathname).toBe('/settings/profession'))
  })

  it('finishing step 2 applies the set and returns; a module added there renders the stub pattern', async () => {
    const { router, runtime } = open(reentryPath, { search: '?scene=s2' })
    await interview()
    await userEvent.click(await screen.findByRole('button', { name: '继续' }))
    await heading('你的模块')
    expect(router.state.location.search).toBe('?from=settings')

    await userEvent.click(await screen.findByRole('button', { name: '添加模块' }))
    const add = within(await screen.findByRole('dialog', { name: '添加模块' }))
    await userEvent.type(add.getByRole('textbox', { name: '名称' }), '寄养{Enter}')
    await waitFor(() => expect(rows()).toHaveLength(5))

    // Every account the set draws on is connected: step 3 is skipped.
    await userEvent.click(screen.getByRole('button', { name: '确认并生成' }))
    await waitFor(() => expect(router.state.location.pathname).toBe('/settings/profession'))
    const added = runtime.getState().modules.find((module) => module.custom)
    expect(added?.name['zh-CN']).toBe('寄养')

    // The module she added has no page builder: the stub pattern, in the frame.
    await act(() => router.navigate(`/m/${added?.id}`))
    await heading('寄养')
    expect(await screen.findByText('这个模块还没有输出')).toBeInTheDocument()
  })

  it('the language select in the onboarding header switches the step in place', async () => {
    const { router } = open('/onboarding/profession')
    await heading('先聊聊你的工作')
    await userEvent.click(screen.getByRole('combobox', { name: '语言' }))
    await userEvent.click(within(await screen.findByRole('listbox')).getByRole('option', { name: 'English' }))
    await heading('Tell me about your work')
    expect(screen.getByText('Step 1 of 3')).toBeInTheDocument()
    expect(screen.getByText('Hello — let me get to know your work first. What do you do?')).toBeInTheDocument()
    expect(router.state.location.pathname).toBe('/onboarding/profession')
  })
})
