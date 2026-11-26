import { createRuntime, type Runtime, type RuntimeOptions } from './store'
import { isText } from './text'

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

/** Every two-locale text anywhere in a value, with the path that leads to it. */
export function textsIn(value: unknown, path = ''): Array<{ path: string; text: Record<string, string> }> {
  if (isText(value)) return [{ path, text: value }]
  if (typeof value !== 'object' || value === null) return []
  return Object.entries(value).flatMap(([key, child]) => textsIn(child, `${path}/${key}`))
}
