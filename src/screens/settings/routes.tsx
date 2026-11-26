import type { AreaRoutes } from '@/app/routes'

import { AccountsPage } from './AccountsPage'
import { AiModesPage } from './AiModesPage'
import { ProfessionPage } from './ProfessionPage'
import { SettingsHome } from './SettingsHome'

// Area `settings` — the home and its three pages, inside the shell
// (`src/shell/route.ts`: `/settings/*`). The module frame's failure fixes
// link to `/settings/accounts` (`accountsPath` of `@/module`).
export const routes: AreaRoutes['routes'] = [
  { path: '/settings', element: <SettingsHome /> },
  { path: '/settings/accounts', element: <AccountsPage /> },
  { path: '/settings/ai-modes', element: <AiModesPage /> },
  { path: '/settings/profession', element: <ProfessionPage /> },
]

const previews = ['empty', 'loading', 'error', 'long'] as const

// `s2` first: the scene with the usual sidebar and workflows whose actions the
// ceilings cap. `settings.profession` in `s4`: the scene with the promotion.
export const matrixRoutes: AreaRoutes['matrixRoutes'] = [
  { path: '/settings', scenes: ['s2'], previews },
  { path: '/settings/accounts', scenes: ['s2'], previews },
  { path: '/settings/ai-modes', scenes: ['s2'], previews },
  { path: '/settings/profession', scenes: ['s4', 's4-resolved'], previews },
]
