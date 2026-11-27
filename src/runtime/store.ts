import type { ProposalPartState } from '@/blocks/types'
import { scene } from '@/fixtures/scenes'
import { prefersReducedMotion } from '@/lib/reduced-motion'
import type { BehaviourMode } from '@/lib/vocab'

import { answerOf, type AnswerOf, type ResourceKind, type ResourceRef } from './facade'
import {
  previewIds,
  sceneIds,
  scenesWithHalves,
  type CreateSubModuleInput,
  type PreviewId,
  type RuntimeState,
  type SaveNodeParamsInput,
  type SceneHalf,
  type SceneId,
  type Snapshot,
  type TaskKind,
} from './model'
import { motion } from '@/tokens/generated/motion'

import * as reduce from './reduce'
import type { SendMessageInput } from './reduce'
import type { Text } from './text'

// The store (spec part 2 § Fake workflow runtime, "Store"): one in-memory
// state, read through `useSyncExternalStore` (`hooks.ts`), changed only by the
// runtime actions below. State = the scene's snapshot + her actions since the
// jump. `localStorage` keeps the scene, the onboarding flag and the pins.

/** The `localStorage` keys the runtime owns (`pa.theme` and `pa.locale` belong to their providers). */
export const storageKeys = { scene: 'pa.scene', onboarded: 'pa.onboarded', pins: 'pa.pins' } as const

/**
 * How long a read and a run take, in milliseconds — simulated, fixed, from the
 * token source (`motion.simulated.delay`). Short enough for the matrix, long
 * enough to see a loading state.
 */
export const SIMULATED_DELAY = motion.simulated.delay

/**
 * The pace of a reply's replay, in milliseconds (D-45): `beat` — the thinking
 * state and each step; `write` — the text being written out; `settle` — the
 * pause before each thing the text carries.
 */
export type ReplyPace = { beat: number; write: number; settle: number }

/** The pace from the token source (`motion.reply.*`). */
export const REPLY_PACE: ReplyPace = motion.reply

/** A scene as the URL and the 时间推进 menu name it: `s1`, or `s3-resolved` for a resolved half. */
export type SceneRef = SceneId | `${(typeof scenesWithHalves)[number]}-resolved`

/** Every scene a screen can be opened in, resolved halves included — what a `matrixRoutes` entry may list. */
export const sceneRefs = sceneIds.flatMap((id): SceneRef[] =>
  (scenesWithHalves as readonly SceneId[]).includes(id) ? [id, `${id}-resolved` as SceneRef] : [id],
)

export function parseSceneRef(value: string | null | undefined): { scene: SceneId; half: SceneHalf } | null {
  if (!value) return null
  const [id, half, ...rest] = value.split('-')
  if (rest.length > 0 || !(sceneIds as readonly string[]).includes(id)) return null
  if (half === undefined) return { scene: id as SceneId, half: 'pending' }
  return half === 'resolved' && (scenesWithHalves as readonly string[]).includes(id) ? { scene: id as SceneId, half } : null
}

export function parsePreview(value: string | null | undefined): PreviewId | null {
  return (previewIds as readonly string[]).includes(value ?? '') ? (value as PreviewId) : null
}

type StorageLike = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>

export type RuntimeOptions = {
  /** Milliseconds a read and a run take. Default `SIMULATED_DELAY`. */
  delay?: number
  /**
   * The pace of a reply's replay. Default `REPLY_PACE` — or, when `delay` is
   * given, every wait of a reply takes `delay` (a test's `{ delay: 0 }` makes
   * the whole runtime immediate).
   */
  pace?: ReplyPace
  /** Whether she asked for reduced motion: the text is then not written out but there at once. Default: the media query. */
  reducedMotion?: () => boolean
  /** Where the scene, the onboarding flag and the pins are kept; `null` keeps nothing. Default `localStorage`. */
  storage?: StorageLike | null
  /** The query string to start from (`?scene=s1&preview=long`). Default: the page's. */
  search?: string
  /** A snapshot to start from instead of a scene's — a demo page's own data, a test's prepared state. */
  initial?: Snapshot
}

/** The runtime actions — the only way a screen changes the state. */
export type RuntimeActions = {
  /**
   * Sends her message. The script decides at once where the answer appears
   * (`surface`); the reply is then replayed as a process (D-45) — thinking, the
   * script's steps one at a time, the text, the table, the proposal — and `done`
   * settles when it is complete, has failed (出错), or keeps streaming (加载中).
   * `null`: a retry with nothing to retry.
   */
  sendMessage(input: SendMessageInput): { conversationId: string; surface: 'in-place' | 'thread'; done: Promise<void> } | null
  /** One-off → persistent (D-08). Returns the sub-module's id: go to `/m/<id>/workflow`. */
  createSubModule(input: CreateSubModuleInput): string | null
  archiveSubModule(moduleId: string): void
  /** Returns the new id; the old one stays an alias. */
  promoteSubModule(moduleId: string): string | null
  /** Returns the id of a module the proposal's `onAccept` created or promoted, when its last part resolved. */
  resolveProposalPart(input: { proposalId: string; partId: string; resolution: Exclude<ProposalPartState, 'pending'> }): string | null
  approveWorkflowChange(input: { workflowId: string }): boolean
  saveNodeParams(input: SaveNodeParamsInput): boolean
  /** 立即运行: the run is `running` at once and settles after the delay. Resolves with the run's id. */
  runModule(moduleId: string): Promise<string | null>
  recordActualDuration(input: { appointmentId: string; minutes: number }): void
  setCeiling(input: { taskKind: TaskKind; ceiling: BehaviourMode | null }): void
  connectAccount(accountId: string): void
  disconnectAccount(accountId: string): void
  /** Confirms the module set (onboarding is done from here); `regenerate` first restores the scene's own set. */
  confirmModuleSet(options?: { regenerate?: boolean }): void
  renameModule(input: { moduleId: string; name: string | Text }): void
  addModule(input: { name: string | Text; description?: string | Text } | { restore: string }): string | null
  removeModule(moduleId: string): void
  togglePin(input: { moduleId: string; blockKey: string; index?: number }): void
  setPreview(preview: PreviewId): void
  /** Replaces the snapshot, resets the preview, keeps the pins. `s3-resolved` names a resolved half. */
  jumpToScene(ref: SceneRef): void
}

export const runtimeActionNames = [
  'sendMessage',
  'createSubModule',
  'archiveSubModule',
  'promoteSubModule',
  'resolveProposalPart',
  'approveWorkflowChange',
  'saveNodeParams',
  'runModule',
  'recordActualDuration',
  'setCeiling',
  'connectAccount',
  'disconnectAccount',
  'confirmModuleSet',
  'renameModule',
  'addModule',
  'removeModule',
  'togglePin',
  'setPreview',
  'jumpToScene',
] as const satisfies ReadonlyArray<keyof RuntimeActions>

export type Runtime = {
  getState(): RuntimeState
  subscribe(listener: () => void): () => void
  /** A read through the facade: the answer after the simulated delay. */
  read<Kind extends ResourceKind>(ref: ResourceRef<Kind>): Promise<AnswerOf<Kind>>
  actions: RuntimeActions
  /**
   * 重新开始（回到首次使用）: the first scene, onboarding not done, no pins, no
   * preview, and nothing of the runtime left in storage. A device control,
   * not a runtime action of the product.
   */
  restart(): void
}

function browserStorage(): StorageLike | null {
  try {
    return typeof window === 'undefined' ? null : window.localStorage
  } catch {
    return null
  }
}

function readPins(storage: StorageLike | null): RuntimeState['pins'] {
  try {
    const parsed: unknown = JSON.parse(storage?.getItem(storageKeys.pins) ?? '{}')
    return typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed) ? (parsed as RuntimeState['pins']) : {}
  } catch {
    return {}
  }
}

export function createRuntime(options: RuntimeOptions = {}): Runtime {
  const delay = options.delay ?? SIMULATED_DELAY
  const pace = options.pace ?? (options.delay === undefined ? REPLY_PACE : { beat: options.delay, write: options.delay, settle: options.delay })
  const still = options.reducedMotion ?? prefersReducedMotion
  const storage = options.storage === undefined ? browserStorage() : options.storage
  const search = options.search ?? (typeof window === 'undefined' ? '' : window.location.search)
  const query = new URLSearchParams(search)
  const listeners = new Set<() => void>()
  const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms))
  const keep = (key: string, value: string | null) => {
    try {
      if (value === null) storage?.removeItem(key)
      else storage?.setItem(key, value)
    } catch {
      // Storage can be full or blocked; the session still works.
    }
  }
  const stored = (key: string) => {
    try {
      return storage?.getItem(key) ?? null
    } catch {
      return null
    }
  }

  // `?scene=` wins over the stored scene and means the story is under way:
  // onboarding counts as done, so the matrix can open any screen directly.
  const asked = parseSceneRef(query.get('scene'))
  const start = asked ?? { scene: parseSceneRef(stored(storageKeys.scene))?.scene ?? sceneIds[0], half: 'pending' as const }
  let state: RuntimeState = {
    ...(options.initial ? structuredClone(options.initial) : scene(start.scene, start.half)),
    epoch: 0,
    preview: parsePreview(query.get('preview')) ?? 'normal',
    onboarded: asked !== null || stored(storageKeys.onboarded) === '1',
    pins: readPins(storage),
  }

  /** Runs a change on a copy of the state, then tells every reader. */
  function change<Result>(mutate: (draft: RuntimeState) => Result): Result {
    const draft = structuredClone(state)
    const result = mutate(draft)
    state = draft
    for (const listener of [...listeners]) listener()
    return result
  }

  /** Runs `step` after `ms` unless the scene has been replaced meanwhile. */
  async function later(ms: number, step: () => void): Promise<void> {
    const epoch = state.epoch
    await wait(ms)
    if (state.epoch === epoch) step()
  }

  function enter(target: { scene: SceneId; half: SceneHalf }, session: Pick<RuntimeState, 'onboarded' | 'pins'>) {
    state = { ...scene(target.scene, target.half), epoch: state.epoch + 1, preview: 'normal', ...session }
    for (const listener of [...listeners]) listener()
  }

  const actions: RuntimeActions = {
    sendMessage(input) {
      const begun = change((draft) => reduce.beginMessage(draft, input))
      if (!begun) return null
      const { conversationId } = begun
      // The replay belongs to the scene it began in: after a jump nothing more of it happens.
      const epoch = state.epoch
      const alive = () => state.epoch === epoch
      const done = (async () => {
        // Thinking: nothing to show yet.
        await wait(pace.beat)
        if (!alive()) return
        // 状态预览 reaches the reply too: 出错 fails it, 加载中 leaves it streaming.
        if (state.preview === 'error') {
          change((draft) => reduce.failReply(draft, conversationId))
          return
        }
        // Working: the script's steps, each running for a beat.
        while (change((draft) => reduce.stepReply(draft, conversationId))) {
          await wait(pace.beat)
          if (!alive()) return
        }
        if (state.preview === 'loading') {
          change((draft) => reduce.streamReply(draft, conversationId, 0.5))
          return
        }
        // Writing: the text has arrived; the list writes it out (at once with reduced motion).
        change((draft) => reduce.streamReply(draft, conversationId, 1))
        if (!still()) {
          await wait(pace.write)
          if (!alive()) return
        }
        // What the text carries comes after it is whole, one thing at a time: the table, then the proposal.
        await wait(pace.settle)
        if (!alive()) return
        if (change((draft) => reduce.attachReply(draft, conversationId))) {
          await wait(pace.settle)
          if (!alive()) return
        }
        change((draft) => reduce.finishReply(draft, conversationId, input.context))
      })()
      return { ...begun, done }
    },
    createSubModule: (input) => change((draft) => reduce.createSubModule(draft, input)),
    archiveSubModule: (moduleId) => change((draft) => reduce.archiveSubModule(draft, moduleId)),
    promoteSubModule(moduleId) {
      const id = change((draft) => reduce.promoteSubModule(draft, moduleId))
      // Its pins moved to the new id with everything else.
      if (id) keep(storageKeys.pins, JSON.stringify(state.pins))
      return id
    },
    resolveProposalPart: (input) => change((draft) => reduce.resolveProposalPart(draft, input)),
    approveWorkflowChange: (input) => change((draft) => reduce.approveWorkflowChange(draft, input)),
    saveNodeParams: (input) => change((draft) => reduce.saveNodeParams(draft, input)),
    async runModule(moduleId) {
      const runId = change((draft) => reduce.startRun(draft, { moduleId }))
      if (runId) await later(delay, () => change((draft) => reduce.finishRun(draft, runId)))
      return runId
    },
    recordActualDuration: (input) => change((draft) => reduce.recordActualDuration(draft, input)),
    setCeiling: (input) => change((draft) => reduce.setCeiling(draft, input)),
    connectAccount: (accountId) => change((draft) => reduce.connectAccount(draft, accountId)),
    disconnectAccount: (accountId) => change((draft) => reduce.disconnectAccount(draft, accountId)),
    confirmModuleSet(confirm = {}) {
      change((draft) => reduce.confirmModuleSet(draft, confirm.regenerate ? scene(draft.scene) : undefined))
      keep(storageKeys.onboarded, '1')
    },
    renameModule: (input) => change((draft) => reduce.renameModule(draft, input)),
    addModule: (input) => change((draft) => reduce.addModule(draft, input)),
    removeModule: (moduleId) => change((draft) => reduce.removeModule(draft, moduleId)),
    togglePin(input) {
      change((draft) => reduce.togglePin(draft, input))
      keep(storageKeys.pins, JSON.stringify(state.pins))
    },
    setPreview: (preview) => change((draft) => reduce.setPreview(draft, preview)),
    jumpToScene(ref) {
      const target = parseSceneRef(ref)
      if (!target) return
      enter(target, { onboarded: state.onboarded, pins: state.pins })
      keep(storageKeys.scene, target.scene)
    },
  }

  return {
    getState: () => state,
    subscribe(listener) {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
    async read(ref) {
      await wait(delay)
      return answerOf(state, ref)
    },
    actions,
    restart() {
      for (const key of Object.values(storageKeys)) keep(key, null)
      enter({ scene: sceneIds[0], half: 'pending' }, { onboarded: false, pins: {} })
    },
  }
}

let shared: Runtime | null = null

// The query the page was opened with. Read when this module loads, so a
// redirect that drops `?scene=&preview=` before the first screen renders
// cannot lose them.
const openedWith = typeof window === 'undefined' ? '' : window.location.search

/** The app's one runtime, made on first use. */
export function getRuntime(): Runtime {
  return (shared ??= createRuntime({ search: openedWith }))
}

/** Replaces the app's runtime — for a test that needs a fresh one, or a fast one (`{ delay: 0 }`). */
export function resetRuntime(options?: RuntimeOptions): Runtime {
  shared = createRuntime(options)
  return shared
}
