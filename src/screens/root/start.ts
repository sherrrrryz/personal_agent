import { modulePath } from '@/shell'

/** Where `/` leads before onboarding is done, and after (spec part 2 § Shell, "Routes"). */
export const startPaths = { onboarding: '/onboarding/profession', home: modulePath('notifications') } as const

/** Where `/` leads while the screen it should open is not built yet: the component gallery. */
export const startFallback = '/dev/components'
