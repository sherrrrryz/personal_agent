import type { Locale } from '@/i18n'
import { findConversation, findModule, findTopic, resolveModule, type RuntimeState } from '@/runtime'

/** A level above the open page: its name and where it leads. */
export type Ancestor = { label: string; to: string }

/** The address of a module's home. */
export const modulePath = (id: string) => `/m/${encodeURIComponent(id)}`

/** The path split into its decoded parts: `/m/profession.clients/pets/p-1` → `m`, `profession.clients`, `pets`, `p-1`. */
export function partsOf(pathname: string): string[] {
  return pathname
    .split('/')
    .filter(Boolean)
    .map((part) => {
      try {
        return decodeURIComponent(part)
      } catch {
        return part
      }
    })
}

/**
 * The header's breadcrumb. The open page is named by its own `h1`; the levels
 * above it come from the address and the state: a sub-module sits under its
 * parent, a module's own sub-page under the module, a topic under 话题, a
 * dedicated chat under its topic, a settings page under 设置.
 */
export function ancestorsOf(
  pathname: string,
  state: RuntimeState,
  locale: Locale,
  names: { topics: string; settings: string },
): { ancestors: Ancestor[]; fallback: string } {
  const [area, id, ...rest] = partsOf(pathname)
  const ancestors: Ancestor[] = []
  let fallback = ''

  if (area === 'm' && id) {
    const module = resolveModule(state, id)?.module
    const parent = module?.parentId ? findModule(state, module.parentId) : undefined
    if (parent) ancestors.push({ label: parent.name[locale], to: modulePath(parent.id) })
    if (module && rest.length > 0) ancestors.push({ label: module.name[locale], to: modulePath(module.id) })
    else fallback = module?.name[locale] ?? ''
  } else if (area === 'topics') {
    if (id) ancestors.push({ label: names.topics, to: '/topics' })
    fallback = id ? (findTopic(state, id)?.title[locale] ?? '') : names.topics
  } else if (area === 'chat' && id) {
    const conversation = findConversation(state, id)
    const topic = conversation ? findTopic(state, conversation.topicId) : undefined
    ancestors.push({ label: names.topics, to: '/topics' })
    if (topic) ancestors.push({ label: topic.title[locale], to: `/topics/${encodeURIComponent(topic.id)}` })
    fallback = conversation?.title[locale] ?? ''
  } else if (area === 'settings') {
    if (id) ancestors.push({ label: names.settings, to: '/settings' })
    else fallback = names.settings
  }
  return { ancestors, fallback }
}

/**
 * Where a scene jump leaves her: on the open route when what it shows exists
 * in the new scene, else on 通知 (spec part 2 § Shell, the device). `null`:
 * stay.
 */
export function routeAfterJump(pathname: string, state: RuntimeState): string | null {
  const [area, id] = partsOf(pathname)
  if (!id) return null
  const gone =
    (area === 'm' && !resolveModule(state, id)) ||
    (area === 'topics' && !findTopic(state, id)) ||
    (area === 'chat' && !findConversation(state, id))
  return gone ? modulePath('notifications') : null
}
