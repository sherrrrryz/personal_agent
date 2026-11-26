import { useNavigate } from 'react-router'

import { PersistenceSwitch } from '@/components/chat'
import { subModuleTemplates } from '@/fixtures'
import { useLocale } from '@/i18n'
import { findModule, findTopic, navigationOf, typed, useActions, useRuntimeState, type Conversation } from '@/runtime'

import { workflowPath } from './paths'

/**
 * One-off ↔ persistent for one conversation (D-08), on the runtime: turning
 * the switch on and confirming creates the sub-module and opens its workflow;
 * turning it off archives it — the conversation stays in Topics (D-20). The
 * two questions are `PersistenceSwitch`'s own.
 */
export function ConversationPersistence({
  conversation,
  screenModuleId,
}: {
  conversation: Conversation
  /** The module whose screen the switch is on: the parent the confirmation is prefilled with. */
  screenModuleId?: string
}) {
  const { locale } = useLocale()
  const state = useRuntimeState()
  const actions = useActions()
  const navigate = useNavigate()

  const { base, profession } = navigationOf(state)
  // Her own modules first: a conversation most often becomes part of one of them.
  const parents = [...profession, ...base].map(({ module }) => ({ value: module.id, label: module.name[locale] }))

  // A sub-module has no sub-modules: its parent stands for it.
  const topLevel = (id: string | undefined) => {
    const module = id ? findModule(state, id) : undefined
    return module?.parentId ?? module?.id
  }
  const candidates = [screenModuleId, conversation.moduleId, ...(findTopic(state, conversation.topicId)?.moduleIds ?? [])]
  const defaultParent = candidates.map(topLevel).find((id) => parents.some((parent) => parent.value === id))

  const subModule = conversation.subModuleId ? findModule(state, conversation.subModuleId) : undefined
  // The story's own name for what this conversation becomes, when it has one.
  const defaultName = (subModuleTemplates[conversation.template ?? '']?.name ?? conversation.title)[locale]

  return (
    <PersistenceSwitch
      persistent={conversation.persistence === 'persistent'}
      defaultName={defaultName}
      parents={parents}
      defaultParent={defaultParent}
      moduleName={subModule?.name[locale]}
      onCreate={({ name, parentId }) => {
        const created = actions.createSubModule({
          parentId,
          conversationId: conversation.id,
          // Left as offered, the name stays the story's own in both languages.
          ...(name === defaultName ? {} : { name: typed(name) }),
        })
        if (created) void navigate(workflowPath(created))
      }}
      onArchive={() => {
        if (conversation.subModuleId) actions.archiveSubModule(conversation.subModuleId)
      }}
    />
  )
}
