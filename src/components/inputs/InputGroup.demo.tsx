import { Search, SendHorizontal, X } from 'lucide-react'

import { Button } from '@/components/actions'
import { Stack } from '@/components/layout'
import { useT } from '@/i18n'

import { Field } from './Field'
import { Input } from './Input'
import { InputGroup } from './InputGroup'
import { Textarea } from './Textarea'

export default function InputGroupDemo() {
  const t = useT('inputs')
  return (
    <Stack gap="lg">
      <Field label={t('group.demo.search')}>
        <InputGroup
          start={<Search aria-hidden="true" />}
          end={
            <Button size="icon" variant="ghost" aria-label={t('group.demo.clear')}>
              <X aria-hidden="true" />
            </Button>
          }
        >
          <Input type="search" />
        </InputGroup>
      </Field>
      <Field label={t('group.demo.price')} error={t('field.demo.phoneError')}>
        <InputGroup end={t('group.demo.currency')}>
          <Input inputMode="decimal" defaultValue="128" />
        </InputGroup>
      </Field>
      <Field label={t('group.demo.message')}>
        <InputGroup
          align="block"
          end={
            <Button size="sm">
              <SendHorizontal aria-hidden="true" />
              {t('group.demo.send')}
            </Button>
          }
        >
          <Textarea defaultValue={t('field.demo.notesValue')} />
        </InputGroup>
      </Field>
    </Stack>
  )
}
