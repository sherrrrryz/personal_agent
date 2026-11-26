// @vitest-environment node
import { describe, expect, it, vi } from 'vitest'

import {
  awaitingCount,
  memoryChanges,
  numberCell,
  openProposals,
  parseSceneRef,
  rowOf,
  sceneRefs,
  stringCell,
  tableOf,
  versionOf,
  workflowOf,
  type Snapshot,
} from '@/runtime'
import { runtimeIn } from '@/runtime/test-support'

import { appointmentStatus, basis, column, firstVisitParam, moduleId, nodeId, proposalId, scene, tableId } from '.'

// R-03 — the invariants of the story, over every scene and both halves of
// `s3` and `s4`. What each scene shows (R-04) is in `story-facts.test.ts`.

const at = (ref: string): Snapshot => {
  const parsed = parseSceneRef(ref)!
  return scene(parsed.scene, parsed.half)
}

const a = column.appointments
const d = column.dogDurations
const b = column.breeds
const mean = (values: number[]) => Math.round(values.reduce((sum, value) => sum + value, 0) / values.length)

/** The scenes in which 服务时长 exists, in story order. */
const withDuration = sceneRefs.filter((ref) => tableOf(at(ref), tableId.breeds))
const beforeTheChange = ['s1', 's2', 's3'] as const
const afterTheChange = ['s3-resolved', 's4', 's4-resolved', 's5'] as const

describe('scene invariants (R-03)', () => {
  it('every scene is listed on one side of the first change', () => {
    expect(withDuration).toEqual([...beforeTheChange, ...afterTheChange])
  })

  it.each(sceneRefs)('%s is deterministic: built twice from nothing, it is the same snapshot', async (ref) => {
    const first = at(ref)
    expect(at(ref)).toEqual(first)
    // A fresh copy of the fixtures builds the story again from `world()`.
    vi.resetModules()
    const rebuilt = await import('./scenes')
    const parsed = parseSceneRef(ref)!
    expect(rebuilt.scene(parsed.scene, parsed.half)).toEqual(first)
  })

  it('story time never goes back, and a resolved half is the same moment as its pending half', () => {
    const times = sceneRefs.map((ref) => at(ref).storyTime)
    expect([...times].sort()).toEqual(times)
    expect(at('s3-resolved').storyTime).toBe(at('s3').storyTime)
    expect(at('s4-resolved').storyTime).toBe(at('s4').storyTime)
  })

  it.each(withDuration)('%s: a dog’s average is the mean of its visits, a breed’s 实测平均 the mean of its dogs', (ref) => {
    const state = at(ref)
    const visits = tableOf(state, tableId.visits)!.rows
    const records = tableOf(state, tableId.dogDurations)!.rows
    for (const record of records) {
      const own = visits.filter((visit) => visit.cells[column.visits.dog] === record.id).map((visit) => Number(visit.cells[column.visits.actual]))
      expect(record.cells[d.visits], record.id).toBe(own.length)
      expect(record.cells[d.average], record.id).toBe(mean(own))
    }
    // Every timed visit belongs to a record.
    expect(new Set(visits.map((visit) => visit.cells[column.visits.dog]))).toEqual(new Set(records.map((record) => record.id)))
    for (const breed of tableOf(state, tableId.breeds)!.rows) {
      const averages = records.filter((record) => record.cells[d.breed] === breed.id).map((record) => Number(record.cells[d.average]))
      if (averages.length === 0) {
        // 尚无数据.
        expect([breed.cells[b.observed], breed.cells[b.dogs], breed.cells[b.min], breed.cells[b.max]], breed.id).toEqual([null, 0, null, null])
      } else {
        expect(breed.cells, breed.id).toMatchObject({ [b.observed]: mean(averages), [b.dogs]: averages.length, [b.min]: Math.min(...averages), [b.max]: Math.max(...averages) })
      }
    }
  })

  it.each(['s2', 's3', 's3-resolved'])('%s: 金毛 实测平均 is 3 h 45 — five dogs, 3 h 20 to 4 h 10', (ref) => {
    expect(rowOf(tableOf(at(ref), tableId.breeds), 'golden')?.cells).toMatchObject({ [b.observed]: 225, [b.dogs]: 5, [b.min]: 200, [b.max]: 250 })
  })

  it.each(sceneRefs.filter((ref) => !['e1', 'e2', 's0', 's1'].includes(ref)))('%s: every visit since 服务时长 exists was timed', (ref) => {
    const state = at(ref)
    const since = scene('s1').storyTime
    const finished = tableOf(state, tableId.appointments)!.rows.filter((row) => row.cells[a.status] === appointmentStatus.done && String(row.cells[a.start]) >= since.slice(0, 10))
    expect(finished.length).toBeGreaterThan(0)
    for (const row of finished) expect(row.cells[a.actual], row.id).toEqual(expect.any(Number))
    // And nothing booked lies in the past.
    for (const row of tableOf(state, tableId.appointments)!.rows) {
      if (row.cells[a.status] === appointmentStatus.booked) expect(String(row.cells[a.start]) >= state.storyTime.slice(0, 10), row.id).toBe(true)
    }
  })

  /** The open bookings of a scene with what each rests on. */
  const booked = (state: Snapshot) =>
    tableOf(state, tableId.appointments)!
      .rows.filter((row) => row.cells[a.status] === appointmentStatus.booked)
      .map((row) => {
        const dog = stringCell(row, a.dog)!
        const record = rowOf(tableOf(state, tableId.dogDurations), dog)
        const breed = rowOf(tableOf(state, tableId.breeds), stringCell(rowOf(tableOf(state, tableId.dogs), dog), column.dogs.breed)!)
        return { row, dog, record, breed, visits: numberCell(record, d.visits) ?? 0 }
      })

  it.each(beforeTheChange)('%s (before `s3` resolved): every booking’s 适用时长 is its breed row’s', (ref) => {
    const state = at(ref)
    const open = booked(state)
    expect(open.length).toBeGreaterThan(0)
    for (const { row, record, breed } of open) {
      expect(row.cells, row.id).toMatchObject({ [a.basis]: basis.breed, [a.estimate]: breed!.cells[b.applied] })
      expect(record?.cells[d.applied] ?? null, row.id).toBeNull()
    }
    // No 适用 value has moved yet: every breed row is still her rule of thumb.
    for (const breed of tableOf(state, tableId.breeds)!.rows) expect(breed.cells[b.basis], breed.id).toBe('seed')
  })

  it('s3 pending: 豆豆 and 大福 have three visits each and are still booked for the breed’s 4 h', () => {
    const open = booked(at('s3')).filter(({ visits }) => visits >= 2)
    expect(open.map(({ dog, visits, row }) => [dog, visits, row.cells[a.estimate]])).toEqual([
      ['doudou', 3, 240],
      ['dafu', 3, 240],
    ])
  })

  it.each(afterTheChange)('%s (from `s3` resolved): a dog with two or more visits is booked on its own record, the others on the breed row', (ref) => {
    const state = at(ref)
    const open = booked(state)
    const extra = Number(versionOf(workflowOf(state, moduleId.duration)!).nodes.find((node) => firstVisitParam in node.params)?.params[firstVisitParam] ?? 0)
    expect(open.some(({ visits }) => visits >= 2)).toBe(true)
    expect(open.some(({ visits }) => visits < 2)).toBe(true)
    for (const { row, record, breed, visits } of open) {
      if (visits >= 2) {
        expect(row.cells, row.id).toMatchObject({ [a.basis]: basis.own, [a.estimate]: record!.cells[d.applied], [a.extra]: null })
        expect(record!.cells[d.applied], row.id).toEqual(expect.any(Number))
      } else {
        const first = visits === 0 && extra > 0
        expect(row.cells, row.id).toMatchObject({ [a.basis]: basis.breed, [a.estimate]: Number(breed!.cells[b.applied]) + (first ? extra : 0), [a.extra]: first ? extra : null })
      }
    }
  })

  it('s3 resolved changes memory rows at both tiers and leaves the workflow at version 1', () => {
    const pending = at('s3')
    const resolved = at('s3-resolved')
    expect(rowOf(tableOf(pending, tableId.breeds), 'golden')?.cells).toMatchObject({ [b.applied]: 240, [b.basis]: 'seed' })
    expect(rowOf(tableOf(resolved, tableId.breeds), 'golden')?.cells).toMatchObject({ [b.applied]: 225, [b.basis]: 'average' })
    expect(['doudou', 'dafu'].map((dog) => rowOf(tableOf(resolved, tableId.dogDurations), dog)?.cells[d.applied])).toEqual([200, 250])
    // Only those three rows moved, and the memory view can mark them.
    const changed = (table: string) =>
      tableOf(resolved, table)!.rows.filter((row) => JSON.stringify(row) !== JSON.stringify(rowOf(tableOf(pending, table), row.id))).map((row) => row.id)
    expect(changed(tableId.breeds)).toEqual(['golden'])
    expect(changed(tableId.dogDurations)).toEqual(['doudou', 'dafu'])
    expect(memoryChanges(resolved, tableOf(resolved, tableId.breeds)!)).toEqual({ golden: 'updated' })
    expect(memoryChanges(resolved, tableOf(resolved, tableId.dogDurations)!)).toEqual({ doudou: 'updated', dafu: 'updated' })
    // The workflow: version 1, the same canvas, nothing proposed.
    expect(resolved.workflows).toEqual(pending.workflows)
    expect(workflowOf(resolved, moduleId.duration)).toMatchObject({ current: 1, versions: [{ n: 1 }] })
    expect(workflowOf(resolved, moduleId.duration)?.versions).toHaveLength(1)
    expect(workflowOf(resolved, moduleId.duration)?.proposed).toBeUndefined()
  })

  it('s3: accepting both parts live, on the pending half, gives the resolved half', () => {
    const runtime = runtimeIn('s3')
    for (const partId of ['breed', 'dogs']) runtime.actions.resolveProposalPart({ proposalId: proposalId.review, partId, resolution: 'accepted' })
    const live = runtime.getState()
    const resolved = at('s3-resolved')
    for (const key of ['memory', 'proposals', 'workflows', 'runs', 'pendingChanges', 'modules'] as const) expect(live[key], key).toEqual(resolved[key])

    // Accepting one part only changes one tier.
    const half = runtimeIn('s3')
    half.actions.resolveProposalPart({ proposalId: proposalId.review, partId: 'breed', resolution: 'accepted' })
    half.actions.resolveProposalPart({ proposalId: proposalId.review, partId: 'dogs', resolution: 'rejected' })
    expect(rowOf(tableOf(half.getState(), tableId.breeds), 'golden')?.cells[b.applied]).toBe(225)
    expect(rowOf(tableOf(half.getState(), tableId.dogDurations), 'doudou')?.cells[d.applied]).toBeNull()
  })

  it('s4 resolved has version 2 with exactly one added condition node and its edges', () => {
    const pending = workflowOf(at('s4'), moduleId.duration)!
    const resolved = workflowOf(at('s4-resolved'), moduleId.duration)!
    expect(pending).toMatchObject({ current: 1, proposed: { proposalId: proposalId.firstVisit } })
    expect(pending.versions).toHaveLength(1)
    expect(resolved.current).toBe(2)
    expect(resolved.versions.map((version) => [version.n, version.author])).toEqual([
      [1, 'ai'],
      [2, 'ai'],
    ])
    expect(resolved.proposed).toBeUndefined()

    const [one, two] = resolved.versions
    // Version 1 is what it was; version 2 is what was proposed.
    expect(one).toEqual(pending.versions[0])
    expect(two).toMatchObject({ nodes: pending.proposed!.nodes, edges: pending.proposed!.edges, reason: pending.proposed!.reason })
    const added = two.nodes.filter((node) => !one.nodes.some((each) => each.id === node.id))
    expect(added).toHaveLength(1)
    expect(added[0]).toMatchObject({ id: nodeId.firstVisit, kind: 'condition', params: { [firstVisitParam]: 30 } })
    // Every node of version 1 is there unchanged, every edge too.
    expect(two.nodes.filter((node) => node.id !== nodeId.firstVisit)).toEqual(one.nodes)
    const newEdges = two.edges.filter((edge) => !one.edges.some((each) => each.id === edge.id))
    expect(two.edges.filter((edge) => !newEdges.includes(edge))).toEqual(one.edges)
    expect(newEdges.map((edge) => [edge.from, edge.to])).toEqual([
      [nodeId.estimate, nodeId.firstVisit],
      [nodeId.firstVisit, nodeId.setDuration],
    ])
  })

  it('s4: approving live — on the canvas or through the proposal — gives the resolved half', () => {
    const resolved = at('s4-resolved')
    const viaCanvas = runtimeIn('s4')
    expect(viaCanvas.actions.approveWorkflowChange({ workflowId: workflowOf(viaCanvas.getState(), moduleId.duration)!.id })).toBe(true)
    const viaProposal = runtimeIn('s4')
    viaProposal.actions.resolveProposalPart({ proposalId: proposalId.firstVisit, partId: 'add', resolution: 'accepted' })
    for (const live of [viaCanvas.getState(), viaProposal.getState()]) {
      for (const key of ['memory', 'proposals', 'workflows', 'runs', 'pendingChanges'] as const) expect(live[key], key).toEqual(resolved[key])
    }
    // Refusing leaves version 1 and removes the draft.
    const refusing = runtimeIn('s4')
    refusing.actions.resolveProposalPart({ proposalId: proposalId.firstVisit, partId: 'add', resolution: 'rejected' })
    expect(workflowOf(refusing.getState(), moduleId.duration)).toMatchObject({ current: 1 })
    expect(workflowOf(refusing.getState(), moduleId.duration)?.proposed).toBeUndefined()
  })

  it('e2 has two no-reply proposals in `notifications`, and only `s3` and `s4` pending hold one more deferred item', () => {
    const waiting = openProposals(at('e2')).filter((proposal) => proposal.mode === 'deferred')
    expect(waiting.map((proposal) => proposal.id)).toEqual(['proposal-no-reply-lucky', 'proposal-no-reply-naicha'])
    for (const proposal of waiting) expect(proposal.moduleId).toBe(moduleId.confirmations)
    expect(Object.fromEntries(sceneRefs.map((ref) => [ref, awaitingCount(at(ref))]))).toEqual({
      e1: 0,
      e2: 2,
      s0: 0,
      s1: 0,
      s2: 0,
      s3: 1,
      's3-resolved': 0,
      s4: 1,
      's4-resolved': 0,
      s5: 0,
    })
  })

  it.each(sceneRefs)('%s: the state is whole — every reference resolves', (ref) => {
    const state = at(ref)
    const modules = new Set(state.modules.map((module) => module.id))
    for (const module of state.modules) {
      expect(workflowOf(state, module.id), module.id).toBeDefined()
      for (const id of module.memoryTableIds) expect(tableOf(state, id)?.ownerModuleId, id).toBe(module.id)
    }
    for (const workflow of state.workflows) {
      for (const version of [...workflow.versions, ...(workflow.proposed ? [workflow.proposed] : [])]) {
        const ids = new Set(version.nodes.map((node) => node.id))
        expect(ids.size, workflow.id).toBe(version.nodes.length)
        for (const edge of version.edges) expect(ids.has(edge.from) && ids.has(edge.to), `${workflow.id} ${edge.id}`).toBe(true)
      }
    }
    for (const table of state.memory) {
      expect(new Set(table.rows.map((row) => row.id)).size, table.id).toBe(table.rows.length)
      for (const column of table.columns) {
        for (const row of table.rows) {
          const value = row.cells[column.id]
          if (value === null || value === undefined) continue
          if (column.type === 'ref') expect(rowOf(tableOf(state, column.refTable!), String(value)), `${table.id}/${row.id}/${column.id}`).toBeDefined()
          if (column.type === 'module') expect(modules.has(String(value)), `${table.id}/${row.id}/${column.id}`).toBe(true)
          if (column.type === 'code' && column.options) expect(column.options[String(value)], `${table.id}/${row.id}/${column.id}=${String(value)}`).toBeDefined()
        }
      }
    }
    for (const proposal of state.proposals) expect(modules.has(proposal.moduleId), proposal.id).toBe(true)
    expect(new Set(state.proposals.map((proposal) => proposal.id)).size).toBe(state.proposals.length)
    expect(new Set(state.runs.map((run) => run.id)).size).toBe(state.runs.length)
    for (const run of state.runs) expect(run.result, run.id).toBe('ok')
    // A module's runs are in the order they happened, and a topic always has a conversation.
    for (const module of state.modules) {
      const times = state.runs.filter((run) => run.moduleId === module.id).map((run) => run.at)
      expect([...times].sort(), module.id).toEqual(times)
    }
    for (const topic of state.topics) expect(state.conversations.some((conversation) => conversation.topicId === topic.id), topic.id).toBe(true)
  })
})
