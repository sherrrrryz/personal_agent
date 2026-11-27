import { act, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { describe, expect, it } from 'vitest'

import { Providers } from '@/app/Providers'
import { buildRoutes } from '@/app/router'
import { LOCALE_STORAGE_KEY } from '@/i18n'
import { createRuntime, RuntimeContext, type PreviewId, type Runtime } from '@/runtime'

// B-13 of docs/specs/lofi-prototype-screens.md, as narrowed by D-43 / D-44:
// the memory view of 服务时长 on the whole route table — inside the real
// shell, so the chat bar is the real one.

const path = '/m/profession.appointments.sub.duration/memory'

function open(scene: string, preview?: PreviewId, address = path) {
  window.localStorage.setItem(LOCALE_STORAGE_KEY, 'zh-CN')
  const runtime: Runtime = createRuntime({ delay: 0, storage: null, search: `?scene=${scene}${preview ? `&preview=${preview}` : ''}` })
  const router = createMemoryRouter(buildRoutes(), { initialEntries: [address] })
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
const table = (name: string) => within(main()).findByRole('table', { name }, { timeout: 5000 })
const row = (id: string) => {
  const found = document.querySelector<HTMLElement>(`[data-memory-row="${id}"]`)
  if (!found) throw new Error(`no row ${id}`)
  return found
}
const headers = (element: HTMLElement) => within(element).getAllByRole('columnheader').map((each) => each.textContent)

describe('the memory view (B-13)', () => {
  it('one tab per table; 依据, 适用 and 实测 in words; 尚无数据; markers on the rows an accepted proposal changed', async () => {
    const user = userEvent.setup()
    open('s3-resolved')
    expect(await within(main()).findByRole('heading', { level: 1, name: '资料' }, { timeout: 5000 })).toBeInTheDocument()
    // The tables arrive after the heading; wait for them rather than racing the simulated delay.
    expect((await within(main()).findAllByRole('tab', {}, { timeout: 5000 })).map((tab) => tab.textContent)).toEqual(['品种大致时长', '每只狗的实际耗时'])

    const breeds = await table('品种大致时长')
    expect(headers(breeds)).toEqual(['品种', '类型', '适用时长', '依据', '实测平均', '更新时间'])
    // 金毛: the accepted review moved 适用时长 to the measured average of its five dogs.
    expect(row('golden')).toHaveTextContent('3小时45分钟')
    expect(row('golden')).toHaveTextContent('5 只的平均')
    expect(row('golden')).toHaveTextContent('约 3小时45分钟（5 只，3小时20分钟 – 4小时10分钟）')
    expect(row('golden').querySelector('[data-change]')).not.toBeNull()
    // A breed nobody has been timed for keeps her own figure and says there is no data.
    const unseen = [...breeds.querySelectorAll<HTMLElement>('[data-memory-row]')].find((each) => each.textContent?.includes('尚无数据'))
    expect(unseen).toBeDefined()
    expect(unseen).toHaveTextContent('你的经验')
    expect(unseen?.querySelector('[data-change]')).toBeNull()

    await user.click(within(main()).getByRole('tab', { name: '每只狗的实际耗时' }))
    const dogs = await table('每只狗的实际耗时')
    expect(headers(dogs)).toEqual(['狗', '品种', '到店次数', '平均实际耗时', '适用时长', '性格备注'])
    expect(within(row('doudou')).getByRole('link', { name: '豆豆' })).toHaveAttribute('href', '/m/profession.clients/pets/doudou')
    expect(row('doudou')).toHaveTextContent('3小时20分钟（按它自己的记录）')
    expect(row('doudou').querySelector('[data-change]')).not.toBeNull()
  })

  it('谁在读这份资料 links the reader modules and says what each reads; nothing shares or edits; the chat bar is beside it', async () => {
    open('s2')
    await table('品种大致时长')
    const readers = within(main()).getByRole('region', { name: '谁在读这份资料' })
    expect(within(readers).getByRole('link', { name: '预约' })).toHaveAttribute('href', '/m/profession.appointments')
    expect(within(readers).getByRole('link', { name: '顾客与宠物' })).toHaveAttribute('href', '/m/profession.clients')
    expect(readers).toHaveTextContent('读取：品种大致时长、每只狗的实际耗时')
    expect(readers).toHaveTextContent('资料在你的整个工作台里是共享的')

    // Read-only, and no sharing control (D-28): the view holds links and tabs, and no switch, checkbox, field or button.
    for (const role of ['switch', 'checkbox', 'textbox', 'combobox', 'button']) expect(within(main()).queryAllByRole(role), role).toHaveLength(0)

    // The view is in `main`, not over the page: the shell's chat bar is there to type in.
    const bar = screen.getByRole('region', { name: '与 AI 对话' })
    expect(within(bar).getByRole('textbox')).toBeEnabled()
  })

  it('s1: the per-dog table says 暂无记录; then 空 · 加载中 · 出错 · 超长内容', async () => {
    const user = userEvent.setup()
    const { runtime } = open('s1')
    await table('品种大致时长')
    await user.click(within(main()).getByRole('tab', { name: '每只狗的实际耗时' }))
    expect(await within(main()).findByText('暂无记录')).toBeInTheDocument()

    act(() => runtime.actions.setPreview('empty'))
    expect(await within(main()).findByText('这个功能还没有记住任何东西')).toBeInTheDocument()
    expect(within(main()).queryByRole('tab')).not.toBeInTheDocument()

    act(() => runtime.actions.setPreview('loading'))
    expect(await within(main()).findByText('正在载入资料…')).toBeInTheDocument()
    expect(within(main()).getByRole('heading', { level: 1, name: '资料' })).toBeInTheDocument()

    act(() => runtime.actions.setPreview('error'))
    expect(await within(main()).findByText('无法载入资料')).toBeInTheDocument()
    expect(within(main()).getByRole('button', { name: '重试' })).toBeInTheDocument()
    // The frame stays: its controls are in the header (D-50).
    expect(screen.getByRole('button', { name: '功能设置' })).toBeInTheDocument()

    act(() => runtime.actions.jumpToScene('s2'))
    act(() => runtime.actions.setPreview('long'))
    const breeds = await table('品种大致时长')
    await waitFor(() => expect(breeds.querySelectorAll('[data-memory-row]').length).toBe(40))
  })

  it('a stub module’s memory is empty, not missing', async () => {
    // A module she adds is a stub: no table of its own.
    const { runtime, router } = open('s2', undefined, '/m/notifications')
    const added = runtime.actions.addModule({ name: '寄养' })!
    await act(() => router.navigate(`/m/${added}/memory`))
    expect(await within(main()).findByText('这个功能还没有记住任何东西', {}, { timeout: 5000 })).toBeInTheDocument()
    expect(document.querySelector('[data-route-not-found]')).toBeNull()
  })
})
