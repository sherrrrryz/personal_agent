// The matrix assertions that run inside the page. Injected by the harness as
// an init script (e2e/matrix/harness.ts) and called through `window.__matrix`.
// Plain browser JavaScript: nothing here is transpiled or imported.
//
// A waiver is an attribute on the element, `data-matrix-allow="clip"` or
// `"scroll"` (space-separated). It exempts that element and
// what is inside it from one assertion, and every use is listed in the
// report, so a waiver is never silent.
;(() => {
  if (window.__matrix) return

  /** Rounding slack, CSS px. */
  const SLACK = 1

  const registry = new Map()
  const ids = new WeakMap()
  let nextId = 1

  function idOf(element) {
    let id = ids.get(element)
    if (!id) {
      id = nextId++
      ids.set(element, id)
      registry.set(id, element)
    }
    return id
  }

  function describe(element) {
    const tag = element.tagName.toLowerCase()
    const id = element.id ? `#${element.id}` : ''
    const role = element.getAttribute('role')
    const text = (
      element.getAttribute('aria-label') ||
      element.innerText ||
      element.getAttribute('placeholder') ||
      element.getAttribute('name') ||
      ''
    )
      .trim()
      .replace(/\s+/g, ' ')
    const short = text.length > 48 ? `${text.slice(0, 48)}…` : text
    return `${tag}${id}${role ? `[role=${role}]` : ''}${short ? ` "${short}"` : ''}`
  }

  function pathOf(element) {
    const parts = []
    for (let node = element; node && node !== document.documentElement; node = node.parentElement) {
      if (node.id) {
        parts.unshift(`#${CSS.escape(node.id)}`)
        break
      }
      const tag = node.tagName.toLowerCase()
      const twins = node.parentElement
        ? [...node.parentElement.children].filter((child) => child.tagName === node.tagName)
        : []
      parts.unshift(twins.length > 1 ? `${tag}:nth-of-type(${twins.indexOf(node) + 1})` : tag)
    }
    return parts.join(' > ')
  }

  function rendered(element, withOpacity) {
    return element.checkVisibility({
      checkVisibilityCSS: true,
      visibilityProperty: true,
      checkOpacity: withOpacity,
      opacityProperty: withOpacity,
    })
  }

  const waivers = new Map()

  function waived(element, kind) {
    const holder = element.closest(`[data-matrix-allow~="${kind}"]`)
    if (!holder) return false
    waivers.set(`${kind} ${pathOf(holder)}`, { kind, element: describe(holder), path: pathOf(holder) })
    return true
  }

  // ── Sideways page scroll ────────────────────────────────────────────────

  function scrollsOn(style, axis) {
    const value = axis === 'x' ? style.overflowX : style.overflowY
    return value === 'auto' || value === 'scroll'
  }

  function hidesOn(style, axis) {
    const value = axis === 'x' ? style.overflowX : style.overflowY
    return value === 'hidden' || value === 'clip'
  }

  function insideScroller(element) {
    for (let node = element.parentElement; node && node !== document.body; node = node.parentElement) {
      const style = getComputedStyle(node)
      if (scrollsOn(style, 'x') || hidesOn(style, 'x')) return true
    }
    return false
  }

  function checkSidewaysScroll() {
    const root = document.scrollingElement || document.documentElement
    const overflow = root.scrollWidth - root.clientWidth
    if (overflow <= SLACK) return []
    const limit = root.clientWidth
    const wide = []
    for (const element of document.body.querySelectorAll('*')) {
      if (!rendered(element, false)) continue
      const box = element.getBoundingClientRect()
      if (box.width === 0 || box.height === 0) continue
      if (box.right + window.scrollX <= limit + SLACK) continue
      if (insideScroller(element)) continue
      wide.push(element)
    }
    const deepest = wide.filter((element) => !wide.some((other) => other !== element && element.contains(other)))
    const named = deepest.filter((element) => !waived(element, 'scroll'))
    if (deepest.length > 0 && named.length === 0) return []
    return [
      {
        kind: 'sideways-scroll',
        message:
          `the page scrolls sideways by ${Math.round(overflow)} px (content ${root.scrollWidth} px in a ${root.clientWidth} px viewport)` +
          (named.length > 0 ? ` — widest: ${describe(named[0])}` : ''),
        element: named.length > 0 ? describe(named[0]) : '',
        path: named.length > 0 ? pathOf(named[0]) : '',
        elements: named.slice(0, 5).map((element) => ({
          element: describe(element),
          path: pathOf(element),
          right: Math.round(element.getBoundingClientRect().right + window.scrollX),
        })),
      },
    ]
  }

  // ── Clipped text ────────────────────────────────────────────────────────

  function textBox(node, range) {
    range.selectNodeContents(node)
    const parentStyle = getComputedStyle(node.parentElement)
    const lineHeight = parseFloat(parentStyle.lineHeight)
    let box = null
    for (const rect of range.getClientRects()) {
      if (rect.width === 0 || rect.height === 0) continue
      // Compare line boxes, not glyph boxes: with a tight line-height the
      // glyph box is taller than the line and would read as clipped.
      let top = rect.top
      let bottom = rect.bottom
      if (Number.isFinite(lineHeight) && lineHeight < rect.height) {
        const middle = (rect.top + rect.bottom) / 2
        top = middle - lineHeight / 2
        bottom = middle + lineHeight / 2
      }
      box = box
        ? {
            left: Math.min(box.left, rect.left),
            right: Math.max(box.right, rect.right),
            top: Math.min(box.top, top),
            bottom: Math.max(box.bottom, bottom),
          }
        : { left: rect.left, right: rect.right, top, bottom }
    }
    return box
  }

  function checkClippedText() {
    const found = new Map()
    const range = document.createRange()
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT)
    for (let node = walker.nextNode(); node; node = walker.nextNode()) {
      if (!node.nodeValue.trim()) continue
      const parent = node.parentElement
      if (!parent || !rendered(parent, true)) continue
      const box = textBox(node, range)
      if (!box) continue
      let openX = true
      let openY = true
      for (let holder = parent; holder && holder !== document.documentElement && (openX || openY); holder = holder.parentElement) {
        const style = getComputedStyle(holder)
        const hidesX = openX && hidesOn(style, 'x')
        const hidesY = openY && hidesOn(style, 'y')
        if (hidesX || hidesY) {
          const outer = holder.getBoundingClientRect()
          // The visually-hidden pattern (a 1 px box): hidden on purpose, for assistive technology.
          if (outer.width <= 1 + SLACK || outer.height <= 1 + SLACK) break
          const inner = {
            left: outer.left + parseFloat(style.borderLeftWidth),
            right: outer.right - parseFloat(style.borderRightWidth),
            top: outer.top + parseFloat(style.borderTopWidth),
            bottom: outer.bottom - parseFloat(style.borderBottomWidth),
          }
          const lostX = hidesX ? Math.max(inner.left - box.left, box.right - inner.right) : 0
          const lostY = hidesY ? Math.max(inner.top - box.top, box.bottom - inner.bottom) : 0
          if (lostX > SLACK || lostY > SLACK) {
            if (!waived(parent, 'clip') && !found.has(holder)) {
              found.set(holder, {
                kind: 'clipped-text',
                message: `text is cut off by ${describe(holder)} (${Math.round(Math.max(lostX, lostY))} px ${lostX > lostY ? 'sideways' : 'vertically'})`,
                element: describe(holder),
                path: pathOf(holder),
                text: node.nodeValue.trim().replace(/\s+/g, ' ').slice(0, 80),
              })
            }
            break
          }
        }
        if (scrollsOn(style, 'x')) openX = false
        if (scrollsOn(style, 'y')) openY = false
      }
    }
    // A placeholder longer than its input is text nobody can read.
    for (const input of document.querySelectorAll('input[placeholder]')) {
      if (input.value || !rendered(input, true)) continue
      if (input.scrollWidth - input.clientWidth <= SLACK) continue
      if (waived(input, 'clip')) continue
      found.set(input, {
        kind: 'clipped-text',
        message: `the placeholder of ${describe(input)} is cut off (${input.scrollWidth - input.clientWidth} px sideways)`,
        element: describe(input),
        path: pathOf(input),
        text: input.placeholder.slice(0, 80),
      })
    }
    return [...found.values()]
  }

  // ── Shared by the keyboard and motion passes ────────────────────────────

  function disabled(element) {
    return (
      element.matches(':disabled') ||
      element.getAttribute('aria-disabled') === 'true' ||
      element.closest('[inert]') !== null
    )
  }

  /** Whether a click that lands on `hit` is answered by `target`. */
  function answers(target, hit) {
    if (!hit) return false
    if (hit === target || target.contains(hit)) return true
    const label = hit.closest('label')
    return label !== null && label.control === target
  }

  // ── Keyboard ────────────────────────────────────────────────────────────

  const FOCUSABLE = 'a[href], button, input, select, textarea, summary, iframe, [tabindex], [contenteditable=""], [contenteditable="true"]'

  function tabbables() {
    const list = []
    for (const element of document.querySelectorAll(FOCUSABLE)) {
      if (element.tabIndex < 0 || disabled(element) || !rendered(element, false)) continue
      if (element.matches('input[type="hidden"]')) continue
      if (element.matches('input[type="radio"]') && element.name) {
        // A native radio group is one tab stop: the checked one, or the first.
        const group = [...document.querySelectorAll(`input[type="radio"][name="${CSS.escape(element.name)}"]`)].filter(
          (radio) => radio.form === element.form && !disabled(radio),
        )
        const stop = group.find((radio) => radio.checked) || group[0]
        if (stop !== element) continue
      }
      list.push(element)
    }
    return list
  }

  /**
   * What a focus indicator can be drawn with, as one string. A property that
   * paints nothing — an outline with no style, a border with no width — is
   * written as "none", so a change of its colour does not count as a change.
   */
  function signatureOf(element, pseudo) {
    const style = getComputedStyle(element, pseudo)
    const outline =
      style.outlineStyle === 'none' || parseFloat(style.outlineWidth) === 0
        ? 'none'
        : [style.outlineStyle, style.outlineWidth, style.outlineColor, style.outlineOffset].join(' ')
    const borders = ['Top', 'Right', 'Bottom', 'Left'].map((side) =>
      style[`border${side}Style`] === 'none' || parseFloat(style[`border${side}Width`]) === 0
        ? 'none'
        : [style[`border${side}Style`], style[`border${side}Width`], style[`border${side}Color`]].join(' '),
    )
    return [outline, style.boxShadow, ...borders, style.backgroundColor, style.textDecorationLine].join('|')
  }

  /** The element, its pseudo-elements and three ancestors: where a focus indicator can be drawn. */
  function signatures(element) {
    const list = [signatureOf(element), signatureOf(element, '::before'), signatureOf(element, '::after')]
    let holder = element.parentElement
    for (let depth = 0; depth < 3 && holder && holder !== document.body; depth++, holder = holder.parentElement) {
      list.push(signatureOf(holder))
    }
    return list.join('\n')
  }

  const atRest = new WeakMap()

  function keyboardStart() {
    if (document.activeElement && document.activeElement !== document.body) document.activeElement.blur()
    const list = tabbables()
    for (const element of list) atRest.set(element, signatures(element))
    return list.map((element) => ({ id: idOf(element), element: describe(element), path: pathOf(element) }))
  }

  function pause(milliseconds) {
    return new Promise((resolve) => setTimeout(resolve, milliseconds))
  }

  function frame() {
    return new Promise((resolve) => requestAnimationFrame(() => resolve()))
  }

  async function keyboardStep() {
    const element = document.activeElement
    if (!element || element === document.body || element === document.documentElement) return { id: null }
    const rest = atRest.get(element)
    // A focus ring may fade in: give it a moment before calling it absent.
    let indicated = rest === undefined ? null : false
    for (let attempt = 0; rest !== undefined && attempt < 8; attempt++) {
      if (signatures(element) !== rest) {
        indicated = true
        break
      }
      await pause(40)
    }
    const box = element.getBoundingClientRect()
    const inView =
      box.bottom > 0 && box.right > 0 && box.top < window.innerHeight && box.left < window.innerWidth
    let covered = false
    if (inView && box.width > 1 && box.height > 1) {
      const points = [
        [box.left + box.width / 2, box.top + box.height / 2],
        [box.left + 2, box.top + 2],
        [box.right - 2, box.top + 2],
        [box.left + 2, box.bottom - 2],
        [box.right - 2, box.bottom - 2],
      ].filter(([x, y]) => x >= 0 && y >= 0 && x < window.innerWidth && y < window.innerHeight)
      covered =
        points.length > 0 &&
        points.every(([x, y]) => {
          const hit = document.elementFromPoint(x, y)
          return hit !== null && !answers(element, hit) && !hit.contains(element)
        })
    }
    return {
      id: idOf(element),
      element: describe(element),
      path: pathOf(element),
      indicated,
      inView,
      covered,
    }
  }

  /** For an element first seen while tabbing: its look once focus has left it. */
  function restSignatureMatches(id, focusedSignature) {
    const element = registry.get(id)
    return element ? signatures(element) === focusedSignature : true
  }

  function focusedSignature() {
    const element = document.activeElement
    return element ? signatures(element) : ''
  }

  // ── Motion ──────────────────────────────────────────────────────────────

  const motion = new Map()

  function recordAnimation(animation, target, source) {
    const timing = animation.effect ? animation.effect.getComputedTiming() : null
    if (!timing) return
    const duration = typeof timing.duration === 'number' ? timing.duration : 0
    if (duration <= 0 && timing.delay <= 0) return
    const name = animation.animationName || animation.transitionProperty || animation.id || 'animation'
    const owner = target || (animation.effect && animation.effect.target)
    const key = `${owner ? pathOf(owner) : '?'} ${name}`
    if (motion.has(key)) return
    motion.set(key, {
      kind: 'motion-under-reduced-motion',
      message: `${owner ? describe(owner) : 'an element'} runs "${name}" for ${Math.round(duration)} ms${timing.delay > 0 ? ` after ${Math.round(timing.delay)} ms` : ''} although reduced motion is requested`,
      element: owner ? describe(owner) : '',
      path: owner ? pathOf(owner) : '',
      name,
      duration: Math.round(duration),
      source,
    })
  }

  function motionSample(source) {
    for (const animation of document.getAnimations()) {
      if (animation.playState === 'finished' || animation.playState === 'idle') continue
      recordAnimation(animation, null, source)
    }
  }

  function motionStart() {
    const onEvent = (event) => {
      if (!(event.target instanceof Element)) return
      for (const animation of event.target.getAnimations()) recordAnimation(animation, event.target, event.type)
    }
    for (const type of ['animationstart', 'transitionrun', 'transitionstart']) {
      document.addEventListener(type, onEvent, true)
    }
    motionSample('load')
  }

  function overlayTriggers() {
    const selector = '[aria-haspopup]:not([aria-haspopup="false"]), [aria-expanded="false"], details:not([open]) > summary'
    return [...document.querySelectorAll(selector)]
      .filter((element) => !disabled(element) && rendered(element, false))
      .map((element) => ({ id: idOf(element), element: describe(element) }))
  }

  function isOpen(id) {
    const element = registry.get(id)
    if (!element) return false
    if (element.matches('summary')) return element.parentElement.open
    return element.getAttribute('aria-expanded') === 'true'
  }

  // ── Text spacing (WCAG 1.4.12) ──────────────────────────────────────────

  function applyTextSpacing() {
    const style = document.createElement('style')
    style.dataset.matrix = 'text-spacing'
    style.textContent =
      '* { line-height: 1.5 !important; letter-spacing: 0.12em !important; word-spacing: 0.16em !important; }' +
      ' p { margin-bottom: 2em !important; }'
    document.head.append(style)
  }

  // ── Environment ─────────────────────────────────────────────────────────

  /** The browser's default font size, read from `rem` in a media query — a style on `html` cannot move it. */
  function defaultFontSize() {
    for (let size = 8; size <= 40; size++) {
      const low = (window.innerWidth - 0.5) / size
      const high = (window.innerWidth + 0.5) / size
      if (window.matchMedia(`(min-width: ${low}rem) and (max-width: ${high}rem)`).matches) return size
    }
    return null
  }

  async function settle() {
    await document.fonts.ready
    await frame()
    await frame()
  }

  window.__matrix = {
    scan() {
      waivers.clear()
      const failures = [...checkSidewaysScroll(), ...checkClippedText()]
      return { failures, waived: [...waivers.values()] }
    },
    keyboardStart,
    keyboardStep,
    focusedSignature,
    restSignatureMatches,
    motionStart,
    motionSample,
    motionReport: () => [...motion.values()],
    overlayTriggers,
    isOpen,
    byId: (id) => registry.get(id) || null,
    applyTextSpacing,
    defaultFontSize,
    settle,
    busy: () => document.querySelector('[aria-busy="true"]') !== null,
  }
})()
