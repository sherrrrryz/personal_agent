// What `@xyflow/react` needs from the browser and jsdom does not have. Only
// for tests (and never imported by app code): call `installFlowDom(size)` in a
// `beforeEach`; vitest's `restoreMocks` and the returned function undo it.

type Sized = { width: number; height: number }

/**
 * A `ResizeObserver` that reports every observed element once, element sizes
 * (every element measures `size`), and `DOMMatrixReadOnly` (the library reads
 * the zoom from the viewport's transform). With these the library measures
 * its nodes, the canvas lays them out, and they become visible to role queries.
 */
export function installFlowDom(size: Sized): () => void {
  const globals = globalThis as Record<string, unknown>
  const before = { observer: globals.ResizeObserver, matrix: globals.DOMMatrixReadOnly }

  class FlowResizeObserver {
    private readonly callback: ResizeObserverCallback
    constructor(callback: ResizeObserverCallback) {
      this.callback = callback
    }
    observe(target: Element) {
      this.callback([{ target } as ResizeObserverEntry], this as unknown as ResizeObserver)
    }
    unobserve() {}
    disconnect() {}
  }
  class FlowMatrix {
    m22: number
    constructor(transform?: string) {
      const scale = transform?.match(/scale\(([\d.]+)\)/)?.[1]
      this.m22 = scale === undefined ? 1 : Number(scale)
    }
  }
  globals.ResizeObserver = FlowResizeObserver
  globals.DOMMatrixReadOnly = FlowMatrix

  const dimensions = {
    offsetWidth: Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'offsetWidth'),
    offsetHeight: Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'offsetHeight'),
  }
  Object.defineProperty(HTMLElement.prototype, 'offsetWidth', { configurable: true, get: () => size.width })
  Object.defineProperty(HTMLElement.prototype, 'offsetHeight', { configurable: true, get: () => size.height })
  const svg = SVGElement.prototype as unknown as { getBBox?: () => DOMRect }
  const getBBox = svg.getBBox
  svg.getBBox = () => ({ x: 0, y: 0, width: 0, height: 0 }) as DOMRect

  return () => {
    globals.ResizeObserver = before.observer
    globals.DOMMatrixReadOnly = before.matrix
    for (const [name, descriptor] of Object.entries(dimensions)) {
      if (descriptor) Object.defineProperty(HTMLElement.prototype, name, descriptor)
    }
    svg.getBBox = getBBox
  }
}
