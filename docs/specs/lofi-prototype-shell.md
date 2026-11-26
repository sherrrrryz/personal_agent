# Design spec: low-fi prototype — shell (fake runtime, app shell, chat, blocks, module frame)

> Status: approved
> Task type: 1 low-fi
> Author: spec session `t1-spec` · Date: 2026-11-26
> Spec review: `pass with notes` (pass 3 at `f810aad`, 2026-11-26, `.orchestration/reviews/task1-spec-review.md`; pass 1 and 2 `changes requested`, all blocking and should-fix findings closed) · Approved by: owner waiver D-41, 2026-11-26 — `G-SPEC` waived once; marked `approved` by the orchestration session on the passing review

Part 2 of 3. It builds on [lofi-prototype-system.md](lofi-prototype-system.md) ("part 1": tooling, theme, base components, matrix harness, the wave plan, the frozen-file rule, the meaning of *component evidence* and of `matrix`) and is built upon by [lofi-prototype-screens.md](lofi-prototype-screens.md) ("part 3"). Criteria here are `R-nn`; packages `S6…S12`, `I4`, `I5`.

## Goal

When this is done the owner can open the running prototype and find the machine every screen runs on: a neutral app shell with module navigation, a chat bar at the bottom that answers in place or opens a dedicated chat, one module frame that renders any module from registered blocks with its run state, and a fake workflow runtime whose 时间推进 control moves the pet-grooming story between its scenes. The module pages themselves are still the stub pattern; part 3 fills them.

## Inputs

- `docs/design/FOUNDATIONS.md` § Product brief; `docs/design/IA-MAP.md` § Nodes (`root`, `chat.*`), § Prototype flows, § Prototype devices, § Topics, sub-modules and chats; part 1
- Decisions: D-08, D-20, D-23, D-39 (persistence, topics, in-place, recent collapsed) · D-10, D-12, D-13, D-22, D-28 (workflow, blocks and frame, notifications, ceiling, one workspace) · D-26, D-27, D-37 (story, stubs) · D-34 (matrix) · D-41
- Components and tokens: part 1's only; nothing here adds a token or a kit file

## Scope

### In scope

- Fake runtime: data model, store, async facade, runtime actions, scenes, scripted chat, story fixtures in both locales, the preview variants
- App shell (`root`) with the 时间推进 device; chat components; `chat.bar`, `chat.thread`, `chat.recent`
- Block registry (seven blocks), `BlockRenderer`, what-changed markers, pinning; `ModuleFrame` and the `/m/<ia-id>` routes

### Out of scope

- Module page builders, topics, onboarding, settings, the workflow editor and memory view, the flows → part 3
- Real backends, accounts and AI calls; persistence beyond `localStorage`

## Design

### Fake workflow runtime (`src/runtime/`, `src/fixtures/`)

- **Store:** one in-memory store read through `useSyncExternalStore`; state = the `scene(id)` snapshot + the user's actions since the jump. `localStorage` keeps `pa.scene`, `pa.onboarded`, `pa.theme`, `pa.locale`, pins and sidebar state. Time is the scene's `storyTime`, never the wall clock.
- **Model:** `Module { id (IA id), kind: base | profession | sub, parentId?, name, icon, workflowId, memoryTableIds, aliases }` · `Workflow { id, moduleId, current, versions: [{ n, at, author: ai | user, reason, nodes, edges }] }` · `WfNode { id, kind: trigger | source | step | condition | action | output | memory, label, params, trigger?: schedule | event | manual | module, mode?, taskKind?, emits?, table? }` · `Run { id, moduleId, at, trigger, version, result: ok | failed | running, reason?, changes }` · `MemoryTable { id, ownerModuleId, name, columns, rows, readers }` · `Proposal { id, moduleId, mode, parts, onAccept (a runtime action) }` · `Conversation { id, topicId, moduleId?, surface: in-place | thread, persistence, subModuleId?, messages }` · `Topic` · `Account` · `ModeSetting { taskKind, ceiling }`; `effectiveMode(action)` = the lower of the node's mode and the ceiling (D-22).
- **Block contract (`src/blocks/types.ts`, owned by S6 so S9 and S10 build against it in parallel):** `PageDescription { blocks: [{ key, block, title, span: full | half, props }] }`, the props type of each of the seven block ids, `ChangeSet` (per block `key` and per item id: `new · updated · removed`), and `BlockDefinition { id, Component, demo }`. A block component receives `props`, `changes` and the data state; it renders no title and sets no outer margin.
- **Async facade and the preview:** every read is asynchronous with a fixed simulated delay. Each resource can answer `ready`, `empty`, `loading`, `long` or `error` with a **typed reason** and, where the story calls for it, partial or stale data: `account-expired:<account>`, `account-missing:<account>`, `source-failed:<module>` (the other sources still answer), `platform-unreachable` (last good data, marked stale), `generation-failed` (a summary fails, its records answer). 状态预览 sets a session value `preview` (正常 · 空 · 加载中 · 出错 · 超长内容) that every resource and the frame's run state obey; each resource's `error` reason under preview is fixed in the fixtures. The screen that shows a resource turns the reason into its own words — that mapping belongs to the screen's package.
- **A module's two halves:** `src/fixtures/` holds every story fact — modules, workflows with versions, memory tables, proposals, conversations, topics — per scene. `src/modules/<ia-id>/module.ts` (part 3) holds only the output side: `page(state, preview)` and the handlers of that module's block actions. **A module with no `module.ts` renders the stub pattern** (frame, never-run state, `block.empty`) — also what a module the user adds gets.
- **Runtime actions** (the only way a screen changes state): `sendMessage`, `createSubModule`, `archiveSubModule`, `promoteSubModule`, `resolveProposalPart` (runs the proposal's `onAccept` when its last part resolves), `approveWorkflowChange`, `saveNodeParams`, `runModule`, `recordActualDuration`, `setCeiling`, `connectAccount`, `disconnectAccount` (dependent modules' next run fails with `account-missing`), `confirmModuleSet`, `renameModule`, `addModule`, `removeModule`, `togglePin`, `setPreview`, `jumpToScene`.
- **Scenes:** 热身 `e1` 第一晚 · `e2` 第二晚; 主线 `s0` 今天 · `s1` 变成工作流 · `s2` 第 1–2 周 · `s3` 第 3 周 · `s4` 第 2 个月 · `s5` 回看. A scene's key action is live and lands on the next state (accepting in `s0` yields `s1`); `s3` and `s4` each have a *pending* and a *resolved* half. From `s0` the hero snapshots contain the warm-up's `confirmations` sub-module.
- **Scripted chat:** `e1` — 明天有哪些预约？帮我给顾客发确认。(in place). `s0` — the hero sentence of `IA-MAP.md` stage 0 (in place, ends in a proposal to persist); 帮我想想下个月的店庆活动怎么做 (**opens a dedicated chat**, topic 店庆活动). In a workflow editor, from `s1` — 把每周复盘改到周一早上 9 点 (in place, a proposal whose `onAccept` is `saveNodeParams`). Anything else gets one honest canned reply in place: 原型只演示脚本中的对话.
- **Story data (zh-CN with en pairs):** manager 周岚; groomers 小陈, 阿杰. Seed rule 长毛大型 4 h · 短毛小型 2 h · 其他 3 h. 金毛 豆豆 3 h 20, 大福 4 h 10 (不配合), 麦芽 3 h 40, 奶茶 3 h 50, Lucky 3 h 45 (mean 3 h 45, range 3 h 20 – 4 h 10); 比熊 雪球 2 h 10; 边牧 Max 3 h 05; 阿拉斯加 可乐; 柯基 and 法斗 rows stay 尚无数据; 金毛 布丁 first visits in `s3`.
- **When a learned value applies** (reconciles stages 1–3 of `IA-MAP.md`): the breed table has two columns, 适用时长 and 实测平均; a dog's row has 平均实际耗时 and 适用时长. Recording an actual duration updates the observed columns at once (`s2`). **适用 changes only when the Monday review's deferred proposal is accepted** (`s3` resolved). So: `s0` 可乐 2 h 默认; `s1`–`s2` every booking on its breed's seed (可乐, 豆豆, 大福 4 h; 雪球, Max 3 h), basis 按品种表（你的经验）; from `s3` resolved 豆豆 3 h 20 and 大福 4 h 10 按它自己的记录, 布丁 3 h 45 按品种表; from `s4` resolved a first visit adds 30 分钟.

### Shell (`root`) and the prototype device

- **Structure:** a grid — the `Sidebar` at the inline start, then a column of header / scrolling `main` / bottom-bar row. The bar is a grid row, never an overlay, so it cannot cover content or the focused element. Modes per cell: part 1 § Responsive. Expanded: sidebar open with wrapping labels. Medium: icon rail. Compact: the kit's off-canvas sheet, opened from the header's menu button.
- **Sidebar, in order:** 基础 — 通知 (with the count awaiting her), 消息, 日程, 待办, 邮件, 文件, 话题; the `profession` heading (我的店 · 宠物美容) — her profession modules, each with its sub-modules nested one level; the `sidebarRecent` slot; footer — 设置 and the preferences menu (`ThemeToggle`, `LocaleSelect`).
- **Slots:** the shell renders two optional components, `chatBar` and `sidebarRecent`, exported by `src/chat/shell-slots.tsx` and found by glob; absent, the row and the group are not rendered. S12 therefore edits no shell file.
- **Header:** sidebar trigger, breadcrumb, the device, and — while a preview is forced — a status line 原型控制：正在预览「出错」状态 with 恢复正常, so a forced state is never read as a defect.
- **时间推进 device (prototype only):** a menu button labelled 原型控制 · 时间推进：<scene>, radio items in the two groups, 上一幕 / 下一幕, 重新开始（回到首次使用）. Jumping replaces the snapshot, keeps the route when the module exists in that scene (else 通知), resets the preview and announces the scene in a live region. The same menu carries **状态预览** (accepted by the lead under D-41; Notify at `G-1`): it survives navigation, resets on a scene jump and on reload, and can be set by `?preview=`. S7 amends `IA-MAP.md` § Prototype devices to name both devices, citing D-41.
- **Routes:** `/onboarding/<step>` · `/m/<ia-id>` and its child routes · `/topics`, `/topics/<id>` · `/chat/<id>` · `/settings`, `/settings/<page>` · `/dev/*` (gallery, shell and frame demos; outside the IA map). `/` goes to `/onboarding/profession` until onboarding is done, then `/m/notifications`; an unknown path shows a not-found `Empty`.

### Chat

- **Components (S8):** `ChatComposer`; `ChatMessageList`, which takes a `renderAttachment` slot and imports no block; `PersistenceSwitch`.
- **`chat.bar` (S12):** `ChatComposer` plus, while the input is empty, up to three suggestion buttons carrying the scene's scripted prompts. Sending opens the **in-place panel**: a `Collapsible` region above the composer — heading 关于：<current screen>, `ChatMessageList` (attachments through `BlockRenderer`), then one row: `PersistenceSwitch`, 在专门对话中打开, 关闭. Non-modal; at most half the shell's block size, scrolling inside. Escape or 关闭 collapses it, returns focus to the composer and toasts 已归档到话题「…」 with a link (D-23). The scripted reply decides the surface: in place, or a navigation to `chat.thread`.
- **One-off ↔ persistent (D-08):** turning `PersistenceSwitch` on shows an inline confirmation — name (prefilled), parent module (prefilled from the screen), 创建 — then `createSubModule`, and navigates to `/m/<new id>/workflow`. The AI may raise the same thing as a `block.proposal`. Turning it off asks in an `AlertDialog` and archives the sub-module; its conversations stay in Topics (D-20).
- **`chat.thread`** (`/chat/<id>`): `Page` with the topic title, a link to the module it concerns, `PersistenceSwitch`, `ChatMessageList`; **the bottom bar is this thread's composer** (no in-place panel here).
- **`chat.recent`:** a `Collapsible` sidebar group 最近对话, **collapsed by default** (D-39), state persisted; the ten latest conversations (title, topic, relative time, a 长期 badge) and 全部话题. A thread opens `chat.thread`; an in-place conversation opens its record in the topic home. In the icon rail it is one icon button that opens the sidebar with the group expanded.
- **States:**

| Surface | Empty | Loading | Error | Long content |
| --- | --- | --- | --- | --- |
| In-place panel | Never blank — it opens with her message and the AI's status 正在回答 | Reply streaming: partial text + status | 回答失败 + 重试 in the list; her text stays in the composer | Scrolls inside; the newest message in view |
| `chat.thread` | A new thread shows her opening message and 正在回答 | Skeleton messages | 无法载入这段对话 + 重试; a failed reply is retried inline | 60 messages scroll in `main`, composer stays; a 2000-character message wraps |
| `chat.recent` | 还没有对话 | Skeleton rows | 无法载入 + 重试 | Titles wrap; ten rows, then 全部话题 |

### Blocks (D-12)

- **`BlockRenderer`** lays out a `PageDescription` inside a container: order is the workflow's; `span: half` blocks pair when the renderer's own inline size reaches Tailwind's `@2xl` container step (42rem) and stack below it. Each block sits in a `Section` named by its title with a pin `Toggle` (固定「title」) and, when it changed, a `ChangeMarker`. An unregistered block id renders an error `Alert` and logs in development.
- **What changed:** a run's `ChangeSet` is passed down; the block marks its changed items, the renderer the block title, and a summary line counts them (本次运行：3 处更新). The next run clears them.
- **Pinning (D-12, "in place"):** a pinned block keeps its current position when a later workflow edit re-orders the layout; the others flow around it. Content still updates. The pin is stored per module.
- **Which "empty":** `block.empty` when the workflow itself emits an empty page (the stubs; `notifications` with nothing to show). An empty collection inside a block or on a non-module screen uses `DataState`'s `empty` slot, which renders the kit's `Empty`.

| Block id | Shows | Props (shape) | Emitted by (≥ 2) | Container behaviour |
| --- | --- | --- | --- | --- |
| `block.summary` | A wrapping row of key figures | `items: [{ label, value, delta? }]` | appointments, inventory, shifts, duration, notifications | Wraps |
| `block.list` | Items with title, meta, badges, actions | `items: [{ id, title, meta, badges, actions?, href? }]` | notifications, messages, confirmations, clients, inventory | Actions wrap under the text |
| `block.table` | Columns × rows | `columns`, `rows`, `caption` | duration, inventory, clients, shifts | Scrolls sideways inside itself |
| `block.schedule` | Time slots by resource, day or week | `range`, `resources`, `slots: [{ id, start, end, title, meta, actions? }]` | appointments, calendar, shifts | One resource with a labelled `Select` below `@md` (28rem); two up to `@2xl`; all from `@2xl`, scrolling inside if they do not fit |
| `block.proposal` (`ProposalCard`) | An AI proposal in parts, each 接受 / 拒绝 | `mode`, `parts: [{ id, text, state }]`, `source` | notifications, shifts, the frame's 待你确认, chat, `settings.profession` | Buttons wrap under each part |
| `block.text` | A short AI-written note with links | `body`, `links?` | duration, confirmations, notifications | `width: prose` |
| `block.empty` | An empty page with one next step | `title`, `body`, `action?` | todo, mail, files | — |

### Module frame (`ModuleFrame`, `/m/<ia-id>`)

- **Views:** `view: page · workflow · memory · child`. All share the header's first row — breadcrumb, the module name, and a `nav` of three links 页面 · 工作流 · 记忆 (`aria-current` on the open one). `page` adds the run-state line (上次运行 time · result; 下次运行; 正在运行 with `Spinner`; a failure `Alert` with the reason in words and a way to fix it), 待你确认 *n* (this module's deferred proposals, in a `Sheet`), 运行记录 (`Sheet`: one row per run — time, trigger, result, changes, workflow version) and 立即运行. `workflow`, `memory` and `child` take `title` and `children`; `child` is for a module's own sub-pages such as the pet file.
- **Routes (S11):** the parent route `/m/:moduleId` resolves the module in the current scene (an alias redirects — a promoted sub-module's old URL; unknown → not-found), and its index is the `page` view: `BlockRenderer` over `page(state, preview)` inside `DataState`. **Child routes** come from every `src/screens/<area>/module-routes.tsx` (`{ path, match?, element }[]`); part 3 contributes `workflow`, `memory` and `pets/:petId`. The chat bar stays reachable in every view.

### Components

| Component | Source | Variants | States | Accessibility contract |
| --- | --- | --- | --- | --- |
| `ChatComposer` | `new` (`InputGroup`, `Textarea`, `Button`) | `placement: bar · thread · onboarding` | empty · typing · sending · disabled | Labelled textarea; Enter sends, Shift+Enter breaks the line; send button named; grows to six lines, then scrolls |
| `ChatMessageList` | `new` (`Item`, `Avatar`) | `readOnly?` | empty · streaming · error · long | `role="log"`, polite; each message names its author; attachments through the slot |
| `PersistenceSwitch` | `new` (`Switch`) | — | one-off · confirming · persistent | Switch named 设为长期 / Keep as a module; its description says what turning it on creates |
| `BlockRenderer` | `new` | — | ready · loading · empty · error | Each block a `section` named by its title; pin state exposed and announced |
| The seven blocks | `new` | table above | ready · loading · empty · error · long | `block.table` / `block.schedule`: named, focusable scroller; `block.proposal`: each part a group named by its text, the resolved state as text, focus moves to the next unresolved part |
| `ModuleFrame` | `new` | `view` (above) | run state: never-run · ok · running · failed | `h1` = module name (`page`) or the view's title; run state is text + icon in a status region; the three view links form a named `nav` |

Not registry items (single-use compositions in `src/shell/` and `src/chat/`): the shell, the 时间推进 device, the chat bar with its in-place panel, the thread page, the recent list.

## Additions to the design system

| Addition | Closest existing | Why it does not serve | Uses (≥2) |
| --- | --- | --- | --- |
| `ChatComposer`, `ChatMessageList`, `PersistenceSwitch` | `Textarea`, `Item`, `Switch` | The kit has no chat parts; D-30 requires the interview to use the same components as the chat | `chat.bar`, `chat.thread`, `onboarding.profession`, topic home |
| `BlockRenderer`, `ModuleFrame` | `Card` + page code | D-12 requires one frame and one assembly path for every module | 12 modules and sub-modules |
| The seven blocks | `Card`, `Table`, `Item` | D-12: a workflow may emit only registered blocks; each meets the two-workflow threshold (table above) | Listed per block |

No token is added. Both modes and every text size: R-09, R-11, R-12, R-14.

## Responsive and adaptive behaviour

| Surface | Compact shell | Medium | Expanded | Risky cells |
| --- | --- | --- | --- | --- |
| Shell | Sidebar off-canvas; header = menu button, breadcrumb (the one truncating slot), device as a named icon button; the preview line wraps beneath | Icon rail | Sidebar open, labels wrap | 320 × root 24 px: the header wraps to two rows; 1024 × root 24 px is compact — sidebar and layout must agree |
| Chat bar and panel | Composer full width; suggestions wrap onto rows; the panel's action row wraps | Same | Same | 320 × root 24 px and 768 × 200%: panel + composer leave `main` reachable |
| Module frame | Header stacks: name, view links, run state, then actions wrapping | Same | One row where it fits | en run-state text; three view links at 320 × root 24 px |
| Blocks | By container (table above): single column, one schedule resource | Pair only if the block area reaches 42rem | Usually paired | `block.schedule` at 320 × root 24 px; `block.table` with seven columns |
| Sheets (approvals, history) | `bottom`; content scrolls, close stays visible | `end` | `end` | 768 × 200% |

## Accessibility

- **Landmarks and order:** skip link → `nav` (模块导航) → `header` → `main` → the chat bar (`region` 与 AI 对话). One `h1` per screen; a route change moves focus to it and sets the document title.
- **In-place panel:** a disclosure, not a dialog — sending expands it, focus stays in the composer, new messages are announced by the `log`, Escape collapses it. This is the kit's `Collapsible` behaviour.
- **Status without colour:** run result, behaviour mode, change markers, counts awaiting her and a proposal's pending / resolved state are icon + text.
- **Device:** a menu of radio items; the scene change and a forced preview are announced politely.
- **Departures from the kit's accessibility behaviour:** none. **Contrast pairs introduced:** none.

## Decisions and rejected alternatives

- **One sidebar holding module navigation and `chat.recent`** (a collapsed group), not a second panel: one navigation landmark, one compact pattern. Reopen: the owner wants the list beside the navigation at `G-1`.
- **适用 changes only on an accepted review** — otherwise stage 3 of the story shows no change (the workflow's "来过两次以上" branch reads the confirmed column).
- **Scenes are snapshots plus live key actions**, not a simulated clock: reproducible screenshots.
- **状态预览** in the device menu (was Q1; accepted under D-41): the four states cannot be reviewed on real screens without it. It is labelled 原型控制 and shows a status line while active.
- **The block contract lives with the runtime** so the two block packages and the frame never wait on each other's types.

## Owner gates

`G-SPEC` is waived once (D-41); the `new` rows above are covered and listed at `G-1` (part 1 § Owner gates carries the whole Notify list). `G-1`: part 3.

## Acceptance criteria

- [ ] **R-01** Store, model and every runtime action of § Fake workflow runtime exist with tests: each action's effect on the state, `effectiveMode` under each ceiling, `disconnectAccount` failing the dependent modules' next run, an alias resolving after `promoteSubModule` — `npm test`
- [ ] **R-02** For every resource the facade answers `ready`, `empty`, `loading`, `long` and `error` with its typed reason and its partial or stale data; `setPreview` forces all of them and the run state, survives navigation, resets on `jumpToScene` — tests enumerating the resources
- [ ] **R-03** Scene invariants: each `scene(id)` is deterministic; a breed's 实测平均 is the mean of its dogs' records (金毛 3 h 45); **before `s3` resolved every booking's 适用时长 is its breed row's, from `s3` resolved a dog with ≥ 2 visits is booked on its own record**; `s3` resolved changes memory rows and leaves the workflow at version 1; `s4` resolved has version 2 with exactly one added condition node and its edges; `e2` has two no-reply proposals in `notifications` — `npm test`
- [ ] **R-04** Story facts: a test enumerates every fact named in part 3's Screens table and criteria B-20…B-26 and finds it in the snapshot of the scene that shows it; every fixture string exists in both locales; the `long` and `empty` variants exist for every resource — `npm test`
- [ ] **R-05** Shell structure in every cell follows part 1's mode table (off-canvas / icon rail / open); no sideways scroll; with a test slot component in the bottom-bar row, the row sits below `main` and never overlaps it — `matrix /dev/shell` zero failures + screenshots at 320, 768, 1024, 1440 light zh-CN and 1024 × root 24 px dark en
- [ ] **R-06** The sidebar lists the seven base modules, the profession heading with the scene's modules and their nested sub-modules, 设置 and the preferences menu; `renameModule`, `addModule`, `removeModule` and `createSubModule` show at once; open-sidebar labels wrap in en — test + screenshot at 1440
- [ ] **R-07** Keyboard: skip link, sidebar, header, device, `main`, in order, no trap, at 1440 and 320; a route change moves focus to the `h1` — `matrix /dev/shell --keyboard` + test
- [ ] **R-08** Device: every scene reachable from the menu, by 上一幕 / 下一幕 and by keyboard; the jump is announced; the scene survives reload; 状态预览 forces each state, shows the status line with 恢复正常, resets on a scene jump and on reload; `IA-MAP.md` § Prototype devices names both devices and cites D-41 — tests + screenshots of the open menu at 320 and 1440 + `check:docs`
- [ ] **R-09** Component evidence for `ChatComposer`, `ChatMessageList` (empty, streaming, error, a 60-message list, a 2000-character message, an attachment through the slot), `PersistenceSwitch`; `matrix /dev/components?family=chat` zero failures — `npm test` + matrix
- [ ] **R-10** `BlockRenderer`: refuses an unknown block id; pairs `span: half` at a 42rem container and stacks below it (demo containers on both sides of the step); a pinned block keeps its index after the description is re-ordered and its state is announced; marks the titles named in a `ChangeSet` and counts them — tests + screenshots of the demo
- [ ] **R-11** Component evidence for `block.text`, `block.empty`, `block.proposal`, each in ready, loading, empty, error and long, marking the items its `ChangeSet` names; `matrix /dev/components?family=blocks` zero failures — `npm test` + matrix
- [ ] **R-12** Component evidence for `block.summary`, `block.list`, `block.table`, `block.schedule`, same states and markers; `block.table` and `block.schedule` scroll inside a named, focusable scroller; `block.schedule` shows one, two or all resources at the container steps; `matrix /dev/components?family=data-blocks` zero failures — `npm test` + matrix
- [ ] **R-13** After merging S7, S8, S9, S10: `verify`, `npm test` green; `matrix /dev/components` and `/dev/shell` zero failures — commands
- [ ] **R-14** `ModuleFrame`: each run state (never-run, ok, running, failed with its reason) as text + icon; 待你确认 and 运行记录 open sheets with focus handled; 立即运行 shows 正在运行 and then a new run; the four views share the first header row — component evidence + `matrix /dev/frame` + screenshots of the four run states at 1024 light and 320 dark
- [ ] **R-15** `/dev/frame` renders a page description of all seven blocks; after a run that changes two items exactly those items and their blocks are marked and the summary counts them; the next run clears them; a pin survives reload — test + screenshots at 320 and 1440
- [ ] **R-16** Routes: `/m/<ia-id>` resolves a module of the scene; a module without `module.ts` renders the stub pattern; an unknown id shows not-found; an alias redirects; a child route contributed by glob renders in its view and, with a test slot component in the bottom-bar row, that row stays reachable below it (the real bar: R-21) — tests
- [ ] **R-17** Chat bar: a scripted in-place prompt opens the panel above the bar with the screen's name in its heading; the screen behind stays operable; Escape collapses, focus returns to the composer, the toast names the topic; the `s0` thread prompt navigates to `chat.thread`; unscripted input gets the canned reply; streaming, error and long states as tabled — tests + screenshots of the open panel at 320 and 1440
- [ ] **R-18** `PersistenceSwitch` on → confirmation → the sub-module exists, appears in the sidebar under its parent, location = `/m/<id>/workflow`; the AI-raised proposal does the same; switching off archives it after the `AlertDialog`; accepting a scripted proposal whose `onAccept` is `saveNodeParams` adds a workflow version to the store — tests
- [ ] **R-19** `chat.thread`: the bottom bar is the thread's composer; header with topic, module link, `PersistenceSwitch`; `chat.recent` is collapsed on first load, expands, stays expanded after reload, opens a thread or a topic record; both show their four states under 状态预览 — tests + `matrix /chat/<id>` + screenshot at 768
- [ ] **R-20** In the shell the chat bar follows `main` in the tab order and, with the panel open, never covers content or the focused element — `flow panel-open` (`npm run matrix -- --flows panel-open`: opens the panel on `/dev/shell`, then tabs through, at 1440 and at 320 × root 24 px)
- [ ] **R-21** After merging S11, S12: `verify`, `npm test` green; `npm run matrix -- --all` zero failures — commands

## Work packages

Waves, integration legs and the frozen-file rule: part 1 § Work packages. `src/runtime/**`, `src/fixtures/**` and `src/blocks/types.ts` freeze at I3.

| # | Package | Owns (files) | Criteria | Est. tokens | Depends on | Planned handoff point |
| --- | --- | --- | --- | --- | --- | --- |
| S6 | Runtime: model, store, facade and preview, actions, block contract, scenes `e1`–`s1`, scripted chat | `src/runtime/**`, `src/blocks/types.ts`, `src/fixtures/**` | R-01, R-02 | 170K | I2 | After the model, store and actions, before the facade variants |
| S6b | Story data: scenes `s2`–`s5`, the `long` and `empty` variants, invariant and story-fact tests (reads part 3's Screens table) | `src/fixtures/**`, `src/runtime/**` (after S6, same worktree) | R-03, R-04 | 150K | S6 | After `s2`–`s3`, before `s4`–`s5` and the variants |
| S7 | App shell, sidebar, header, 时间推进 device, `/dev/shell` | `src/shell/**`, `src/screens/root/**`, namespace `shell`; the layout line in `src/app/RootLayout.tsx`; `IA-MAP.md` § Prototype devices | R-05 – R-08 | 180K | I3 | After the layout and sidebar, before the device and the keyboard pass |
| S8 | Chat components | `src/components/chat/**`, `components/chat.md`, namespace `chat-components` | R-09 | 120K | I3 | After the composer and the list |
| S9 | `BlockRenderer`, markers, pinning, `block.text` · `block.empty` · `block.proposal` | `src/block-renderer/**`, `src/blocks/{text,empty,proposal}/**`, `components/blocks.md`, namespace `blocks` | R-10, R-11 | 150K | I3 | After the renderer, before the three blocks |
| S10 | Data blocks `block.summary` · `block.list` · `block.table` · `block.schedule` | `src/blocks/{summary,list,table,schedule}/**`, `components/data-blocks.md`, namespace `data-blocks` | R-12 | 180K | I3 | After summary, list and table; `block.schedule` is the second leg |
| I4 | Merge wave 4 | Whatever the merge needs | R-13 | 40K | S7 – S10 | — |
| S11 | Module frame, `/m/<ia-id>` routes, `/dev/frame` | `src/module/**`, `src/screens/module/**`, `components/module.md`, namespace `module` | R-14, R-15, R-16 | 170K | I4 | After the frame and its sheets, before the routes |
| S12 | Chat surfaces: bar and in-place panel, persistence, thread, recent | `src/chat/**` (with `shell-slots.tsx`), `src/screens/chat/**`, `e2e/flows/panel-open.spec.ts`, namespace `chat` | R-17 – R-20 | 195K | I4 | After the bar and panel, before persistence, thread and recent |
| I5 | Merge wave 5 | Whatever the merge needs | R-21 | 45K | S11, S12 | — |

## Review plan

The first result review runs after I5 over parts 1 and 2 (part 1 § Review plan). For this part it probes hardest: the in-place panel by keyboard and through the accessibility tree, with the page behind still operable; the shell at 320 × root 24 px and at 1024 × root 24 px; dark mode on `/dev/frame` with long content, not on components; that the 适用 column does not move before `s3` resolved; that a forced preview is unmistakable on screen; the two scrolling blocks by keyboard; pinning after a re-order. VoiceOver is listed as **not checked** unless the reviewer could drive it.
