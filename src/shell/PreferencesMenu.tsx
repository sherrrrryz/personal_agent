import { SlidersHorizontalIcon } from 'lucide-react'

import { Button } from '@/components/actions'
import {
  DropdownMenu,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  useSidebar,
} from '@/components/navigation'
import { localeNames, locales, useLocale, useT } from '@/i18n'
import { themeChoices, useTheme } from '@/theme'

const themeKey = { system: 'theme.system', light: 'theme.light', dark: 'theme.dark' } as const

/**
 * The preferences menu of the sidebar footer: appearance and language. The
 * same two choices as `ThemeToggle` and `LocaleSelect`, bound to the same
 * providers and named by the same words — as radio items, because a toggle
 * group and a select are not menu items and the arrow keys of a menu would
 * not reach them (navigation.md).
 */
export function PreferencesMenu() {
  const t = useT('shell')
  const words = useT('navigation')
  const { mode } = useSidebar()
  const { theme, setTheme } = useTheme()
  const { locale, setLocale } = useLocale()

  const trigger =
    mode === 'rail' ? (
      <Button variant="ghost" size="icon" aria-label={t('prefs.label')}>
        <SlidersHorizontalIcon aria-hidden="true" />
      </Button>
    ) : (
      <Button variant="ghost">
        <SlidersHorizontalIcon aria-hidden="true" />
        {t('prefs.label')}
      </Button>
    )

  return (
    <div className="flex p-2">
      <DropdownMenu trigger={trigger} side="top">
        <DropdownMenuRadioGroup label={words('theme.label')} value={theme} onValueChange={setTheme}>
          {themeChoices.map((choice) => (
            <DropdownMenuRadioItem key={choice} value={choice}>
              {words(themeKey[choice])}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
        <DropdownMenuSeparator />
        <DropdownMenuRadioGroup label={words('locale.label')} value={locale} onValueChange={setLocale}>
          {locales.map((choice) => (
            <DropdownMenuRadioItem key={choice} value={choice} lang={choice}>
              {localeNames[choice]}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenu>
    </div>
  )
}
