import { BellIcon, CalendarIcon, MessageSquareIcon, MessagesSquareIcon, PackageIcon, ScissorsIcon, SettingsIcon } from 'lucide-react'
import type { ReactNode } from 'react'

import { DemoGroup } from '@/components/actions/demo-parts'
import { Stack } from '@/components/layout'
import { useIsMobile } from '@/hooks/use-mobile'
import { useT } from '@/i18n'

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarItem,
  SidebarProvider,
  SidebarSubItem,
  SidebarTrigger,
} from './Sidebar'
import { useSidebar } from './sidebar-context'

// Demo destinations: fragments of the gallery page itself.
const link = (id: string) => <a href={`#demo-${id}`} />

function Brand() {
  const t = useT('navigation')
  const { mode } = useSidebar()
  return mode === 'rail' ? <span className="sr-only">{t('demo.sidebar.brand')}</span> : <p className="p-2 font-medium wrap-anywhere">{t('demo.sidebar.brand')}</p>
}

function DemoSidebar({ name, trigger = false }: { name: string; trigger?: boolean }) {
  const t = useT('navigation')
  return (
    <Sidebar aria-label={name}>
      <SidebarHeader>
        {trigger && (
          <div className="flex">
            <SidebarTrigger />
          </div>
        )}
        <Brand />
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup label={t('demo.sidebar.base')}>
          <SidebarItem
            icon={<BellIcon />}
            label={t('demo.sidebar.notifications')}
            render={link('notifications')}
            badge={
              <>
                <span aria-hidden="true">3</span>
                <span className="sr-only">{t('demo.sidebar.waiting', { count: 3 })}</span>
              </>
            }
          />
          <SidebarItem icon={<MessageSquareIcon />} label={t('demo.sidebar.messages')} render={link('messages')} />
          <SidebarItem icon={<CalendarIcon />} label={t('demo.sidebar.schedule')} render={link('schedule')} current />
        </SidebarGroup>
        <SidebarGroup label={t('demo.sidebar.shop')}>
          <SidebarItem icon={<ScissorsIcon />} label={t('demo.sidebar.bookings')} render={link('bookings')}>
            <SidebarSubItem label={t('demo.sidebar.duration')} render={link('duration')} />
            <SidebarSubItem label={t('demo.sidebar.reminders')} render={link('reminders')} current />
          </SidebarItem>
          <SidebarItem icon={<PackageIcon />} label={t('demo.sidebar.stock')} disabled />
        </SidebarGroup>
        <SidebarGroup label={t('demo.sidebar.recent')} collapsible icon={<MessagesSquareIcon />}>
          <SidebarItem icon={<MessageSquareIcon />} label={t('demo.sidebar.talk1')} render={link('talk-1')} />
          <SidebarItem icon={<MessageSquareIcon />} label={t('demo.sidebar.talk2')} render={link('talk-2')} />
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <SidebarGroup label={t('demo.sidebar.settings')}>
          <SidebarItem icon={<SettingsIcon />} label={t('demo.sidebar.settings')} render={link('settings')} />
        </SidebarGroup>
      </SidebarFooter>
    </Sidebar>
  )
}

function Beside({ children }: { children: ReactNode }) {
  return <div className="flex min-w-0 flex-1 items-start p-2">{children}</div>
}

export default function SidebarDemo() {
  const t = useT('navigation')
  const compact = useIsMobile()
  return (
    <Stack gap="lg">
      <DemoGroup caption={t('demo.sidebar.open')}>
        <SidebarProvider placement="inline">
          <DemoSidebar name={t('demo.sidebar.nameOpen')} trigger />
        </SidebarProvider>
      </DemoGroup>
      <DemoGroup caption={t('demo.sidebar.rail')}>
        <SidebarProvider placement="inline" open={false}>
          <DemoSidebar name={t('demo.sidebar.nameRail')} />
        </SidebarProvider>
      </DemoGroup>
      <DemoGroup caption={t('demo.sidebar.sheet')}>
        {compact ? (
          <SidebarProvider placement="viewport">
            <DemoSidebar name={t('demo.sidebar.nameSheet')} />
            <Beside>
              <SidebarTrigger />
            </Beside>
          </SidebarProvider>
        ) : (
          <p>{t('demo.sidebar.sheetWide')}</p>
        )}
      </DemoGroup>
    </Stack>
  )
}
