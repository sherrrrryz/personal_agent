import { act, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router'
import { describe, expect, it } from 'vitest'

import { Providers } from '@/app/Providers'
import { compactQuery } from '@/hooks/use-mobile'
import { LOCALE_STORAGE_KEY } from '@/i18n'
import { createRuntime, RuntimeContext, useRuntimeState, type FailureReason, type Runtime, type Snapshot } from '@/runtime'
import { axe } from '@/test/axe'
import { setMediaQuery } from '@/test/match-media'

import { collectDefinitions, definitionOf } from './definitions'
import { demoAccountId, demoFailures, demoModuleId, demoSnapshot, type DemoLastRun } from './demo-module'
import { ModuleFrame } from './ModuleFrame'

// R-14 of docs/specs/lofi-prototype-shell.md: the frame's run states, its two
// sheets, 刷新 and the first row the four views share.

type View = 'page' | 'workflow' | 'memory' | 'child'

function Frame({ view }: { view: View }) {
  const module = useRuntimeState((state) => state.modules[0])
  if (view === 'page') {
    return (
      <ModuleFrame module={module} view="page">
        <p>页面内容</p>
      </ModuleFrame>
    )
  }
  return (
    <ModuleFrame module={module} view={view} title="视图标题">
      <p>视图内容</p>
    </ModuleFrame>
  )
}

function open(
  options: { last?: DemoLastRun; view?: View; locale?: 'zh-CN' | 'en'; search?: string; delay?: number; initial?: Snapshot; compact?: boolean } = {},
) {
  const { last = 'ok', view = 'page', locale = 'zh-CN', search = '', delay = 0 } = options
  window.localStorage.setItem(LOCALE_STORAGE_KEY, locale)
  if (options.compact) act(() => setMediaQuery(compactQuery, true))
  const runtime: Runtime = createRuntime({ delay, storage: null, search, initial: options.initial ?? demoSnapshot(last) })
  const rendered = render(
    <Providers>
      <RuntimeContext value={runtime}>
        <MemoryRouter>
          <Frame view={view} />
        </MemoryRouter>
      </RuntimeContext>
    </Providers>,
  )
  return { runtime, ...rendered }
}

const status = () => document.querySelector<HTMLElement>('[data-run-status]')!

/** Opens 功能设置 (D-50, D-52): the update state, 待你确认, 更新记录 and 刷新, then 流程, then 资料. */
async function openSettings(name = '功能设置') {
  await userEvent.click(screen.getByRole('button', { name }))
  return screen.findByRole('dialog', { name })
}
const runNow = () => screen.getByRole('button', { name: '刷新' })

/** The demo's state with its last run failed for a reason the demo's own control does not offer. */
function failedWith(reason: FailureReason): Snapshot {
  const snapshot = demoSnapshot('platform-unreachable')
  snapshot.runs[snapshot.runs.length - 1].reason = reason
  return snapshot
}

describe('ModuleFrame — the run state (R-14)', () => {
  it('says a module has never run, with an icon', () => {
    open({ last: 'never' })
    expect(status()).toHaveAttribute('role', 'status')
    expect(status()).toHaveAttribute('data-run-status', 'never-run')
    expect(status()).toHaveTextContent('尚未更新')
    expect(status()).toHaveTextContent('没有安排下次更新')
    expect(status().querySelector('svg')).toBeInTheDocument()
  })

  it('says when the last run succeeded and when the next one is', () => {
    open()
    expect(status()).toHaveAttribute('data-run-status', 'ok')
    expect(status()).toHaveTextContent(/上次更新：2026年11月26日 08:00 · 成功/)
    expect(status()).toHaveTextContent(/下次更新：2026年11月27日 08:00/)
    expect(status().querySelector('svg')).toBeInTheDocument()
    expect(status().querySelector('[data-run-failure]')).toBeNull()
  })

  it('says a run is under way, and holds 刷新 busy meanwhile', () => {
    open({ search: '?preview=loading' })
    expect(status()).toHaveAttribute('data-run-status', 'running')
    expect(status()).toHaveTextContent('正在更新…')
    expect(status().querySelector('svg')).toBeInTheDocument()
    expect(runNow()).toHaveAttribute('aria-busy', 'true')
  })

  it.each(demoFailures)('says why the last run failed and how to fix it: %s', (code) => {
    open({ last: code })
    expect(status()).toHaveAttribute('data-run-status', 'failed')
    expect(status()).toHaveTextContent(/上次更新：2026年11月26日 08:00 · 失败/)
    const failure = status().querySelector<HTMLElement>('[data-run-failure]')!
    expect(failure).toHaveAttribute('data-run-failure', code)
    expect(failure).toHaveTextContent('上次更新失败')
    // Said once, politely, by the status region around it.
    expect(failure).not.toHaveAttribute('role')
    if (code === 'account-expired') {
      expect(failure).toHaveTextContent('「演示账号」的授权已过期，这次更新没能从它那里读到内容。')
      expect(within(failure).getByRole('link', { name: '去设置里重新连接' })).toHaveAttribute('href', '/settings/accounts')
    } else if (code === 'account-missing') {
      expect(failure).toHaveTextContent('还没有连接「演示账号」')
      expect(within(failure).getByRole('link', { name: '去设置里连接' })).toHaveAttribute('href', '/settings/accounts')
    } else {
      expect(failure).toHaveTextContent(code === 'platform-unreachable' ? '暂时连不上平台' : '这次的总结没有写出来')
      expect(within(failure).getByRole('button', { name: '再试一次' })).toBeInTheDocument()
    }
  })

  it('names the source that failed and links to it', () => {
    open({ initial: failedWith({ code: 'source-failed', moduleId: demoModuleId }) })
    const failure = status().querySelector<HTMLElement>('[data-run-failure="source-failed"]')!
    expect(failure).toHaveTextContent('来自「框架演示」的数据没有送达，其他来源照常。')
    expect(within(failure).getByRole('link', { name: '打开「框架演示」' })).toHaveAttribute('href', `/m/${demoModuleId}`)
  })

  it('falls back to the id of an account or a module the state does not hold', () => {
    open({ initial: failedWith({ code: 'account-missing', account: 'somewhere' }) })
    expect(status()).toHaveTextContent('还没有连接「somewhere」')
  })

  it('forces the failed and the never-run state under 状态预览', () => {
    const { runtime } = open()
    act(() => runtime.actions.setPreview('error'))
    expect(status()).toHaveAttribute('data-run-status', 'failed')
    expect(status().querySelector('[data-run-failure]')).toHaveAttribute('data-run-failure', 'platform-unreachable')
    act(() => runtime.actions.setPreview('empty'))
    expect(status()).toHaveAttribute('data-run-status', 'never-run')
  })

  it('runs again from the failure, and the new run replaces it', async () => {
    // A run long enough to be seen running when the suite is under load, and a wait for it.
    const { runtime } = open({ last: 'generation-failed', delay: 150 })
    await userEvent.click(within(status()).getByRole('button', { name: '再试一次' }))
    await waitFor(() => expect(status()).toHaveAttribute('data-run-status', 'running'))
    await waitFor(() => expect(status()).toHaveAttribute('data-run-status', 'ok'))
    expect(runtime.getState().runs).toHaveLength(4)
  })
})

describe('ModuleFrame — 刷新 (R-14)', () => {
  it('shows 正在更新 and then the new run', async () => {
    const { runtime } = open({ delay: 30 })
    await userEvent.click(runNow())
    expect(status()).toHaveTextContent('正在更新…')
    expect(runNow()).toHaveAttribute('aria-busy', 'true')
    // Busy, not gone: the button keeps the focus it had.
    expect(runNow()).toHaveFocus()
    await waitFor(() => expect(status()).toHaveTextContent(/上次更新：2026年11月26日 09:30 · 成功/))
    expect(runNow()).not.toHaveAttribute('aria-busy')
    expect(runtime.getState().runs.at(-1)).toMatchObject({ trigger: 'manual', result: 'ok', version: 2 })
  })

  it('fails the run when an account the module draws on is gone', async () => {
    const snapshot = demoSnapshot()
    snapshot.accounts[0] = { ...snapshot.accounts[0], status: 'disconnected', feeds: [demoModuleId] }
    open({ initial: snapshot })
    await userEvent.click(runNow())
    await waitFor(() => expect(status()).toHaveAttribute('data-run-status', 'failed'))
    expect(status().querySelector('[data-run-failure]')).toHaveAttribute('data-run-failure', 'account-missing')
    expect(snapshot.accounts[0].id).toBe(demoAccountId)
  })
})

describe('ModuleFrame — 待你确认 (R-14)', () => {
  it('opens the module’s deferred proposals in a sheet, moves focus in and gives it back', async () => {
    open()
    const settings = await openSettings()
    const trigger = await within(settings).findByRole('button', { name: '待你确认（2）' })
    await userEvent.click(trigger)
    const sheet = await screen.findByRole('dialog', { name: '待你确认' })
    await waitFor(() => expect(sheet).toContainElement(document.activeElement as HTMLElement))
    expect(sheet).toHaveTextContent('「框架演示」留给你决定的事项。')
    expect(sheet.closest('[data-side]')).toHaveAttribute('data-side', 'right')
    expect(await within(sheet).findByRole('region', { name: '调整两个预约' })).toBeInTheDocument()
    expect(within(sheet).getByRole('region', { name: '补货：沐浴露' })).toBeInTheDocument()
    await userEvent.keyboard('{Escape}')
    await waitFor(() => expect(screen.queryByRole('dialog', { name: '待你确认' })).toBeNull())
    await waitFor(() => expect(trigger).toHaveFocus())
  })

  it('resolves a part through the runtime, keeps the decided card until the sheet closes, and counts what is left', async () => {
    const { runtime } = open()
    await openSettings()
    await userEvent.click(await screen.findByRole('button', { name: '待你确认（2）' }))
    const sheet = await screen.findByRole('dialog', { name: '待你确认' })
    const second = await within(sheet).findByRole('region', { name: '补货：沐浴露' })
    await userEvent.click(within(second).getByRole('button', { name: /接受/ }))
    expect(runtime.getState().proposals[1].parts[0].state).toBe('accepted')
    // Still there, saying what she decided.
    expect(within(sheet).getByRole('region', { name: '补货：沐浴露' })).toHaveTextContent('已接受')
    await userEvent.keyboard('{Escape}')
    await waitFor(() => expect(screen.queryByRole('dialog', { name: '待你确认' })).toBeNull())
    expect(screen.getByRole('button', { name: '待你确认（1）' })).toBeInTheDocument()
    // Opened again, only what still waits is listed.
    await userEvent.click(screen.getByRole('button', { name: '待你确认（1）' }))
    const again = await screen.findByRole('dialog', { name: '待你确认' })
    expect(await within(again).findByRole('region', { name: '调整两个预约' })).toBeInTheDocument()
    expect(within(again).queryByRole('region', { name: '补货：沐浴露' })).toBeNull()
  })

  it('says so when nothing waits, and slides in from the bottom in the compact size class', async () => {
    open({ last: 'never', compact: true })
    await openSettings()
    await userEvent.click(await screen.findByRole('button', { name: '待你确认（0）' }))
    const sheet = await screen.findByRole('dialog', { name: '待你确认' })
    expect(await within(sheet).findByText('没有等你确认的事项')).toBeInTheDocument()
    expect(sheet.closest('[data-side]')).toHaveAttribute('data-side', 'bottom')
  })
})

describe('ModuleFrame — 更新记录 (R-14)', () => {
  it('lists one row per run, the latest first, in a sheet that handles focus', async () => {
    open({ last: 'account-expired' })
    await openSettings()
    const trigger = screen.getByRole('button', { name: '更新记录' })
    await userEvent.click(trigger)
    const sheet = await screen.findByRole('dialog', { name: '更新记录' })
    await waitFor(() => expect(sheet).toContainElement(document.activeElement as HTMLElement))
    const table = await within(sheet).findByRole('table')
    expect(within(table).getAllByRole('columnheader').map((cell) => cell.textContent)).toEqual([
      '时间',
      '起因',
      '结果',
      '变化',
      '流程版本',
    ])
    const rows = within(table).getAllByRole('row').slice(1)
    expect(rows).toHaveLength(3)
    expect(rows[0]).toHaveTextContent(/2026年11月26日 08:00按计划失败「演示账号」的授权已过期.*没有变化第 2 版/)
    expect(rows[2]).toHaveTextContent(/2026年11月24日 08:00按计划成功1 处更新第 1 版/)
    // The result is an icon and a word, never colour alone.
    expect(rows[0].querySelector('svg')).toBeInTheDocument()
    expect(within(sheet).getByRole('region', { name: '每次更新一行，最新的在最前' })).toHaveAttribute('tabindex', '0')
    await userEvent.keyboard('{Escape}')
    await waitFor(() => expect(trigger).toHaveFocus())
  })

  it('shows its empty and its failed state', async () => {
    const { runtime } = open({ last: 'never' })
    await openSettings()
    await userEvent.click(screen.getByRole('button', { name: '更新记录' }))
    const sheet = await screen.findByRole('dialog', { name: '更新记录' })
    expect(await within(sheet).findByText('还没有更新过')).toBeInTheDocument()
    act(() => runtime.actions.setPreview('error'))
    expect(await within(sheet).findByText('无法载入更新记录')).toBeInTheDocument()
    expect(sheet).toHaveTextContent('暂时连不上平台')
  })
})

describe('ModuleFrame — the four views (R-14)', () => {
  it('opens 功能设置 as a large window in the middle of the screen (D-52)', async () => {
    open()
    const settings = await openSettings()
    expect(settings).toHaveAttribute('data-size', 'wide')
    // A solid window, not frosted (owner: "把居中大窗口背景变为白色实色", D-52).
    expect(settings).not.toHaveClass('surface-frosted')
    // Outside the app no screen hands the frame its parts: the two headings and their links stay.
    expect(within(settings).getAllByRole('heading', { level: 3 })).toHaveLength(2)
  })

  it('closes 功能设置 when a link inside it is followed', async () => {
    open()
    const settings = await openSettings()
    await userEvent.click(within(settings).getByRole('link', { name: '整页打开「流程」' }))
    await waitFor(() => expect(screen.queryByRole('dialog', { name: '功能设置' })).toBeNull())
  })

  it.each(['page', 'workflow', 'memory', 'child'] as const)('draws the same controls in the %s view, and no visible title (D-50)', async (view) => {
    open({ view })
    // Outside the shell the controls stand at the top of the frame; inside it, in the header's slot.
    const row = document.querySelector<HTMLElement>('[data-slot="module-frame-row"]')!
    expect(within(row).getByRole('button', { name: '功能设置' })).toBeInTheDocument()
    // 刷新 belongs to the page view alone.
    expect(within(row).queryByRole('button', { name: '刷新' }) !== null).toBe(view === 'page')
    // One `h1`, out of sight: the module's name on the page view, the view's own title elsewhere.
    const headings = screen.getAllByRole('heading', { level: 1 })
    expect(headings).toHaveLength(1)
    expect(headings[0]).toHaveTextContent(view === 'page' ? '框架演示' : '视图标题')
    expect(headings[0]).toHaveClass('sr-only')
    // The run state is a quiet region on the page view only; the views are not on the page.
    expect(document.querySelector('[data-run-status]') !== null).toBe(view === 'page')
    expect(screen.queryAllByRole('navigation')).toHaveLength(0)
    const settings = await openSettings()
    // D-52: the update state and its buttons on top, then 流程, then 资料 — each also a page of its own.
    expect(within(settings).getByText(/上次更新|尚未更新/)).toBeInTheDocument()
    const status = settings.querySelector<HTMLElement>('[data-slot="module-settings-status"]')!
    expect(within(status).getAllByRole('button').map((button) => button.textContent)).toEqual(['待你确认（2）', '更新记录', '刷新'])
    const parts = within(settings).getAllByRole('heading', { level: 3 })
    expect(parts.map((heading) => heading.textContent)).toEqual(['流程', '资料'])
    const links = [within(settings).getByRole('link', { name: '整页打开「流程」' }), within(settings).getByRole('link', { name: '整页打开「资料」' })]
    expect(links.map((link) => link.getAttribute('href'))).toEqual([`/m/${demoModuleId}/workflow`, `/m/${demoModuleId}/memory`])
    const current = links.filter((link) => link.getAttribute('aria-current') === 'page').map((link) => link.getAttribute('href'))
    expect(current).toEqual(view === 'workflow' || view === 'memory' ? [`/m/${demoModuleId}/${view}`] : [])
  })

  it('starts the view links from `basePath` when a demo shows the frame elsewhere', async () => {
    function Elsewhere() {
      const module = useRuntimeState((state) => state.modules[0])
      return <ModuleFrame module={module} view="memory" title="资料" basePath="/dev/frame" />
    }
    render(
      <Providers>
        <RuntimeContext value={createRuntime({ delay: 0, storage: null, search: '', initial: demoSnapshot() })}>
          <MemoryRouter>
            <Elsewhere />
          </MemoryRouter>
        </RuntimeContext>
      </Providers>,
    )
    const settings = await openSettings(document.documentElement.lang === 'en' ? 'Feature settings' : '功能设置')
    expect(within(settings).getAllByRole('link').map((link) => link.getAttribute('href'))).toEqual(['/dev/frame/workflow', '/dev/frame/memory'])
  })
})

describe('ModuleFrame — accessibility and wording (R-14)', () => {
  it.each([
    ['ok', 'page'],
    ['account-expired', 'page'],
    ['never', 'page'],
    ['ok', 'workflow'],
  ] as const)('has no axe violation: last run %s, %s view', async (last, view) => {
    const { container } = open({ last, view })
    await screen.findByRole('button', { name: '功能设置' })
    expect(await axe(container)).toHaveNoViolations()
  })

  it('has no axe violation with a sheet open', async () => {
    open()
    await openSettings()
    await userEvent.click(await screen.findByRole('button', { name: '待你确认（2）' }))
    const sheet = await screen.findByRole('dialog', { name: '待你确认' })
    await within(sheet).findByRole('region', { name: '调整两个预约' })
    expect(await axe(document.body)).toHaveNoViolations()
  })

  it('shows no English text or name in zh-CN', async () => {
    const { container } = open({ last: 'account-expired' })
    await openSettings()
    await screen.findByRole('button', { name: '待你确认（2）' })
    expect(container.textContent).not.toMatch(/[A-Za-z]{2,}/)
    for (const control of [...screen.getAllByRole('button'), ...screen.getAllByRole('link')]) {
      expect(control.getAttribute('aria-label') ?? '').not.toMatch(/[A-Za-z]{2,}/)
    }
    expect(document.body.textContent).not.toMatch(/[A-Za-z]{2,}/)
  })

  it('speaks English in en', async () => {
    open({ locale: 'en', last: 'platform-unreachable' })
    // 刷新 is beside 功能设置; the sheet makes the rest of the page inert, so look before opening it.
    expect(screen.getByRole('button', { name: 'Refresh' })).toBeInTheDocument()
    await openSettings('Feature settings')
    expect(await screen.findByRole('button', { name: 'Awaiting you (2)' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Open Process as a page' })).toBeInTheDocument()
    expect(status()).toHaveTextContent(/Last updated: Nov 26, 2026, 8:00 AM · failed/)
    expect(status()).toHaveTextContent('The platform could not be reached. Nothing was changed.')
    expect(screen.getByRole('button', { name: 'Update history' })).toBeInTheDocument()
  })
})

describe('module definitions', () => {
  const page = () => ({ blocks: [] })

  it('collects the definitions by id and refuses a malformed or a doubled file', () => {
    const found = collectDefinitions({ '/src/modules/a/module.ts': { default: { id: 'a', page } } })
    expect([...found.keys()]).toEqual(['a'])
    expect(() => collectDefinitions({ '/src/modules/a/module.ts': { default: { id: 'a' } } })).toThrow(/default-exports a ModuleDefinition/)
    expect(() =>
      collectDefinitions({ '/src/modules/a/module.ts': { default: { id: 'a', page } }, '/src/modules/b/module.ts': { default: { id: 'a', page } } }),
    ).toThrow(/defined twice/)
  })

  it('finds a definition by id, then by alias, and falls back to the stub', () => {
    const module = demoSnapshot().modules[0]
    const own = { id: module.id, page }
    const old = { id: 'old.id', page }
    expect(definitionOf(module, new Map([[own.id, own]]))).toEqual({ definition: own, stub: false })
    expect(definitionOf({ ...module, aliases: ['old.id'] }, new Map([[old.id, old]]))).toEqual({ definition: old, stub: false })
    const stub = definitionOf(module, new Map())
    expect(stub.stub).toBe(true)
    const emitted = stub.definition.page(demoSnapshot() as never, 'normal', { locale: 'zh-CN' })
    expect(emitted.blocks).toEqual([
      {
        key: 'stub',
        block: 'block.empty',
        title: '页面内容',
        span: 'full',
        props: {
          title: '这个功能还没有内容',
          body: '它的流程还没有产出页面。设置好流程并更新后，给出的内容会出现在这里。',
          action: { label: '打开流程', href: `/m/${module.id}/workflow` },
        },
      },
    ])
  })
})
