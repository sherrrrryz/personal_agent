// @vitest-environment node
import { afterEach, describe, expect, it, vi } from 'vitest'

import { longSizes, moduleId, tableId } from '@/fixtures'

import {
  createRuntime,
  formatReason,
  previewErrorOf,
  previewIds,
  resourceKinds,
  runStateOf,
  SIMULATED_DELAY,
  versionOf,
  type AnswerOf,
  type FailureCode,
  type ResourceData,
  type ResourceKind,
  type ResourceRef,
  type Runtime,
} from '.'
import { runtimeIn } from './test-support'

// R-02: for every resource the facade answers ready, empty, loading, long and
// error with its typed reason and its partial or stale data; `setPreview`
// forces all of them and the run state, and resets on `jumpToScene`. The
// tables below have one entry per resource kind — a missing one does not
// compile — and every test walks `resourceKinds`.

/** One of each resource, all present in `s1`. */
function refsIn(runtime: Runtime): { [Kind in ResourceKind]: ResourceRef<Kind> } {
  const state = runtime.getState()
  return {
    modules: { kind: 'modules' },
    module: { kind: 'module', moduleId: moduleId.appointments },
    workflow: { kind: 'workflow', moduleId: moduleId.duration },
    memory: { kind: 'memory', moduleId: moduleId.clients },
    runs: { kind: 'runs', moduleId: moduleId.appointments },
    proposals: { kind: 'proposals' },
    conversations: { kind: 'conversations' },
    conversation: { kind: 'conversation', id: state.conversations[0].id },
    topics: { kind: 'topics' },
    topic: { kind: 'topic', id: state.topics[0].id },
    accounts: { kind: 'accounts' },
    'mode-settings': { kind: 'mode-settings' },
  }
}

type Check = { [Kind in ResourceKind]: (data: ResourceData[Kind]) => void }

/** What "nothing yet" looks like for each resource. */
const emptyShaped: Check = {
  modules: (data) => expect(data.every((module) => module.kind === 'base')).toBe(true),
  module: (data) => {
    expect(data.module.id).toBe(moduleId.appointments)
    expect(data.view.memory.every((table) => table.rows.length === 0)).toBe(true)
  },
  workflow: (data) => expect(versionOf(data).nodes.map((node) => node.kind)).toEqual(['trigger', 'source', 'output']),
  memory: (data) => expect(data.tables.map((table) => table.rows)).toEqual([[], []]),
  runs: (data) => expect(data).toEqual([]),
  proposals: (data) => expect(data).toEqual([]),
  conversations: (data) => expect(data).toEqual([]),
  // A thread that has just begun: her opening message, and the AI still answering.
  conversation: (data) => expect(data.messages.map((message) => [message.author, message.status])).toEqual([['user', 'done'], ['ai', 'streaming']]),
  topics: (data) => expect(data).toEqual([]),
  // A topic always has a conversation; what is empty is its summary.
  topic: (data) => {
    expect(data.topic.summary).toBeNull()
    expect(data.conversations.length).toBeGreaterThan(0)
  },
  accounts: (data) => expect(data.every((account) => account.status === 'disconnected')).toBe(true),
  'mode-settings': (data) => expect(data.every((setting) => setting.ceiling === null)).toBe(true),
}

/** What the long variant holds for each resource. */
const longShaped: Check = {
  modules: (data) => expect(data.filter((module) => module.kind === 'profession')).toHaveLength(longSizes.professionModules),
  module: (data) => expect(data.view.memory.find((table) => table.id === tableId.appointments)?.rows).toHaveLength(longSizes.rows),
  workflow: (data) => expect(versionOf(data).nodes).toHaveLength(longSizes.workflowNodes),
  memory: (data) => expect(data.tables[0].rows).toHaveLength(longSizes.rows),
  runs: (data) => expect(data).toHaveLength(longSizes.runs),
  proposals: (data) => expect(Math.max(...data.map((proposal) => proposal.parts.length))).toBe(longSizes.proposalParts),
  // 20 in every topic she has talked in (S6b), so at least 20 in all.
  conversations: (data) => expect(data.length).toBeGreaterThanOrEqual(longSizes.conversations),
  conversation: (data) => {
    expect(data.messages).toHaveLength(longSizes.messages)
    expect(data.messages.at(-1)?.text.en).toHaveLength(longSizes.messageCharacters)
    expect(data.messages.at(-1)?.text['zh-CN']).toHaveLength(longSizes.messageCharacters)
  },
  topics: (data) => expect(data).toHaveLength(longSizes.topics),
  topic: (data) => expect(data.conversations.length).toBeGreaterThan(1),
  accounts: (data) => expect(Math.max(...data.map((account) => account.feeds.length))).toBe(longSizes.accountFeeds),
  'mode-settings': (data) => expect(data).toHaveLength(6),
}

const typedReason = /^(account-expired:\w+|account-missing:\w+|source-failed:[\w.-]+|platform-unreachable|generation-failed)$/

describe.each(resourceKinds)('resource %s (R-02)', (kind) => {
  const read = async (preview: (typeof previewIds)[number]) => {
    const runtime = runtimeIn('s1')
    runtime.actions.setPreview(preview)
    const ref = refsIn(runtime)[kind]
    return { runtime, ref, answer: (await runtime.read(ref)) as AnswerOf<ResourceKind> }
  }

  it('ready', async () => {
    const { answer } = await read('normal')
    expect(answer.state).toBe('ready')
    expect(answer).toHaveProperty('data')
  })

  it('empty', async () => {
    const { answer } = await read('empty')
    expect(answer.state).toBe('empty')
    if (answer.state === 'empty') (emptyShaped[kind] as (data: unknown) => void)(answer.data)
  })

  it('loading', async () => {
    expect((await read('loading')).answer).toEqual({ state: 'loading' })
  })

  it('long', async () => {
    const { answer } = await read('long')
    expect(answer.state).toBe('long')
    if (answer.state === 'long') (longShaped[kind] as (data: unknown) => void)(answer.data)
  })

  it('error, with its typed reason and what survives of the data', async () => {
    const { answer, ref } = await read('error')
    const fixed = previewErrorOf(ref)
    expect(answer.state).toBe('error')
    if (answer.state !== 'error') return
    expect(answer.reason).toEqual(fixed.reason)
    expect(formatReason(answer.reason)).toMatch(typedReason)
    if (fixed.keeps === 'nothing') expect(answer).toEqual({ state: 'error', reason: fixed.reason })
    if (fixed.keeps === 'stale') expect(answer).toMatchObject({ stale: true, data: expect.anything() })
    if (fixed.keeps === 'partial') expect(answer).toMatchObject({ partial: true, data: expect.anything() })
  })
})

describe('the facade', () => {
  afterEach(() => vi.useRealTimers())

  it('every read is asynchronous, with the fixed simulated delay', async () => {
    vi.useFakeTimers()
    const runtime = createRuntime({ storage: null, search: '?scene=s1' })
    let answered = false
    const reading = runtime.read({ kind: 'accounts' }).then((answer) => {
      answered = true
      return answer
    })
    await vi.advanceTimersByTimeAsync(SIMULATED_DELAY - 1)
    expect(answered).toBe(false)
    await vi.advanceTimersByTimeAsync(1)
    expect(answered).toBe(true)
    expect((await reading).state).toBe('ready')
  })

  it('answers empty by the data when nothing is forced', async () => {
    const runtime = runtimeIn('e1')
    // A module she adds has never run and keeps no records.
    const added = runtime.actions.addModule({ name: '寄养' })!
    for (const ref of [{ kind: 'topics' }, { kind: 'conversations' }, { kind: 'proposals' }, { kind: 'runs', moduleId: added }, { kind: 'memory', moduleId: added }] as const) {
      expect((await runtime.read(ref)).state, ref.kind).toBe('empty')
    }
    expect((await runtime.read({ kind: 'memory', moduleId: moduleId.inventory })).state).toBe('ready')
  })

  it('answers not-found for an id nothing answers to, whatever is previewed', async () => {
    const runtime = runtimeIn('s1')
    const missing = [
      { kind: 'module', moduleId: 'nowhere' },
      { kind: 'workflow', moduleId: 'nowhere' },
      { kind: 'memory', moduleId: 'nowhere' },
      { kind: 'runs', moduleId: 'nowhere' },
      { kind: 'proposals', moduleId: 'nowhere' },
      { kind: 'conversation', id: 'nowhere' },
      { kind: 'topic', id: 'nowhere' },
    ] as const
    for (const preview of ['normal', 'empty', 'error', 'long'] as const) {
      runtime.actions.setPreview(preview)
      for (const ref of missing) expect(await runtime.read(ref), `${ref.kind} ${preview}`).toEqual({ state: 'error', reason: { code: 'not-found' } })
    }
  })

  it('resolves a promoted sub-module by its old id', async () => {
    const runtime = runtimeIn('s1')
    runtime.actions.promoteSubModule(moduleId.duration)
    const answer = await runtime.read({ kind: 'module', moduleId: moduleId.duration })
    expect(answer).toMatchObject({ state: 'ready', data: { module: { id: 'profession.duration' } } })
  })

  it('error keeps what the story says survives', async () => {
    const runtime = runtimeIn('e2')
    runtime.actions.setPreview('error')
    const module = (id: string) => runtime.read({ kind: 'module', moduleId: id })

    // source-failed:<module> — the other sources still answer.
    const notifications = await module(moduleId.notifications)
    expect(notifications).toMatchObject({ state: 'error', reason: { code: 'source-failed', moduleId: moduleId.shifts }, partial: true })
    if (notifications.state === 'error') {
      expect(notifications.data?.view.proposals).toHaveLength(2)
      expect(notifications.data?.view.memory.some((table) => table.ownerModuleId === moduleId.shifts)).toBe(false)
      expect(notifications.data?.view.memory.some((table) => table.id === tableId.notices)).toBe(true)
    }
    // platform-unreachable — the last good data, marked stale.
    const appointments = await module(moduleId.appointments)
    expect(appointments).toMatchObject({ state: 'error', reason: { code: 'platform-unreachable' }, stale: true })
    if (appointments.state === 'error') expect(appointments.data?.view.memory).toEqual(runtime.getState().memory)
    // account-expired:<account> — nothing to show.
    expect(await module(moduleId.messages)).toEqual({ state: 'error', reason: { code: 'account-expired', account: 'wechat' } })
    // generation-failed — the summary fails, its records answer.
    const topic = await runtime.read({ kind: 'topic', id: runtime.getState().topics[0].id })
    expect(topic).toMatchObject({ state: 'error', reason: { code: 'generation-failed' }, partial: true, data: { topic: { summary: null } } })
    if (topic.state === 'error') expect(topic.data?.conversations).toHaveLength(1)
    expect(runtime.getState().topics[0].summary).not.toBeNull()
  })

  it('every typed reason is some resource’s fixed failure', () => {
    const runtime = runtimeIn('s1')
    const refs: ResourceRef[] = [...Object.values(refsIn(runtime)), ...runtime.getState().modules.map((module) => ({ kind: 'module' as const, moduleId: module.id }))]
    const codes = new Set<FailureCode>(refs.map((ref) => previewErrorOf(ref).reason.code))
    expect([...codes].sort()).toEqual(['account-expired', 'account-missing', 'generation-failed', 'platform-unreachable', 'source-failed'])
  })

  it('gives the same answer object for the same state, and a new one after a change', () => {
    const runtime = runtimeIn('s1')
    const ref = { kind: 'module', moduleId: moduleId.appointments } as const
    const state = runtime.getState()
    return runtime.read(ref).then(async (first) => {
      expect(await runtime.read(ref)).toBe(first)
      runtime.actions.setPreview('long')
      const long = await runtime.read(ref)
      expect(long).not.toBe(first)
      expect(await runtime.read(ref)).toBe(long)
      expect(runtime.getState()).not.toBe(state)
    })
  })
})

describe('setPreview (R-02)', () => {
  it('forces the run state of every module', () => {
    const runtime = runtimeIn('s1')
    const status = (id: string) => runStateOf(runtime.getState(), id).status
    // As the story has it: 预约 and 待办 ran (D-51); a module she adds never did.
    expect(runStateOf(runtime.getState(), moduleId.appointments)).toMatchObject({ status: 'ok', last: { result: 'ok' }, nextRunAt: '2026-11-06T08:00' })
    expect(status(moduleId.todo)).toBe('ok')
    const added = runtime.actions.addModule({ name: '寄养' })!
    expect(status(added)).toBe('never-run')

    const forced = { empty: 'never-run', loading: 'running', error: 'failed', long: 'ok', normal: 'ok' } as const
    for (const preview of previewIds) {
      runtime.actions.setPreview(preview)
      for (const module of runtime.getState().modules.filter((each) => each.id !== moduleId.duration)) {
        const expected = module.custom ? (preview === 'normal' || preview === 'long' ? 'never-run' : forced[preview]) : forced[preview]
        expect(status(module.id), `${module.id} ${preview}`).toBe(expected)
      }
    }
    runtime.actions.setPreview('error')
    expect(runStateOf(runtime.getState(), moduleId.appointments).reason).toEqual({ code: 'platform-unreachable' })
    expect(runStateOf(runtime.getState(), moduleId.messages).reason).toEqual({ code: 'account-expired', account: 'wechat' })
    for (const module of runtime.getState().modules) {
      expect(formatReason(runStateOf(runtime.getState(), module.id).reason!), module.id).toMatch(typedReason)
    }
  })

  it('shows a real failed run with its reason when nothing is forced', async () => {
    const runtime = runtimeIn('s1')
    runtime.actions.disconnectAccount('payments')
    const running = runtime.actions.runModule(moduleId.inventory)
    expect(runStateOf(runtime.getState(), moduleId.inventory).status).toBe('running')
    await running
    expect(runStateOf(runtime.getState(), moduleId.inventory)).toMatchObject({ status: 'failed', reason: { code: 'account-missing', account: 'payments' } })
  })

  it('forces every resource at once, and resets on jumpToScene', async () => {
    const runtime = runtimeIn('s1')
    runtime.actions.setPreview('error')
    for (const ref of Object.values(refsIn(runtime))) expect((await runtime.read(ref)).state, ref.kind).toBe('error')
    runtime.actions.jumpToScene('s1')
    expect(runtime.getState().preview).toBe('normal')
    for (const ref of Object.values(refsIn(runtime))) expect((await runtime.read(ref)).state, ref.kind).toBe('ready')
    expect(runStateOf(runtime.getState(), moduleId.appointments).status).toBe('ok')
  })

  it('can be set by ?preview=, and is not kept across a reload', () => {
    const forced = createRuntime({ delay: 0, storage: null, search: '?scene=s1&preview=long' })
    expect(forced.getState()).toMatchObject({ scene: 's1', preview: 'long', onboarded: true })
    expect(createRuntime({ delay: 0, storage: null, search: '?preview=nonsense' }).getState().preview).toBe('normal')
    expect(createRuntime({ delay: 0, storage: null, search: '' }).getState().preview).toBe('normal')
  })
})
