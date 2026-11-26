import { Navigate } from 'react-router'

import type { AreaRoutes } from '@/app/routes'

import { AccountsStep } from './AccountsStep'
import { ModulesStep } from './ModulesStep'
import { OnboardingLayout } from './OnboardingLayout'
import { ProfessionStep } from './ProfessionStep'

// Area `onboarding` — the three steps before the shell (D-30). `/onboarding/*`
// is bare (`src/shell/route.ts`): the layout brings the onboarding header.
// `/` leads to step 1 until onboarding is done (`src/screens/root/`).
export const routes: AreaRoutes['routes'] = [
  {
    path: '/onboarding',
    element: <OnboardingLayout />,
    children: [
      { index: true, element: <Navigate to="/onboarding/profession" replace /> },
      { path: 'profession', element: <ProfessionStep /> },
      { path: 'modules', element: <ModulesStep /> },
      { path: 'accounts', element: <AccountsStep /> },
    ],
  },
]

// No scene: onboarding happens before the story's first scene, and the
// previews are read from the address (`?preview=`) — there is no device here.
const previews = ['empty', 'loading', 'error', 'long'] as const

export const matrixRoutes: AreaRoutes['matrixRoutes'] = [
  { path: '/onboarding/profession', previews },
  { path: '/onboarding/modules', previews },
  { path: '/onboarding/accounts', previews },
]
