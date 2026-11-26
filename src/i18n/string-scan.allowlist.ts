// The allowlist of the string scan (`string-scan.test.ts`, spec A-09): what
// may hold a string literal a user could see or hear although it is outside
// `src/i18n/` and `src/fixtures/`. Every entry says why. Keep it short — the
// answer to a finding is almost always "move the text into the messages".

/** Files the scan does not read. Paths are relative to the repo root. */
export const allowedFiles: ReadonlyArray<{ pattern: RegExp; why: string }> = [
  { pattern: /\.test\.tsx?$/, why: 'Tests render probe text and seeded literals that never ship' },
  { pattern: /^src\/test\//, why: 'Test helpers; nothing here is rendered in the app' },
  { pattern: /^src\/tokens\/generated\//, why: 'Generated token output; holds no markup' },
]

/** Single literals that stay where they are. `text` is matched exactly, after trimming. */
export const allowedLiterals: ReadonlyArray<{ file: string; text: string; why: string }> = []
