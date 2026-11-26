import { Field, Select } from '@/components/inputs'
import { localeNames, locales, useLocale, useT, type Locale } from '@/i18n'

// Each language in its own words, marked with its own `lang` so it is read aloud correctly.
const options = locales.map((locale) => ({ value: locale, label: localeNames[locale], lang: locale }))

/**
 * The language switch (D-24): a labelled select bound to the
 * `LocaleProvider`. Choosing re-renders the app in place.
 */
export function LocaleSelect() {
  const t = useT('navigation')
  const { locale, setLocale } = useLocale()
  return (
    <Field label={t('locale.label')}>
      <Select<Locale> options={options} value={locale} onValueChange={setLocale} />
    </Field>
  )
}
