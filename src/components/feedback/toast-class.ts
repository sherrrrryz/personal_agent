import { buttonClass } from '@/components/actions'
import { cn } from '@/lib/utils'

// The look of a toast, written here in our tokens. The `sonner` library
// styles toasts itself — pixel font sizes, a 20 px close control, a 24 px
// action, literal colours and a shadow — so its styling is switched off
// (`unstyled`) and every part gets its classes from this file. Where a toast
// sits, how toasts stack and how they move stays the library's.
//
// Every utility is written out in full: Tailwind reads class names from the
// source text (`components/actions.md` § Pitfalls).

/** The toast itself: a bordered popover surface whose controls wrap under the text when the row runs out. */
const toast =
  'cn-toast flex w-full flex-wrap items-center gap-2 rounded-lg border bg-popover p-3 text-sm text-popover-foreground outline-none focus-visible:border-ring focus-visible:ring-3! focus-visible:ring-ring/50'

/** Title and description. The basis keeps the text readable before a control is allowed to wrap away. */
const content = 'flex min-w-0 flex-1 basis-40 flex-col gap-1'

export const toastClassNames = {
  toast,
  content,
  title: 'font-medium wrap-anywhere',
  description: 'wrap-anywhere text-muted-foreground',
  icon: 'flex shrink-0 items-center',
  // The library draws these three as plain `button`s; they take the look, the
  // target minimum and the focus ring of our `Button`.
  actionButton: buttonClass({ variant: 'secondary', size: 'sm' }),
  cancelButton: buttonClass({ variant: 'ghost', size: 'sm' }),
  // The close control comes first, in the page and on screen alike, as the library orders it.
  closeButton: cn(buttonClass({ variant: 'ghost', size: 'icon' }), 'shrink-0'),
}
