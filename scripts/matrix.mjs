#!/usr/bin/env node
// npm run matrix — walks screens through the verification matrix and says
// what broke. Contract: docs/specs/lofi-prototype-system.md § Matrix harness;
// how to run it: docs/design/FOUNDATIONS.md § Verification matrix.
//
// Each run starts its own dev server from the working directory on a free
// port, never reuses one, and writes to <working directory>/.matrix/<run>/.
import { spawn } from 'node:child_process'
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import path from 'node:path'
import process from 'node:process'
import { stripVTControlCharacters } from 'node:util'

import {
  LONG_PREVIEW,
  PASSES,
  baseCells,
  cellsFor,
  isAxeCell,
  routeSlug,
  routeUrl,
  stressCells,
} from '../e2e/matrix/cells.mjs'
import { writeIndex } from '../e2e/matrix/report.mjs'

const USAGE = `npm run matrix -- [route…] [--all] [--scene <id>] [--preview <state>]
                  [--cells full|stress|smoke] [--flows [name]]
                  [--keyboard] [--reduced-motion] [--forced-colors] [--text-spacing]
                  [--out <dir>] [--dry-run] [--self-test]

  route…            paths to check, e.g. /dev/components?family=layout
  --all             every route a src/screens/<area>/routes.tsx lists in matrixRoutes,
                    with its scenes; with --cells full also its previews
  --scene <id>      adds ?scene=<id>
  --preview <state> adds ?preview=<state>
  --cells           full (44 cells, the default) · stress (4) · smoke (4)
  --flows [name]    runs e2e/flows/<name>.spec.ts, or every flow
  --keyboard, --reduced-motion, --forced-colors, --text-spacing
                    the optional passes, at 320 and 1440, light zh-CN
  --out <dir>       where to write, instead of .matrix/<run>/
  --dry-run         write the plan and stop
  --self-test       prove the harness on its own fixture pages`

function parseArgs(argv) {
  const options = {
    routes: [],
    all: false,
    scene: null,
    preview: null,
    cells: 'full',
    flows: null,
    passes: [],
    out: null,
    dryRun: false,
    selfTest: false,
    help: false,
  }
  const value = (index, flag) => {
    const next = argv[index + 1]
    if (next === undefined || next.startsWith('--')) throw new Error(`${flag} needs a value`)
    return next
  }
  for (let index = 0; index < argv.length; index++) {
    const arg = argv[index]
    if (arg === '--all') options.all = true
    else if (arg === '--scene') options.scene = value(index++, arg)
    else if (arg === '--preview') options.preview = value(index++, arg)
    else if (arg === '--cells') options.cells = value(index++, arg)
    else if (arg === '--out') options.out = value(index++, arg)
    else if (arg === '--flows') {
      const next = argv[index + 1]
      options.flows ??= []
      // A flow name is a bare word; a route starts with a slash.
      if (next !== undefined && !next.startsWith('--') && !next.startsWith('/')) {
        options.flows.push(next)
        index++
      }
    } else if (arg === '--dry-run') options.dryRun = true
    else if (arg === '--self-test') options.selfTest = true
    else if (arg === '--help' || arg === '-h') options.help = true
    else if (arg.startsWith('--') && PASSES.includes(arg.slice(2))) options.passes.push(arg.slice(2))
    else if (arg.startsWith('--')) throw new Error(`unknown option ${arg}`)
    else if (arg.startsWith('/')) options.routes.push(arg)
    else throw new Error(`"${arg}" is not a route (a route starts with /)`)
  }
  cellsFor(options.cells)
  return options
}

function runId() {
  const stamp = new Date().toISOString().replace(/[-:]/g, '').replace('T', '-').slice(0, 15)
  return `${stamp}-${process.pid}`
}

/** This run's own dev server: the working directory, a port the system picks, never reused. */
async function startServer(root, run) {
  const { createServer } = await import('vite')
  const identity = { run, root, pid: process.pid }
  const server = await createServer({
    root,
    clearScreen: false,
    logLevel: 'warn',
    server: {
      host: '127.0.0.1',
      port: 0,
      strictPort: true,
      open: false,
      // Writing reports and screenshots must not reload the pages under test.
      watch: { ignored: ['**/.matrix/**', '**/.orchestration/**', '**/test-results/**'] },
    },
    plugins: [
      {
        name: 'matrix-identity',
        configureServer(vite) {
          vite.middlewares.use('/__matrix/identity', (_request, response) => {
            response.setHeader('Content-Type', 'application/json')
            response.end(JSON.stringify(identity))
          })
        },
      },
    ],
  })
  await server.listen()
  const address = server.httpServer?.address()
  if (!address || typeof address === 'string') throw new Error('the dev server gave no port')
  const baseURL = `http://127.0.0.1:${address.port}`
  // The server that answers on this port must be the one this run started.
  const answer = await fetch(`${baseURL}/__matrix/identity`).then((response) => response.json())
  if (answer.run !== run || answer.pid !== process.pid || answer.root !== root) {
    await server.close()
    throw new Error(`port ${address.port} is answered by another server (${JSON.stringify(answer)})`)
  }
  return { server, baseURL, info: { root, port: address.port, pid: process.pid } }
}

/** Where `--all` looks for route registries; the self-test points it at its fixtures. */
function registryDir() {
  return process.env.MATRIX_ROUTES_DIR || 'src/screens'
}

/**
 * Reads `matrixRoutes` from every <registry>/<area>/routes.tsx by importing
 * the module in the browser through the dev server — the way the app loads it.
 */
async function discoverRoutes(root, baseURL) {
  const dir = path.resolve(root, registryDir())
  const files = existsSync(dir)
    ? readdirSync(dir, { withFileTypes: true })
        .filter((entry) => entry.isDirectory() && existsSync(path.join(dir, entry.name, 'routes.tsx')))
        .map((entry) => `/${path.relative(root, path.join(dir, entry.name, 'routes.tsx')).split(path.sep).join('/')}`)
        .sort()
    : []
  if (files.length === 0) throw new Error(`--all: no <area>/routes.tsx under ${registryDir()}/`)
  const { chromium } = await import('@playwright/test')
  const browser = await chromium.launch()
  const found = []
  try {
    const page = await browser.newPage()
    for (const file of files) {
      let exported
      // The first import of a module can make Vite optimise a dependency and reload the page: try again.
      for (let attempt = 1; ; attempt++) {
        try {
          await page.goto(`${baseURL}/e2e/matrix/fixtures/blank.html`, { waitUntil: 'load' })
          exported = await page.evaluate(async (specifier) => {
            const module = await import(/* @vite-ignore */ specifier)
            return module.matrixRoutes === undefined ? null : JSON.parse(JSON.stringify(module.matrixRoutes))
          }, file)
          break
        } catch (error) {
          if (attempt === 3) throw new Error(`--all: ${file} could not be imported — ${error.message}`)
          await page.waitForTimeout(1000)
        }
      }
      if (!Array.isArray(exported)) throw new Error(`--all: ${file} does not export a matrixRoutes array`)
      for (const entry of exported) {
        const route = typeof entry === 'string' ? { path: entry } : entry
        if (!route || typeof route.path !== 'string' || !route.path.startsWith('/')) {
          throw new Error(`--all: ${file} has a matrixRoutes entry without a path: ${JSON.stringify(entry)}`)
        }
        found.push({
          path: route.path,
          scenes: Array.isArray(route.scenes) ? route.scenes : [],
          previews: Array.isArray(route.previews) ? route.previews : [],
          from: file,
        })
      }
    }
  } finally {
    await browser.close()
  }
  return found
}

function plan(options, discovered) {
  const cells = cellsFor(options.cells)
  const tests = []
  const add = (route, scene, preview, cell, pass) => {
    const variant = [scene && `scene-${scene}`, preview && `preview-${preview}`].filter(Boolean).join('_')
    const folder = path.join('screens', routeSlug(route) + (variant ? `__${routeSlug(variant)}` : ''))
    const name = pass ? `${pass}-w${cell.width}` : cell.id
    const id = `${folder.slice('screens/'.length)}--${name}`
    if (tests.some((test) => test.id === id)) return
    tests.push({
      id,
      route,
      url: routeUrl(route, scene, preview),
      scene: scene ?? null,
      preview: preview ?? null,
      cell,
      pass: pass ?? null,
      axe: !pass && isAxeCell(cell),
      screenshot: path.join(folder, `${name}.png`),
    })
  }
  const addScreen = (route, scene, preview) => {
    for (const cell of cells) add(route, scene, preview, cell, null)
    for (const pass of options.passes) for (const cell of baseCells()) add(route, scene, preview, cell, pass)
  }
  for (const route of options.routes) addScreen(route, options.scene, options.preview)
  for (const route of discovered) {
    const scenes = options.scene ? [options.scene] : route.scenes.length > 0 ? route.scenes : [null]
    for (const scene of scenes) addScreen(route.path, scene, options.preview)
    // The route's own previews join the full matrix only: three states at
    // 320 and 1440 light zh-CN, long content on the stress cells.
    if (options.cells !== 'full' || options.preview) continue
    for (const preview of route.previews) {
      const where = preview === LONG_PREVIEW ? stressCells() : baseCells()
      for (const cell of where) add(route.path, options.scene, preview, cell, null)
    }
  }
  return tests
}

function playwright(root, planFile, projects, files) {
  const require = createRequire(import.meta.url)
  const cli = require.resolve('@playwright/test/cli')
  // File filters go first: `--project` takes every bare word that follows it.
  const args = [cli, 'test', ...files, '--config', path.join(root, 'playwright.config.ts')]
  for (const project of projects) args.push(`--project=${project}`)
  return new Promise((resolve) => {
    const child = spawn(process.execPath, args, {
      cwd: root,
      stdio: 'inherit',
      env: { ...process.env, MATRIX_PLAN: planFile },
    })
    child.on('exit', (code) => resolve(code ?? 1))
  })
}

/** Every test Playwright ran, flat: project, file, title, status and the first error. */
function playwrightTests(outDir) {
  const file = path.join(outDir, 'playwright.json')
  if (!existsSync(file)) return []
  const report = JSON.parse(readFileSync(file, 'utf8'))
  const list = []
  const visit = (suite, titles) => {
    for (const spec of suite.specs ?? []) {
      for (const test of spec.tests ?? []) {
        const last = test.results?.[test.results.length - 1]
        list.push({
          project: test.projectName,
          file: spec.file,
          title: [...titles, spec.title].join(' › '),
          ok: spec.ok,
          status: last?.status ?? 'not run',
          error: last?.error?.message ? stripVTControlCharacters(last.error.message) : null,
        })
      }
    }
    for (const child of suite.suites ?? []) visit(child, child.title && child.title !== suite.file ? [...titles, child.title] : titles)
  }
  for (const suite of report.suites ?? []) visit(suite, [])
  return list
}

function collect(outDir, thePlan) {
  const ran = playwrightTests(outDir)
  const read = (file) => (existsSync(file) ? JSON.parse(readFileSync(file, 'utf8')) : null)
  const tests = thePlan.tests.map((planned) => {
    const result = read(path.join(outDir, 'results', `${planned.id}.json`))
    const failures = result
      ? [...result.failures]
      : [{ kind: 'not-run', message: 'the cell did not run — see the Playwright output' }]
    if (result?.error) failures.push({ kind: 'error', message: result.error })
    return {
      ...planned,
      cell: planned.cell.id,
      ok: failures.length === 0,
      failures,
      waived: result?.waived ?? [],
      notes: result?.notes ?? {},
      ms: result?.ms ?? null,
    }
  })
  const environmentTest = ran.find((test) => test.project === 'environment')
  const environment = {
    ok: environmentTest?.ok === true,
    error: environmentTest ? environmentTest.error : 'the environment self-test did not run',
    measured: read(path.join(outDir, 'environment.json')),
  }
  const flows = ran
    .filter((test) => test.project === 'flows')
    .map((test) => ({ file: test.file, title: test.title, ok: test.ok, status: test.status, error: test.error }))
  return { environment, tests, flows }
}

function summarise(report) {
  const failed = report.tests.filter((test) => !test.ok)
  const lines = []
  const byRoute = new Map()
  for (const test of failed) {
    for (const failure of test.failures) {
      // One line per defect: the same element failing the same way in many cells is one entry.
      const key = [test.url, failure.kind, failure.path || failure.rule || failure.message].join('\n')
      const entry = byRoute.get(key) ?? { url: test.url, failure, where: [] }
      entry.where.push(test.pass ? `${test.pass} at ${test.cell}` : test.cell)
      byRoute.set(key, entry)
    }
  }
  let url = null
  for (const entry of byRoute.values()) {
    if (entry.url !== url) {
      url = entry.url
      lines.push('', `  ${url}`)
    }
    const where = entry.where.length > 4 ? `${entry.where.slice(0, 3).join(', ')} and ${entry.where.length - 3} more` : entry.where.join(', ')
    lines.push(`    ✗ ${entry.failure.kind}: ${entry.failure.message}`, `      in ${entry.where.length} — ${where}`)
  }
  if (!report.environment.ok) lines.push('', `  ✗ environment: ${report.environment.error ?? 'failed'}`)
  for (const flow of report.flows.filter((item) => !item.ok)) {
    lines.push('', `  ✗ flow ${flow.title} (${flow.file}): ${(flow.error ?? flow.status).split('\n')[0]}`)
  }
  return lines
}

async function main() {
  const options = parseArgs(process.argv.slice(2))
  if (options.help) {
    console.log(USAGE)
    return 0
  }
  const root = process.cwd()
  if (options.selfTest) {
    const { selfTest } = await import('../e2e/matrix/self-test.mjs')
    return selfTest({ root, script: path.join(root, 'scripts', 'matrix.mjs'), out: options.out })
  }
  if (options.routes.length === 0 && !options.all && options.flows === null) {
    console.error(`matrix: nothing to check — give a route, --all or --flows.\n\n${USAGE}`)
    return 2
  }
  const run = runId()
  const outDir = path.resolve(root, options.out ?? path.join('.matrix', run))
  mkdirSync(outDir, { recursive: true })

  const flowFiles = []
  if (options.flows !== null) {
    const dir = path.join(root, 'e2e', 'flows')
    for (const name of options.flows) {
      const file = path.join(dir, `${name}.spec.ts`)
      if (!existsSync(file)) throw new Error(`--flows: there is no e2e/flows/${name}.spec.ts`)
      flowFiles.push(file)
    }
    if (options.flows.length === 0 && (!existsSync(dir) || !readdirSync(dir).some((name) => name.endsWith('.spec.ts')))) {
      throw new Error('--flows: there is no flow under e2e/flows/ yet')
    }
  }

  const started = Date.now()
  const { server, baseURL, info } = await startServer(root, run)
  let report
  let exitCode
  try {
    console.log(`matrix: run ${run} — dev server ${baseURL} (pid ${info.pid}) from ${root}`)
    const discovered = options.all ? await discoverRoutes(root, baseURL) : []
    const thePlan = {
      run,
      baseURL,
      outDir,
      server: info,
      options: { ...options, routesDir: options.all ? registryDir() : null },
      discovered,
      tests: plan(options, discovered),
      flows: options.flows,
    }
    const planFile = path.join(outDir, 'plan.json')
    writeFileSync(planFile, JSON.stringify(thePlan, null, 2))
    const screens = new Set(thePlan.tests.map((test) => test.url)).size
    console.log(
      `matrix: ${thePlan.tests.length} cell runs over ${screens} screen(s)` +
        (options.flows !== null ? `, flows: ${options.flows.join(', ') || 'all'}` : ''),
    )
    if (options.dryRun) {
      console.log(`matrix: dry run — the plan is ${path.relative(root, planFile)}`)
      return 0
    }
    const projects = ['environment']
    if (thePlan.tests.length > 0) projects.push('matrix')
    if (options.flows !== null) projects.push('flows')
    // A file filter applies to every project, so the harness's own specs are named with the flows.
    const files =
      flowFiles.length > 0
        ? [...flowFiles, ...['environment', 'matrix'].map((name) => path.join(root, 'e2e', 'matrix', `${name}.spec.ts`))]
        : []
    const playwrightExit = await playwright(root, planFile, projects, files)
    report = {
      run,
      startedAt: new Date(started).toISOString(),
      seconds: Math.round((Date.now() - started) / 1000),
      command: `npm run matrix -- ${process.argv.slice(2).join(' ')}`,
      server: info,
      baseURL,
      options: thePlan.options,
      discovered,
      ...collect(outDir, thePlan),
    }
    const failedTests = report.tests.filter((test) => !test.ok)
    const failedFlows = report.flows.filter((flow) => !flow.ok)
    report.summary = {
      screens,
      cellRuns: report.tests.length,
      failedCellRuns: failedTests.length,
      failures: failedTests.reduce((count, test) => count + test.failures.length, 0),
      failureKinds: [...new Set(failedTests.flatMap((test) => test.failures.map((failure) => failure.kind)))].sort(),
      waivers: [...new Set(report.tests.flatMap((test) => test.waived.map((waiver) => `${waiver.kind} ${waiver.path}`)))].sort(),
      flows: report.flows.length,
      failedFlows: failedFlows.length,
      environment: report.environment.ok,
      playwrightExit,
    }
    report.summary.ok =
      report.environment.ok && failedTests.length === 0 && failedFlows.length === 0 && playwrightExit === 0
    exitCode = report.summary.ok ? 0 : 1
    writeFileSync(path.join(outDir, 'report.json'), JSON.stringify(report, null, 2))
    writeIndex(outDir, report)
  } finally {
    await server.close()
  }

  const where = path.relative(root, outDir) || '.'
  console.log('')
  if (exitCode === 0) {
    console.log(`matrix: passed — ${report.summary.cellRuns} cell runs, ${report.summary.flows} flow test(s), zero failures.`)
  } else {
    console.log(`matrix: FAILED — ${report.summary.failedCellRuns} of ${report.summary.cellRuns} cell runs, ${report.summary.failedFlows} flow test(s).`)
    for (const line of summarise(report)) console.log(line)
    console.log('')
  }
  if (report.summary.waivers.length > 0) console.log(`matrix: ${report.summary.waivers.length} waiver(s) in use — listed in the report.`)
  console.log(`matrix: report ${where}/index.html · ${where}/report.json`)
  return exitCode
}

main().then(
  (code) => process.exit(code),
  (error) => {
    console.error(`matrix: ${error.message}`)
    process.exit(2)
  },
)
