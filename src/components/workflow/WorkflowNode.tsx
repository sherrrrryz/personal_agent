import {
  BrainIcon,
  DatabaseIcon,
  GitBranchIcon,
  LayoutPanelTopIcon,
  ListChecksIcon,
  SendIcon,
  ZapIcon,
  type LucideIcon,
} from 'lucide-react'
import { useId, type ReactNode } from 'react'
import { Link } from 'react-router'

import { focusRing } from '@/components/actions/focus-ring'
import { BehaviourModeBadge, ChangeMarker } from '@/components/data-display'
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useT } from '@/i18n'
import type { BehaviourMode } from '@/lib/vocab'
import { cn } from '@/lib/utils'

import { diffChange, type WorkflowDiff, type WorkflowNodeKind } from './node-kinds'

const kindIcon: Record<WorkflowNodeKind, LucideIcon> = {
  trigger: ZapIcon,
  source: DatabaseIcon,
  step: ListChecksIcon,
  condition: GitBranchIcon,
  action: SendIcon,
  output: LayoutPanelTopIcon,
  memory: BrainIcon,
}

// `mode: diff` (spec part 3 § Workflow editor, "Diff"): a node the comparison
// names is told three ways — the marker's word, a border of its own **style**
// (dashed = added, dotted = changed; never colour alone), and 变更摘要 above
// the view, which is the editor's.
const diffBorder = { added: 'border-2 border-dashed border-foreground', changed: 'border-2 border-dotted border-foreground', none: undefined } as const
export type WorkflowNodeLink = { href: string; label: string }

export type WorkflowNodeProps = {
  kind: WorkflowNodeKind
  /** The node's own name: 每周一复盘, 设置预约时长. */
  label: string
  /** What it holds, one fact a line: a trigger's rule, a step's branches, a memory's tables. */
  lines?: readonly string[]
  /** An action's mode as it really runs — already capped by the user's ceiling (D-22). */
  mode?: BehaviourMode
  /** The ceiling holds the action below the mode the AI picked: says 受上限限制. */
  capped?: boolean
  /** Where its content can be seen: a source's module, an output's page, the memory view. */
  links?: readonly WorkflowNodeLink[]
  /** The nodes it leads to, by name. Connectors are drawn, never focusable: this line is how they are read. */
  connectsTo?: readonly string[]
  selected?: boolean
  /** What a comparison says about it: a `ChangeMarker` beside the kind and a border style of its own. */
  diff?: WorkflowDiff
  /** One control beside the heading — 步骤列表 puts the button that opens the inspector here. */
  action?: ReactNode
  /** The id the "leads to" line gets, for an `aria-describedby` on whatever wraps the node. */
  connectsId?: string
}

/**
 * One node of a workflow: the kit's `Card` with the kind's icon and the kind
 * in words, the node's name, and what it holds. Plain content — the canvas
 * makes it focusable and opens the inspector; in 步骤列表 the `action` does.
 * It is as wide as its container.
 */
export function WorkflowNode({
  kind,
  label,
  lines = [],
  mode,
  capped = false,
  links = [],
  connectsTo = [],
  selected = false,
  diff = 'none',
  action,
  connectsId,
}: WorkflowNodeProps) {
  const t = useT('workflow')
  const ownId = useId()
  const Icon = kindIcon[kind]
  const hasBody = lines.length > 0 || mode !== undefined || links.length > 0 || connectsTo.length > 0
  return (
    <Card
      size="sm"
      // Selected is told by the heavier ring and by the word below, never by colour alone.
      className={cn(selected && 'ring-2 ring-foreground', diffBorder[diff])}
      data-slot="workflow-node"
      data-kind={kind}
      data-selected={selected || undefined}
      data-diff={diff === 'none' ? undefined : diff}
    >
      <CardHeader>
        <CardDescription className="flex items-center gap-1.5">
          <Icon aria-hidden="true" className="size-4 shrink-0" />
          <span data-slot="workflow-node-kind">{t(`kind.${kind}`)}</span>
          {selected && <span className="sr-only">{t('node.selected')}</span>}
          {diff !== 'none' && <ChangeMarker kind={diffChange[diff]} />}
        </CardDescription>
        <CardTitle className="wrap-anywhere">{label}</CardTitle>
        {action != null && <CardAction>{action}</CardAction>}
      </CardHeader>
      {hasBody && (
        <CardContent className="flex flex-col gap-2">
          {lines.map((line) => (
            <p key={line} className="wrap-anywhere">
              {line}
            </p>
          ))}
          {mode !== undefined && (
            <p className="flex flex-wrap items-center gap-2">
              <BehaviourModeBadge mode={mode} />
              {capped && <span data-slot="workflow-node-capped">{t('node.capped')}</span>}
            </p>
          )}
          {links.map((link) => (
            <p key={link.href + link.label}>
              <Link to={link.href} className={`rounded-md underline underline-offset-4 wrap-anywhere ${focusRing}`}>
                {link.label}
              </Link>
            </p>
          ))}
          {connectsTo.length > 0 && (
            <p id={connectsId ?? ownId} className="text-muted-foreground wrap-anywhere" data-slot="workflow-node-connects">
              {t('node.connectsTo', { targets: connectsTo.join(t('node.separator')) })}
            </p>
          )}
        </CardContent>
      )}
    </Card>
  )
}
