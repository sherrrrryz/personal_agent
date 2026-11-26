import { act, render, screen, waitFor, within } from '@testing-library/react'
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

