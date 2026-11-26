import { useLocation } from 'react-router'

import { resolveModule, useRuntimeState, type ChatContext, type Module, type ModuleView } from '@/runtime'

/** Where the chat bar stands: the open address, and the module screen it shows, if it shows one. */
export type ChatScreen = {
  pathname: string
  /** The id in `/chat/<id>`: the bar is that conversation's composer. */
  threadId?: string
  /** The module whose screen is open, in the current scene. */
  module?: Module
  /** What `sendMessage` is told about the screen. */
  context: ChatContext
}

const decode = (part: string) => {
  try {
    return decodeURIComponent(part)
  } catch {
    return part
  }
}

const views: Record<string, ModuleView> = { workflow: 'workflow', memory: 'memory' }

/** The open screen, read from the address: `/m/<id>` is a module's page, `/m/<id>/workflow` its workflow, and so on. */
export function useChatScreen(): ChatScreen {
  const { pathname } = useLocation()
  const state = useRuntimeState()
  const [area, id, child] = pathname.split('/').filter(Boolean).map(decode)
  if (area === 'chat' && id) return { pathname, threadId: id, context: {} }
  const module = area === 'm' && id ? resolveModule(state, id)?.module : undefined
  if (!module) return { pathname, context: {} }
  const view: ModuleView = child ? (views[child] ?? 'child') : 'page'
  return { pathname, module, context: { moduleId: module.id, view } }
}

/**
 * What the open screen is called, for the panel's heading 关于：…. The page's
 * own `h1` is its name (the shell's breadcrumb reads the same element); on a
 * module's sub-page the module's name goes in front of it, joined by `join`.
 */
export function screenName(module: string, join: (module: string, view: string) => string): string {
  const heading = document.querySelector('main h1')?.textContent?.trim() ?? ''
  if (module && heading && heading !== module) return join(module, heading)
  return heading || module
}
