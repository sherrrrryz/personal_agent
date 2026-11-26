#!/usr/bin/env node
/**
 * Gate for `docs/**` — wire it into the project's verify command.
 *
 * Four rules:
 *   (a) every `docs/**\/*.md` carries a recognized `> Status:` header within
 *       its first 10 lines
 *   (b) every such file is linked from `docs/README.md`
 *   (c) every relative `.md` link in `docs/README.md` resolves
 *   (d) every spec row's status cell in `docs/README.md` names the same status
 *       word as that spec's own header
 *
 * It checks structure only. It cannot tell whether an `evergreen` document is
 * still true — that rests on the same-PR docs rule.
 *
 * Usage: node scripts/check-docs.mjs            (repo root = parent of scripts/)
 *        CHECK_DOCS_ROOT=/some/tree node scripts/check-docs.mjs
 */
import { readdirSync, readFileSync, existsSync, statSync, realpathSync } from "node:fs";
import { dirname, join, posix, relative, sep } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT =
  process.env.CHECK_DOCS_ROOT ??
  join(dirname(fileURLToPath(import.meta.url)), "..");
const DOCS_DIR = "docs";
const INDEX_FILE = "docs/README.md";
const STATUS_WORDS = [
  "evergreen",
  "historical",
  "draft",
  "approved",
  "implemented",
  "superseded",
];
const STATUS_RE = new RegExp(
  "^> Status: `?(" + STATUS_WORDS.join("|") + ")`?(\\b|$)",
);

function listDocs(dir) {
  const out = [];
  for (const name of readdirSync(join(ROOT, dir))) {
    const rel = posix.join(dir, name);
    if (statSync(join(ROOT, rel)).isDirectory()) out.push(...listDocs(rel));
    else if (name.endsWith(".md")) out.push(rel);
  }
  return out.sort();
}

export function statusOf(content) {
  for (const line of content.split("\n").slice(0, 10)) {
    const match = STATUS_RE.exec(line);
    if (match) return match[1];
  }
  return null;
}

export function indexLinks(indexContent) {
  const links = [];
  const linkRe = /\[[^\]]*\]\(([^)#\s]+\.md)(#[^)]*)?\)/g;
  // Links inside HTML comments are examples, not index entries.
  const visible = indexContent.replace(/<!--[\s\S]*?-->/g, "");
  for (const line of visible.split("\n")) {
    for (const match of line.matchAll(linkRe)) {
      if (/^[a-z]+:\/\//.test(match[1])) continue;
      const target = posix.normalize(posix.join(DOCS_DIR, match[1]));
      const cells = line.split("|").map((cell) => cell.trim());
      const rowStatus =
        cells.length >= 4 ? (/`([a-z]+)`/.exec(cells[2])?.[1] ?? null) : null;
      links.push({ target, rowStatus });
    }
  }
  return links;
}

function main() {
  const errors = [];
  if (!existsSync(join(ROOT, INDEX_FILE))) {
    console.error(`check:docs — ${INDEX_FILE} does not exist`);
    process.exit(1);
  }
  const docs = listDocs(DOCS_DIR);
  const statuses = new Map();
  for (const doc of docs) {
    const status = statusOf(readFileSync(join(ROOT, doc), "utf8"));
    statuses.set(doc, status);
    if (!status)
      errors.push(
        `${doc}: no \`> Status: <${STATUS_WORDS.join("|")}>\` header in the first 10 lines`,
      );
  }
  const links = indexLinks(readFileSync(join(ROOT, INDEX_FILE), "utf8"));
  const linked = new Set(links.map((link) => link.target));
  for (const doc of docs) {
    if (doc !== INDEX_FILE && !linked.has(doc))
      errors.push(`${doc}: not linked from ${INDEX_FILE}`);
  }
  for (const { target, rowStatus } of links) {
    if (!existsSync(join(ROOT, target))) {
      errors.push(`${INDEX_FILE}: links to ${target}, which does not exist`);
      continue;
    }
    const own = statuses.get(target);
    const isSpec = target.startsWith("docs/specs/");
    if (isSpec && rowStatus && STATUS_WORDS.includes(rowStatus) && own && rowStatus !== own)
      errors.push(
        `${INDEX_FILE}: row says \`${rowStatus}\` but ${target} says \`${own}\``,
      );
  }
  if (errors.length > 0) {
    console.error(`check:docs — ${errors.length} problem(s):`);
    for (const error of errors) console.error(`  - ${error}`);
    process.exit(1);
  }
  const shown = relative(process.cwd(), join(ROOT, DOCS_DIR)).split(sep).join("/");
  console.log(`check:docs — ${docs.length} documents under ${shown || DOCS_DIR} OK`);
}

// Compare real paths: through a symlink (or /tmp → /private/tmp) the plain
// strings differ and the gate would exit 0 without running.
if (process.argv[1] && realpathSync(fileURLToPath(import.meta.url)) === realpathSync(process.argv[1])) main();
