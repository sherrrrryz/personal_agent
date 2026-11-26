import { useMemo, useState } from 'react'
import { Outlet, useLocation } from 'react-router'

import { Progress, ProgressLabel } from '@/components/feedback'
import { LocaleSelect, ThemeToggle } from '@/components/navigation'
import { useT } from '@/i18n'

import { OnboardingContext, onboardingSteps, type OnboardingProgress } from './paths'

/**
 * What surrounds the three steps (spec part 3 § Screens: the onboarding
 * header): the product's name, the step as text and as a `Progress`, the
 * language and the theme. Onboarding is outside the shell, so this is all the
 * chrome there is. The interview's progress is held here, so 上一步 from step
 * 2 finds the conversation as she left it.
 */
export function OnboardingLayout() {
  const t = useT('onboarding')
  const common = useT('common')
  const { pathname } = useLocation()
  const [answered, setAnswered] = useState(0)
  const [said, setSaid] = useState<Record<number, string>>({})
  const progress = useMemo<OnboardingProgress>(() => ({ answered, setAnswered, said, setSaid }), [answered, said])

  const step = Math.max(1, onboardingSteps.findIndex((path) => path === pathname) + 1)
  const total = onboardingSteps.length

  return (
    <OnboardingContext value={progress}>
      <header className="flex min-w-0 flex-wrap items-end justify-between gap-x-6 gap-y-3 border-b px-4 py-3 md:px-6 lg:px-8">
        <p className="font-semibold">{common('app.name')}</p>
        <div className="min-w-48 flex-1">
          <Progress value={step} max={total}>
            <ProgressLabel>{t('step.progress', { step, total })}</ProgressLabel>
          </Progress>
        </div>
        <div className="w-48">
          <LocaleSelect />
        </div>
        <ThemeToggle />
      </header>
      <Outlet />
    </OnboardingContext>
  )
}
