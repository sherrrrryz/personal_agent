import { act, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { beforeEach, describe, expect, it } from 'vitest'

import { Providers } from '@/app/Providers'
import { installFlowDom } from '@/components/workflow/test-support'
import { nodeId, proposalId } from '@/fixtures/keys'
import { LOCALE_STORAGE_KEY } from '@/i18n'
import { createRuntime, RuntimeContext, workflowOf, type Runtime } from '@/runtime'
import { moduleRoutes as frameRoutes } from '@/screens/module/routes'

import { moduleRoutes } from '../module-routes'

import { diffOf } from './compare'

// B-12 of docs/specs/lofi-prototype-screens.md, as narrowed by D-43 / D-44:
// the editor of 服务时长 in `s4`, where the AI's change — the condition
// 第一次来的狗 +30 分钟 and its two connectors — waits for approval.

const duration = 'profession.appointments.sub.duration'
const added = [`${nodeId.estimate}>${nodeId.firstVisit}`, `${nodeId.firstVisit}>${nodeId.setDuration}`]

beforeEach(() => installFlowDom({ width: 200, height: 100 }))

function open(scene = 's4') {
  window.localStorage.setItem(LOCALE_STORAGE_KEY, 'zh-CN')
  const runtime: Runtime = createRuntime({ delay: 0, storage: null, search: `?scene=${scene}` })
  const router = createMemoryRouter(frameRoutes({ childRoutes: moduleRoutes }), { initialEntries: [`/m/${duration}/workflow`] })
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
  return { runtime, workflow, user: userEvent.setup() }
}

const wait = { timeout: 5000 }
const nodes = () => [...document.querySelectorAll<HTMLElement>('.react-flow__node')]
const node = (id: string) => {
  const found = document.querySelector<HTMLElement>(`.react-flow__node[data-id="${id}"]`)
  if (!found) throw new Error(`no node ${id}`)
  return found
}
const marked = () => nodes().filter((each) => each.querySelector('[data-diff]')).map((each) => each.dataset.id)
const versionLine = () => document.querySelector('[data-slot="workflow-version"]')
/** The canvas with its nodes laid out and visible. */
async function laidOut() {
  await screen.findByRole('region', { name: '流程画布' }, wait)
  await waitFor(() => expect(nodes().length).toBeGreaterThan(0), wait)
  await waitFor(() => expect(nodes()[0]).toBeVisible(), wait)
}
/** Focus a node and press Enter: its inspector, once any earlier sheet has left and given the focus back. */
async function inspect(user: ReturnType<typeof userEvent.setup>, id: string) {
  await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument(), wait)
  await act(() => new Promise<void>((resolve) => window.requestAnimationFrame(() => resolve())))
  act(() => node(id).focus())
  await waitFor(() => expect(node(id)).toHaveFocus())
  await user.keyboard('{Enter}')
  return screen.findByRole('dialog', {}, wait)
}

describe('the workflow editor’s diff and history (B-12)', () => {
  it('a pending change opens as a diff that marks and lists exactly what it adds; 批准 makes it the current version', async () => {
    const { workflow, runtime, user } = open()
    await laidOut()

    // The comparison: the draft against version 1 — one node and two connectors added, nothing else.
    expect(versionLine()).toHaveTextContent('等你批准的修改')
    expect(document.querySelector('[data-slot="workflow-canvas"]')).toHaveAttribute('data-mode', 'diff')
    expect(diffOf(workflow(), { version: 'proposed', compareTo: null })).toEqual({
      nodes: { [nodeId.firstVisit]: 'added' },
      edges: { [added[0]]: 'added', [added[1]]: 'added' },
    })
    expect(marked()).toEqual([nodeId.firstVisit])
    expect(node(nodeId.firstVisit).querySelector('[data-diff="added"] [data-change="new"]')).not.toBeNull()
    expect(node(nodeId.firstVisit)).toHaveAccessibleName('条件：第一次来的狗 +30 分钟，新')

    const summary = screen.getByRole('region', { name: '变更摘要' })
    expect(within(summary).getAllByRole('listitem').map((item) => item.textContent)).toEqual([
      '新增条件「第一次来的狗 +30 分钟」',
      '新增连接：估算时长 → 第一次来的狗 +30 分钟',
      '新增连接：第一次来的狗 +30 分钟 → 设置预约时长',
    ])
    // 变更摘要 comes before the view in reading order.
    const view = document.querySelector('[data-slot="workflow-view"]')
    expect(summary.compareDocumentPosition(view as Node) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()

    // A proposed change is read-only: its inspector has the fields, and no 保存.
    const sheet = await inspect(user, nodeId.firstVisit)
    expect(within(sheet).getByText('这不是当前生效的版本，只能查看。')).toBeInTheDocument()
    expect(within(sheet).queryByRole('button', { name: '保存' })).not.toBeInTheDocument()
    await user.keyboard('{Escape}')
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument(), wait)

    await user.click(screen.getByRole('button', { name: '批准' }))
    await waitFor(() => expect(workflow().current).toBe(2))
    expect(workflow().proposed).toBeUndefined()
    expect(runtime.getState().proposals.find((each) => each.id === proposalId.firstVisit)?.applied).toBe(true)
    await waitFor(() => expect(versionLine()).toHaveTextContent('版本 2（当前）'))
    expect(document.querySelector('[data-slot="workflow-decision"]')).toHaveTextContent('已批准。版本 2 现在生效。')
    expect(document.querySelector('[data-slot="workflow-decision"]')).toHaveFocus()
    expect(screen.queryByRole('region', { name: '变更摘要' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: '批准' })).not.toBeInTheDocument()
    expect(marked()).toEqual([])
    // The new node is part of the workflow now.
    expect(node(nodeId.firstVisit)).toHaveAccessibleName('条件：第一次来的狗 +30 分钟')
  })

  it('历史 lists every version with author and reason; an old version opens read-only; 与上一版对比 switches the marks on and off', async () => {
    const { workflow, user } = open('s4-resolved')
    await laidOut()
    expect(workflow().current).toBe(2)
    expect(versionLine()).toHaveTextContent('版本 2（当前）')

    await user.click(screen.getByRole('button', { name: '历史' }))
    const history = await screen.findByRole('dialog', { name: '版本历史' }, wait)
    const rows = within(history).getAllByRole('listitem')
    expect(rows).toHaveLength(workflow().versions.length)
    expect(rows[0]).toHaveTextContent('版本 2')
    expect(rows[0]).toHaveTextContent('当前')
    expect(rows[0]).toHaveTextContent('由AI修改')
    expect(rows[0]).toHaveTextContent('所以新增条件「第一次来的狗 +30 分钟」')
    expect(rows[1]).toHaveTextContent('版本 1')
    expect(rows[1]).toHaveTextContent(workflow().versions[0].reason['zh-CN'])
    expect(rows[1]).toHaveTextContent(workflow().versions[0].author === 'ai' ? '由AI修改' : '由你修改')

    // 查看 on version 1: the old version under its banner, without the node version 2 added, and nothing to save.
    await user.click(within(history).getByRole('button', { name: '查看版本 1' }))
    await waitFor(() => expect(versionLine()).toHaveTextContent(/^版本 1$/), wait)
    expect(screen.getByText('你正在查看版本 1——只读')).toBeInTheDocument()
    await waitFor(() => expect(document.querySelector(`.react-flow__node[data-id="${nodeId.firstVisit}"]`)).toBeNull())
    const sheet = await inspect(user, 'deviation')
    expect(within(sheet).getByLabelText('阈值')).toBeDisabled()
    expect(within(sheet).queryByRole('button', { name: '保存' })).not.toBeInTheDocument()
    await user.keyboard('{Escape}')
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument(), wait)
    await user.click(screen.getByRole('button', { name: '返回当前版本' }))
    await waitFor(() => expect(versionLine()).toHaveTextContent('版本 2（当前）'))
    expect(screen.queryByText('你正在查看版本 1——只读')).not.toBeInTheDocument()

    // The switch: version 2 against version 1 marks the same node the proposal added.
    const compare = screen.getByRole('button', { name: '与上一版对比' })
    expect(compare).toHaveAttribute('aria-pressed', 'false')
    await user.click(compare)
    await waitFor(() => expect(marked()).toEqual([nodeId.firstVisit]))
    expect(screen.getByRole('button', { name: '与上一版对比' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('region', { name: '变更摘要' })).toHaveTextContent('版本 2 与版本 1 相比。')
    await user.click(screen.getByRole('button', { name: '与上一版对比' }))
    await waitFor(() => expect(marked()).toEqual([]))
    expect(screen.queryByRole('region', { name: '变更摘要' })).not.toBeInTheDocument()
  })

  it('拒绝 drops the change: the workflow stays at version 1 and nothing is marked', async () => {
    const { workflow, user } = open()
    await laidOut()
    await user.click(screen.getByRole('button', { name: '拒绝' }))
    await waitFor(() => expect(workflow().proposed).toBeUndefined())
    expect(workflow().current).toBe(1)
    await waitFor(() => expect(versionLine()).toHaveTextContent('版本 1（当前）'))
    expect(document.querySelector('[data-slot="workflow-decision"]')).toHaveTextContent('已拒绝。流程仍是版本 1。')
    expect(document.querySelector(`.react-flow__node[data-id="${nodeId.firstVisit}"]`)).toBeNull()
    expect(document.querySelector('[data-slot="workflow-canvas"]')).toHaveAttribute('data-mode', 'view')
  })
})
