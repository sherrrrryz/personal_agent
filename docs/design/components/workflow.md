# Components — workflow

> Status: evergreen — the registry rows and the accessibility contract of
> the node canvas of the workflow editor. Contract every component meets, conventions and the
> index of families: `../COMPONENTS.md`.

<!--
HOW TO BUILD THIS FILE
- Skeleton written by package S1b of task 1; the rows are written by package
  C3 (`docs/specs/lofi-prototype-screens.md`, criteria B-09), in the same change
  that adds each component. One writer: nobody else edits this file.
- Admitted by the spec for this family: `WorkflowCanvas`, `WorkflowNode`, `WorkflowHandle`.
- A row here and the code must agree — `src/test/registry-parity.test.ts`
  fails otherwise (`../COMPONENTS.md` § Conventions, "One component, one row").
-->

Code: `src/components/workflow/`.

## Registry

One row per component. The Component cell is the component's name in
backticks and nothing else. Source: `kit` · `wrapped` · `new` · `dependency`;
Status: `lofi` · `styled` · `deprecated → <replacement>` (`../COMPONENTS.md`
§ Registry).

| Component | Source | Variants | Status | Notes |
| --- | --- | --- | --- | --- |
| `WorkflowCanvas` | `dependency` | `mode`: `view` · `diff` | `lofi` | `@xyflow/react` 13.0.3 (D-16): pan and zoom only — nodes are not draggable, connectable or deletable (D-10). Takes `nodes` **in flow order** (`flowOrder`) and `edges`; positions come from `rankLayout` over the sizes the library measured and one step of the spacing scale, never typed coordinates. `selectedId`, `revealId` (the `?node=` deep link: that node in the middle at full size), `onOpenNode`. Zoom is our three `Button`s (放大 · 缩小 · 适应画面); the wheel scrolls the page. `mode: diff` only reaches the DOM here (`data-mode`, `data-diff`, edge class `workflow-edge-added` / `-changed`) — drawing it is package C6's. Loading and error are the editor's `DataState` around both views, not states of the canvas |
| `WorkflowNode` | `new` | `kind`: `trigger` · `source` · `step` · `condition` · `action` · `output` · `memory`; `selected`; `diff`: `added` · `changed` · `none` | `lofi` | The kit's `Card` (`size: sm`): kind icon + the kind in words, `label`, `lines` (what it holds), an action's `mode` as `BehaviourModeBadge` and 受上限限制 when `capped`, `links`, and the line 接到：… from `connectsTo`. As wide as its container; plain content — the canvas makes it focusable, 步骤列表 passes the opening button as `action`. `diff` is carried as `data-diff` for C6 |
| `WorkflowHandle` | `dependency` | `type`: `target` · `source` | `lofi` | The library's `Handle` as the library draws it, on the start (`target`) or end (`source`) edge of a node. Never connectable; only inside `WorkflowCanvas` |

## Accessibility contract

One row per component of the registry above; the reviewer tests against it
(`../ACCESSIBILITY.md` § Per-component contract). Min target is 44 × 44 CSS px
through `size.target.min` for anything interactive. **Withdrawn by D-43:** there is no
target-size and no contrast requirement; the "Min target" column binds nothing.

| Component | Role | Name comes from | Keyboard | Focus | Min target | Announces |
| --- | --- | --- | --- | --- | --- | --- |
| `WorkflowCanvas` | `region` named 工作流画布, holding the library's `application` (same name) and a `group` 画布缩放 of three buttons | The messages (`workflow` namespace) | Tab goes through the nodes in the order given, then the library's attribution link, then the three zoom buttons, then out — no trap; Enter or Space on a node calls `onOpenNode`; a key pressed on a link inside a node stays the link's. Connectors and connection points take no focus | The kit's ring on the focused node; a focused node outside the view is panned into it (the library's `autoPanOnNodeFocus`) | — (D-43) | Nothing by itself |
| `WorkflowNode` | On the canvas: the library's node wrapper, `group`, focusable; in 步骤列表: a list item holding the card and a button | Canvas: kind, label and — for an action — its mode (动作：设置预约时长，自主). The list's button: 查看和调整：<kind>：<label> | Canvas: Enter or Space opens the inspector. Links inside are ordinary links | The kit's ring; `selected` is a heavier ring plus the hidden word 已选中, and `aria-current` on the wrapper / list item | — (D-43) | Described by the library's hint (按回车或空格查看和调整这个步骤) and by its own line 接到：… — the only way connectors are read |
| `WorkflowHandle` | None — `aria-hidden` | — | Not focusable | — | — | Nothing |

## Pitfalls

- **The canvas needs a box with a block size.** The library fills its parent; `WorkflowCanvas` brings the box
  (`h-120`, capped at the window's height). Put it in a container with a width.
- **Text panned out of the box is cut off by design** — the one `data-matrix-allow="clip"` of this family sits on
  the canvas's view box. Text clipped *inside a node* is still a defect: check the cards, not the box.
- **Tests in jsdom** need what the library measures with: `installFlowDom(size)` from
  `src/components/workflow/test-support.ts` (a `ResizeObserver` that reports once, element sizes,
  `DOMMatrixReadOnly`). Without it every node stays `visibility: hidden` and no role query finds it.
- **The library's attribution link stays** (a small "React Flow" link in the corner of the canvas, one tab stop
  after the nodes): the library asks for a paid subscription before `hideAttribution` is used, and the project
  takes on no paid plan. Its text is the library's, in English.
- **The library's root is `role="application"`** and cannot be changed; give it the same name as the region.
- **A node's `aria-describedby`** is written by the library and replaced by ours through `domAttributes`; ours
  repeats the library's id (`react-flow__node-desc-<flow id>`) and adds the node's 接到 line.
