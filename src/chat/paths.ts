import { modulePath } from '@/shell'

// The addresses the chat surfaces lead to.

/** A dedicated chat (`chat.thread`). */
export const threadPath = (conversationId: string) => `/chat/${encodeURIComponent(conversationId)}`

/** A topic's home, where an in-place conversation is kept as a record (D-23). */
export const topicPath = (topicId: string) => `/topics/${encodeURIComponent(topicId)}`

/** Where a conversation's sub-module opens once it exists (D-08): its workflow. */
export const workflowPath = (moduleId: string) => `${modulePath(moduleId)}/workflow`
