import { Stack } from '@/components/layout'
import { useT } from '@/i18n'
import { useTheme } from '@/theme'

import { ThemeToggle } from './ThemeToggle'

export default function ThemeToggleDemo() {
  const t = useT('navigation')
  const { resolvedTheme } = useTheme()
  return (
    <Stack gap="sm">
      <ThemeToggle />
      <p className="text-sm text-muted-foreground">{t('demo.theme.current', { mode: t(`theme.${resolvedTheme}`) })}</p>
    </Stack>
  )
}
