import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ReactElement } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { Button } from '@/components/actions'
import { LocaleProvider, LOCALE_STORAGE_KEY, translate, type Locale } from '@/i18n'
import { behaviourMode, behaviourModes, type BehaviourMode } from '@/lib/vocab'
import { axe } from '@/test/axe'

import { BehaviourModePicker } from './index'

// Component evidence for `BehaviourModePicker` (A-13): the three modes of the
// shared vocabulary as a radio group, the ceiling of D-22, every state, the
// keyboard path and axe, in both locales.

function renderIn(locale: Locale, ui: ReactElement) {
  window.localStorage.setItem(LOCALE_STORAGE_KEY, locale)
  return render(<LocaleProvider>{ui}</LocaleProvider>)
}

const nameOf = (locale: Locale, mode: BehaviourMode) => translate(locale, 'common', behaviourMode[mode].nameKey)
const meaningOf = (locale: Locale, mode: BehaviourMode) => translate(locale, 'common', behaviourMode[mode].meaningKey)
const limitOf = (locale: Locale, ceiling: BehaviourMode) =>
  translate(locale, 'inputs', 'modePicker.limit', { mode: nameOf(locale, ceiling) })

describe('BehaviourModePicker', () => {
  beforeEach(() => window.localStorage.clear())

  it.each(['zh-CN', 'en'] as const)(
    '%s: a radio group named by its legend; each option is the mode’s icon, name and one line of meaning',
    async (locale) => {
      const { container } = renderIn(locale, <BehaviourModePicker legend="给顾客发消息" description="这类任务的上限" />)
      const group = screen.getByRole('radiogroup', { name: '给顾客发消息' })
      expect(group).toHaveAccessibleDescription('这类任务的上限')
      const radios = within(group).getAllByRole('radio')
      // From most to least autonomy, as the vocabulary lists them.
      expect(radios).toHaveLength(behaviourModes.length)
      behaviourModes.forEach((mode, index) => {
        // The name is the words only: the icon is decorative.
        expect(radios[index]).toHaveAccessibleName(nameOf(locale, mode))
        expect(radios[index]).toHaveAccessibleDescription(meaningOf(locale, mode))
        expect(radios[index]).not.toHaveAttribute('aria-disabled', 'true')
        const row = radios[index].closest('label')!
        expect(row).toHaveClass('w-full')
        expect(row.querySelectorAll('svg[aria-hidden="true"]')).toHaveLength(1)
      })
      // Nothing is chosen until the caller or the user chooses.
      for (const radio of radios) expect(radio).not.toBeChecked()
      expect(await axe(container)).toHaveNoViolations()
    },
  )

  it('reports the chosen mode; a click anywhere on a row chooses it', async () => {
    const onValueChange = vi.fn()
    renderIn('zh-CN', <BehaviourModePicker legend="修改预约" defaultValue="assisted" onValueChange={onValueChange} />)
    expect(screen.getByRole('radio', { name: nameOf('zh-CN', 'assisted') })).toBeChecked()
    await userEvent.click(screen.getByText(meaningOf('zh-CN', 'deferred')))
    expect(onValueChange).toHaveBeenCalledTimes(1)
    expect(onValueChange).toHaveBeenLastCalledWith('deferred')
    expect(screen.getByRole('radio', { name: nameOf('zh-CN', 'deferred') })).toBeChecked()
  })

  it('is one tab stop; the arrows move and choose; Tab leaves', async () => {
    const onValueChange = vi.fn()
    renderIn(
      'zh-CN',
      <>
        <BehaviourModePicker legend="修改预约" defaultValue="autonomous" onValueChange={onValueChange} />
        <Button>下一步</Button>
      </>,
    )
    await userEvent.tab()
    expect(screen.getByRole('radio', { name: nameOf('zh-CN', 'autonomous') })).toHaveFocus()
    await userEvent.keyboard('{ArrowDown}')
    expect(onValueChange).toHaveBeenLastCalledWith('assisted')
    await userEvent.keyboard('{ArrowDown}')
    expect(onValueChange).toHaveBeenLastCalledWith('deferred')
    await userEvent.tab()
    expect(screen.getByRole('button', { name: '下一步' })).toHaveFocus()
  })

  describe('under a ceiling (D-22)', () => {
    it.each(['zh-CN', 'en'] as const)('%s: the modes above it cannot be chosen and the group says why, as text', async (locale) => {
      const onValueChange = vi.fn()
      const { container } = renderIn(
        locale,
        <BehaviourModePicker legend="顺延预约" description="这一步会修改预约" ceiling="assisted" value="assisted" onValueChange={onValueChange} />,
      )
      const group = screen.getByRole('radiogroup', { name: '顺延预约' })
      const reason = limitOf(locale, 'assisted')
      expect(reason).toContain(nameOf(locale, 'assisted'))
      // The caller's description first, then the reason — both read with the group.
      expect(group).toHaveAccessibleDescription(`这一步会修改预约 ${reason}`)
      expect(screen.getByText(reason)).toBeVisible()
      const above = within(group).getByRole('radio', { name: nameOf(locale, 'autonomous') })
      expect(above).toHaveAttribute('aria-disabled', 'true')
      for (const mode of ['assisted', 'deferred'] as const) {
        expect(within(group).getByRole('radio', { name: nameOf(locale, mode) })).not.toHaveAttribute('aria-disabled', 'true')
      }
      await userEvent.click(above)
      await userEvent.click(screen.getByText(meaningOf(locale, 'autonomous')))
      expect(onValueChange).not.toHaveBeenCalled()
      expect(await axe(container)).toHaveNoViolations()
    })

    it('shows a value above the ceiling as the ceiling, controlled or not', () => {
      renderIn(
        'zh-CN',
        <>
          <BehaviourModePicker legend="甲" ceiling="assisted" value="autonomous" />
          <BehaviourModePicker legend="乙" ceiling="deferred" defaultValue="autonomous" />
          <BehaviourModePicker legend="丙" ceiling="assisted" value="deferred" />
        </>,
      )
      const radio = (legend: string, mode: BehaviourMode) =>
        within(screen.getByRole('radiogroup', { name: legend })).getByRole('radio', { name: nameOf('zh-CN', mode) })
      expect(radio('甲', 'assisted')).toBeChecked()
      expect(radio('甲', 'autonomous')).not.toBeChecked()
      expect(radio('乙', 'deferred')).toBeChecked()
      // A value at or under the ceiling is shown as it is.
      expect(radio('丙', 'deferred')).toBeChecked()
    })

    it('with the lowest ceiling two modes are closed and the arrows have nowhere to go', async () => {
      const onValueChange = vi.fn()
      renderIn('zh-CN', <BehaviourModePicker legend="下单补货" ceiling="deferred" value="deferred" onValueChange={onValueChange} />)
      const group = screen.getByRole('radiogroup', { name: '下单补货' })
      expect(group).toHaveAccessibleDescription(limitOf('zh-CN', 'deferred'))
      expect(within(group).getAllByRole('radio').filter((radio) => radio.getAttribute('aria-disabled') === 'true')).toHaveLength(2)
      await userEvent.tab()
      await userEvent.keyboard('{ArrowUp}{ArrowDown}')
      expect(onValueChange).not.toHaveBeenCalled()
    })

    it('says nothing about a limit when the ceiling closes nothing', () => {
      renderIn('zh-CN', <BehaviourModePicker legend="整理归档" ceiling="autonomous" />)
      const group = screen.getByRole('radiogroup', { name: '整理归档' })
      expect(group).not.toHaveAttribute('aria-describedby')
      for (const radio of within(group).getAllByRole('radio')) expect(radio).not.toHaveAttribute('aria-disabled', 'true')
    })
  })

  it('lists extra choices after the three modes; they are never capped', async () => {
    const onValueChange = vi.fn<(value: BehaviourMode | 'unset') => void>()
    renderIn(
      'zh-CN',
      <BehaviourModePicker
        legend="给顾客发消息"
        extraOptions={[{ value: 'unset', label: '未设置', description: '由助手决定' }]}
        ceiling="deferred"
        value="unset"
        onValueChange={onValueChange}
      />,
    )
    const radios = screen.getAllByRole('radio')
    expect(radios).toHaveLength(4)
    expect(radios[3]).toHaveAccessibleName('未设置')
    expect(radios[3]).toHaveAccessibleDescription('由助手决定')
    expect(radios[3]).toBeChecked()
    await userEvent.click(screen.getByText(nameOf('zh-CN', 'deferred')))
    expect(onValueChange).toHaveBeenLastCalledWith('deferred')
  })

  it('invalid, disabled and read-only states', async () => {
    const onValueChange = vi.fn()
    renderIn(
      'zh-CN',
      <>
        <BehaviourModePicker legend="有误" ceiling="assisted" error="没有保存成功，请重新选择" />
        <BehaviourModePicker legend="停用" disabled onValueChange={onValueChange} />
        <BehaviourModePicker legend="只读" defaultValue="assisted" readOnly onValueChange={onValueChange} />
      </>,
    )
    const invalid = screen.getByRole('radiogroup', { name: '有误' })
    expect(invalid).toHaveAttribute('aria-invalid', 'true')
    // The reason for the limit and the error are both the group's description.
    expect(invalid).toHaveAccessibleDescription(`${limitOf('zh-CN', 'assisted')} 没有保存成功，请重新选择`)
    expect(screen.getByRole('alert')).toHaveTextContent('没有保存成功，请重新选择')
    const disabled = screen.getByRole('radiogroup', { name: '停用' })
    await userEvent.click(within(disabled).getByText(nameOf('zh-CN', 'deferred')))
    const readOnly = screen.getByRole('radiogroup', { name: '只读' })
    await userEvent.click(within(readOnly).getByRole('radio', { name: nameOf('zh-CN', 'deferred') }))
    expect(within(readOnly).getByRole('radio', { name: nameOf('zh-CN', 'assisted') })).toBeChecked()
    expect(onValueChange).not.toHaveBeenCalled()
  })
})
