import { useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router'

import { ToggleGroup, ToggleGroupItem } from '@/components/actions'
import { DataState, Skeleton } from '@/components/feedback'
import { Inline, Stack } from '@/components/layout'
import { WorkflowCanvas, type WorkflowCanvasEdge, type WorkflowCanvasNode } from '@/components/workflow'
import { useLocale, useT } from '@/i18n'
import { ModuleFrame, useRouteModule } from '@/module'
import { useResource, useRuntimeState, versionOf, type Module, type Workflow } from '@/runtime'

import { NodeInspector } from './NodeInspector'
import { workflowView } from './node-view'
import { collectSlots, shownCurrent, type EditorShown, type EditorSlotProps, type EditorSlots } from './slots'
import { StepList } from './StepList'

// Package C6's two slot files, when they exist (`slots.ts`): 历史 from `history/`, the comparison from `diff/`.
const registeredSlots = collectSlots(import.meta.glob('./{history,diff}/slots.tsx', { eager: true }))

/** The address parameter that selects a node: `/m/<ia-id>/workflow?node=<id>`. */
export const NODE_PARAM = 'node'

type ViewKind = 'canvas' | 'list'

/**
 * `<module>.workflow` — the workflow editor (spec part 3 § Workflow editor):
 * the module frame, then the version line, the switch 画布 / 步骤列表, one
 * line on how to use the view, and the view. A node opens the inspector.
 */
export function WorkflowEditor({ slots = registeredSlots }: { slots?: readonly EditorSlots[] }) {
  const { module, basePath } = useRouteModule()
  const t = useT('workflow')
  return (
    <ModuleFrame module={module} view="workflow" title={t('title')} width="full">
      {/* Another module, or another try after a failure, starts the editor afresh. */}
      <WorkflowPanel key={module.id} module={module} basePath={basePath} slots={slots} />
    </ModuleFrame>
  )
}

/**
 * The editor without its frame: the version line, the switch, the view and the
 * inspector. The `workflow` view puts it in `main`; 功能设置 puts it in its
 * 流程 part (D-52, `./settings-panel.tsx`).
 */
export function WorkflowPanel({ module, basePath, slots = registeredSlots }: { module: Module; basePath: string; slots?: readonly EditorSlots[] }) {
  const [attempt, setAttempt] = useState(0)
  return (
    <Editor
      key={`${module.id}:${attempt}`}
      module={module}
      basePath={basePath}
      slots={slots}
      onRetry={() => setAttempt((count) => count + 1)}
    />
  )
}

function Editor({ module, basePath, slots, onRetry }: { module: Module; basePath: string; slots: readonly EditorSlots[]; onRetry: () => void }) {
  const t = useT('workflow')
  const answer = useResource({ kind: 'workflow', moduleId: module.id })
  const workflow = 'data' in answer ? answer.data : undefined
  return (
    <DataState
      state={answer.state === 'loading' ? 'loading' : workflow ? 'ready' : 'error'}
      loadingLabel={t('loading')}
      loading={<Skeleton className="h-64 w-full" />}
      errorTitle={t('error.title')}
      error={t('error.body')}
      onRetry={onRetry}
    >
      {workflow && <Loaded module={module} basePath={basePath} workflow={workflow} slots={slots} />}
    </DataState>
  )
}

function Loaded({ module, basePath, workflow, slots }: { module: Module; basePath: string; workflow: Workflow; slots: readonly EditorSlots[] }) {
  const t = useT('workflow')
  const { locale } = useLocale()
  const state = useRuntimeState()
  const [search] = useSearchParams()
  const deepLink = search.get(NODE_PARAM)

  // A change that waits for her approval is what the editor opens on: the comparison, with 批准 / 拒绝 (B-24).
  const [shown, setShown] = useState<EditorShown>(() => (workflow.proposed && slots.length > 0 ? { version: 'proposed', compareTo: null } : shownCurrent))
  const [kind, setKind] = useState<ViewKind>('canvas')
  const [selectedId, setSelectedId] = useState<string | null>(deepLink)
  // The inspector: the node it is for, whether it is open, and a count so that opening a node again starts clean.
  const [inspector, setInspector] = useState<{ id: string; open: boolean; turn: number } | null>(null)
  const opener = useRef<HTMLElement | null>(null)
  const views = useRef<HTMLDivElement>(null)

  const proposed = shown.version === 'proposed' ? workflow.proposed : undefined
  const version = proposed ?? versionOf(workflow, typeof shown.version === 'number' ? shown.version : workflow.current)
  const number = 'n' in version ? version.n : null
  const readOnly = number !== workflow.current
  const comparing = shown.compareTo !== null || proposed !== undefined

  const { nodes, edges } = useMemo<{ nodes: WorkflowCanvasNode[]; edges: WorkflowCanvasEdge[] }>(() => {
    const diff = comparing ? slots.find((slot) => slot.diffOf)?.diffOf?.(workflow, shown) : undefined
    return workflowView(version, { state, locale, t, basePath, diff: diff?.nodes, edgeDiff: diff?.edges })
  }, [version, state, locale, t, basePath, comparing, slots, workflow, shown])

  function openNode(id: string) {
    opener.current = document.activeElement instanceof HTMLElement ? document.activeElement : null
    setSelectedId(id)
    setInspector((previous) => ({ id, open: true, turn: (previous?.turn ?? 0) + 1 }))
  }

  function onInspectorChange(open: boolean) {
    setInspector((previous) => (previous ? { ...previous, open } : previous))
    if (open) return
    // Back to where she was: the node on the canvas, or the step's button in the list.
    const id = inspector?.id
    window.requestAnimationFrame(() => {
      const from = opener.current
      const target = from?.isConnected
        ? from
        : views.current?.querySelector<HTMLElement>(id ? `.react-flow__node[data-id="${CSS.escape(id)}"], [data-step-open="${CSS.escape(id)}"]` : 'none')
      target?.focus()
    })
  }

  const slotProps: EditorSlotProps = { module, workflow, shown, onShownChange: setShown }
  const opened = inspector ? version.nodes.find((node) => node.id === inspector.id) : undefined
  const openedView = inspector ? nodes.find((node) => node.id === inspector.id) : undefined

  return (
    <Stack gap="md">
      <Inline gap="md" align="center" data-slot="workflow-version-line">
        <p data-slot="workflow-version" data-version={number ?? 'proposed'}>
          {number === null ? t('version.proposed') : t(readOnly ? 'version.old' : 'version.current', { n: number })}
        </p>
        {/* ── Slot for package C6 — `versionActions`: 历史, 与上一版对比, the diff switch. Empty until C6 fills it. ── */}
        {slots.map((slot, index) => slot.versionActions && <slot.versionActions key={index} {...slotProps} />)}
      </Inline>

      <ToggleGroup<ViewKind> aria-label={t('view.label')} required value={kind} onValueChange={(next) => next && setKind(next)}>
        <ToggleGroupItem value="canvas">{t('view.canvas')}</ToggleGroupItem>
        <ToggleGroupItem value="list">{t('view.list')}</ToggleGroupItem>
      </ToggleGroup>
      <p className="text-sm text-muted-foreground" data-slot="workflow-hint">
        {t(kind === 'canvas' ? 'hint.canvas' : 'hint.list')}
      </p>

      {/* ── Slot for package C6 — `beforeView`: the old-version banner, 变更摘要, the pending proposal. Empty until C6 fills it. ── */}
      {slots.map((slot, index) => slot.beforeView && <slot.beforeView key={index} {...slotProps} />)}

      <div ref={views} className="min-w-0" data-slot="workflow-view" data-view={kind}>
        {kind === 'canvas' ? (
          <WorkflowCanvas
            nodes={nodes}
            edges={edges}
            mode={comparing ? 'diff' : 'view'}
            selectedId={selectedId}
            revealId={deepLink}
            onOpenNode={openNode}
          />
        ) : (
          <StepList nodes={nodes} selectedId={selectedId} revealId={deepLink} onOpenNode={openNode} />
        )}
      </div>

      {inspector && opened && openedView && (
        <NodeInspector
          key={`${inspector.id}:${inspector.turn}`}
          workflow={workflow}
          node={opened}
          view={openedView}
          open={inspector.open}
          onOpenChange={onInspectorChange}
          readOnly={readOnly}
        />
      )}
    </Stack>
  )
}
