import { fileURLToPath } from 'node:url'

import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// Folders of this checkout the dev server must not watch: other sessions'
// worktrees (`.claude/worktrees/`), matrix output and orchestration notes.
// A write there reloaded the open page (docs/design/UI-PITFALLS.md § 8).
// Anchored at this directory, so a worktree — itself under `.claude/` — still
// watches its own files.
const here = fileURLToPath(new URL('.', import.meta.url)).replace(/\/$/, '')
const unwatched = ['.claude', '.matrix', '.orchestration'].map(
  (folder) => `${here.replace(/[$^*+?()[\]{}|!]/g, '\\$&')}/${folder}/**`,
)

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: { watch: { ignored: unwatched } },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
})
