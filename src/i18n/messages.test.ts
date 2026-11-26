// @vitest-environment node
import { readdirSync } from 'node:fs'
import { join } from 'node:path'

import { describe, expect, it } from 'vitest'

import { catalog } from './registry'
import { locales, type Message } from './types'

// A-09: both locales of every namespace have the same keys. Runs over the
// whole glob registry, so it covers every namespace a later package adds.

const namespaces = [...new Set(locales.flatMap((locale) => Object.keys(catalog[locale])))].sort()
const placeholders = (text: string) => [...text.matchAll(/\{(\w+)\}/g)].map((match) => match[1]).sort()
const texts = (message: Message) => (typeof message === 'string' ? [message] : Object.values(message))

describe('message files', () => {
  it('every file under messages/ is registered', () => {
    const onDisk = readdirSync(join(import.meta.dirname, 'messages')).filter((file) => file.endsWith('.ts'))
    expect(onDisk.length).toBe(namespaces.length * locales.length)
  })

  it('has the common namespace', () => {
    expect(namespaces).toContain('common')
  })

  describe.each(namespaces)('namespace %s', (namespace) => {
    const [reference, ...others] = locales

    it('exists in every locale', () => {
      for (const locale of locales) expect(catalog[locale][namespace], locale).toBeDefined()
    })

    it('has the same keys in every locale', () => {
      const keys = Object.keys(catalog[reference][namespace] ?? {}).sort()
      expect(keys.length).toBeGreaterThan(0)
      for (const locale of others) {
        expect(Object.keys(catalog[locale][namespace] ?? {}).sort(), locale).toEqual(keys)
      }
    })

    it('has no empty text, and every plural message has `other`', () => {
      for (const locale of locales) {
        for (const [key, message] of Object.entries(catalog[locale][namespace] ?? {})) {
          if (typeof message !== 'string') expect(message.other, `${locale} ${key}`).toBeTypeOf('string')
          for (const text of texts(message)) expect(text.trim(), `${locale} ${key}`).not.toBe('')
        }
      }
    })

    it('uses the same placeholders in every locale', () => {
      const source = catalog[reference][namespace] ?? {}
      for (const [key, message] of Object.entries(source)) {
        const expected = [...new Set(texts(message).flatMap(placeholders))].sort()
        for (const locale of others) {
          const other = catalog[locale][namespace]?.[key]
          if (other === undefined) continue
          expect([...new Set(texts(other).flatMap(placeholders))].sort(), `${locale} ${key}`).toEqual(expected)
        }
      }
    })
  })
})
