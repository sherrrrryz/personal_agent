// @vitest-environment node
import { describe, expect, it } from 'vitest'

import { locales } from '@/i18n'
import { awaitingCount, findModule, openProposals, sceneIds, subModulesOf, tableOf, versionOf, workflowOf } from '@/runtime'
import { textsIn } from '@/runtime/test-support'

import { basis, chatScripts, column, moduleId, scene, sceneNames, tableId } from '.'

// The scenes `e1`–`s1` one by one. The invariants of the whole story (R-03)
// are in `story.test.ts`, the story facts and the variants (R-04) in
// `story-facts.test.ts`.

describe('scenes', () => {
  it.each(sceneIds)('%s is deterministic, a copy, and named in both locales', (id) => {
    expect(scene(id)).toEqual(scene(id))
    const once = scene(id)
    once.modules.length = 0
    expect(scene(id).modules.length).toBeGreaterThan(0)
    expect(scene(id).scene).toBe(id)
    for (const locale of locales) expect(sceneNames[id][locale].trim()).not.toBe('')
  })

  it('story time only moves forward', () => {
    const times = sceneIds.map((id) => scene(id).storyTime)
    expect([...times].sort()).toEqual(times)
  })

  it.each(['e1', 'e2', 's0', 's1'] as const)('%s: every story text exists in both locales', (id) => {
    const texts = textsIn(scene(id))
    expect(texts.length).toBeGreaterThan(100)
    for (const { path, text } of texts) {
      // A streaming or failed message has no text yet; a snapshot holds neither.
      for (const locale of locales) expect(text[locale].trim(), `${path} ${locale}`).not.toBe('')
    }
    for (const script of chatScripts) for (const { path, text } of textsIn(script)) for (const locale of locales) expect(text[locale].trim(), path).not.toBe('')
  })

  it('e1: six base modules, her four profession modules, nothing asked yet', () => {
    const state = scene('e1')
    expect(state.modules.map((module) => [module.id, module.kind])).toEqual([
      [moduleId.notifications, 'base'],
      [moduleId.messages, 'base'],
      [moduleId.calendar, 'base'],
      [moduleId.todo, 'base'],
      [moduleId.mail, 'base'],
      [moduleId.files, 'base'],
      [moduleId.appointments, 'profession'],
      [moduleId.clients, 'profession'],
      [moduleId.inventory, 'profession'],
      [moduleId.shifts, 'profession'],
    ])
    expect(state.conversations).toEqual([])
    expect(state.accounts.filter((account) => account.status === 'connected')).toHaveLength(3)
    expect(state.modeSettings.filter((setting) => setting.ceiling !== null)).toHaveLength(2)
    // Every module has a workflow; a stub's is the three-node placeholder.
    for (const module of state.modules) expect(workflowOf(state, module.id), module.id).toBeDefined()
    expect(versionOf(workflowOf(state, moduleId.todo)!).nodes).toHaveLength(3)
    // Every edge joins two nodes of its version, and every table a module names exists.
    for (const workflow of state.workflows) {
      const ids = new Set(versionOf(workflow).nodes.map((node) => node.id))
      for (const edge of versionOf(workflow).edges) expect(ids.has(edge.from) && ids.has(edge.to), `${workflow.id} ${edge.id}`).toBe(true)
    }
    for (const module of state.modules) for (const id of module.memoryTableIds) expect(tableOf(state, id)?.ownerModuleId, id).toBe(module.id)
  })

  it('e2: the confirmations sub-module ran, and two no-reply proposals wait in notifications', () => {
    const state = scene('e2')
    expect(subModulesOf(state, moduleId.appointments).map((module) => module.id)).toEqual([moduleId.confirmations])
    const waiting = openProposals(state)
    expect(waiting).toHaveLength(2)
    for (const proposal of waiting) expect(proposal).toMatchObject({ moduleId: moduleId.confirmations, mode: 'deferred' })
    expect(awaitingCount(state)).toBe(2)
    expect(tableOf(state, tableId.confirmations)?.rows.map((row) => row.cells.status)).toEqual(['replied', 'no-reply', 'no-reply'])
    expect(state.runs.filter((run) => run.moduleId === moduleId.confirmations)).toMatchObject([{ result: 'ok', at: '2026-11-03T19:00' }])
    expect(state.conversations).toMatchObject([{ persistence: 'persistent', subModuleId: moduleId.confirmations, surface: 'in-place' }])
  })

  it('s0: 可乐 is booked for the default two hours and nothing waits', () => {
    const state = scene('s0')
    const kele = tableOf(state, tableId.appointments)!.rows.find((row) => row.cells[column.appointments.dog] === 'kele')!
    expect(kele.cells).toMatchObject({ [column.appointments.estimate]: 120, [column.appointments.basis]: basis.default, status: 'booked' })
    expect(openProposals(state)).toEqual([])
    expect(findModule(state, moduleId.confirmations)).toBeDefined()
    expect(findModule(state, moduleId.duration)).toBeUndefined()
  })

  it('s1: 服务时长 exists with its two tables, and every open booking is on its breed’s seed', () => {
    const state = scene('s1')
    expect(findModule(state, moduleId.duration)).toMatchObject({ kind: 'sub', parentId: moduleId.appointments, memoryTableIds: [tableId.breeds, tableId.dogDurations] })
    expect(tableOf(state, tableId.dogDurations)?.rows).toEqual([])
    const estimates = Object.fromEntries(
      tableOf(state, tableId.appointments)!
        .rows.filter((row) => row.cells.status === 'booked')
        .map((row) => [row.cells[column.appointments.dog], [row.cells[column.appointments.estimate], row.cells[column.appointments.basis]]]),
    )
    expect(estimates).toEqual({ doudou: [240, 'breed'], kele: [240, 'breed'], dafu: [240, 'breed'], xueqiu: [180, 'breed'], max: [180, 'breed'] })
    // The canvas of stage 1: the three actions with their modes.
    const actions = versionOf(workflowOf(state, moduleId.duration)!).nodes.filter((node) => node.kind === 'action')
    expect(actions.map((node) => node.mode)).toEqual(['autonomous', 'assisted', 'deferred'])
    // 设置预约时长 already ran: the last run of 预约 reports the five rewritten bookings.
    const lastRun = state.runs.filter((run) => run.moduleId === moduleId.appointments).at(-1)!
    expect(Object.keys(lastRun.changes.blocks.schedule)).toHaveLength(5)
    expect(state.topics.map((topic) => topic.id)).toEqual(['confirmations', 'duration-rule'])
  })
})
