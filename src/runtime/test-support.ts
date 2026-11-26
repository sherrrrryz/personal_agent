import { createRuntime, type Runtime, type RuntimeOptions } from './store'

// Shared by the runtime's and the fixtures' tests; never imported by app code.

/** A `localStorage` stand-in that a test can read back. */
export function memoryStorage(seed: Record<string, string> = {}) {
  const items = new Map(Object.entries(seed))
  return {
    items,
    getItem: (key: string) => items.get(key) ?? null,
    setItem: (key: string, value: string) => void items.set(key, value),
    removeItem: (key: string) => void items.delete(key),
  }
}

/** A runtime that answers without delay and keeps nothing, in the scene given (`s1`, `s3-resolved`). */
export function runtimeIn(sceneRef: string, options: RuntimeOptions = {}): Runtime {
  return createRuntime({ delay: 0, storage: null, search: `?scene=${sceneRef}`, ...options })
}
