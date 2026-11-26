import type { ReactNode } from 'react'
import { toast as sonnerToast } from 'sonner'

// Raising a toast. Screens call `toast(…)` from the family's index and never
// import `sonner` themselves; `Sonner` (the toaster) shows what is raised.

/** Where a `Sonner` shows its toasts. */
export const sonnerPositions = ['top-center', 'top-right', 'bottom-center', 'bottom-right'] as const
export type SonnerPosition = (typeof sonnerPositions)[number]

export const toastKinds = ['plain', 'success', 'warning', 'error'] as const
export type ToastKind = (typeof toastKinds)[number]

export type ToastOptions = {
  /** What happened, by icon as well as by words. `plain` has no icon. Default `plain`. */
  kind?: ToastKind
  /** A second line under the message. */
  description?: ReactNode
  /** One action — an undo, usually. Its label is the button's name. */
  action?: { label: string; onClick: () => void }
  /** Stays until dismissed. For a message that needs more than a glance; the default goes away by itself. */
  persistent?: boolean
  /** Raising a toast again with the same id replaces it instead of stacking a second one. */
  id?: string
  /** The `id` of the `Sonner` that shows it, when a screen has a toaster of its own. */
  toasterId?: string
}

export type ToastId = string | number

const raise = {
  plain: sonnerToast,
  success: sonnerToast.success,
  warning: sonnerToast.warning,
  error: sonnerToast.error,
} as const

/**
 * Shows a toast and returns its id. A toast is announced politely and goes
 * away by itself, so it repeats or confirms — an error is always also shown
 * where it happened (`components/feedback.md`).
 */
export function toast(message: ReactNode, options: ToastOptions = {}): ToastId {
  const { kind = 'plain', description, action, persistent = false, id, toasterId } = options
  return raise[kind](message, {
    description,
    action,
    id,
    toasterId,
    ...(persistent ? { duration: Number.POSITIVE_INFINITY } : {}),
  })
}

/** Removes one toast, or every toast when no id is given. */
toast.dismiss = (id?: ToastId): void => {
  sonnerToast.dismiss(id)
}
