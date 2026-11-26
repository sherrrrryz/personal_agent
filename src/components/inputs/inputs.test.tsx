import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ComponentType } from 'react'
import { describe, expect, it, vi } from 'vitest'

import { Button } from '@/components/actions'
import { LocaleProvider, LOCALE_STORAGE_KEY } from '@/i18n'
import { axe } from '@/test/axe'

import { Field, Input, InputGroup, RadioGroup, Select, Switch, Textarea } from './index'

// Component evidence for the field controls (A-13): render, every state, the
// keyboard path, axe, and each demo in zh-CN.

const tokens = (element: Element) => element.className.split(' ')

const services = [
  { value: 'bath', label: '洗澡' },
  { value: 'groom', label: '全套美容' },
  { value: 'teeth', label: '洁牙', disabled: true },
] as const

describe('Field', () => {
  it('names the control by its visible label and wires description and error to it', async () => {
    const { container } = render(
      <Field label="宠物名字" description="按主人的叫法填写" error="请填写名字">
        <Input />
      </Field>,
    )
    const input = screen.getByRole('textbox', { name: '宠物名字' })
    expect(input).toHaveAccessibleDescription('按主人的叫法填写 请填写名字')
    expect(input).toBeInvalid()
    // The error is text beside the field, with an icon: never colour alone.
    const alert = screen.getByRole('alert')
    expect(alert).toHaveTextContent('请填写名字')
    expect(alert.querySelector('svg[aria-hidden="true"]')).not.toBeNull()
    await userEvent.click(screen.getByText('宠物名字'))
    expect(input).toHaveFocus()
    expect(await axe(container)).toHaveNoViolations()
  })

  it('is valid and undescribed when it has neither description nor error', () => {
    render(
      <Field label="宠物名字">
        <Input />
      </Field>,
    )
    const input = screen.getByRole('textbox', { name: '宠物名字' })
    expect(input).not.toHaveAttribute('aria-invalid')
    expect(input).not.toHaveAttribute('aria-describedby')
    expect(screen.queryByRole('alert')).toBeNull()
  })

  it('disables the control inside it; the control’s own props win, except the id the label points at', () => {
    render(
      <>
        <Field label="甲" disabled>
          <Input />
        </Field>
        <Field label="乙" disabled>
          <Input disabled={false} id="own" aria-describedby="extra" />
        </Field>
      </>,
    )
    expect(screen.getByRole('textbox', { name: '甲' })).toBeDisabled()
    const own = screen.getByRole('textbox', { name: '乙' })
    expect(own).toBeEnabled()
    expect(own).not.toHaveAttribute('id', 'own')
    expect(own).toHaveAttribute('aria-describedby', 'extra')
  })
})

describe('Input and Textarea', () => {
  it.each([
    // The kit's own sizes, as stock draws them (D-43).
    ['Input', Input, 'INPUT', 'h-8'],
    ['Textarea', Textarea, 'TEXTAREA', 'min-h-16'],
  ] as const)('%s: native element at the kit’s size, typed into', async (_name, Control, tag, minimum) => {
    const onChange = vi.fn()
    render(
      <Field label="备注">
        <Control onChange={onChange} />
      </Field>,
    )
    const control = screen.getByRole('textbox', { name: '备注' })
    expect(control.tagName).toBe(tag)
    expect(control).toHaveClass(minimum)
    expect(control.className).not.toMatch(/-target\b/)
    await userEvent.tab()
    expect(control).toHaveFocus()
    await userEvent.keyboard('好')
    expect(onChange).toHaveBeenCalled()
    expect(control).toHaveValue('好')
  })

  it.each([
    ['Input', Input],
    ['Textarea', Textarea],
  ] as const)('%s: disabled, invalid and read-only states', async (_name, Control) => {
    render(
      <>
        <Control aria-label="停用" disabled />
        <Control aria-label="有误" aria-invalid />
        <Control aria-label="只读" readOnly defaultValue="前台" />
      </>,
    )
    expect(screen.getByRole('textbox', { name: '停用' })).toBeDisabled()
    const invalid = screen.getByRole('textbox', { name: '有误' })
    expect(invalid).toBeInvalid()
    // An invalid control keeps the focus ring while it is focused.
    expect(tokens(invalid)).toEqual(
      expect.arrayContaining(['aria-invalid:focus-visible:ring-ring/50', 'dark:aria-invalid:focus-visible:ring-ring/50']),
    )
    const readOnly = screen.getByRole('textbox', { name: '只读' })
    expect(readOnly).toHaveAttribute('readonly')
    // Read-only is the native state; the kit draws it like any other field and nothing is added (D-43).
    expect(tokens(readOnly).filter((token) => token.startsWith('[&[readonly]]'))).toEqual([])
    await userEvent.type(readOnly, '改')
    expect(readOnly).toHaveValue('前台')
  })
})

describe('Select', () => {
  it('is a combobox named by its field that opens, moves with the arrows and chooses with Enter', async () => {
    const onValueChange = vi.fn()
    render(
      <Field label="服务项目" description="可以之后再改">
        <Select options={services} placeholder="请选择" onValueChange={onValueChange} />
      </Field>,
    )
    const trigger = screen.getByRole('combobox', { name: '服务项目' })
    expect(trigger).toHaveAccessibleDescription('可以之后再改')
    expect(trigger).toHaveTextContent('请选择')
    expect(trigger).toHaveClass('min-h-8', 'h-auto', 'w-full', 'whitespace-normal')
    expect(tokens(trigger)).not.toContain('whitespace-nowrap')
    await userEvent.tab()
    expect(trigger).toHaveFocus()
    await userEvent.keyboard('{Enter}')
    const list = await screen.findByRole('listbox')
    const options = within(list).getAllByRole('option')
    expect(options.map((option) => option.textContent)).toEqual(['洗澡', '全套美容', '洁牙'])
    expect(options[2]).toHaveAttribute('aria-disabled', 'true')
    await userEvent.keyboard('{ArrowDown}{Enter}')
    expect(onValueChange).toHaveBeenCalledTimes(1)
    expect(['bath', 'groom']).toContain(onValueChange.mock.calls[0][0])
    expect(trigger).toHaveTextContent(/洗澡|全套美容/)
  })

  it('closes on Escape and returns focus to the trigger', async () => {
    render(<Select aria-label="服务项目" options={services} defaultValue="bath" />)
    const trigger = screen.getByRole('combobox', { name: '服务项目' })
    expect(trigger).toHaveTextContent('洗澡')
    await userEvent.click(trigger)
    await screen.findByRole('listbox')
    await userEvent.keyboard('{Escape}')
    expect(screen.queryByRole('listbox')).toBeNull()
    expect(trigger).toHaveFocus()
  })

  it('disabled and invalid states', () => {
    render(
      <>
        <Field label="停用" disabled>
          <Select options={services} />
        </Field>
        <Field label="有误" error="请选择服务项目">
          <Select options={services} />
        </Field>
      </>,
    )
    expect(screen.getByRole('combobox', { name: '停用' })).toHaveAttribute('data-disabled')
    const invalid = screen.getByRole('combobox', { name: '有误' })
    expect(invalid).toHaveAttribute('aria-invalid', 'true')
    expect(invalid).toHaveAccessibleDescription('请选择服务项目')
  })

  // The kit's read-only locks the value, not the list: it opens to be read
  // (a moment after the press — asserting "no listbox" passed only by timing).
  it('read-only: the list opens to be read and choosing changes nothing', async () => {
    const onValueChange = vi.fn()
    render(<Select aria-label="只读" options={services} defaultValue="bath" readOnly onValueChange={onValueChange} />)
    const trigger = screen.getByRole('combobox', { name: '只读' })
    expect(trigger).toHaveAttribute('aria-readonly', 'true')
    await userEvent.tab()
    expect(trigger).toHaveFocus()
    await userEvent.keyboard('{Enter}')
    const list = await screen.findByRole('listbox')
    expect(within(list).getByRole('option', { name: '洗澡' })).toHaveAttribute('aria-selected', 'true')
    await userEvent.keyboard('{ArrowDown}{Enter}')
    expect(onValueChange).not.toHaveBeenCalled()
    expect(trigger).toHaveTextContent('洗澡')
    await userEvent.keyboard('{Escape}')
    await waitFor(() => expect(screen.queryByRole('listbox')).toBeNull())
    expect(trigger).toHaveFocus()
    expect(onValueChange).not.toHaveBeenCalled()
  })

  it('marks the language of an option whose label is in another language', async () => {
    render(<Select aria-label="语言" options={[{ value: 'en', label: 'English', lang: 'en' }]} defaultValue="en" />)
    const trigger = screen.getByRole('combobox', { name: '语言' })
    expect(within(trigger).getByText('English')).toHaveAttribute('lang', 'en')
  })
})

describe('Switch', () => {
  it('is a switch named by its label and described by its description; the whole row toggles it once', async () => {
    const onCheckedChange = vi.fn()
    const { container } = render(<Switch label="提前提醒" description="上午九点发送" onCheckedChange={onCheckedChange} />)
    const control = screen.getByRole('switch', { name: '提前提醒' })
    expect(control).toHaveAccessibleDescription('上午九点发送')
    expect(control).toHaveAttribute('aria-checked', 'false')
    await userEvent.click(screen.getByText('提前提醒'))
    expect(onCheckedChange).toHaveBeenCalledTimes(1)
    expect(onCheckedChange).toHaveBeenLastCalledWith(true)
    expect(control).toHaveAttribute('aria-checked', 'true')
    await userEvent.click(control)
    expect(onCheckedChange).toHaveBeenCalledTimes(2)
    expect(control).toHaveAttribute('aria-checked', 'false')
    // The row is a label: the whole of it answers a click.
    expect(control.closest('label')).toHaveClass('w-full')
    expect(await axe(container)).toHaveNoViolations()
  })

  it('is toggled with Space and Enter from the keyboard', async () => {
    render(<Switch label="提前提醒" />)
    const control = screen.getByRole('switch')
    await userEvent.tab()
    expect(control).toHaveFocus()
    await userEvent.keyboard(' ')
    expect(control).toHaveAttribute('aria-checked', 'true')
    await userEvent.keyboard('{Enter}')
    expect(control).toHaveAttribute('aria-checked', 'false')
  })

  it('disabled and read-only switches do not change', async () => {
    const onCheckedChange = vi.fn()
    render(
      <>
        <Switch label="停用" disabled onCheckedChange={onCheckedChange} />
        <Switch label="只读" readOnly defaultChecked onCheckedChange={onCheckedChange} />
      </>,
    )
    const disabled = screen.getByRole('switch', { name: '停用' })
    expect(disabled).toHaveAttribute('aria-disabled', 'true')
    await userEvent.click(screen.getByText('停用'))
    const readOnly = screen.getByRole('switch', { name: '只读' })
    expect(readOnly).toHaveAttribute('aria-readonly', 'true')
    await userEvent.click(readOnly)
    expect(readOnly).toHaveAttribute('aria-checked', 'true')
    expect(onCheckedChange).not.toHaveBeenCalled()
  })
})

describe('RadioGroup', () => {
  const coats = [
    { value: 'short', label: '短毛', description: '大约四十分钟' },
    { value: 'long', label: '长毛' },
    { value: 'unknown', label: '还不确定', disabled: true },
  ] as const

  it('is a radio group named by its legend, each option named by its label; a row chooses its option', async () => {
    const onValueChange = vi.fn()
    const { container } = render(
      <RadioGroup legend="毛发长度" description="决定预约时长" options={coats} onValueChange={onValueChange} />,
    )
    const group = screen.getByRole('radiogroup', { name: '毛发长度' })
    expect(group).toHaveAccessibleDescription('决定预约时长')
    const short = within(group).getByRole('radio', { name: '短毛' })
    expect(short).toHaveAccessibleDescription('大约四十分钟')
    expect(within(group).getByRole('radio', { name: '还不确定' })).toHaveAttribute('aria-disabled', 'true')
    await userEvent.click(screen.getByText('长毛'))
    expect(onValueChange).toHaveBeenCalledTimes(1)
    expect(onValueChange).toHaveBeenLastCalledWith('long')
    expect(within(group).getByRole('radio', { name: '长毛' })).toBeChecked()
    await userEvent.click(short)
    expect(onValueChange).toHaveBeenCalledTimes(2)
    expect(short).toBeChecked()
    for (const radio of within(group).getAllByRole('radio')) {
      expect(radio.closest('label')).toHaveClass('w-full')
    }
    expect(await axe(container)).toHaveNoViolations()
  })

  it('is one tab stop; the arrows move and choose, skipping a disabled option', async () => {
    render(
      <>
        <RadioGroup legend="毛发长度" options={coats} defaultValue="short" />
        <Button>下一步</Button>
      </>,
    )
    await userEvent.tab()
    expect(screen.getByRole('radio', { name: '短毛' })).toHaveFocus()
    await userEvent.keyboard('{ArrowDown}')
    expect(screen.getByRole('radio', { name: '长毛' })).toBeChecked()
    await userEvent.keyboard('{ArrowDown}')
    expect(screen.getByRole('radio', { name: '还不确定' })).not.toBeChecked()
    await userEvent.tab()
    expect(screen.getByRole('button', { name: '下一步' })).toHaveFocus()
  })

  it('invalid, disabled and read-only states', async () => {
    const onValueChange = vi.fn()
    render(
      <>
        <RadioGroup legend="有误" options={coats} error="请选择毛发长度" />
        <RadioGroup legend="停用" options={coats} disabled onValueChange={onValueChange} />
        <RadioGroup legend="只读" options={coats} defaultValue="short" readOnly onValueChange={onValueChange} />
      </>,
    )
    const invalid = screen.getByRole('radiogroup', { name: '有误' })
    expect(invalid).toHaveAttribute('aria-invalid', 'true')
    expect(invalid).toHaveAccessibleDescription('请选择毛发长度')
    expect(screen.getByRole('alert')).toHaveTextContent('请选择毛发长度')
    const disabled = screen.getByRole('radiogroup', { name: '停用' })
    await userEvent.click(within(disabled).getByText('长毛'))
    const readOnly = screen.getByRole('radiogroup', { name: '只读' })
    await userEvent.click(within(readOnly).getByRole('radio', { name: '长毛' }))
    expect(within(readOnly).getByRole('radio', { name: '短毛' })).toBeChecked()
    expect(onValueChange).not.toHaveBeenCalled()
  })
})

describe('InputGroup', () => {
  it('holds the control and what is attached to it; the control keeps its field wiring', async () => {
    const onClear = vi.fn()
    const { container } = render(
      <Field label="搜索" error="没有找到">
        <InputGroup
          start={<svg aria-hidden="true" data-testid="icon" />}
          end={
            <Button size="icon" variant="ghost" aria-label="清空" onClick={onClear}>
              <svg aria-hidden="true" />
            </Button>
          }
        >
          <Input type="search" />
        </InputGroup>
      </Field>,
    )
    const input = screen.getByRole('searchbox', { name: '搜索' })
    expect(input).toBeInvalid()
    expect(input).toHaveAccessibleDescription('没有找到')
    expect(input).toHaveAttribute('data-slot', 'input-group-control')
    const group = input.closest('[data-slot="input-group"]')!
    // The kit's group (D-43); an invalid control keeps the focus ring while focused.
    expect(group).toHaveClass('h-8')
    expect(tokens(group)).toContain('has-[[data-slot=input-group-control][aria-invalid=true]:focus-visible]:ring-ring/50')
    expect(group).toContainElement(screen.getByTestId('icon'))
    // Tab order follows reading order: the control, then the attached button.
    await userEvent.tab()
    expect(input).toHaveFocus()
    await userEvent.tab()
    await userEvent.keyboard('{Enter}')
    expect(onClear).toHaveBeenCalledTimes(1)
    expect(await axe(container)).toHaveNoViolations()
  })

  it('takes a textarea with its action underneath', () => {
    render(
      <InputGroup align="block" end={<Button size="sm">发送</Button>}>
        <Textarea aria-label="消息" />
      </InputGroup>,
    )
    expect(screen.getByRole('textbox', { name: '消息' }).tagName).toBe('TEXTAREA')
    expect(screen.getByRole('button', { name: '发送' }).closest('[data-align]')).toHaveAttribute('data-align', 'block-end')
  })
})

describe('the inputs family as a whole', () => {
  const sources = readdirSync(import.meta.dirname)
    .filter((file) => /\.tsx?$/.test(file) && !file.includes('.test.'))
    .map((file) => [file, readFileSync(join(import.meta.dirname, file), 'utf8')] as const)

  it.each(sources)('%s sets no fixed block size, no truncation and no outer margin', (_file, source) => {
    expect(source.match(/(?<![\w-])(?:h|size|max-h)-(?:\d|\[|px|full|screen|dvh|svh|target)[\w./[\]-]*/g) ?? []).toEqual(
      // An icon's own square is not a text box.
      (source.match(/(?<![\w-])size-4(?![\w.-])/g) ?? []),
    )
    expect(source.match(/\b(?:truncate|line-clamp-\d+|overflow-hidden|whitespace-nowrap)\b/g) ?? []).toEqual([])
    expect(source.match(/(?<![\w-])-?m[trblxyse]?-[\w./[\]-]+/g) ?? []).toEqual([])
  })

  const demos = Object.entries(import.meta.glob<ComponentType>('./*.demo.tsx', { eager: true, import: 'default' }))

  it('every component of the family has a demo', () => {
    expect(demos.map(([path]) => path).sort()).toEqual(
      expect.arrayContaining(
        ['BehaviourModePicker', 'Field', 'Input', 'InputGroup', 'RadioGroup', 'Select', 'Switch', 'Textarea'].map((name) => `./${name}.demo.tsx`),
      ),
    )
  })

  it.each(demos)('%s renders in zh-CN with no English text or name and no axe violation', async (_path, Demo) => {
    window.localStorage.setItem(LOCALE_STORAGE_KEY, 'zh-CN')
    const { container } = render(
      <LocaleProvider>
        <Demo />
      </LocaleProvider>,
    )
    const prose = container.cloneNode(true) as HTMLElement
    for (const code of prose.querySelectorAll('code')) code.remove()
    expect(prose.textContent).not.toMatch(/[A-Za-z]{2,}/)
    expect(prose.textContent).toMatch(/\p{Script=Han}/u)
    for (const named of container.querySelectorAll('[aria-label], [placeholder], [title]')) {
      for (const attribute of ['aria-label', 'placeholder', 'title']) {
        expect(named.getAttribute(attribute) ?? '').not.toMatch(/[A-Za-z]{2,}/)
      }
    }
    expect(await axe(container)).toHaveNoViolations()
  })
})
