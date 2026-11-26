// Writes index.html for a matrix run: the summary, the environment proof and,
// per screen, every cell run with its screenshot and what it found. A static
// page with system colours only, so it follows the reader's light or dark
// setting; it is a tool's output, not UI source.
import { writeFileSync } from 'node:fs'
import path from 'node:path'

const escape = (value) =>
  String(value).replace(/[&<>"']/g, (char) => `&#${char.charCodeAt(0)};`)

const STYLE = `
  :root { color-scheme: light dark; font-family: system-ui, sans-serif; line-height: 1.5; }
  body { margin: 0 auto; max-width: 80rem; padding: 1rem; overflow-wrap: anywhere; }
  h1 { font-size: 1.5rem; } h2 { font-size: 1.25rem; margin-top: 2rem; } h3 { font-size: 1rem; }
  code, pre { font-family: ui-monospace, monospace; font-size: 0.875rem; }
  pre { white-space: pre-wrap; }
  .verdict { font-weight: 700; }
  table { border-collapse: collapse; width: 100%; }
  th, td { border: 1px solid GrayText; padding: 0.25rem 0.5rem; text-align: start; vertical-align: top; }
  .scroller { overflow-x: auto; }
  ul { margin: 0; padding-inline-start: 1.25rem; }
  a { display: inline-block; min-height: 1.5rem; }
`

function failureItem(failure) {
  const extra = failure.path ? ` <code>${escape(failure.path)}</code>` : ''
  const text = failure.text ? ` — “${escape(failure.text)}”` : ''
  return `<li><strong>${escape(failure.kind)}</strong>: ${escape(failure.message)}${text}${extra}</li>`
}

function screenSection(url, tests) {
  const failed = tests.filter((test) => !test.ok).length
  const rows = tests
    .map((test) => {
      const what = test.pass ? `${escape(test.pass)} · ${escape(test.cell)}` : escape(test.cell)
      const found = test.ok
        ? ''
        : `<ul>${test.failures.map(failureItem).join('')}</ul>`
      const waived = test.waived.length
        ? `<p>Waived: ${test.waived.map((waiver) => `${escape(waiver.kind)} on <code>${escape(waiver.path)}</code>`).join('; ')}</p>`
        : ''
      const axe = test.axe ? ' · axe' : ''
      return `<tr>
        <td>${test.ok ? '✓ pass' : '✗ fail'}</td>
        <td>${what}${axe}</td>
        <td><a href="${escape(test.screenshot.split(path.sep).join('/'))}">screenshot</a></td>
        <td>${found}${waived}</td>
      </tr>`
    })
    .join('\n')
  return `<section>
    <h2><code>${escape(url)}</code> — ${failed === 0 ? `✓ ${tests.length} cell runs pass` : `✗ ${failed} of ${tests.length} cell runs fail`}</h2>
    <div class="scroller" role="region" tabindex="0" aria-label="Cell runs of ${escape(url)}">
      <table>
        <thead><tr><th scope="col">Result</th><th scope="col">Cell</th><th scope="col">Picture</th><th scope="col">Found</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
  </section>`
}

export function writeIndex(outDir, report) {
  const byUrl = new Map()
  for (const test of report.tests) {
    const list = byUrl.get(test.url) ?? []
    list.push(test)
    byUrl.set(test.url, list)
  }
  const summary = report.summary
  const flows = report.flows.length
    ? `<section><h2>Flows</h2><ul>${report.flows
        .map(
          (flow) =>
            `<li>${flow.ok ? '✓' : '✗'} ${escape(flow.title)} <code>${escape(flow.file)}</code>${flow.ok || !flow.error ? '' : `<pre>${escape(flow.error)}</pre>`}</li>`,
        )
        .join('')}</ul></section>`
    : ''
  const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>Matrix run ${escape(report.run)}</title>
<style>${STYLE}</style>
</head>
<body>
<main>
<h1>Matrix run ${escape(report.run)}</h1>
<p class="verdict">${summary.ok ? '✓ Passed' : '✗ Failed'} — ${summary.cellRuns} cell runs over ${summary.screens} screen(s), ${summary.failedCellRuns} failed; ${summary.flows} flow test(s), ${summary.failedFlows} failed.</p>
<p><code>${escape(report.command)}</code><br />Started ${escape(report.startedAt)}, ${report.seconds} s. Dev server <code>${escape(report.baseURL)}</code> (pid ${report.server.pid}) from <code>${escape(report.server.root)}</code>.</p>
${summary.failureKinds.length ? `<p>Kinds of failure: ${summary.failureKinds.map((kind) => `<code>${escape(kind)}</code>`).join(', ')}</p>` : ''}
${summary.waivers.length ? `<p>Waivers in use (<code>data-matrix-allow</code>): ${summary.waivers.map((waiver) => `<code>${escape(waiver)}</code>`).join(', ')}</p>` : ''}
<section>
<h2>Environment — ${report.environment.ok ? '✓ proved' : '✗ not proved'}</h2>
<p>Root 24 px is the browser's default font size, not a style on <code>html</code>; <code>(min-width: 48rem)</code> must flip at 1152 px there and at 768 px at the default 16 px; 200% zoom at 768 is a 384 px viewport at a device pixel ratio of 2.</p>
<pre>${escape(JSON.stringify(report.environment.measured, null, 2))}</pre>
${report.environment.ok || !report.environment.error ? '' : `<pre>${escape(report.environment.error)}</pre>`}
</section>
${[...byUrl].map(([url, tests]) => screenSection(url, tests)).join('\n')}
${flows}
</main>
</body>
</html>
`
  writeFileSync(path.join(outDir, 'index.html'), html)
}
