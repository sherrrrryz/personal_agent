import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'

import {
  formatDate,
  formatDuration,
  formatTime,
  LOCALE_STORAGE_KEY,
  LocaleProvider,
  localeNames,
  locales,
  pickLocale,
  translate,
  useFormat,
  useLocale,
  useT,
} from './index'

function browserLanguages(languages: string[]) {
  vi.spyOn(window.navigator, 'languages', 'get').mockReturnValue(languages)
  vi.spyOn(window.navigator, 'language', 'get').mockReturnValue(languages[0] ?? '')
}

function Probe() {
  const { locale, setLocale } = useLocale()
  const t = useT('common')
  const format = useFormat()
  return (
    <div>
      <output data-testid="locale">{locale}</output>
      <p data-testid="text">{t('action.retry')}</p>
      <p data-testid="duration">{format.duration(200)}</p>
      {locales.map((option) => (
        <button key={option} type="button" lang={option} onClick={() => setLocale(option)}>
          {localeNames[option]}
        </button>
      ))}
    </div>
  )
}

function mount() {
  return render(
    <LocaleProvider>
      <Probe />
    </LocaleProvider>,
  )
}

afterEach(() => {
  document.documentElement.removeAttribute('lang')
})

describe('pickLocale (A-09)', () => {
  it.each([
    [['zh-TW'], 'zh-CN'],
    [['zh'], 'zh-CN'],
    [['zh-Hans-CN', 'en'], 'zh-CN'],
    [['ZH-hk'], 'zh-CN'],
    [['fr'], 'en'],
    [['en-GB'], 'en'],
    [['fr', 'zh-CN'], 'zh-CN'],
    [['en-US', 'zh-CN'], 'en'],
    [[], 'en'],
  ] as const)('%j → %s', (languages, expected) => {
    expect(pickLocale(languages)).toBe(expected)
  })
})

describe('LocaleProvider (A-09)', () => {
  it("['zh-TW'] starts in zh-CN and sets <html lang>", () => {
    browserLanguages(['zh-TW'])
    mount()
    expect(screen.getByTestId('locale')).toHaveTextContent('zh-CN')
    expect(screen.getByTestId('text')).toHaveTextContent('重试')
    expect(document.documentElement.lang).toBe('zh-CN')
  })

  it("['fr'] starts in en", () => {
    browserLanguages(['fr'])
    mount()
    expect(screen.getByTestId('locale')).toHaveTextContent('en')
    expect(screen.getByTestId('text')).toHaveTextContent('Try again')
    expect(document.documentElement.lang).toBe('en')
  })

  it('setLocale switches in place, sets <html lang> and stores pa.locale', async () => {
    const user = userEvent.setup()
    browserLanguages(['fr'])
    mount()
    const probe = screen.getByTestId('text')

    await user.click(screen.getByRole('button', { name: '简体中文' }))
    // The same element, re-rendered: no reload, no remount.
    expect(screen.getByTestId('text')).toBe(probe)
    expect(probe).toHaveTextContent('重试')
    expect(screen.getByTestId('duration')).toHaveTextContent(formatDuration('zh-CN', 200))
    expect(document.documentElement.lang).toBe('zh-CN')
    expect(window.localStorage.getItem(LOCALE_STORAGE_KEY)).toBe('zh-CN')

    await user.click(screen.getByRole('button', { name: 'English' }))
    expect(probe).toHaveTextContent('Try again')
    expect(document.documentElement.lang).toBe('en')
    expect(window.localStorage.getItem(LOCALE_STORAGE_KEY)).toBe('en')
  })

  it('the stored choice overrides the browser language and survives a reload', () => {
    browserLanguages(['zh-CN'])
    window.localStorage.setItem(LOCALE_STORAGE_KEY, 'en')
    mount()
    expect(screen.getByTestId('locale')).toHaveTextContent('en')
    expect(document.documentElement.lang).toBe('en')
  })

  it('ignores a stored value it does not know', () => {
    browserLanguages(['zh-CN'])
    window.localStorage.setItem(LOCALE_STORAGE_KEY, 'fr')
    mount()
    expect(screen.getByTestId('locale')).toHaveTextContent('zh-CN')
  })

  it('applies a choice made in another tab', () => {
    browserLanguages(['en'])
    mount()
    window.localStorage.setItem(LOCALE_STORAGE_KEY, 'zh-CN')
    act(() => {
      window.dispatchEvent(new StorageEvent('storage', { key: LOCALE_STORAGE_KEY, newValue: 'zh-CN' }))
    })
    expect(screen.getByTestId('text')).toHaveTextContent('重试')
  })

  it('useLocale outside a provider says what is missing', () => {
    expect(() => render(<Probe />)).toThrow(/LocaleProvider/)
  })
})

describe('translate', () => {
  it('fills placeholders and leaves an unknown one visible', () => {
    expect(translate('en', 'dev', 'sample.item', { n: 3 })).toBe('Item 3')
    expect(translate('zh-CN', 'dev', 'sample.item', { n: 3 })).toBe('条目 3')
    expect(translate('en', 'dev', 'sample.item')).toBe('Item {n}')
  })

  it('picks the plural form of the locale', () => {
    expect(translate('en', 'dev', 'gallery.count', { count: 1 })).toBe('1 demo')
    expect(translate('en', 'dev', 'gallery.count', { count: 4 })).toBe('4 demos')
    expect(translate('zh-CN', 'dev', 'gallery.count', { count: 1 })).toBe('1 个演示')
  })

  it('shows namespace:key for a key nobody has', () => {
    expect(translate('en', 'common', 'no.such.key' as never)).toBe('common:no.such.key')
  })

  it('names each locale in its own language', () => {
    expect(localeNames).toEqual({ 'zh-CN': '简体中文', en: 'English' })
  })
})

describe('formatting goes through Intl', () => {
  const evening = new Date(2026, 10, 26, 19, 0)

  it('durations', () => {
    expect(formatDuration('en', 200)).toBe('3 hr 20 min')
    expect(formatDuration('en', 120)).toBe('2 hr')
    expect(formatDuration('en', 45)).toBe('45 min')
    expect(formatDuration('en', 0)).toBe('0 min')
    expect(formatDuration('zh-CN', 200).replace(/\s/g, '')).toBe('3小时20分钟')
  })

  it('dates and times', () => {
    expect(formatDate('en', evening)).toBe('Nov 26, 2026')
    expect(formatDate('zh-CN', evening)).toBe('2026年11月26日')
    expect(formatTime('en', evening).replace(/\s/g, ' ')).toBe('7:00 PM')
    expect(formatTime('zh-CN', evening)).toBe('19:00')
  })
})
