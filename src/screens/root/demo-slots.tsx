import { MessageSquareIcon, MessagesSquareIcon } from 'lucide-react'

import { Button } from '@/components/actions'
import { SidebarGroup, SidebarItem } from '@/components/navigation'
import { useT } from '@/i18n'

/** `/dev/shell`: what stands in the bottom row until the chat bar exists. */
export function DemoBar() {
  const t = useT('shell')
  return (
    <section aria-label={t('demo.bar.label')} className="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-2">
      <p className="min-w-0 flex-1 basis-48 text-sm">{t('demo.bar.note')}</p>
      <Button variant="secondary">{t('demo.bar.action')}</Button>
    </section>
  )
}

/** `/dev/shell`: what stands in the sidebar where `chat.recent` goes — collapsed, as it will be (D-39). */
export function DemoRecent() {
  const t = useT('shell')
  return (
    <SidebarGroup label={t('demo.recent.label')} collapsible icon={<MessagesSquareIcon />}>
      <SidebarItem icon={<MessageSquareIcon />} label={t('demo.recent.first')} />
      <SidebarItem icon={<MessageSquareIcon />} label={t('demo.recent.second')} />
    </SidebarGroup>
  )
}
