import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { beforeEach, describe, expect, it } from 'vitest'

import { Providers } from '@/app/Providers'
import { flowOrder } from '@/components/workflow'
import { installFlowDom } from '@/components/workflow/test-support'
import { LOCALE_STORAGE_KEY } from '@/i18n'
import { createRuntime, RuntimeContext, versionOf, workflowOf, type Runtime } from '@/runtime'
import { moduleRoutes as frameRoutes } from '@/screens/module/routes'

import { moduleRoutes } from './module-routes'

// B-09, B-10 and B-11 of docs/specs/lofi-prototype-screens.md, as narrowed by
// D-43 / D-44: the editor of 服务时长, whose workflow holds all seven kinds.
// The real browser's side — Tab through the laid-out canvas, measured
// overlap — is the flow `canvas-keyboard`.

const duration = 'profession.appointments.sub.duration'
const path = `/m/${duration}/workflow`

// Every element measures the same in jsdom: enough for the library to place and show its nodes.
beforeEach(() => installFlowDom({ width: 200, height: 100 }))

function open(address = path, options: { scene?: string; preview?: string } = {}) {
  const { scene = 's2', preview } = options
  window.localStorage.setItem(LOCALE_STORAGE_KEY, 'zh-CN')
  const runtime: Runtime = createRuntime({ delay: 0, storage: null, search: `?scene=${scene}${preview ? `&preview=${preview}` : ''}` })
  const router = createMemoryRouter(frameRoutes({ childRoutes: moduleRoutes }), { initialEntries: [address] })
  render(
    <Providers>
      <RuntimeContext value={runtime}>
        <RouterProvider router={router} />
      </RuntimeContext>
    </Providers>,
  )
  const workflow = () => {
    const found = workflowOf(runtime.getState(), duration)
    if (!found) throw new Error('no workflow')
    return found
  }
  return { runtime, workflow }
}

const canvas = () => screen.findByRole('region', { name: '流程画布' })
const nodeElements = () => [...document.querySelectorAll<HTMLElement>('.react-flow__node')]
const node = (id: string) => {
  const found = document.querySelector<HTMLElement>(`.react-flow__node[data-id="${id}"]`)
  if (!found) throw new Error(`no node ${id}`)
  return found
}
/** The canvas with its nodes measured, laid out and visible. */
async function laidOut() {
  const region = await canvas()
  await waitFor(() => expect(nodeElements().length).toBeGreaterThan(0))
  await waitFor(() => expect(nodeElements()[0]).toBeVisible())
  return region
}
/**
 * Focus a node and press Enter: the inspector, by its name.
 * An inspector that was just saved is waited out first: the sheet leaves, and
 * one frame later the editor gives the focus back to the node it was opened
 * from. Under load that frame used to land after this helper's own focus, so
 * Enter opened the previous node's inspector again.
 */
async function inspect(id: string, name: string) {
  const user = userEvent.setup()
  await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument(), { timeout: 5000 })
  await act(() => new Promise<void>((resolve) => window.requestAnimationFrame(() => resolve())))
  act(() => node(id).focus())
  await waitFor(() => expect(node(id)).toHaveFocus())
  await user.keyboard('{Enter}')
  return { user, sheet: await screen.findByRole('dialog', { name }, { timeout: 5000 }) }
}
const save = (sheet: HTMLElement) => within(sheet).getByRole('button', { name: '保存' })

describe('the workflow editor', () => {
  it('B-09: seven kinds with the kind as text, in flow order; Enter opens the inspector, Escape gives the focus back', async () => {
    const { workflow } = open()
    const region = await laidOut()
    for (const kind of ['开始', '来源', '步骤', '条件', '动作', '内容', '资料']) {
      expect(within(region).getAllByText(kind, { selector: '[data-slot="workflow-node-kind"]' }).length).toBeGreaterThan(0)
    }

    // Every node is one tab stop, and their order in the document — the Tab order — is the flow's.
    const version = versionOf(workflow())
    const order = flowOrder(
      version.nodes.map((each) => each.id),
      version.edges,
    )
    expect(order.slice(0, 4)).toEqual(['booking-changed', 'review', 'pet-files', 'estimate'])
    expect(nodeElements().map((element) => element.dataset.id)).toEqual(order)
    for (const element of nodeElements()) expect(element).toHaveAttribute('tabindex', '0')
    expect(node('set-duration')).toHaveAccessibleName('动作：设置预约时长，自主')
    expect(node('set-duration')).toHaveAccessibleDescription(/接到：建议排班调整、记录实际耗时/)

    // After the last node come the library's attribution link (kept: hiding it asks for a paid plan) and the
    // zoom buttons — the canvas is left, not trapped in.
    const user = userEvent.setup()
    act(() => node('propose-rule').focus())
    await user.tab()
    if (document.activeElement?.closest('.react-flow__attribution')) await user.tab()
    expect(screen.getByRole('button', { name: '放大' })).toHaveFocus()
    expect(screen.getByRole('button', { name: '缩小' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '适应画面' })).toBeInTheDocument()

    const { sheet } = await inspect('review', '开始：每周一复盘')
    expect(within(sheet).getByLabelText('时间')).toHaveValue('18:00')
    await user.keyboard('{Escape}')
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    await waitFor(() => expect(node('review')).toHaveFocus())
  })

  it('B-09, B-11: ?node= selects that node; 步骤列表 lists the same nodes in the same order and opens the same inspector', async () => {
    open(`${path}?node=deviation`)
    await laidOut()
    expect(node('deviation')).toHaveAttribute('aria-current', 'true')
    expect(within(node('deviation')).getByText('已选中')).toBeInTheDocument()
    expect(node('review')).not.toHaveAttribute('aria-current')
    const onCanvas = nodeElements().map((element) => element.dataset.id)

    const user = userEvent.setup()
    await user.click(screen.getByRole('button', { name: '步骤列表' }))
    const list = await screen.findByRole('list', { name: '步骤列表' })
    expect(screen.getByRole('button', { name: '步骤列表' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: '画布' })).toHaveAttribute('aria-pressed', 'false')
    const items = within(list).getAllByRole('listitem')
    expect(items.map((item) => item.dataset.step)).toEqual(onCanvas)
    expect(items.find((item) => item.dataset.step === 'deviation')).toHaveAttribute('aria-current', 'true')
    expect(screen.queryByRole('region', { name: '流程画布' })).not.toBeInTheDocument()

    const button = within(list).getByRole('button', { name: '查看和调整：条件：偏差超过 30 分钟' })
    await user.click(button)
    expect(await screen.findByRole('dialog', { name: '条件：偏差超过 30 分钟' })).toBeInTheDocument()
    await user.keyboard('{Escape}')
    await waitFor(() => expect(button).toHaveFocus())
  })

  it('B-10: a trigger time, a condition threshold and an action mode each save as a new version with its reason', async () => {
    const { workflow, runtime } = open()
    await laidOut()
    expect(screen.getByText('版本 1（当前）')).toBeInTheDocument()

    const trigger = await inspect('review', '开始：每周一复盘')
    fireEvent.change(within(trigger.sheet).getByLabelText('时间'), { target: { value: '09:00' } })
    await trigger.user.click(save(trigger.sheet))
    await waitFor(() => expect(workflow().current).toBe(2))
    expect(versionOf(workflow())).toMatchObject({ author: 'user', reason: { 'zh-CN': '你把「每周一复盘」的时间改为周一 09:00' } })
    expect(await screen.findByText('版本 2（当前）')).toBeInTheDocument()
    expect(within(node('review')).getByText('每周一 09:00')).toBeInTheDocument()

    // Invalid input: the error is said beside the field and nothing is saved.
    const condition = await inspect('deviation', '条件：偏差超过 30 分钟')
    const threshold = within(condition.sheet).getByLabelText('阈值')
    fireEvent.change(threshold, { target: { value: '' } })
    await condition.user.click(save(condition.sheet))
    expect(within(condition.sheet).getByText('请填写大于 0 的整数。')).toBeInTheDocument()
    expect(threshold).toBeInvalid()
    expect(workflow().current).toBe(2)
    fireEvent.change(threshold, { target: { value: '45' } })
    await condition.user.click(save(condition.sheet))
    await waitFor(() => expect(workflow().current).toBe(3))
    expect(versionOf(workflow()).reason['zh-CN']).toBe('你把「偏差超过 30 分钟」的阈值改为 45 分钟')
    expect(await within(node('deviation')).findByText('阈值：45 分钟')).toBeInTheDocument()

    const action = await inspect('suggest-shifts', '动作：建议排班调整')
    await action.user.click(within(action.sheet).getByRole('radio', { name: /待确认/ }))
    await action.user.click(save(action.sheet))
    await waitFor(() => expect(workflow().current).toBe(4))
    expect(versionOf(workflow()).reason['zh-CN']).toBe('你把「建议排班调整」的模式改为待确认')
    expect(versionOf(workflow()).reason.en).toBe('You changed the mode of “Suggest shift changes” to Deferred')

    // A version that arrives from elsewhere (the chat's proposal) is shown at once.
    act(() => {
      runtime.actions.saveNodeParams({
        workflowId: workflow().id,
        nodeId: 'deviation',
        params: { thresholdMinutes: 60 },
        reason: { 'zh-CN': '来自对话', en: 'From the chat' },
        author: 'ai',
      })
    })
    expect(await screen.findByText('版本 5（当前）')).toBeInTheDocument()
    expect(within(node('deviation')).getByText('阈值：60 分钟')).toBeInTheDocument()
  })

  it('B-10: under a lower ceiling the node shows the mode that applies and 受上限限制, and the picker locks what lies above', async () => {
    const { runtime } = open()
    await laidOut()
    expect(within(node('set-duration')).getByText('自主')).toBeInTheDocument()
    act(() => runtime.actions.setCeiling({ taskKind: 'change-appointments', ceiling: 'deferred' }))
    await waitFor(() => expect(within(node('set-duration')).getByText('待确认')).toBeInTheDocument())
    expect(within(node('set-duration')).getByText('受上限限制')).toBeInTheDocument()
    expect(node('set-duration')).toHaveAccessibleName('动作：设置预约时长，待确认')

    const { sheet } = await inspect('set-duration', '动作：设置预约时长')
    expect(within(sheet).getByRole('radio', { name: /自主/ })).toHaveAttribute('aria-disabled', 'true')
    expect(within(sheet).getByRole('radio', { name: /协助/ })).toHaveAttribute('aria-disabled', 'true')
    expect(within(sheet).getByRole('radio', { name: /待确认/ })).toBeChecked()
  })

  it('B-11: loading says so and keeps the frame', async () => {
    open(path, { preview: 'loading' })
    expect(await screen.findByText('正在载入流程…')).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 1, name: '流程' })).toBeInTheDocument()
    expect(screen.queryByRole('region', { name: '流程画布' })).not.toBeInTheDocument()
  })

  it('B-11: error keeps the frame and offers a retry; 空 is the three-node placeholder', async () => {
    open(path, { preview: 'error' })
    expect(await screen.findByText('无法载入流程')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '重试' })).toBeInTheDocument()
    // The frame stays: its controls are in the header (D-50).
    expect(screen.getByRole('button', { name: '功能设置' })).toBeInTheDocument()
  })

  it('B-11: 空 shows the placeholder workflow of three nodes', async () => {
    open(path, { preview: 'empty' })
    await laidOut()
    expect(nodeElements().map((element) => element.dataset.id)).toEqual(['manual', 'source', 'output'])
  })
})
