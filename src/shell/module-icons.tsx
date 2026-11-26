import {
  BellIcon,
  CalendarClockIcon,
  CalendarIcon,
  FolderIcon,
  ListTodoIcon,
  MailIcon,
  MessageSquareIcon,
  PackageIcon,
  PawPrintIcon,
  PuzzleIcon,
  SendIcon,
  TimerIcon,
  UsersIcon,
  type LucideIcon,
} from 'lucide-react'

import type { ModuleIcon } from '@/runtime'

/** A module's icon name (`Module.icon`, `moduleIcons`) → the lucide component. */
export const moduleIconComponents: Record<ModuleIcon, LucideIcon> = {
  bell: BellIcon,
  'message-square': MessageSquareIcon,
  calendar: CalendarIcon,
  'list-todo': ListTodoIcon,
  mail: MailIcon,
  folder: FolderIcon,
  'calendar-clock': CalendarClockIcon,
  'paw-print': PawPrintIcon,
  package: PackageIcon,
  users: UsersIcon,
  timer: TimerIcon,
  send: SendIcon,
  puzzle: PuzzleIcon,
}
