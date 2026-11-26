// @vitest-environment node
//
// Registry parity (spec A-06; `docs/design/COMPONENTS.md` § Conventions,
// "One component, one row"): every registered component in the code has a
// registry row in its family file, and every row has its code. Runs on the
// repo on every `npm test`, and on seeded trees to prove it can fail.

import { existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'

import { afterEach, describe, expect, it } from 'vitest'

import { REPO_ROOT } from './tokens'

const FAMILY_DOCS = 'docs/design/components'
const COMPONENTS = 'src/components'
const KIT = 'ui'
const BLOCKS = 'src/blocks'
const BLOCK_PREFIX = 'block.'

/** The family files, and the folders outside `src/components/<family>/` that also feed one. */
const FAMILIES = [
  'layout',
  'actions',
  'inputs',
  'navigation',
  'containers',
  'feedback',
  'data-display',
  'chat',
  'blocks',
  'data-blocks',
  'module',
  'workflow',
] as const
const EXTRA_ROOTS: Record<string, string[]> = {
  blocks: ['src/block-renderer'],
  module: ['src/module'],
}
/** A block folder may be registered in either of these. */
const BLOCK_FAMILIES = ['blocks', 'data-blocks']

const UNIT_FILE = /^([A-Z][A-Za-z0-9]*)\.tsx?$/
const UNIT_DIR = /^[A-Z][A-Za-z0-9]*$/
const ROW_NAME = /^`([A-Za-z][A-Za-z0-9.-]*)`$/

type Row = { name: string; source: string }

function isDir(path: string): boolean {
  return existsSync(path) && statSync(path).isDirectory()
}

/** A component unit: `Name.tsx` / `Name.ts` or a folder `Name/`, directly in `dir`. Tests, demos and lower-case helpers are not units. */
function unitsIn(root: string, dir: string): Map<string, string> {
  const units = new Map<string, string>()
  if (!isDir(join(root, dir))) return units
  for (const entry of readdirSync(join(root, dir))) {
    const path = `${dir}/${entry}`
    if (isDir(join(root, path))) {
      if (UNIT_DIR.test(entry)) units.set(entry, `${path}/`)
    } else {
      const match = UNIT_FILE.exec(entry)
      if (match) units.set(match[1], path)
    }
  }
  return units
}

/** The rows of the `## Registry` table of a family file. */
function rowsOf(root: string, family: string, problems: string[]): Row[] {
  const file = `${FAMILY_DOCS}/${family}.md`
  if (!existsSync(join(root, file))) {
    problems.push(`${file} does not exist — every family has a file, even with no row yet`)
    return []
  }
  const rows: Row[] = []
  let inRegistry = false
  let found = false
  let sourceColumn = -1
  for (const line of readFileSync(join(root, file), 'utf8').split('\n')) {
    if (line.startsWith('## ')) {
      inRegistry = line.trim() === '## Registry'
      sourceColumn = -1
      continue
    }
    if (!inRegistry || !line.startsWith('|')) continue
    const cells = line.split('|').slice(1, -1).map((cell) => cell.trim())
    if (sourceColumn < 0) {
      found = true
      sourceColumn = cells.indexOf('Source')
      if (cells[0] !== 'Component' || sourceColumn < 0) {
        problems.push(`${file}: the Registry table starts with a "Component" column and has a "Source" column`)
        return rows
      }
      continue
    }
    if (cells.every((cell) => /^:?-+:?$/.test(cell))) continue
    const match = ROW_NAME.exec(cells[0])
    if (!match) {
      problems.push(`${file}: row "${cells[0]}" — the Component cell is one name in backticks and nothing else`)
      continue
    }
    if (rows.some((row) => row.name === match[1])) problems.push(`${file}: \`${match[1]}\` has two rows`)
    rows.push({ name: match[1], source: cells[sourceColumn] ?? '' })
  }
  if (!found) problems.push(`${file}: no "## Registry" table`)
  return rows
}

/** Every way the code and the family files disagree. Empty when they agree. */
export function findParityProblems(root: string): string[] {
  const problems: string[] = []
  const rows = new Map<string, Row[]>()
  for (const family of FAMILIES) rows.set(family, rowsOf(root, family, problems))
  const hasRow = (family: string, name: string) => rows.get(family)!.some((row) => row.name === name)
  const rootsOf = (family: string) => [`${COMPONENTS}/${family}`, ...(EXTRA_ROOTS[family] ?? [])]

  // Family files and family folders nobody declared.
  if (isDir(join(root, FAMILY_DOCS)))
    for (const entry of readdirSync(join(root, FAMILY_DOCS))) {
      const family = entry.replace(/\.md$/, '')
      if (entry.endsWith('.md') && !(FAMILIES as readonly string[]).includes(family))
        problems.push(`${FAMILY_DOCS}/${entry}: not a family this test knows — add it to FAMILIES in src/test/registry-parity.test.ts`)
    }
  if (isDir(join(root, COMPONENTS)))
    for (const entry of readdirSync(join(root, COMPONENTS))) {
      if (entry === KIT || !isDir(join(root, COMPONENTS, entry))) continue
      if (!(FAMILIES as readonly string[]).includes(entry))
        problems.push(`${COMPONENTS}/${entry}/: no family file ${FAMILY_DOCS}/${entry}.md`)
    }

  // Code → row.
  for (const family of FAMILIES)
    for (const dir of rootsOf(family))
      for (const [name, path] of unitsIn(root, dir))
        if (!hasRow(family, name)) problems.push(`${path}: no row \`${name}\` in ${FAMILY_DOCS}/${family}.md`)
  if (isDir(join(root, BLOCKS)))
    for (const entry of readdirSync(join(root, BLOCKS))) {
      if (!isDir(join(root, BLOCKS, entry))) continue
      const name = `${BLOCK_PREFIX}${entry}`
      if (!BLOCK_FAMILIES.some((family) => hasRow(family, name)))
        problems.push(`${BLOCKS}/${entry}/: no row \`${name}\` in ${BLOCK_FAMILIES.map((family) => `${FAMILY_DOCS}/${family}.md`).join(' or ')}`)
    }

  // Row → code.
  for (const family of FAMILIES)
    for (const { name, source } of rows.get(family)!) {
      const file = `${FAMILY_DOCS}/${family}.md`
      if (name.startsWith(BLOCK_PREFIX)) {
        const dir = `${BLOCKS}/${name.slice(BLOCK_PREFIX.length)}`
        if (!BLOCK_FAMILIES.includes(family)) problems.push(`${file}: \`${name}\` — a block is registered in ${BLOCK_FAMILIES.join(' or ')}`)
        else if (!isDir(join(root, dir))) problems.push(`${file}: row \`${name}\` has no folder ${dir}/`)
        continue
      }
      if (/^`kit`$/.test(source)) {
        // A kit row has no file of ours: the family's index re-exports it by name.
        const index = `${COMPONENTS}/${family}/index.ts`
        const text = existsSync(join(root, index)) ? readFileSync(join(root, index), 'utf8') : ''
        if (!new RegExp(`\\b${name}\\b`).test(text)) problems.push(`${file}: kit row \`${name}\` is not re-exported by name from ${index}`)
        continue
      }
      if (!rootsOf(family).some((dir) => unitsIn(root, dir).has(name)))
        problems.push(`${file}: row \`${name}\` has no ${name}.tsx or ${name}/ in ${rootsOf(family).join('/ or ')}/`)
    }

  return problems
}

describe('registry parity — the repo', () => {
  it('has a row for every component and code for every row', () => {
    expect(findParityProblems(REPO_ROOT)).toEqual([])
  })
})

describe('registry parity — seeded trees', () => {
  const trees: string[] = []
  afterEach(() => {
    for (const tree of trees.splice(0)) rmSync(tree, { recursive: true, force: true })
  })

  const table = (...rows: string[]) =>
    ['> Status: evergreen', '', '## Registry', '', '| Component | Source | Variants | Status | Notes |', '| --- | --- | --- | --- | --- |', ...rows, ''].join('\n')

  /** A tree with the twelve family files, `rows` in some of them, and `files` on disk. */
  function seed(rows: Record<string, string[]>, files: Record<string, string>): string {
    const root = mkdtempSync(join(tmpdir(), 'pa-registry-parity-'))
    trees.push(root)
    const all: Record<string, string> = { ...files }
    for (const family of FAMILIES) all[`${FAMILY_DOCS}/${family}.md`] = table(...(rows[family] ?? []))
    for (const [path, content] of Object.entries(all)) {
      mkdirSync(dirname(join(root, path)), { recursive: true })
      writeFileSync(join(root, path), content)
    }
    return root
  }

  const registered = {
    rows: {
      actions: ['| `Button` | `wrapped` | `variant`, `size` | `lofi` | |'],
      feedback: ['| `Badge` | `kit` | kit’s | `lofi` | |'],
      navigation: ['| `Sidebar` | `wrapped` | kit’s | `lofi` | parts in the folder |'],
      blocks: ['| `BlockRenderer` | `new` | — | `lofi` | |', '| `block.text` | `new` | — | `lofi` | |'],
      'data-blocks': ['| `block.table` | `new` | — | `lofi` | |'],
      module: ['| `ModuleFrame` | `new` | `view` | `lofi` | |'],
    },
    files: {
      'src/components/ui/button.tsx': '',
      'src/components/actions/index.ts': "export { Button } from './Button'\n",
      'src/components/actions/Button.tsx': '',
      'src/components/actions/Button.test.tsx': '',
      'src/components/actions/Button.demo.tsx': '',
      'src/components/actions/button-variants.ts': '',
      'src/components/feedback/index.ts': "export { Badge } from '@/components/ui/badge'\n",
      'src/components/navigation/Sidebar/index.ts': '',
      'src/components/navigation/Sidebar/SidebarMenu.tsx': '',
      'src/block-renderer/BlockRenderer.tsx': '',
      'src/blocks/types.ts': '',
      'src/blocks/text/index.ts': '',
      'src/blocks/table/index.ts': '',
      'src/module/ModuleFrame.tsx': '',
      'src/module/routes.tsx': '',
    },
  }

  it('passes when every component has its row — files, folders, kit rows, blocks, the renderer, the frame', () => {
    expect(findParityProblems(seed(registered.rows, registered.files))).toEqual([])
  })

  it('passes while the folders of later packages do not exist yet', () => {
    expect(findParityProblems(seed({}, {}))).toEqual([])
  })

  it.each([
    ['src/components/actions/Unregistered.tsx', 'src/components/actions/Unregistered.tsx: no row `Unregistered` in docs/design/components/actions.md'],
    ['src/components/actions/Unregistered/index.ts', 'src/components/actions/Unregistered/: no row `Unregistered` in docs/design/components/actions.md'],
    ['src/blocks/unregistered/index.ts', 'src/blocks/unregistered/: no row `block.unregistered` in docs/design/components/blocks.md or docs/design/components/data-blocks.md'],
    ['src/block-renderer/Unregistered.tsx', 'src/block-renderer/Unregistered.tsx: no row `Unregistered` in docs/design/components/blocks.md'],
    ['src/module/Unregistered.tsx', 'src/module/Unregistered.tsx: no row `Unregistered` in docs/design/components/module.md'],
    ['src/components/unknown/Thing.tsx', 'src/components/unknown/: no family file docs/design/components/unknown.md'],
  ])('fails on a seeded unregistered component: %s', (path, problem) => {
    expect(findParityProblems(seed(registered.rows, { ...registered.files, [path]: '' }))).toEqual([problem])
  })

  it.each([
    ['actions', '| `Ghost` | `wrapped` | — | `lofi` | |', 'docs/design/components/actions.md: row `Ghost` has no Ghost.tsx or Ghost/ in src/components/actions/'],
    ['feedback', '| `Ghost` | `kit` | — | `lofi` | |', 'docs/design/components/feedback.md: kit row `Ghost` is not re-exported by name from src/components/feedback/index.ts'],
    ['data-blocks', '| `block.ghost` | `new` | — | `lofi` | |', 'docs/design/components/data-blocks.md: row `block.ghost` has no folder src/blocks/ghost/'],
    ['module', '| `Ghost` | `new` | — | `lofi` | |', 'docs/design/components/module.md: row `Ghost` has no Ghost.tsx or Ghost/ in src/components/module/ or src/module/'],
    ['actions', '| `Button` (and parts) | `wrapped` | — | `lofi` | |', 'docs/design/components/actions.md: row "`Button` (and parts)" — the Component cell is one name in backticks and nothing else'],
    ['actions', '| `Button` | `wrapped` | — | `lofi` | again |', 'docs/design/components/actions.md: `Button` has two rows'],
  ])('fails on a seeded row with no code, or a malformed row: %s %s', (family, row, problem) => {
    const rows = { ...registered.rows, [family]: [...(registered.rows[family as keyof typeof registered.rows] ?? []), row] }
    expect(findParityProblems(seed(rows, registered.files))).toEqual([problem])
  })

  it('fails when a family file is missing or has no Registry table', () => {
    const root = seed(registered.rows, registered.files)
    rmSync(join(root, FAMILY_DOCS, 'workflow.md'))
    writeFileSync(join(root, FAMILY_DOCS, 'chat.md'), '> Status: evergreen\n')
    writeFileSync(join(root, FAMILY_DOCS, 'extra.md'), table())
    expect(findParityProblems(root)).toEqual([
      'docs/design/components/chat.md: no "## Registry" table',
      'docs/design/components/workflow.md does not exist — every family has a file, even with no row yet',
      'docs/design/components/extra.md: not a family this test knows — add it to FAMILIES in src/test/registry-parity.test.ts',
    ])
  })
})
