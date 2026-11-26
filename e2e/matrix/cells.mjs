// The verification matrix as data — docs/design/FOUNDATIONS.md § Verification
// matrix (D-34) and docs/specs/lofi-prototype-system.md § Matrix harness.
// Shared by scripts/matrix.mjs (the plan) and the Playwright specs (the run).
// Plain JavaScript so both can import it without a build step.

/** The four widths of the matrix, in CSS px at 100% zoom, with a viewport height each. */
export const WIDTHS = [
  { width: 320, height: 640 },
  { width: 768, height: 1024 },
  { width: 1024, height: 768 },
  { width: 1440, height: 900 },
]

/** The size a real user's "very large" text setting gives the root, in px. */
export const ROOT_LARGE = 24
export const ROOT_DEFAULT = 16
/** Chromium keeps the monospace default three px under the standard one. */
export const FIXED_FONT_OFFSET = 3

export const THEMES = ['light', 'dark']
export const LOCALES = ['zh-CN', 'en']

/**
 * @typedef {object} Cell
 * @property {string} id            e.g. `w768-zoom200-dark-en`
 * @property {number} width         the matrix width this cell stands for
 * @property {'100' | 'zoom200' | 'root24'} text
 * @property {'light' | 'dark'} theme
 * @property {'zh-CN' | 'en'} locale
 * @property {{ width: number, height: number }} viewport  CSS px the page is laid out in
 * @property {number} deviceScaleFactor
 * @property {number} rootFontSize  the browser's default font size, px
 */

/** @returns {Cell} */
export function makeCell(width, text, theme, locale) {
  const size = WIDTHS.find((entry) => entry.width === width)
  if (!size) throw new Error(`${width} is not a matrix width (320, 768, 1024 or 1440)`)
  // 200% browser zoom halves the CSS px a window offers and doubles the
  // device px each one takes: the same thing as a half-size viewport at
  // a device scale factor of 2.
  const zoomed = text === 'zoom200'
  return {
    id: `w${width}-${text}-${theme}-${locale}`,
    width,
    text,
    theme,
    locale,
    viewport: zoomed
      ? { width: size.width / 2, height: size.height / 2 }
      : { width: size.width, height: size.height },
    deviceScaleFactor: zoomed ? 2 : 1,
    rootFontSize: text === 'root24' ? ROOT_LARGE : ROOT_DEFAULT,
  }
}

/**
 * The 44 cells of one screen: 100% at four widths, 200% zoom at 768 · 1024 ·
 * 1440, root 24 px at four widths; each × light/dark × zh-CN/en. 320 at 200%
 * is not a cell (under the WCAG 1.4.10 floor).
 * @returns {Cell[]}
 */
export function fullCells() {
  const cells = []
  for (const text of ['100', 'zoom200', 'root24']) {
    for (const { width } of WIDTHS) {
      if (text === 'zoom200' && width === 320) continue
      for (const theme of THEMES) {
        for (const locale of LOCALES) cells.push(makeCell(width, text, theme, locale))
      }
    }
  }
  return cells
}

/** The four hardest text cases (spec § Matrix harness, `--cells stress`). */
export function stressCells() {
  return [
    makeCell(320, 'root24', 'dark', 'en'),
    makeCell(320, 'root24', 'light', 'zh-CN'),
    makeCell(768, 'zoom200', 'light', 'en'),
    makeCell(1440, 'zoom200', 'dark', 'zh-CN'),
  ]
}

/** A quick look: the two end widths at 100%, each theme once, each locale once. */
export function smokeCells() {
  return [
    makeCell(320, '100', 'light', 'zh-CN'),
    makeCell(320, '100', 'dark', 'en'),
    makeCell(1440, '100', 'light', 'zh-CN'),
    makeCell(1440, '100', 'dark', 'en'),
  ]
}

/** The two cells every pass and every forced preview runs in: 320 and 1440, light zh-CN. */
export function baseCells() {
  return [makeCell(320, '100', 'light', 'zh-CN'), makeCell(1440, '100', 'light', 'zh-CN')]
}

export function cellsFor(set) {
  if (set === 'full') return fullCells()
  if (set === 'stress') return stressCells()
  if (set === 'smoke') return smokeCells()
  throw new Error(`unknown --cells "${set}" (full, stress or smoke)`)
}

/**
 * `axe` runs in four cells per screen: 320 and 1440 at 100%, light and dark.
 * Light is taken in zh-CN and dark in en so both locales are analysed.
 */
export function isAxeCell(cell) {
  if (cell.text !== '100') return false
  if (cell.width !== 320 && cell.width !== 1440) return false
  return (
    (cell.theme === 'light' && cell.locale === 'zh-CN') ||
    (cell.theme === 'dark' && cell.locale === 'en')
  )
}

/** The optional passes, by flag name. */
export const PASSES = ['keyboard', 'reduced-motion', 'forced-colors', 'text-spacing']

/** The preview that carries long content; it runs on the stress cells, the others on the base cells. */
export const LONG_PREVIEW = 'long'

/** The route with `?scene=&preview=` added, keeping a query the route already has. */
export function routeUrl(route, scene, preview) {
  const url = new URL(route, 'http://matrix.invalid')
  if (scene) url.searchParams.set('scene', scene)
  if (preview) url.searchParams.set('preview', preview)
  return `${url.pathname}${url.search}${url.hash}`
}

/** A file-system-safe name for a route. */
export function routeSlug(route) {
  const slug = route
    .replace(/^\/+/, '')
    .replace(/[^a-zA-Z0-9._-]+/g, '_')
    .replace(/^_+|_+$/g, '')
  return slug || 'root'
}
