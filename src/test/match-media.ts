// A controllable `window.matchMedia` for tests. jsdom has none; components
// that read a media query (theme, breakpoints, reduced motion) need one that
// a test can flip. Every query is false until a test sets it.

type Listener = (event: MediaQueryListEvent) => void

const matches = new Map<string, boolean>()
const listeners = new Map<string, Set<Listener>>()

function listenersOf(query: string): Set<Listener> {
  let set = listeners.get(query)
  if (!set) {
    set = new Set()
    listeners.set(query, set)
  }
  return set
}

function createList(query: string): MediaQueryList {
  const add = (listener: Listener | null) => {
    if (listener) listenersOf(query).add(listener)
  }
  const remove = (listener: Listener | null) => {
    if (listener) listenersOf(query).delete(listener)
  }
  return {
    get matches() {
      return matches.get(query) ?? false
    },
    media: query,
    onchange: null,
    addEventListener: (_type: string, listener: Listener | null) => add(listener),
    removeEventListener: (_type: string, listener: Listener | null) => remove(listener),
    addListener: add,
    removeListener: remove,
    dispatchEvent: () => true,
  } as unknown as MediaQueryList
}

/** Installs the mock on `window`. Called once from the test setup. */
export function installMatchMedia(): void {
  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    writable: true,
    value: (query: string) => createList(query),
  })
}

/** Sets whether `query` matches and tells every listener, as a browser would. */
export function setMediaQuery(query: string, value: boolean): void {
  if ((matches.get(query) ?? false) === value) return
  matches.set(query, value)
  const event = { matches: value, media: query } as MediaQueryListEvent
  for (const listener of [...listenersOf(query)]) listener(event)
}

/** Back to "nothing matches, nobody listens". Called after every test. */
export function resetMatchMedia(): void {
  matches.clear()
  listeners.clear()
}
