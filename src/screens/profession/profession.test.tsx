import { act, cleanup, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { describe, expect, it, vi } from 'vitest'

import { NotFound } from '@/app/NotFound'
import { Providers } from '@/app/Providers'
import { column, tableId } from '@/fixtures/keys'
import { LOCALE_STORAGE_KEY } from '@/i18n'
import { createRuntime, latestRun, rowOf, RuntimeContext, tableOf, type PreviewId, type Runtime } from '@/runtime'
import { moduleRoutes } from '@/screens/module/routes'
import { Shell } from '@/shell'

// B-05 … B-08 of docs/specs/lofi-prototype-screens.md: the pages of the
// profession modules, the pet file and the two sub-module homes, on the real
// module routes with the real definitions and child routes.

vi.mock('@/chat/shell-slots', () => ({}))

const appointments = '/m/profession.appointments'
const clients = '/m/profession.clients'
const duration = '/m/profession.appointments.sub.duration'
const confirmations = '/m/profession.appointments.sub.confirmations'

function open(path: string, scene: string, preview?: PreviewId) {
  window.localStorage.setItem(LOCALE_STORAGE_KEY, 'zh-CN')
  const runtime: Runtime = createRuntime({ delay: 0, storage: null, search: `?scene=${scene}${preview ? `&preview=${preview}` : ''}` })
  const router = createMemoryRouter([{ path: '/', element: <Shell />, children: [...moduleRoutes(), { path: '*', element: <NotFound /> }] }], {
    initialEntries: [path],
  })
  render(
    <Providers>
      <RuntimeContext value={runtime}>
        <RouterProvider router={router} />
      </RuntimeContext>
    </Providers>,
  )
  return { runtime, router }
}

const main = () => screen.getByRole('main')
const h1 = () => within(main()).getByRole('heading', { level: 1 })
// A block the last run changed carries a marker in its title, after the name.
const block = (name: string) => within(main()).findByRole('region', { name: new RegExp(`^${name}`) })
const blocks = () => [...document.querySelectorAll('[data-block]')].map((each) => each.getAttribute('data-block'))
const item = (id: string) => document.querySelector<HTMLElement>(`[data-item="${id}"]`)!

/** 空 · 加载中 · 出错 of a page: the screen's own empty words, the busy page, and what its failure keeps. */
async function walkStates(path: string, scene: string, emptyWords: string, onError: 'kept' | 'failed') {
  const { runtime } = open(path, scene, 'empty')
  await waitFor(() => expect(main()).toHaveTextContent(emptyWords))
  act(() => runtime.actions.setPreview('loading'))
  await waitFor(() => expect(main().querySelector('[aria-busy="true"]')).not.toBeNull())
  act(() => runtime.actions.setPreview('error'))
  if (onError === 'kept') await waitFor(() => expect(main().querySelector('[data-page-kept]')).not.toBeNull())
  else await waitFor(() => expect(within(main()).getAllByRole('button', { name: /重试|再运行/ }).length).toBeGreaterThan(0))
  act(() => runtime.actions.setPreview('long'))
  await waitFor(() => expect(blocks().length).toBeGreaterThan(0))
}

describe('profession.appointments (B-05)', () => {
  it('shows the week by groomer with each estimate’s basis in words', async () => {
    open(appointments, 's3-resolved')
    const schedule = await block('按美容师排的预约')
    for (const groomer of ['周岚', '小陈', '阿杰']) expect(within(schedule).getByRole('group', { name: groomer })).toBeInTheDocument()
    expect(item('apt-1128-doudou')).toHaveTextContent('豆豆（金毛）')
    expect(item('apt-1128-doudou')).toHaveTextContent('预计 3小时20分钟 · 按它自己的记录')
    expect(item('apt-1128-dafu')).toHaveTextContent('预计 4小时10分钟 · 按它自己的记录')
    expect(item('apt-1126-buding')).toHaveTextContent('预计 3小时45分钟 · 按品种表')
  })

  it('s0: 可乐 is booked for two hours by default', async () => {
    open(appointments, 's0')
    await block('按美容师排的预约')
    expect(item('apt-1105-kele')).toHaveTextContent('可乐（阿拉斯加）')
    expect(item('apt-1105-kele')).toHaveTextContent('预计 2小时 · 默认')
  })

  it('the sheet’s 开始 → 完成 records the actual duration, and the page shows the new run’s marker', async () => {
    const { runtime, router } = open(appointments, 's2')
    await block('按美容师排的预约')
    await userEvent.click(item('apt-1121-dafu'))
    const sheet = await screen.findByRole('dialog', { name: '大福（金毛）' })
    expect(within(sheet).getByRole('link', { name: '查看大福的档案' })).toHaveAttribute('href', `${clients}/pets/dafu`)
    expect(sheet).toHaveTextContent('预计 4小时——按品种表')
    await userEvent.click(within(sheet).getByRole('button', { name: '开始' }))
    expect(within(sheet).getByRole('status')).toHaveTextContent('已开始 10:00')
    const field = within(sheet).getByRole('spinbutton', { name: '实际耗时（分钟）' })
    expect(field).toHaveValue(240)
    await userEvent.clear(field)
    await userEvent.type(field, '255')
    await userEvent.click(within(sheet).getByRole('button', { name: '完成' }))

    const state = () => runtime.getState()
    expect(rowOf(tableOf(state(), tableId.appointments), 'apt-1121-dafu')?.cells[column.appointments.actual]).toBe(255)
    await waitFor(() => expect(router.state.location.pathname).toBe(appointments))
    await waitFor(() => expect(latestRun(state(), 'profession.appointments')?.changes.blocks.schedule?.['apt-1121-dafu']).toBe('updated'))
    await waitFor(() => expect(item('apt-1121-dafu').querySelector('[data-change]')).not.toBeNull())
    expect(item('apt-1121-dafu')).toHaveTextContent('实际 4小时15分钟')
    expect(item('apt-1121-dafu')).toHaveTextContent('已完成')
  })

  it('walks its states', async () => {
    await walkStates(appointments, 's2', '今天没有预约', 'kept')
  })
})

describe('profession.clients and the pet file (B-06)', () => {
  it('lists every dog with its facts, 适用时长 and basis, and links to its file', async () => {
    open(clients, 's3-resolved')
    await block('狗狗档案')
    expect(item('dafu')).toHaveTextContent('大福')
    expect(item('dafu')).toHaveTextContent('金毛 · 王先生 · 适用时长 4小时10分钟（按它自己的记录）')
    expect(item('buding')).toHaveTextContent('适用时长 3小时45分钟（按品种表）')
    expect(item('dafu')).toHaveAttribute('href', `${clients}/pets/dafu`)
  })

  it('大福’s file carries its facts, 不配合 and every visit’s 预计 and 实际', async () => {
    const { runtime } = open(`${clients}/pets/dafu`, 's3-resolved')
    expect(h1()).toHaveTextContent('大福')
    const file = await block('档案')
    expect(file).toHaveTextContent('金毛')
    expect(file).toHaveTextContent('王先生')
    expect(file).toHaveTextContent('4小时10分钟（按它自己的记录）')
    expect(await block('性格备注')).toHaveTextContent('不太配合')
    const visits = rowsOfDog(runtime, 'dafu')
    expect(visits.length).toBeGreaterThanOrEqual(3)
    const table = within(await block('每次到店')).getByRole('table')
    expect(within(table).getAllByRole('row')).toHaveLength(visits.length + 1)
    for (const header of ['日期', '预计', '实际', '差值', '美容师']) expect(within(table).getByRole('columnheader', { name: header })).toBeInTheDocument()
    expect(table).toHaveTextContent('4小时5分钟')
    expect(table).toHaveTextContent('+5分钟')
  })

  it('a dog with no visit says so; an unknown id is not found', async () => {
    const { router } = open(`${clients}/pets/buding`, 's3')
    expect(await block('每次到店')).toHaveTextContent('还没有到店记录')
    await act(() => router.navigate(`${clients}/pets/nobody`))
    expect(document.querySelector('[data-route-not-found]')).toBeInTheDocument()
  })

  it('walk their states', async () => {
    await walkStates(clients, 's2', '还没有顾客档案', 'kept')
  })

  it('the pet file walks its states', async () => {
    const { runtime } = open(`${clients}/pets/dafu`, 's2', 'empty')
    expect(await block('每次到店')).toHaveTextContent('先按品种表估时')
    act(() => runtime.actions.setPreview('loading'))
    await waitFor(() => expect(main().querySelector('[aria-busy="true"]')).not.toBeNull())
    act(() => runtime.actions.setPreview('error'))
    expect(await block('性格备注')).toHaveTextContent('不太配合')
    act(() => runtime.actions.setPreview('long'))
    await block('每次到店')
  })
})

function rowsOfDog(runtime: Runtime, dog: string) {
  return (tableOf(runtime.getState(), tableId.visits)?.rows ?? []).filter((row) => row.cells[column.visits.dog] === dog)
}


describe('profession.inventory and profession.shifts (B-07)', () => {
  it('inventory: the figures, the stock table with status as text, and what to restock', async () => {
    open('/m/profession.inventory', 's2')
    expect(await block('概况')).toHaveTextContent('低于安全库存')
    const table = within(await block('库存')).getByRole('table')
    for (const header of ['商品', '库存', '安全库存', '状态']) expect(within(table).getByRole('columnheader', { name: header })).toBeInTheDocument()
    expect(within(table).getByRole('row', { name: /低敏香波/ })).toHaveTextContent('低于安全库存')
    expect(within(table).getByRole('row', { name: /洁耳液/ })).toHaveTextContent('刚好在安全线')
    expect(within(table).getByRole('row', { name: /牵引绳/ })).toHaveTextContent('充足')
    expect(await block('补货建议')).toHaveTextContent('补低敏香波 500 ml')
    expect(blocks()).toEqual(['block.summary', 'block.table', 'block.list'])
  })

  it('shifts: 净空出时间 is the sum of the week’s duration changes, beside the rota, the assisted suggestion and 换班申请', async () => {
    const { runtime } = open('/m/profession.shifts', 's3-resolved')
    const a = column.appointments
    const moved = (tableOf(runtime.getState(), tableId.appointments)?.rows ?? []).filter(
      (row) => row.cells[a.status] === 'booked' && typeof row.cells[a.previous] === 'number',
    )
    const net = moved.reduce((sum, row) => sum + Number(row.cells[a.previous]) - Number(row.cells[a.estimate]), 0)
    expect(moved.length).toBeGreaterThan(0)
    expect(net).toBe(45)
    const summary = await block('概况')
    expect(summary).toHaveTextContent('本周工时')
    expect(summary).toHaveTextContent('预约负载')
    expect(within(summary).getByText('净空出时间').closest('[data-slot]')?.parentElement ?? summary).toHaveTextContent('45分钟')
    expect(blocks()).toEqual(['block.summary', 'block.schedule', 'block.proposal', 'block.list'])
    const proposal = await block('排班建议')
    expect(proposal).toHaveTextContent('协助')
    // Accepting a part goes through the runtime.
    const open_ = runtime.getState().proposals.find((each) => each.moduleId === 'profession.shifts' && each.parts.some((part) => part.state === 'pending'))
    expect(open_).toBeDefined()
    await userEvent.click(within(proposal).getAllByRole('button', { name: /接受/ })[0])
    await waitFor(() => expect(runtime.getState().proposals.find((each) => each.id === open_?.id)?.parts[0].state).toBe('accepted'))
    expect(await block('换班申请')).toHaveTextContent('小陈想和阿杰对调')
  })

  it('walk their states', async () => {
    await walkStates('/m/profession.inventory', 's2', '还没有商品', 'failed')
    cleanup()
    await walkStates('/m/profession.shifts', 's3-resolved', '本周还没有排班', 'kept')
  })
})

describe('the sub-module homes (B-08)', () => {
  const durationScenes = ['s1', 's2', 's3', 's3-resolved', 's4', 's4-resolved', 's5'] as const
  const confirmationScenes = ['e2', 's0', ...durationScenes] as const

  it.each(durationScenes)('服务时长 renders in %s, under 预约', async (scene) => {
    open(duration, scene)
    expect(h1()).toHaveTextContent('服务时长')
    expect(document.querySelector('[data-route-not-found]')).toBeNull()
    expect(within(screen.getByRole('navigation', { name: '当前位置' })).getByRole('link', { name: '预约' })).toHaveAttribute('href', appointments)
    if (scene === 's1') {
      await waitFor(() => expect(main()).toHaveTextContent('暂无记录——完成第一单后这里会更新'))
    } else {
      expect(await block('概况')).toHaveTextContent('已学习的狗')
      const table = within(await block('预计与实际')).getByRole('table')
      expect(within(table).getAllByRole('row').length).toBeGreaterThan(1)
      expect(within(table).getAllByRole('link', { name: /大福/ })[0]).toHaveAttribute('href', `${clients}/pets/dafu`)
    }
    expect(await block('现在的规则')).toHaveTextContent('周一复盘')
  })

  it.each(confirmationScenes)('预约确认 renders in %s, under 预约', async (scene) => {
    open(confirmations, scene)
    expect(h1()).toHaveTextContent('预约确认')
    expect(document.querySelector('[data-route-not-found]')).toBeNull()
    expect(within(screen.getByRole('navigation', { name: '当前位置' })).getByRole('link', { name: '预约' })).toHaveAttribute('href', appointments)
    expect(await block('概况')).toHaveTextContent('已回复')
    expect(blocks()).toEqual(['block.summary', 'block.list', 'block.text'])
  })

  it('e1: made persistent, 预约确认 says when it first runs', async () => {
    const { runtime, router } = open(appointments, 'e1')
    let created: string | null = null
    act(() => {
      created = runtime.actions.createSubModule({ parentId: 'profession.appointments', template: 'confirmations' })
    })
    expect(created).toBe('profession.appointments.sub.confirmations')
    await act(() => router.navigate(confirmations))
    expect(h1()).toHaveTextContent('预约确认')
    await waitFor(() => expect(main()).toHaveTextContent('今晚 19:00 第一次运行'))
    expect(blocks()).toEqual(['block.empty'])
  })

  it('e2: two customers have not replied, as text', async () => {
    open(confirmations, 'e2')
    const list = await block('每位顾客')
    expect(within(list).getAllByText('无回复')).toHaveLength(2)
  })

  it('walk their states', async () => {
    await walkStates(duration, 's2', '暂无记录', 'kept')
    cleanup()
    await walkStates(confirmations, 'e2', '尚未运行', 'failed')
  })
})
