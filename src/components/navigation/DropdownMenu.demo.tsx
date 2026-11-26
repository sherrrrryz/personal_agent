import { ClockIcon, EllipsisIcon, MessageSquareIcon, Trash2Icon } from 'lucide-react'
import { useState } from 'react'

import { Button } from '@/components/actions'
import { Inline, Stack } from '@/components/layout'
import { useT } from '@/i18n'

import {
  DropdownMenu,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
} from './DropdownMenu'

export default function DropdownMenuDemo() {
  const t = useT('navigation')
  const [chosen, setChosen] = useState<string | null>(null)
  const [view, setView] = useState('week')
  const item = (key: 'demo.menu.edit' | 'demo.menu.message' | 'demo.menu.cancel') => ({
    onClick: () => setChosen(t(key)),
    children: t(key),
  })
  return (
    <Stack gap="sm">
      <Inline>
        <DropdownMenu trigger={<Button variant="secondary">{t('demo.menu.open')}</Button>}>
          <DropdownMenuGroup label={t('demo.menu.open')}>
            <DropdownMenuItem icon={<ClockIcon />} {...item('demo.menu.edit')} />
            <DropdownMenuItem icon={<MessageSquareIcon />} {...item('demo.menu.message')} />
            <DropdownMenuItem disabled>{t('demo.menu.export')}</DropdownMenuItem>
          </DropdownMenuGroup>
          <DropdownMenuSeparator />
          <DropdownMenuItem variant="danger" icon={<Trash2Icon />} {...item('demo.menu.cancel')} />
        </DropdownMenu>
        <DropdownMenu
          align="end"
          trigger={
            <Button variant="ghost" size="icon" aria-label={t('demo.menu.more')}>
              <EllipsisIcon aria-hidden="true" />
            </Button>
          }
        >
          <DropdownMenuRadioGroup label={t('demo.menu.view')} value={view} onValueChange={setView}>
            <DropdownMenuRadioItem value="day">{t('demo.menu.day')}</DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="week">{t('demo.menu.week')}</DropdownMenuRadioItem>
          </DropdownMenuRadioGroup>
        </DropdownMenu>
      </Inline>
      <p className="text-sm text-muted-foreground">{chosen ? t('demo.menu.chosen', { item: chosen }) : t('demo.menu.none')}</p>
    </Stack>
  )
}
