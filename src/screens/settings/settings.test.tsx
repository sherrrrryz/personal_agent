import { act, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { afterEach, describe, expect, it } from 'vitest'

import { Providers } from '@/app/Providers'
import { buildRoutes } from '@/app/router'
import { toast } from '@/components/feedback'
import { compactQuery } from '@/hooks/use-mobile'
import { LOCALE_STORAGE_KEY } from '@/i18n'
import { actionsOfKind, ceilingFor, createRuntime, effectiveMode, RuntimeContext, type Runtime } from '@/runtime'
import { reentryPath } from '@/screens/onboarding/paths'
import { expandedQuery } from '@/shell/use-media'
import { axe } from '@/test/axe'
import { setMediaQuery } from '@/test/match-media'

// B-16, B-17 and B-18 of docs/specs/lofi-prototype-screens.md: the settings
// home and its three pages on the app's own routes, inside the shell.

function open(path: string, options: { scene?: string; preview?: string } = {}) {
  const { scene = 's2', preview } = options
  window.localStorage.setItem(LOCALE_STORAGE_KEY, 'zh-CN')
  act(() => {
    setMediaQuery(compactQuery, false)
    setMediaQuery(expandedQuery, true)
  })
  const runtime: Runtime = createRuntime({ delay: 0, storage: null, search: `?scene=${scene}${preview ? `&preview=${preview}` : ''}` })
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
const main = () => within(screen.getByRole('main'))
const sidebar = () => within(screen.getByRole('navigation', { name: '功能导航' }))
const account = (container: HTMLElement, id: string) => container.querySelector(`[data-account="${id}"]`) as HTMLElement

afterEach(() => {
  act(() => toast.dismiss())
})

describe('settings and settings.accounts (B-16)', () => {
  it('the home: three links with live status lines, and 显示', async () => {
    const { runtime, container } = open('/settings')
    await heading('设置')
    const accounts = await main().findByRole('link', { name: /账号连接/ })
    expect(accounts).toHaveAttribute('href', '/settings/accounts')
    await waitFor(() => expect(accounts).toHaveTextContent('5 个已连接'))
    expect(main().getByRole('link', { name: /AI 行为模式/ })).toHaveTextContent('2 类任务已设置')
    expect(main().getByRole('link', { name: /职业功能/ })).toHaveTextContent('4 个功能')
    const display = within(screen.getByRole('region', { name: '显示' }))
    expect(display.getByRole('group', { name: '外观' })).toBeInTheDocument()
    expect(display.getByRole('combobox', { name: '语言' })).toBeInTheDocument()
    expect(await axe(container)).toHaveNoViolations()

    // Live: the line follows the state.
    act(() => runtime.actions.disconnectAccount('wechat'))
    await waitFor(() => expect(accounts).toHaveTextContent('4 个已连接'))
  })

  it('the home in its states: skeleton lines, lines that cannot be read, a fresh workspace', async () => {
    const loading = open('/settings', { preview: 'loading' })
    await heading('设置')
    expect(loading.container.querySelectorAll('[data-status-line="loading"]')).toHaveLength(3)
    expect(main().getByRole('link', { name: /账号连接/ })).toHaveAttribute('href', '/settings/accounts')
    loading.unmount()

    const failed = open('/settings', { preview: 'error' })
    await waitFor(() => expect(main().getAllByText('暂时读不到状态')).toHaveLength(3))
    expect(main().getByRole('link', { name: /职业功能/ })).toHaveAttribute('href', '/settings/profession')
    failed.unmount()

    open('/settings', { preview: 'empty' })
    expect(await main().findByText('尚未连接账号')).toBeInTheDocument()
    expect(main().getByText('尚未设置')).toBeInTheDocument()
    expect(main().getByText('0 个功能')).toBeInTheDocument()
  })

  it('accounts: status as text; 断开 names the modules that stop, and their frame then shows the failure with a link back', async () => {
    const { router, runtime, container } = open('/settings/accounts')
    await heading('账号连接')
    await waitFor(() => expect(account(container, 'wechat')).toHaveTextContent('已连接'))
    expect(await axe(container)).toHaveNoViolations()

    await userEvent.click(screen.getByRole('button', { name: '断开「微信」' }))
    const question = await screen.findByRole('alertdialog', { name: '断开「微信」？' })
    expect(question).toHaveTextContent('这些功能会停止更新：消息')
    await userEvent.click(within(question).getByRole('button', { name: '断开' }))
    await waitFor(() => expect(account(container, 'wechat')).toHaveTextContent('未连接'))
    expect(runtime.getState().accounts.find((each) => each.id === 'wechat')?.status).toBe('disconnected')

    // The header of the module's frame: the failure, and the way back here.
    await act(() => router.navigate('/m/messages'))
    await heading('消息')
    await waitFor(() => expect(container.querySelector('[data-run-failure="account-missing"]')).not.toBeNull())
    const failure = within(container.querySelector('[data-run-failure="account-missing"]') as HTMLElement)
    expect(failure.getByRole('link')).toHaveAttribute('href', '/settings/accounts')

    // Connecting again runs the module once more: the failure is gone.
    await act(() => router.navigate('/settings/accounts'))
    await userEvent.click(await screen.findByRole('button', { name: '连接「微信」' }))
    await userEvent.click(within(await screen.findByRole('dialog', { name: '连接「微信」' })).getByRole('button', { name: '模拟连接' }))
    await waitFor(() => expect(account(container, 'wechat')).toHaveTextContent('已连接'))
    await act(() => router.navigate('/m/messages'))
    await waitFor(() => expect(container.querySelector('[data-run-status="ok"]')).not.toBeNull())
  })

  it('accounts in its states: reading, unreadable with expired authorisations, nothing to connect', async () => {
    const loading = open('/settings/accounts', { preview: 'loading' })
    expect(await main().findByText('正在读取账号…')).toBeInTheDocument()
    loading.unmount()

    const failed = open('/settings/accounts', { preview: 'error' })
    expect(await main().findByText('暂时读不到账号状态')).toBeInTheDocument()
    expect(main().getByRole('button', { name: '重试' })).toBeInTheDocument()
    const wechat = account(failed.container, 'wechat')
    expect(wechat).toHaveTextContent('授权过期')
    expect(within(wechat).getByRole('button', { name: '重新连接「微信」' })).toHaveTextContent('重新连接')
    failed.unmount()

    open('/settings/accounts', { preview: 'empty' })
    expect(await main().findByText('没有可连接的账号')).toBeInTheDocument()
  })
})

describe('settings.ai-modes (B-17)', () => {
  const duration = (runtime: Runtime) => {
    const found = actionsOfKind(runtime.getState(), 'change-appointments').find(({ node }) => node.label['zh-CN'] === '设置预约时长')
    if (!found) throw new Error('the story has no 设置预约时长 action in this scene')
    return found.node
  }
  const row = async () => within(await screen.findByRole('radiogroup', { name: '修改预约' }))
  const actionsOf = (container: HTMLElement) => container.querySelector('[data-task-kind="change-appointments"]') as HTMLElement

  it('a ceiling is saved, the row shows what it caps, and 未设置 restores the AI’s choice', async () => {
    const { runtime, container } = open('/settings/ai-modes')
    await heading('AI 行为模式')
    expect(main().getByText(/这里选的是每类任务的上限/)).toBeInTheDocument()
    const group = await row()
    expect(group.getByRole('radio', { name: /未设置/ })).toBeChecked()
    expect(effectiveMode(runtime.getState(), duration(runtime))).toBe('autonomous')
    expect(actionsOf(container)).toHaveTextContent('设置预约时长')
    expect(actionsOf(container)).not.toHaveTextContent('受上限限制')
    expect(await axe(container)).toHaveNoViolations()

    await userEvent.click(group.getByRole('radio', { name: /协助/ }))
    await waitFor(() => expect(ceilingFor(runtime.getState(), 'change-appointments')).toBe('assisted'))
    expect(effectiveMode(runtime.getState(), duration(runtime))).toBe('assisted')
    const capped = within(actionsOf(container)).getByRole('link', { name: /设置预约时长/ }).closest('li') as HTMLElement
    expect(capped).toHaveTextContent('协助')
    expect(capped).toHaveTextContent('受上限限制')

    await userEvent.click(group.getByRole('radio', { name: /未设置/ }))
    await waitFor(() => expect(ceilingFor(runtime.getState(), 'change-appointments')).toBeNull())
    expect(effectiveMode(runtime.getState(), duration(runtime))).toBe('autonomous')
    expect(actionsOf(container)).not.toHaveTextContent('受上限限制')
  })

  it('a save that fails keeps the earlier choice and says so beside the field', async () => {
    const { runtime } = open('/settings/ai-modes')
    await row()
    act(() => runtime.actions.setPreview('error'))
    expect(await main().findByText('暂时读不到设置')).toBeInTheDocument()
    const stale = await row()
    await userEvent.click(stale.getByRole('radio', { name: /待确认/ }))
    expect(await main().findByText('保存失败，仍按之前的选择执行。请重试。')).toBeInTheDocument()
    expect(ceilingFor(runtime.getState(), 'change-appointments')).toBeNull()
    expect(stale.getByRole('radio', { name: /未设置/ })).toBeChecked()
  })

  it('in its states: reading, rows that cap nothing, a row that caps twelve behind 展开全部', async () => {
    const loading = open('/settings/ai-modes', { preview: 'loading' })
    expect(await main().findByText('正在读取设置…')).toBeInTheDocument()
    loading.unmount()

    const empty = open('/settings/ai-modes', { preview: 'empty' })
    await waitFor(() => expect(main().getAllByText('目前没有受此设置影响的动作。')).toHaveLength(6))
    empty.unmount()

    const long = open('/settings/ai-modes', { preview: 'long' })
    expect(await main().findByRole('button', { name: '展开全部（12）' })).toBeInTheDocument()
    const rules = long.container.querySelector('[data-task-kind="change-rules"]') as HTMLElement
    expect(within(rules).getAllByRole('link')).toHaveLength(5)
    await userEvent.click(within(rules).getByRole('button', { name: '展开全部（12）' }))
    await waitFor(() => expect(within(rules).getAllByRole('link')).toHaveLength(12))
  })
})

describe('settings.profession (B-18)', () => {
  it('rename, add and a confirmed removal show in the sidebar; the interview can be redone', async () => {
    const { container, runtime } = open('/settings/profession', { scene: 's4' })
    await heading('职业功能')
    await main().findByRole('list', { name: '职业功能' })
    expect(main().getByRole('link', { name: '重新进行职业访谈' })).toHaveAttribute('href', reentryPath)
    expect(await axe(container)).toHaveNoViolations()

    await userEvent.click(main().getByRole('button', { name: '重命名「排班」' }))
    const name = within(await screen.findByRole('dialog', { name: '重命名功能' })).getByRole('textbox', { name: '名称' })
    await userEvent.clear(name)
    await userEvent.type(name, '员工排班{Enter}')
    // The dialog closes first: while it is open the page behind it is inert.
    await waitFor(() => expect(sidebar().getByRole('link', { name: '员工排班' })).toBeInTheDocument())

    await userEvent.click(main().getByRole('button', { name: '添加功能' }))
    await userEvent.type(within(await screen.findByRole('dialog', { name: '添加功能' })).getByRole('textbox', { name: '名称' }), '寄养{Enter}')
    await waitFor(() => expect(sidebar().getByRole('link', { name: '寄养' })).toBeInTheDocument())

    await userEvent.click(main().getByRole('button', { name: '移除「商品与库存」' }))
    const question = await screen.findByRole('alertdialog', { name: '移除「商品与库存」？' })
    // Nothing is removed before she confirms.
    expect(runtime.getState().modules.some((module) => module.id === 'profession.inventory')).toBe(true)
    await userEvent.click(within(question).getByRole('button', { name: '移除' }))
    await waitFor(() => expect(sidebar().queryByRole('link', { name: '商品与库存' })).toBeNull())
  })

  it('at s4, accepting the promotion makes 服务时长 a top-level module and its old address redirects', async () => {
    const { router, runtime } = open('/settings/profession', { scene: 's4' })
    const suggestions = within(await screen.findByRole('region', { name: '升级建议' }))
    expect(await suggestions.findByRole('heading', { name: '把「服务时长」升级为顶层功能' })).toBeInTheDocument()
    const old = 'profession.appointments.sub.duration'
    expect(runtime.getState().modules.find((module) => module.id === old)?.kind).toBe('sub')

    await userEvent.click(suggestions.getByRole('button', { name: '接受' }))
    await waitFor(() => expect(runtime.getState().modules.find((module) => module.id === 'profession.duration')?.kind).toBe('profession'))
    expect(await suggestions.findByRole('link', { name: '打开「服务时长」' })).toHaveAttribute('href', '/m/profession.duration')
    // In the module set, beside the four.
    expect(within(main().getByRole('list', { name: '职业功能' })).getByText('服务时长')).toBeInTheDocument()

    await act(() => router.navigate(`/m/${old}`))
    await waitFor(() => expect(router.state.location.pathname).toBe('/m/profession.duration'))
  })

  it('in its states: reading, unreadable, an empty set with no suggestion, twelve modules', async () => {
    const loading = open('/settings/profession', { scene: 's4', preview: 'loading' })
    await heading('职业功能')
    expect(main().getAllByText('加载中…').length).toBeGreaterThan(0)
    loading.unmount()

    const failed = open('/settings/profession', { scene: 's4', preview: 'error' })
    expect(await main().findByText('暂时读不到功能')).toBeInTheDocument()
    expect(main().getByRole('button', { name: '重试' })).toBeInTheDocument()
    failed.unmount()

    const empty = open('/settings/profession', { scene: 's4', preview: 'empty' })
    expect(await main().findByText('还没有功能')).toBeInTheDocument()
    expect(main().getByText('暂无建议。')).toBeInTheDocument()
    expect(main().getByRole('button', { name: '添加功能' })).toBeInTheDocument()
    empty.unmount()

    open('/settings/profession', { scene: 's4', preview: 'long' })
    const list = await main().findByRole('list', { name: '职业功能' })
    await waitFor(() => expect(list.querySelectorAll(':scope > [role="listitem"]')).toHaveLength(12))
  })
})
