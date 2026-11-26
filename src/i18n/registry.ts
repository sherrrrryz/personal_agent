import {
  fallbackLocale,
  isLocale,
  type Locale,
  type Message,
  type MessageKey,
  type MessageParams,
  type Messages,
  type Namespace,
} from './types'

// The glob registry: every `messages/<namespace>.<locale>.ts` is a namespace
// in one locale. A package adds its two files; nobody edits a central index.
const files = import.meta.glob<Messages>('./messages/*.ts', { eager: true, import: 'default' })

const fileName = /\/([a-z][a-z0-9-]*)\.([A-Za-z-]+)\.ts$/

function buildCatalog(): Record<Locale, Record<string, Messages>> {
  const catalog: Record<Locale, Record<string, Messages>> = { 'zh-CN': {}, en: {} }
  for (const [path, messages] of Object.entries(files)) {
    const match = fileName.exec(path)
    const locale = match?.[2]
    if (!match || !isLocale(locale)) {
      throw new Error(`${path}: a message file is named <namespace>.<locale>.ts (kebab-case namespace; zh-CN or en)`)
    }
    catalog[locale][match[1]] = messages
  }
  return catalog
}

/** Every message of every namespace, per locale. Read by the parity test. */
export const catalog = buildCatalog()

const pluralRules = new Map<Locale, Intl.PluralRules>()

function pluralForm(locale: Locale, count: number): Intl.LDMLPluralRule {
  let rules = pluralRules.get(locale)
  if (!rules) {
    rules = new Intl.PluralRules(locale)
    pluralRules.set(locale, rules)
  }
  return rules.select(count)
}

function fill(text: string, params: MessageParams | undefined): string {
  if (!params) return text
  return text.replace(/\{(\w+)\}/g, (placeholder, name: string) =>
    name in params ? String(params[name]) : placeholder,
  )
}

function resolve(locale: Locale, message: Message, params: MessageParams | undefined): string {
  if (typeof message === 'string') return fill(message, params)
  const form = pluralForm(locale, Number(params?.count ?? 0))
  const text = form === 'other' ? message.other : (message[form] ?? message.other)
  return fill(text, params)
}

/**
 * The text of `namespace` → `key` in `locale`. A key the locale lacks falls
 * back to `en`; a key nobody has comes back as `namespace:key`, visible on
 * screen and caught by the parity test rather than rendering nothing.
 */
export function translate<N extends Namespace>(
  locale: Locale,
  namespace: N,
  key: MessageKey<N>,
  params?: MessageParams,
): string {
  const message = catalog[locale][namespace]?.[key]
  if (message !== undefined) return resolve(locale, message, params)
  const fallback = catalog[fallbackLocale][namespace]?.[key]
  if (fallback !== undefined) return resolve(fallbackLocale, fallback, params)
  return `${namespace}:${key}`
}
