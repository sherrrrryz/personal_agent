import { useLayoutEffect, useMemo, useState } from 'react'
import { Outlet, useLocation } from 'react-router'

import { Progress, ProgressLabel } from '@/components/feedback'
import { useT } from '@/i18n'
import { shellPanelClass } from '@/shell/panel'

import { AppearanceMenu } from './AppearanceMenu'
import { OnboardingBarContext, OnboardingContext, onboardingSteps, type OnboardingProgress } from './paths'
import { useOnboardingBars } from './use-onboarding-bars'

/**
 * What surrounds the three steps (D-54). Onboarding is outside the shell, so
 * this is all the chrome there is, laid over a page of its own that scrolls:
 *
 * - the backdrop — a light gradient (`surface-backdrop`), dark in
 *   dark mode;
 * - a small top bar floating over the page's start, frosted like the shell's
 *   bars (D-47, `shellPanelClass`): the product's name in capitals at the
 *   start, the step as a slim `Progress` with its words at the end;
 * - the AI's portrait, centred under the bar (`data-agent-avatar-slot`; it is
 *   decorative, the conversation says everything);
 * - the step itself;
 * - a bottom bar floating over the page's end, which the interview fills with
 *   its composer (`useOnboardingBar`);
 * - language and appearance in a floating ⋯ button at the bottom end corner
 *   (`AppearanceMenu`).
 *
 * The page keeps the room of both bars as padding and as `scroll-padding`
 * (`useOnboardingBars` measures them), so its first and last content and a
 * focused control are never under a bar. The interview's progress is held
 * here, so 上一步 from step 2 finds the conversation as she left it.
 */
export function OnboardingLayout() {
  const t = useT('onboarding')
  const common = useT('common')
  const { pathname } = useLocation()
  const [answered, setAnswered] = useState(0)
  const [said, setSaid] = useState<Record<number, string>>({})
  const progress = useMemo<OnboardingProgress>(() => ({ answered, setAnswered, said, setSaid }), [answered, said])
  const [bar, setBar] = useState<HTMLElement | null>(null)
  const page = useOnboardingBars()

  const step = Math.max(1, onboardingSteps.findIndex((path) => path === pathname) + 1)
  const total = onboardingSteps.length

  // A new step starts at its top: this page, not `main`, is what scrolls here (jsdom has no `scrollTo`).
  useLayoutEffect(() => {
    if (typeof page.current?.scrollTo === 'function') page.current.scrollTo(0, 0)
  }, [pathname, page])

  return (
    <OnboardingContext value={progress}>
      <OnboardingBarContext value={bar}>
        <div
          ref={page}
          className="surface-backdrop h-svh overflow-x-clip overflow-y-auto bg-background scroll-pt-(--onboarding-header-size) scroll-pb-(--onboarding-bar-size)"
          data-onboarding=""
        >
          {/* A transparent row with room around a floating panel, as the shell's bars are (D-50); the room lets clicks through. */}
          <header className="pointer-events-none fixed inset-x-0 top-0 z-10 p-2" data-onboarding-header="">
            <div className={`${shellPanelClass} flex flex-wrap items-center justify-between gap-x-4 gap-y-1 px-3 py-1.5`}>
              <p className="text-sm font-semibold tracking-wider uppercase">{common('app.name')}</p>
              <Progress value={step} max={total} className="w-44 flex-nowrap items-center gap-2">
                <ProgressLabel className="shrink-0 text-xs font-normal text-muted-foreground">
                  {t('step.progress', { step, total })}
                </ProgressLabel>
              </Progress>
            </div>
          </header>
          <div className="flex flex-col pt-(--onboarding-header-size) pb-(--onboarding-bar-size)">
            {/*
              The AI's portrait (D-54): a square of the spacing scale, centred, empty until the
              avatar (`src/components/agent-avatar/`) is set into it. Decorative.
            */}
            <div aria-hidden="true" className="mx-auto mt-6 size-44 shrink-0" data-agent-avatar-slot="" />
            <Outlet />
          </div>
          {/* The bottom bar: a step's composer comes in through a portal; empty, it takes no room. */}
          <div ref={setBar} className="pointer-events-none fixed inset-x-0 bottom-0 z-10 p-2 empty:hidden" data-onboarding-bar="" />
          <AppearanceMenu />
        </div>
      </OnboardingBarContext>
    </OnboardingContext>
  )
}
