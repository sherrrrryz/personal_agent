// Family `containers` — registry and contract: docs/design/components/containers.md.
export { AlertDialog } from './AlertDialog'
export type { AlertDialogProps } from './AlertDialog'
export { Dialog } from './Dialog'
export type { DialogProps } from './Dialog'
export { Sheet } from './Sheet'
export type { SheetProps } from './Sheet'
// `kit` rows, re-exported unchanged. The trigger of a `Collapsible` or a
// `Tooltip` is always our `Button`, passed as `render`.
export { Card, CardAction, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
export { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
export { Separator } from '@/components/ui/separator'
export { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
