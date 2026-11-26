#!/usr/bin/env node
/**
 * Gate for raw visual values — wire it into the project's verify command as
 * `check:design-values`.
 *
 * It fails when UI source contains a visual value that should be a token:
 *   (a) colour literals        #rgb / #rrggbb(aa), rgb(), hsl(), oklch(), …
 *   (b) fixed lengths          12px, 0.5px …            (allowed: 0, 1px hairlines)
 *   (c) arbitrary utilities    p-[13px], text-[#fff], w-[37rem]
 *   (d) numeric style props    fontSize: 14, padding: 12, height: 48, zIndex: 10 …
 *       and JSX props padding={12}   (React Native / CSS-in-JS; 0 is allowed)
 *   (e) raw relative lengths and durations   0.8125rem, 200ms
 *
 * Files under the token source are exempt — that is where raw values live.
 * A single line can be exempted with a reason:
 *     // design-values-ignore: hairline must stay 1 device pixel
 * on the same line or the line above. Exemptions are listed in the output so
 * a reviewer can read them.
 *
 * It is a text scan, not a parser: it proves the common cases, not absence.
 * It does not see named colours, stock utility classes (p-4, text-red-500) or
 * SVG attributes. Reviewers still look for those (docs/design/REVIEW.md).
 * It fails when it finds nothing to scan. `tokenPaths` are path prefixes from
 * the repo root; list the token source AND the generated outputs there.
 *
 * Config: design-values.config.json at the repo root (all keys optional)
 *   { "include": ["src", "app", "packages"],
 *     "tokenPaths": ["tokens/", "src/theme/"],
 *     "exclude": ["src/components/ui/"],   // kit code copied in as-is: not scanned, count reported
 *     "extensions": [".ts", ".tsx", ".js", ".jsx", ".css", ".scss"],
 *     "allowPx": ["1px"] }
 *
 * Usage: node scripts/check-design-values.mjs
 *        CHECK_DESIGN_ROOT=/some/tree node scripts/check-design-values.mjs
 */
import { readdirSync, readFileSync, existsSync, statSync, realpathSync } from "node:fs";
import { dirname, join, posix } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT =
  process.env.CHECK_DESIGN_ROOT ??
  join(dirname(fileURLToPath(import.meta.url)), "..");

const DEFAULTS = {
  include: ["src", "app", "apps", "packages"],
  tokenPaths: ["tokens/", "src/tokens/", "src/theme/"],
  exclude: [],
  extensions: [".ts", ".tsx", ".js", ".jsx", ".css", ".scss"],
  allowPx: ["1px"],
};
const SKIP_DIRS = new Set(["node_modules", "dist", "build", ".next", ".expo", "coverage"]);
const SKIP_FILE = /\.(test|spec)\.[jt]sx?$|\.d\.ts$/;
const IGNORE_MARK = /design-values-ignore:\s*\S/;

const NUMERIC_PROPS =
  "fontSize|lineHeight|letterSpacing|fontWeight|padding\\w*|margin\\w*|gap|rowGap|columnGap|" +
  "width|height|minWidth|minHeight|maxWidth|maxHeight|top|left|right|bottom|start|end|inset\\w*|" +
  "borderRadius|border\\w+Radius|borderWidth|border\\w+Width|shadowRadius|shadowOpacity|elevation|opacity|zIndex";
const JSX_PROPS = "padding\\w*|margin\\w*|gap|size|width|height|radius|p|px|py|m|mx|my";

// Rules run in order; each match is blanked out so later rules do not count it again.
export const RULES = [
  { id: "arbitrary-utility", re: /(?<![\w-])(?!aria-|data-)[\w:-]+-\[(?!var\()[^\]\s]*(?:\d|#)[^\]\s]*\]/g },
  { id: "colour", re: /(?<![\w&])#(?:[0-9a-fA-F]{8}|[0-9a-fA-F]{6}|[0-9a-fA-F]{3,4})\b/g },
  { id: "colour", re: /\b(?:rgba?|hsla?|hwb|lab|lch|oklab|oklch|color)\(\s*(?:[\d.]|display-p3|srgb)/g },
  { id: "fixed-length", re: /(?<![\w.#-])\d*\.?\d+px\b/g },
  { id: "raw-length", re: /(?<![\w.#-])\d*\.?\d+(?:rem|em|pt|vh|vw|dvh|svh)\b/g },
  { id: "duration", re: /(?<![\w.#-])\d*\.?\d+m?s\b(?=\s*[;,"'`)]|\s*$)/g },
  { id: "numeric-style", re: new RegExp(`\\b(?:${NUMERIC_PROPS})\\s*:\\s*-?\\d*\\.?\\d+\\b(?!\\s*[.\\w%])`, "g") },
  { id: "numeric-prop", re: new RegExp(`\\b(?:${JSX_PROPS})=\\{\\s*-?\\d*\\.?\\d+\\s*\\}`, "g") },
];
const COMMENT_ONLY = /^\s*(?:\/\/|\/\*|\*|\{\/\*|#\s)/;
const stripComments = (line) => line.replace(/\/\*.*?\*\//g, "").replace(/(?<![:"'`])\/\/.*$/, "");

function loadConfig() {
  const file = join(ROOT, "design-values.config.json");
  if (!existsSync(file)) return DEFAULTS;
  return { ...DEFAULTS, ...JSON.parse(readFileSync(file, "utf8")) };
}

function listFiles(dir, config, out = []) {
  if (!existsSync(join(ROOT, dir))) return out;
  for (const name of readdirSync(join(ROOT, dir))) {
    if (SKIP_DIRS.has(name) || name.startsWith(".")) continue;
    const rel = posix.join(dir, name);
    if (statSync(join(ROOT, rel)).isDirectory()) listFiles(rel, config, out);
    else if (
      config.extensions.some((ext) => name.endsWith(ext)) &&
      !SKIP_FILE.test(name) &&
      !config.tokenPaths.some((path) => rel.startsWith(path)) &&
      !config.exclude.some((path) => rel.startsWith(path))
    )
      out.push(rel);
  }
  return out;
}

export function scan(content, config = DEFAULTS) {
  const findings = [];
  const exemptions = [];
  const lines = content.split("\n");
  lines.forEach((raw, index) => {
    const previous = index > 0 ? lines[index - 1] : "";
    const exempt =
      IGNORE_MARK.test(raw) || (IGNORE_MARK.test(previous) && COMMENT_ONLY.test(previous));
    let line = stripComments(raw);
    for (const { id, re } of RULES) {
      line = line.replace(re, (text) => {
        const zero = /(?:^|[:{\s])-?0*\.?0+(?:px|rem|em|pt|m?s)?\s*\}?$/.test(text);
        const hairline =
          (id === "fixed-length" && config.allowPx.includes(text)) ||
          (id === "numeric-style" && /^border\w*Width\s*:\s*1$/.test(text));
        const ratio = id === "numeric-style" && /^(?:opacity|shadowOpacity)\s*:\s*1$/.test(text);
        if (!zero && !hairline && !ratio) (exempt ? exemptions : findings).push({ line: index + 1, id, text });
        return " ".repeat(text.length);
      });
    }
  });
  return { findings, exemptions };
}

function main() {
  const config = loadConfig();
  const files = config.include.flatMap((dir) => listFiles(dir, config));
  const excluded = config.include
    .flatMap((dir) => listFiles(dir, { ...config, exclude: [] }))
    .filter((file) => !files.includes(file));
  if (excluded.length > 0)
    console.log(`  not scanned: ${excluded.length} kit file(s) under ${config.exclude.join(", ")} (design-values.config.json § exclude)`);
  if (files.length === 0) {
    console.error(`check:design-values — nothing to scan. None of [${config.include.join(", ")}] holds UI source; set "include" in design-values.config.json.`);
    process.exit(1);
  }
  let total = 0;
  let exempted = 0;
  for (const file of files) {
    const { findings, exemptions } = scan(readFileSync(join(ROOT, file), "utf8"), config);
    for (const { line, id, text } of findings) console.error(`  ${file}:${line}  ${id}  ${text}`);
    for (const { line, text } of exemptions) console.log(`  exempt ${file}:${line}  ${text}`);
    total += findings.length;
    exempted += exemptions.length;
  }
  if (total > 0) {
    console.error(`check:design-values — ${total} raw value(s) in ${files.length} files. Use a token, or add the value to the token source through docs/design/GOVERNANCE.md.`);
    process.exit(1);
  }
  console.log(`check:design-values — ${files.length} files OK (${exempted} exempted line(s))`);
}

// Compare real paths: through a symlink (or /tmp → /private/tmp) the plain
// strings differ and the gate would exit 0 without running.
if (process.argv[1] && realpathSync(fileURLToPath(import.meta.url)) === realpathSync(process.argv[1])) main();
