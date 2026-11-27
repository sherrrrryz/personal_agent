import { MessagesSquareIcon, SettingsIcon } from 'lucide-react'
import { useEffect, type ComponentType } from 'react'
import { Link, useLocation } from 'react-router'

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarItem,
  SidebarSubItem,
  SidebarTrigger,
  useSidebar,
} from '@/components/navigation'
import { useLocale, useT } from '@/i18n'
import { awaitingCount, navigationOf, resolveModule, useRuntimeState, type Module } from '@/runtime'

import { modulePath, partsOf } from './crumbs'
import { moduleIconComponents } from './module-icons'

/**
 * The module navigation (spec part 2 § Shell, "Sidebar, in order"): at the top
 * the trigger that folds it into the rail and opens it again (D-53; the sheet
 * has its own close button instead); 基础 — the
 * base modules and 话题; the profession heading with her modules, each with
 * its sub-modules one level down; the chat's recent list (`recent`, a slot);
 * the footer with 设置 and the preferences menu.
 *
 * It reads the state itself, never a resource: a forced 状态预览 must not
 * empty the navigation.
 */
export function AppSidebar({ recent: Recent }: { recent?: ComponentType }) {
  const t = useT('shell')
  const { locale } = useLocale()
  const state = useRuntimeState()
  const { pathname } = useLocation()
  const { mode, setSheetOpen } = useSidebar()

  // Following a link in the compact sheet closes it: the page it opened is behind it.
  useEffect(() => {
    setSheetOpen(false)
  }, [pathname, setSheetOpen])

  const [area, id] = partsOf(pathname)
  const open = area === 'm' && id ? resolveModule(state, id)?.module : undefined
  const { base, profession } = navigationOf(state)
  const waiting = awaitingCount(state)

  const item = ({ module, subs }: { module: Module; subs: Module[] }) => {
    const Icon = moduleIconComponents[module.icon]
    // The rail draws no sub-items: there the parent stands for the sub-module that is open.
    const current = open?.id === module.id || (mode === 'rail' && open?.parentId === module.id)
    return (
      <SidebarItem
        key={module.id}
        icon={<Icon />}
        label={module.name[locale]}
        current={current}
        render={<Link to={modulePath(module.id)} />}
        badge={
          module.id === 'notifications' && waiting > 0 ? (
            <>
              <span aria-hidden="true">{waiting}</span>
              <span className="sr-only">{t('nav.awaiting', { count: waiting })}</span>
            </>
          ) : undefined
        }
      >
        {subs.length > 0
          ? subs.map((sub) => (
              <SidebarSubItem
                key={sub.id}
                label={sub.name[locale]}
                current={open?.id === sub.id}
                render={<Link to={modulePath(sub.id)} />}
              />
            ))
          : undefined}
      </SidebarItem>
    )
  }

  return (
    <Sidebar aria-label={t('nav.label')}>
      {mode !== 'sheet' && (
        <SidebarHeader>
          <div className="flex">
            <SidebarTrigger />
          </div>
        </SidebarHeader>
      )}
      <SidebarContent>
        <SidebarGroup label={t('nav.base')}>
          {base.map(item)}
          <SidebarItem
            icon={<MessagesSquareIcon />}
            label={t('nav.topics')}
            current={area === 'topics'}
            render={<Link to="/topics" />}
          />
        </SidebarGroup>
        {profession.length > 0 && <SidebarGroup label={t('nav.profession')}>{profession.map(item)}</SidebarGroup>}
        {Recent && <Recent />}
      </SidebarContent>
      <SidebarFooter>
        <SidebarGroup label={t('nav.footer')}>
          <SidebarItem
            icon={<SettingsIcon />}
            label={t('nav.settings')}
            current={area === 'settings'}
            render={<Link to="/settings" />}
          />
        </SidebarGroup>
      </SidebarFooter>
    </Sidebar>
  )
}
