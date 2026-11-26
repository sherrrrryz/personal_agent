import { MonitorIcon, MoonIcon, SunIcon } from 'lucide-react'

import { ToggleGroup, ToggleGroupItem } from '@/components/actions'
import { useT } from '@/i18n'
import { themeChoices, useTheme, type ThemeChoice } from '@/theme'

const icons = { system: MonitorIcon, light: SunIcon, dark: MoonIcon } satisfies Record<ThemeChoice, unknown>

/**
 * The light / dark choice (D-19): follow the system, light, or dark. Bound to
 * the `ThemeProvider`, so every placement shows and sets the same choice.
 */
export function ThemeToggle() {
  const t = useT('navigation')
  const { theme, setTheme } = useTheme()
  return (
    <ToggleGroup<ThemeChoice>
      aria-label={t('theme.label')}
      value={theme}
      onValueChange={(choice) => {
        if (choice) setTheme(choice)
      }}
      required
    >
      {themeChoices.map((choice) => {
        const Icon = icons[choice]
        return (
          <ToggleGroupItem key={choice} value={choice}>
            <Icon aria-hidden="true" />
            {t(`theme.${choice}`)}
          </ToggleGroupItem>
        )
      })}
    </ToggleGroup>
  )
}
