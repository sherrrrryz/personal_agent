// The fake workflow runtime (spec part 2 § Fake workflow runtime).
//
// Reading:   `useResource({ kind: 'module', moduleId })` — through the facade,
//            obeys 状态预览; `useRuntimeState(select)` — the raw state, for
//            navigation and the device; `useRunState(moduleId)`.
// Changing:  `useActions()` — the runtime actions, the only way.
// Outside React, and in tests: `createRuntime({ delay: 0, storage: null })`.
//
// The URL contract, read once when the runtime is created:
//   ?scene=<e1|e2|s0|s1|s2|s3|s4|s5|s3-resolved|s4-resolved>
//   ?preview=<normal|empty|loading|error|long>

export {
  answerOf,
  previewErrorOf,
  resourceKey,
  resourceKinds,
  runStateOf,
  viewOf,
} from './facade'
export type { AnswerOf, ResourceAnswer, ResourceData, ResourceKind, ResourceRef, RunState } from './facade'
export { RuntimeContext, useActions, useResource, useRunState, useRuntime, useRuntimeState } from './hooks'
export * from './model'
export type { ModuleDefinition, PageContext } from './module-definition'
export { findScript, suggestedPrompts } from './reduce'
export type { SendMessageInput } from './reduce'
export * from './selectors'
export {
  createRuntime,
  getRuntime,
  parsePreview,
  parseSceneRef,
  resetRuntime,
  runtimeActionNames,
  sceneRefs,
  SIMULATED_DELAY,
  storageKeys,
} from './store'
export type { Runtime, RuntimeActions, RuntimeOptions, SceneRef } from './store'
export { isText, textIn, tx, typed } from './text'
export type { Text } from './text'
export { addDays, addMinutes, datePart, nextAt, timePart, toDate } from './time'
