import { EllipsisIcon } from 'lucide-react'

import { Button } from '@/components/actions'
import { DropdownMenu, DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuSeparator } from '@/components/navigation'
import { localeNames, locales, useLocale, useT, type Locale } from '@/i18n'
import { themeChoices, useTheme, type ThemeChoice } from '@/theme'

/**
 * Language and appearance during onboarding (D-54): a floating round button
 * (⋯) at the bottom end corner of the page, frosted like the bars (D-47),
 * that opens a menu of two choices — the language, each in its own words and
 * marked with its own `lang`, and the appearance. The same choices as
 * `LocaleSelect` and `ThemeToggle` in settings, bound to the same providers.
 */
export function AppearanceMenu() {
  const t = useT('onboarding')
  const nav = useT('navigation')
  const { locale, setLocale } = useLocale()
  const { theme, setTheme } = useTheme()

  return (
    // A transparent corner with room around the button; the room lets clicks through to the page.
    <div className="pointer-events-none fixed end-0 bottom-0 z-20 p-4" data-onboarding-fab="">
      <div className="surface-frosted pointer-events-auto rounded-full bg-background p-1 ring-1 ring-foreground/10">
        <DropdownMenu
          align="end"
          side="top"
          trigger={
            <Button variant="ghost" size="icon" aria-label={t('menu.appearance')}>
              <EllipsisIcon aria-hidden="true" />
            </Button>
          }
        >
          <DropdownMenuRadioGroup<Locale> label={nav('locale.label')} value={locale} onValueChange={setLocale}>
            {locales.map((each) => (
              <DropdownMenuRadioItem key={each} value={each} lang={each}>
                {localeNames[each]}
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
          <DropdownMenuSeparator />
          <DropdownMenuRadioGroup<ThemeChoice> label={nav('theme.label')} value={theme} onValueChange={setTheme}>
            {themeChoices.map((choice) => (
              <DropdownMenuRadioItem key={choice} value={choice}>
                {nav(`theme.${choice}`)}
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
        </DropdownMenu>
      </div>
    </div>
  )
}
