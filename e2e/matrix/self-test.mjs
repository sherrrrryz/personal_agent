// npm run matrix -- --self-test — proves the harness on its own fixture
// pages (docs/specs/lofi-prototype-system.md § Matrix harness, A-11):
//   1. the passing page: 44 cells and every pass, zero failures, exit 0
//   2. the failing page: non-zero exit, the three defects named in every cell
//   3. the page with defects only the passes see: each pass finds its own
//   4. --all reads matrixRoutes from a route registry and plans from it
//   5. two runs started together from two directories do not share a server
// The environment proof (root 24 px) is part of every run and is checked in 1.
import { spawn } from 'node:child_process'
import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import process from 'node:process'

const FIXTURES = '/e2e/matrix/fixtures'

function run(script, cwd, args, env = {}) {
  return new Promise((resolve) => {
    const child = spawn(process.execPath, [script, ...args], { cwd, env: { ...process.env, ...env } })
    let output = ''
    child.stdout.on('data', (chunk) => (output += chunk))
    child.stderr.on('data', (chunk) => (output += chunk))
    child.on('exit', (code) => resolve({ code, output }))
  })
}

const readJson = (file) => (existsSync(file) ? JSON.parse(readFileSync(file, 'utf8')) : null)
const sameSet = (left, right) => left.length === right.length && [...left].sort().join() === [...right].sort().join()

export async function selfTest({ root, script, out }) {
  const stamp = new Date().toISOString().replace(/[-:]/g, '').replace('T', '-').slice(0, 15)
  const base = path.resolve(root, out ?? path.join('.matrix', `self-test-${stamp}-${process.pid}`))
  mkdirSync(base, { recursive: true })
  const checks = []
  const check = (name, ok, detail) => {
    checks.push({ name, ok, detail })
    console.log(`${ok ? '  ✓' : '  ✗'} ${name}${ok ? '' : ` — ${detail}`}`)
  }
  const step = async (title, dir, args, env, cwd = root, runScript = script) => {
    console.log(`\nself-test: ${title}`)
    const outDir = path.join(base, dir)
    const result = await run(runScript, cwd, [...args, '--out', outDir], env)
    writeFileSync(path.join(base, `${dir}.log`), result.output)
    return { ...result, report: readJson(path.join(outDir, 'report.json')), plan: readJson(path.join(outDir, 'plan.json')), outDir }
  }

  // 1 — the passing page
  const pass = await step('the passing page, 44 cells and every pass', 'pass', [
    `${FIXTURES}/pass.html`,
    '--keyboard',
    '--reduced-motion',
    '--forced-colors',
    '--text-spacing',
  ])
  const passTests = pass.report?.tests ?? []
  const cells = passTests.filter((test) => !test.pass)
  check('exit 0', pass.code === 0, `exit ${pass.code}`)
  check('44 cells', cells.length === 44 && new Set(cells.map((test) => test.cell)).size === 44, `${cells.length} cells`)
  check('axe ran in four cells', cells.filter((test) => test.axe).length === 4, `${cells.filter((test) => test.axe).length}`)
  check(
    'four passes at 320 and 1440',
    sameSet(
      passTests.filter((test) => test.pass).map((test) => `${test.pass}@${test.cell}`),
      ['keyboard', 'reduced-motion', 'forced-colors', 'text-spacing'].flatMap((name) => [
        `${name}@w320-100-light-zh-CN`,
        `${name}@w1440-100-light-zh-CN`,
      ]),
    ),
    'the passes planned are not the eight expected',
  )
  check('zero failures', passTests.length > 0 && passTests.every((test) => test.ok), `${passTests.filter((test) => !test.ok).length} failed`)
  check(
    'a screenshot for every cell run, report.json and index.html',
    passTests.length > 0 &&
      passTests.every((test) => existsSync(path.join(pass.outDir, test.screenshot))) &&
      existsSync(path.join(pass.outDir, 'index.html')),
    'a file is missing',
  )
  const measured = pass.report?.environment?.measured
  check(
    'root 24 px proved: computed root size 24px, no style on html, (min-width: 48rem) flips at 1152 px',
    pass.report?.environment?.ok === true &&
      measured?.root24?.rootFontSize === '24px' &&
      measured.root24.styleOnHtml === null &&
      measured.root24.mdAt1151 === false &&
      measured.root24.mdAt1152 === true,
    JSON.stringify(measured?.root24),
  )
  check(
    'the overlay was opened and the waiver is listed',
    passTests.filter((test) => test.pass === 'reduced-motion').every((test) => test.notes.overlaysOpened >= 2) &&
      (pass.report?.summary?.waivers ?? []).some((waiver) => waiver.startsWith('clip ')),
    'the reduced-motion pass opened no overlay, or the clip waiver is not reported',
  )

  // 2 — the failing page
  const fail = await step('the failing page, three defects', 'fail', [`${FIXTURES}/fail.html`])
  const failTests = fail.report?.tests ?? []
  const three = ['clipped-text', 'sideways-scroll', 'small-target']
  check('non-zero exit', fail.code === 1, `exit ${fail.code}`)
  check(
    'every one of the 44 cells names exactly the three defects',
    failTests.length === 44 && failTests.every((test) => sameSet(test.failures.map((failure) => failure.kind), three)),
    `kinds found: ${JSON.stringify(fail.report?.summary?.failureKinds)}`,
  )
  check(
    'the output names them',
    three.every((kind) => fail.output.includes(`✗ ${kind}:`)) &&
      fail.output.includes('widest: div "This block is wider') &&
      fail.output.includes('label "Full name of the account holder"') &&
      fail.output.includes('button "Close" answers a click over 24 × 24 px'),
    'the summary does not name the three defects',
  )

  // 3 — defects only the passes see
  const passes = await step('defects only the passes see', 'passes-fail', [
    `${FIXTURES}/passes-fail.html`,
    '--cells',
    'smoke',
    '--keyboard',
    '--reduced-motion',
    '--forced-colors',
    '--text-spacing',
  ])
  const kindsOf = (name) => [
    ...new Set((passes.report?.tests ?? []).filter((test) => test.pass === name).flatMap((test) => test.failures.map((failure) => failure.kind))),
  ]
  check('non-zero exit', passes.code === 1, `exit ${passes.code}`)
  check(
    'the plain cells are clean',
    (passes.report?.tests ?? []).filter((test) => !test.pass).length === 4 &&
      (passes.report?.tests ?? []).filter((test) => !test.pass).every((test) => test.ok),
    'a plain cell failed',
  )
  check('--keyboard finds the missing indicator and the trap', sameSet(kindsOf('keyboard'), ['focus-not-visible', 'keyboard-trap']), JSON.stringify(kindsOf('keyboard')))
  check('--forced-colors finds the missing indicator', sameSet(kindsOf('forced-colors'), ['focus-not-visible']), JSON.stringify(kindsOf('forced-colors')))
  check('--reduced-motion finds the animation', sameSet(kindsOf('reduced-motion'), ['motion-under-reduced-motion']), JSON.stringify(kindsOf('reduced-motion')))
  check('--text-spacing finds the clipped line', sameSet(kindsOf('text-spacing'), ['clipped-text']), JSON.stringify(kindsOf('text-spacing')))

  // 4 — --all
  const registry = { MATRIX_ROUTES_DIR: 'e2e/matrix/fixtures/screens' }
  const all = await step('--all, planned from a route registry', 'all-plan', ['--all', '--dry-run'], registry)
  const planned = all.plan?.tests ?? []
  const count = (filter) => planned.filter(filter).length
  check('exit 0', all.code === 0, `exit ${all.code}`)
  check(
    'two scenes × 44 cells, one preview at 320 and 1440, long content on the stress cells, a route without scenes once',
    planned.length === 138 &&
      count((test) => test.scene === 'e1' && !test.preview) === 44 &&
      count((test) => test.scene === 's3' && !test.preview) === 44 &&
      count((test) => test.preview === 'empty') === 2 &&
      count((test) => test.preview === 'long') === 4 &&
      count((test) => test.route.endsWith('blank.html')) === 44 &&
      planned.some((test) => test.url === `${FIXTURES}/pass.html?scene=s3`) &&
      planned.some((test) => test.url === `${FIXTURES}/pass.html?preview=long`),
    `${planned.length} cell runs planned`,
  )
  const allRun = await step('--all --cells smoke, run', 'all-smoke', ['--all', '--cells', 'smoke'], registry)
  check(
    'exit 0 over the registry routes',
    allRun.code === 0 && allRun.report?.tests?.length === 12 && allRun.report.summary.screens === 3,
    `exit ${allRun.code}, ${allRun.report?.tests?.length} cell runs`,
  )

  // 5 — two directories, two servers
  console.log('\nself-test: two runs started together from two directories')
  const twin = path.join(base, 'twin')
  // A copy of this checkout without its dependencies: Node resolves them from the directory above.
  mkdirSync(twin, { recursive: true })
  for (const entry of readdirSync(root)) {
    if (['node_modules', '.git', '.matrix', '.orchestration', 'dist'].includes(entry)) continue
    cpSync(path.join(root, entry), path.join(twin, entry), { recursive: true })
  }
  const args = [`${FIXTURES}/pass.html`, '--cells', 'smoke']
  const [here, there] = await Promise.all([
    step('… here', 'parallel-here', args),
    step('… and in a copy of this directory', 'parallel-there', args, {}, twin, path.join(twin, 'scripts', 'matrix.mjs')),
  ])
  const a = here.report?.server
  const b = there.report?.server
  check('both exit 0', here.code === 0 && there.code === 0, `exit ${here.code} and ${there.code}`)
  check(
    'each served its own directory from its own server',
    Boolean(a && b) && a.root === root && b.root === twin && a.port !== b.port && a.pid !== b.pid,
    JSON.stringify({ here: a, there: b }),
  )

  const failed = checks.filter((item) => !item.ok)
  writeFileSync(path.join(base, 'self-test.json'), JSON.stringify({ ok: failed.length === 0, checks }, null, 2))
  console.log(
    `\nself-test: ${failed.length === 0 ? `passed — ${checks.length} checks` : `FAILED — ${failed.length} of ${checks.length} checks`}. Output: ${path.relative(root, base)}/`,
  )
  return failed.length === 0 ? 0 : 1
}
