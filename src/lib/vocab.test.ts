import { describe, expect, it } from 'vitest'

import { locales, translate } from '@/i18n'

import { behaviourMode, behaviourModes, capMode, changeKind, changeKinds, isAboveCeiling } from './vocab'

describe('behaviour modes (A-10)', () => {
  it('exports the three modes of D-22', () => {
    expect([...behaviourModes]).toEqual(['autonomous', 'assisted', 'deferred'])
    expect(Object.keys(behaviourMode)).toEqual([...behaviourModes])
  })

  it.each(behaviourModes)('%s has an icon, and a name and a meaning in both locales', (mode) => {
    const entry = behaviourMode[mode]
    expect(entry.mode).toBe(mode)
    expect(entry.icon).toBeTruthy()
    for (const key of [entry.nameKey, entry.meaningKey]) {
      for (const locale of locales) {
        const text = translate(locale, 'common', key)
        expect(text).not.toBe(`common:${key}`)
        expect(text.trim()).not.toBe('')
      }
    }
  })

  it('uses the names the spec gives', () => {
    const names = (locale: 'zh-CN' | 'en') =>
      behaviourModes.map((mode) => translate(locale, 'common', behaviourMode[mode].nameKey))
    expect(names('zh-CN')).toEqual(['自主', '协助', '待确认'])
    expect(names('en')).toEqual(['Autonomous', 'Assisted', 'Deferred'])
  })

  it('every mode has its own icon', () => {
    expect(new Set(behaviourModes.map((mode) => behaviourMode[mode].icon)).size).toBe(behaviourModes.length)
  })

  it('compares a mode with a ceiling', () => {
    expect(isAboveCeiling('autonomous', 'assisted')).toBe(true)
    expect(isAboveCeiling('assisted', 'deferred')).toBe(true)
    expect(isAboveCeiling('assisted', 'assisted')).toBe(false)
    expect(isAboveCeiling('deferred', 'autonomous')).toBe(false)
    expect(capMode('autonomous', 'deferred')).toBe('deferred')
    expect(capMode('deferred', 'autonomous')).toBe('deferred')
    expect(capMode('assisted', 'autonomous')).toBe('assisted')
  })
})

describe('change kinds (A-10)', () => {
  it('exports the three kinds', () => {
    expect([...changeKinds]).toEqual(['new', 'updated', 'removed'])
    expect(Object.keys(changeKind)).toEqual([...changeKinds])
  })

  it('uses the words the spec gives, in both locales', () => {
    const labels = (locale: 'zh-CN' | 'en') =>
      changeKinds.map((kind) => translate(locale, 'common', changeKind[kind].labelKey))
    expect(labels('zh-CN')).toEqual(['新', '已更新', '已移除'])
    expect(labels('en')).toEqual(['New', 'Updated', 'Removed'])
  })

  it('every kind has its own icon', () => {
    expect(new Set(changeKinds.map((kind) => changeKind[kind].icon)).size).toBe(changeKinds.length)
  })
})
