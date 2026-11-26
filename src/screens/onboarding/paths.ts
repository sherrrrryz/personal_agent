import { createContext, useContext } from 'react'
import { useSearchParams } from 'react-router'

/** The three steps, in order (D-30). */
export const onboardingPaths = {
  profession: '/onboarding/profession',
  modules: '/onboarding/modules',
  accounts: '/onboarding/accounts',
} as const

export const onboardingSteps = [onboardingPaths.profession, onboardingPaths.modules, onboardingPaths.accounts] as const

export const settingsPaths = {
  home: '/settings',
  accounts: '/settings/accounts',
  aiModes: '/settings/ai-modes',
  profession: '/settings/profession',
} as const

/** Where the first run ends: 通知. */
export const afterOnboarding = '/m/notifications'

// Re-entry (D-36): `settings.profession` opens step 1 again with `?from=settings`.
// The mark travels in the address from step to step, so a reload keeps the mode.
const reentryParam = 'from'
const reentryValue = 'settings'

/** The address of step 1 in re-entry mode. */
export const reentryPath = `${onboardingPaths.profession}?${reentryParam}=${reentryValue}`

/** Whether the steps were opened from settings, and a step's address in the same mode. */
export function useReentry(): { reentry: boolean; to: (path: string) => string } {
  const [search] = useSearchParams()
  const reentry = search.get(reentryParam) === reentryValue
  return { reentry, to: (path) => (reentry ? `${path}?${reentryParam}=${reentryValue}` : path) }
}

/** What the steps share while she moves between them: how far the interview has come. */
export type OnboardingProgress = {
  /** How many of the interview's questions she has answered. */
  answered: number
  setAnswered: (answered: number) => void
  /** Her own words where she typed instead of using the suggestion, by question. */
  said: Record<number, string>
  setSaid: (said: Record<number, string>) => void
}

export const OnboardingContext = createContext<OnboardingProgress | null>(null)

export function useOnboarding(): OnboardingProgress {
  const progress = useContext(OnboardingContext)
  if (!progress) throw new Error('useOnboarding: a step is rendered outside OnboardingLayout')
  return progress
}
