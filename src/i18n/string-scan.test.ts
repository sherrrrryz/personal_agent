// @vitest-environment node
import { readdirSync, readFileSync } from 'node:fs'
import { join, relative, sep } from 'node:path'

import { parseAst } from 'vite'
import { describe, expect, it } from 'vitest'

import { allowedFiles, allowedLiterals } from './string-scan.allowlist'

// A-09: no user-visible string literal in `src/` (kit folder included)
// outside `src/i18n/` and `src/fixtures/`, bar the allowlist. "User-visible"
// is text a person reads or a screen reader says: JSX text, a string in a JSX
// child expression, and a string given to a naming attribute. The files are
// parsed (Vite's parser), not grepped, so commas, brackets and CJK text are
// found and type arguments are not mistaken for markup.

const root = process.cwd()
const outside = [/^src\/i18n\//, /^src\/fixtures\//]

/** Attributes whose value a user reads or hears. */
const namingAttributes = new Set([
  'aria-label',
  'aria-description',
  'aria-roledescription',
  'aria-valuetext',
  'aria-placeholder',
  'title',
  'alt',
  'placeholder',
  'label',
])

type Node = { type: string; [key: string]: unknown }
export type Finding = { file: string; kind: 'text' | 'attribute'; text: string }

const hasLetter = (text: string) => /\p{L}/u.test(text)
const isNode = (value: unknown): value is Node =>
  typeof value === 'object' && value !== null && typeof (value as Node).type === 'string'

/** The string literals an expression can evaluate to: through `a ? 'x' : 'y'`, `a && 'x'`, `a ?? 'x'`, templates. */
function stringsOf(expression: unknown): string[] {
  if (!isNode(expression)) return []
  switch (expression.type) {
    case 'Literal':
      return typeof expression.value === 'string' ? [expression.value] : []
    case 'TemplateLiteral':
      return (expression.quasis as Array<{ value: { cooked: string } }>).map((quasi) => quasi.value.cooked)
    case 'ConditionalExpression':
      return [...stringsOf(expression.consequent), ...stringsOf(expression.alternate)]
    case 'LogicalExpression':
      return [...stringsOf(expression.left), ...stringsOf(expression.right)]
    case 'JSXExpressionContainer':
    case 'ParenthesizedExpression':
    case 'TSAsExpression':
    case 'TSSatisfiesExpression':
    case 'TSNonNullExpression':
      return stringsOf(expression.expression)
    default:
      return []
  }
}

export function scanSource(file: string, source: string): Finding[] {
  const findings: Finding[] = []
  const add = (kind: Finding['kind'], texts: string[]) => {
    for (const text of texts) if (hasLetter(text)) findings.push({ file, kind, text: text.trim() })
  }
  const visit = (node: Node, parent: Node | null) => {
    if (node.type === 'JSXText') add('text', [node.value as string])
    if (node.type === 'JSXExpressionContainer' && (parent?.type === 'JSXElement' || parent?.type === 'JSXFragment')) {
      add('text', stringsOf(node))
    }
    if (node.type === 'JSXAttribute') {
      const name = (node.name as { name?: unknown }).name
      if (typeof name === 'string' && namingAttributes.has(name)) add('attribute', stringsOf(node.value))
    }
    // The same attributes written as an object: `{ 'aria-label': 'Close' }`.
    if (node.type === 'Property' && isNode(node.key) && node.key.type === 'Literal') {
      const name = node.key.value
      if (typeof name === 'string' && name.startsWith('aria-') && namingAttributes.has(name)) {
        add('attribute', stringsOf(node.value))
      }
    }
    for (const value of Object.values(node)) {
      if (Array.isArray(value)) {
        for (const child of value) if (isNode(child)) visit(child, node)
      } else if (isNode(value)) {
        visit(value, node)
      }
    }
  }
  visit(parseAst(source, { lang: file.endsWith('x') ? 'tsx' : 'ts' }) as unknown as Node, null)
  return findings
}

function sourceFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name)
    if (entry.isDirectory()) return sourceFiles(path)
    return /\.tsx?$/.test(entry.name) && !entry.name.endsWith('.d.ts') ? [path] : []
  })
}

const scanned = sourceFiles(join(root, 'src'))
  .map((path) => relative(root, path).split(sep).join('/'))
  .filter((file) => !outside.some((pattern) => pattern.test(file)))
  .filter((file) => !allowedFiles.some(({ pattern }) => pattern.test(file)))

const isAllowed = (finding: Finding) =>
  allowedLiterals.some((allowed) => allowed.file === finding.file && allowed.text === finding.text)

describe('no user-visible string literal outside the messages (A-09)', () => {
  it('reads the kit folder and our own code', () => {
    expect(scanned.some((file) => file.startsWith('src/components/ui/'))).toBe(true)
    expect(scanned).toContain('src/components/layout/Page.tsx')
    expect(scanned).toContain('src/screens/dev/ComponentGallery.tsx')
    expect(scanned.some((file) => file.startsWith('src/i18n/'))).toBe(false)
  })

  it('finds none', () => {
    const findings = scanned.flatMap((file) => scanSource(file, readFileSync(join(root, file), 'utf8')))
    expect(findings.filter((finding) => !isAllowed(finding))).toEqual([])
  })

  it('every allowlist entry says why, and is still needed', () => {
    for (const entry of [...allowedFiles, ...allowedLiterals]) expect(entry.why.trim()).not.toBe('')
    for (const allowed of allowedLiterals) {
      const findings = scanSource(allowed.file, readFileSync(join(root, allowed.file), 'utf8'))
      expect(findings.map((finding) => finding.text), allowed.file).toContain(allowed.text)
    }
  })
})

describe('the scan can fail', () => {
  const find = (source: string) => scanSource('seeded.tsx', source).map(({ kind, text }) => `${kind}:${text}`)

  it('JSX text, with punctuation, before a child element, and in Chinese', () => {
    expect(find('const a = <p>Hello, (world) <b>now</b></p>')).toEqual(['text:Hello, (world)', 'text:now'])
    expect(find('const a = <p>关闭</p>')).toEqual(['text:关闭'])
  })

  it('a string in a child expression, also behind a condition', () => {
    expect(find("const a = <p>{'Close'}</p>")).toEqual(['text:Close'])
    expect(find("const a = <p>{open ? 'Hide' : `Show`}</p>")).toEqual(['text:Hide', 'text:Show'])
    expect(find("const a = <p>{open && 'Open'}</p>")).toEqual(['text:Open'])
  })

  it('the naming attributes, in every way of writing a string', () => {
    expect(
      find('const a = <img aria-label="Close" title={"Title"} alt={`Alt`} placeholder={on ? "On" : "Off"} />'),
    ).toEqual(['attribute:Close', 'attribute:Title', 'attribute:Alt', 'attribute:On', 'attribute:Off'])
    expect(find("const a = { 'aria-label': 'Close' }")).toEqual(['attribute:Close'])
  })

  it('leaves alone what no user reads', () => {
    expect(find('const a = <p className="flex" data-slot="x" id="main">{t("key")}{count}</p>')).toEqual([])
    expect(find('const a = <p title={t("key")} aria-label={label}> · {" "}</p>')).toEqual([])
    expect(find('const a: Array<string> = useState<Map<string, number>>(x)')).toEqual([])
  })
})
