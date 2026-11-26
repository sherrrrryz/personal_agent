# Design spec: low-fi prototype — screens (modules, topics, workflow editor, memory, onboarding, settings, flows)

> Status: approved
> Task type: 1 low-fi
> Author: spec session `t1-spec` · Date: 2026-11-26
> Spec review: `pass with notes` (pass 3 at `f810aad`, 2026-11-26, `.orchestration/reviews/task1-spec-review.md`; pass 1 and 2 `changes requested`, all blocking and should-fix findings closed) · Approved by: owner waiver D-41, 2026-11-26 — `G-SPEC` waived once; marked `approved` by the orchestration session on the passing review

Part 3 of 3. It builds only from [lofi-prototype-system.md](lofi-prototype-system.md) ("part 1": base components, matrix harness, wave plan, frozen files, *component evidence*) and [lofi-prototype-shell.md](lofi-prototype-shell.md) ("part 2": runtime and its actions, scenes, shell, chat, blocks, `ModuleFrame`). Criteria here are `B-nn`; packages `C1…C7`, `I6`. No token and no kit file is added here.

## Goal

When this is done the owner can walk the pet-grooming manager's whole story in the running prototype: three onboarding steps, then every node of the IA map — the seven base modules, her four profession modules, two sub-modules born from conversations, topics, settings — and see the AI learn her grooming times across six stages: an in-place answer becoming a workflow on a node canvas, two memory tables filling, a deferred memory change, a workflow change shown as a diff and saved as version 2, and the archive in Topics. Every screen holds at 320 px, at 200% text, in dark and in both languages.

## Inputs

- `docs/design/IA-MAP.md` § Nodes, § Prototype flows, § Prototype devices, § Topics, sub-modules and chats; `docs/design/FOUNDATIONS.md` § Product brief (Prototype scope), § Verification matrix; parts 1 and 2
- Decisions: D-07, D-08, D-20, D-23 (topics, persistence, in-place) · D-10, D-12, D-13, D-16, D-22, D-28 (workflow, blocks, frame, canvas, ceiling, shared memory) · D-26, D-27 (story) · D-29, D-30, D-36, D-38 (profession modules, onboarding, re-entry, promotion) · D-34, D-35, D-37 (matrix, tools, stubs) · D-41
- Platform and kit: as part 1

## Scope

### In scope

- A screen for every page node of `IA-MAP.md` § Nodes; `todo`, `mail`, `files` as stubs (D-37); `profession` is a navigation heading, not a page
- The workflow editor (`<module>.workflow`) and the memory view (`<module>.memory`) for every module and sub-module
- Onboarding (three steps, shown once, re-enterable) and settings (home + three pages)
- The onboarding flow, the hero flow (stages 0–5) and the secondary flow as end-to-end acceptance; the full matrix run and the `G-1` evidence packet

### Out of scope

- What the story never touches: real triage in `todo` / `mail` / `files`; the restock flow (dropped, D-27); creating nodes or edges on the canvas; restoring an old workflow version; editing memory rows directly
- Search, filters and sorting beyond what a block provides; notifications outside the app; multi-user anything

## Design

### Screens and flows

Defaults for the States column — **loading:** `DataState` skeleton shaped like the content, with status text; **error:** the typed reason of part 2's facade put into the screen's own words, what still works, 重试. Only what is specific is written below. Every state of every screen is reached through 状态预览 and is produced by the package that owns the screen (its `page(state, preview)` or its screen component). "Frame" = `ModuleFrame`, `view: page`. An empty page uses `block.empty`; an empty collection inside a block or on a non-module screen uses `DataState`'s `empty` slot.

| IA node | Screen | Components used | States required |
| --- | --- | --- | --- |
| `onboarding.profession` | Step 1 of 3. Onboarding header (product name, 第 1 步，共 3 步 + `Progress`, `LocaleSelect`, `ThemeToggle`), then the interview: the AI asks four things in turn — what she does, how the work is organised, what recurs, what she tracks per dog and which tools she uses; her scripted answers are suggestion buttons; the AI closes with a summary and 继续 | `Page`, `ChatMessageList`, `ChatComposer` (`placement: onboarding`), `Button`, `Progress` | Empty: the AI's first question is already there. Loading: reply streaming. Error: reply failed → retry in the list. Long: a 40-message interview scrolls in `main`, composer stays |
| `onboarding.modules` | Step 2. The proposed set: 预约 · 顾客与宠物 · 商品与库存 · 排班, each with one line on what its workflow will do; per row 重命名 (`Dialog`), 移除 (undo in a toast); 添加模块 (`Dialog`: name + what it should do — the added module renders the stub pattern); primary 确认并生成; 上一步 | `Page`, `Item`, `Button`, `Dialog`, `Field`, `Input`, `Textarea`, `Sonner` | Empty (all removed): text + 添加模块; 确认 disabled with the reason as text. Loading: 正在生成模块建议 skeleton rows. Error: 生成失败 + 重试, 上一步 still works. Long: 12 modules, long names wrap |
| `onboarding.accounts` | Step 3. Connectors the confirmed modules draw on — 日历, 微信, 收款 first, then 更多 (Google, Slack, Figma, GitHub) — each naming the modules it feeds; 连接 opens a `Dialog` stating 原型：模拟授权; 稍后再连 allowed; primary 完成 → `/m/notifications` | `Page`, `Item`, `Badge`, `Button`, `Dialog`, `Collapsible` | Empty: a set needing no account says so and offers 完成. Loading: skeleton rows. Error: 授权失败 on the row + 重试. Long: en descriptions wrap |
| `root` · `chat.bar` · `chat.thread` · `chat.recent` | Part 2 § Shell, § Chat | — | Part 2 § Chat states table (R-17, R-19) |
| `notifications` | Frame. `block.summary` (待你确认 · 今天新增) · one `block.proposal` per deferred item from any module, naming its source module with a link · `block.list` of important items with a source-module badge. First screen after onboarding | Frame, blocks | Empty: `block.empty` 现在没有需要你处理的事. Error (`source-failed`): the rest still shows; the failure names the module. Long: 30 items; a five-part proposal |
| `messages` | Frame. `block.summary` (未读) · `block.list` of customer messages grouped by the module they were triaged into, each with a channel badge and a link to that module | Frame, blocks | Empty: 还没有消息；连接微信后会出现在这里 + link to `settings.accounts`. Error (`account-expired`): 微信授权已过期 + 重新连接. Long: a 200-character message wraps |
| `calendar` | Frame. `block.schedule` (week; one day when narrow) of her own events plus the bookings written by `profession.appointments`, each with a source badge and link · `block.list` 今天 | Frame, blocks | Empty: the grid still shows + 今天没有安排. Long: six overlapping bookings stack, none hidden |
| `todo` · `mail` · `files` | Stub (D-37): no `page` builder beyond `block.empty` saying what the module will do once connected + link to `settings.accounts`; run state 尚未运行; placeholder workflow (手动触发 → 来源：未连接 → 输出); empty memory view | Frame, `block.empty` | Empty is the screen. Loading, error: the frame's. Long: n/a |
| `topics` | Not a module (no frame). `Page`, `h1` 话题; a `Grid` of topic cards: AI-given title, first line of the summary, number of conversations, last activity, a badge when a sub-module grew from it | `Page`, `Grid`, `Card`, `Badge`, `DataState` | Empty: 你和 AI 的每次对话都会自动归到这里. Long: 40 topics; long titles wrap |
| `topics.<topic>` | `Page`: breadcrumb, `h1` = topic title; `Section` AI 摘要 (text, 根据 *n* 条对话整理, time); 相关模块 links; `Section` 对话记录 — each conversation a `Collapsible` (date, surface badge 就地回答 / 专门对话) opening a read-only `ChatMessageList`, with 继续对话 → `chat.thread` | `Page`, `Section`, `Collapsible`, `ChatMessageList`, `Badge`, `Button` | Empty: summary pending → 摘要生成中 (a topic always has a conversation). Error (`generation-failed`): summary failed, records still listed. Long: 20 conversations, a 60-message record |
| `profession.appointments` | Frame. `block.summary` (今天 · 待确认 · 空档) · `block.schedule` by groomer (周岚 · 小陈 · 阿杰): each slot = dog, breed, service, 预计 duration and **its basis in words** (默认 / 按品种表 / 按它自己的记录) with actions 开始 · 完成 · `block.list` 待安排. A slot opens the appointment `Sheet`: dog (link to its file), the estimate and why with a link to the deciding node, 开始 → 已开始 10:00, 完成 → a `Field` 实际耗时 (prefilled, editable) → `recordActualDuration` | Frame, blocks, `Sheet`, `Field`, `Input`, `Button` | Empty: 今天没有预约 + the next booked day. Error (`platform-unreachable`): the last good schedule stays, marked 上次同步. Long: 14 bookings a day; long dog and owner names |
| `profession.clients` | Frame. `block.summary` · `block.list` of dogs (name, breed, owner, 适用时长 + basis, 下次到店). **Pet file** (`/m/profession.clients/pets/<id>`, `ModuleFrame view: child`): `block.summary` (品种 · 毛长 · 体型 · 主人 · 适用时长 + basis · 下次到店), `block.text` 性格备注, `block.table` 每次到店 (日期 · 预计 · 实际 · 差值 · 美容师) — existing blocks, no new one | Frame, blocks, `Breadcrumb` | Empty: 还没有顾客档案. Pet file with no visit: 还没有到店记录，先按品种表估时. Long: 30 visits; a 300-character note |
| `profession.inventory` | Frame. `block.summary` (低于安全库存 · 本周销售) · `block.table` (商品 · 库存 · 安全库存 · 状态 as text) · `block.list` 补货建议 (static) | Frame, blocks | Empty: 还没有商品. Long: 30 rows scroll inside the table |
| `profession.shifts` | Frame. `block.summary` (本周工时 · 预约负载 · 净空出时间) · `block.schedule` (week × staff) · `block.proposal` (assisted) when durations change · `block.list` 换班申请 | Frame, blocks | Empty: 本周还没有排班. Long: en weekday and name labels |
| `…appointments.sub.duration` 服务时长 | Frame (breadcrumb 预约 › 服务时长). `block.summary` (已学习 *n* 只狗 · 平均偏差) · `block.table` 预计 vs 实际 per finished appointment with markers · `block.text` the rule in words and why | Frame, blocks | Empty (`s1`): 暂无记录——完成第一单后这里会更新. Long: 30 rows |
| `…appointments.sub.confirmations` 预约确认 | Frame. `block.summary` (已发 · 已回复 · 无回复) · `block.list` one row per customer with status text · `block.text` | Frame, blocks | Empty (`e1`): 今晚 19:00 第一次运行. Long: 20 customers |
| `<module>.workflow` · `<module>.memory` | § Workflow editor · § Memory view | below | below |
| `settings` | `Page`: three `Item` links, each with a live status line (3 个已连接 · 2 类任务已设置 · 4 个模块), and `Section` 显示 with `ThemeToggle` and `LocaleSelect` | `Page`, `Section`, `Item`, `DataState`, `ThemeToggle`, `LocaleSelect` | Empty (fresh workspace): 尚未连接账号 · 尚未设置 · 0 个模块. Loading: the status lines are skeletons, the links work. Error: 暂时读不到状态 on the line, the link still works. Long: en status lines wrap under the label |
| `settings.accounts` | The connector list of `onboarding.accounts` (one screen-level composition, both in C4): status as text (已连接 · 未连接 · 授权过期), the modules each feeds, 连接 / 断开 (`AlertDialog` naming the modules that will stop) | `Page`, `Item`, `Badge`, `Button`, `Dialog`, `AlertDialog`, `DataState` | Empty: 没有可连接的账号. Loading: skeleton rows. Error: the list cannot load + 重试; per row 授权过期 + 重新连接. Long: en; a connector feeding eight modules wraps its badges |
| `settings.ai-modes` | One row per kind of task — 给顾客发消息 · 修改预约 · 调整排班 · 修改规则和工作流 · 下单补货 · 整理归档 — each a `BehaviourModePicker` with a fourth option 未设置（由 AI 决定，默认协助）; a lead paragraph says the setting is a **ceiling** (D-22); each row lists the workflow actions it currently caps, with links | `Page`, `Section`, `BehaviourModePicker`, `Field`, `Collapsible`, `DataState` | Empty (a row capping nothing): 目前没有受此设置影响的动作. Loading: skeleton rows. Error: load failed + 重试; a failed save restores the previous choice with the error as text beside the field. Long: a row capping 12 actions shows five and 展开全部 |
| `settings.profession` | The module set as in `onboarding.modules` (重命名 · 移除 with `AlertDialog` · 添加 · 重新生成 with `AlertDialog`); 重新进行职业访谈 → `/onboarding/profession` in re-entry mode (D-36): 取消 returns here; finishing step 2 applies the set and returns here, step 3 appears only if a new module needs an unconnected account. `Section` 升级建议: from `s4`, a `ProposalCard` to promote 服务时长 to a top-level module (D-38) | `Page`, `Section`, `Item`, `Button`, `Dialog`, `AlertDialog`, `ProposalCard`, `DataState` | Empty set: text + 添加; empty 升级建议: 暂无建议. Loading, error: defaults. Long: 12 modules |

One primary action per screen: the step's 继续 / 确认 / 完成 in onboarding; the first unresolved proposal in `notifications`; 开始 or 完成 of the next appointment; 保存 in a node's inspector; 批准 on a pending diff.

### Workflow editor (`/m/<ia-id>/workflow`, `ModuleFrame view: workflow`)

- **Layout:** version line (版本 *n*（当前）, 历史), a `ToggleGroup` 画布 / 步骤列表, a visible one-line hint (用 Tab 在步骤间移动，回车查看和调整), then the view. Both views exist in every cell; **步骤列表 is the default in the compact shell**, the canvas otherwise. The chat bar stays below.
- **Canvas:** `WorkflowCanvas` on `@xyflow/react`: pan and zoom only. Nodes are **not draggable, connectable or deletable** (read-and-adjust, D-10), so no drag needs an alternative. Positions come from a rank layout in flow order, computed from **measured node sizes** and a gap read from the spacing scale — never typed coordinates — so nodes cannot overlap at 200% text. Zoom controls (放大 · 缩小 · 适应画面) are our `Button`s, not the library's control component (D-16). Our overrides of the library's variables sit in one CSS file as `var()` references to tokens; its colour mode follows `.dark`; edges are not animated.
- **Node kinds** (`WorkflowNode` = `Card` + kind icon + kind name as text + label + what it holds):

| Kind | Shows | Adjustable in the inspector |
| --- | --- | --- |
| trigger | Type as text (定时 · 账号事件 · 手动 · 来自模块) and its rule (每周一 09:00) | Time and weekday of a schedule |
| source | What it reads — an account, a module's output or a memory table — with a link | — (read-only, says why) |
| step | A one-line description; branches as text (来过两次以上：用这只狗的记录；否则：用品种表) | Named parameters, when the step has any |
| condition | The threshold in words (偏差超过 30 分钟) | The threshold (`Input type="number"` + unit) |
| action | What it does, the target module, a `BehaviourModeBadge` showing `effectiveMode`; when the ceiling is lower, 受上限限制 | Mode via `BehaviourModePicker` (options above the ceiling disabled with the reason) |
| output | The block it emits (title + block id) and 在页面中查看 | — |
| memory | Its tables by name, 被 *n* 个模块读取, link to the memory view | — |

- **Inspector:** selecting a node opens a `Sheet` (`end`; `bottom` in the compact shell) with the node's fields; 保存 calls `saveNodeParams`, creating a new version (author 你, reason in words: 你把复盘时间改为周一 09:00) and a toast; 取消 and Escape discard. Invalid input: error text beside the field. The editor re-renders whenever the store gains a version from elsewhere (the chat proposal of part 2).
- **Why this estimate:** `/workflow?node=<id>` opens with that node selected and in view — the target of the appointment sheet's link.
- **Diff (`mode: diff`, C6):** for a pending proposal and for 与上一版对比. Added and changed nodes and edges carry a `ChangeMarker` and a distinct border **style**, not colour alone; above the view a 变更摘要 list states each change in words (新增条件「第一次来的狗 +30 分钟」；连接：估算时长 → 新条件 → 设置预约时长). A pending proposal adds a `ProposalCard` with 批准 / 拒绝; 批准 calls `approveWorkflowChange`.
- **History (C6):** 历史 opens a `Sheet` listing versions (number, date, author AI / 你, reason) with 查看 and 与当前对比; an old version opens read-only under a banner. The frame's 运行记录 names the version each run used.
- **States:** empty → n/a (a stub's placeholder workflow has three nodes); loading → skeleton of the view; error → 无法载入工作流 + 重试, the header still works; long → a 25-node workflow: the canvas pans, 步骤列表 scrolls.

### Memory view (`/m/<ia-id>/memory`, `ModuleFrame view: memory`)

A view of the frame in `main` — **not an overlay**, so the page's chat bar stays usable while she reads it. `Tabs`, one per table. For `…sub.duration`: **品种大致时长** — 品种 · 类型 · 适用时长 · 依据 (你的经验 / 5 只的平均) · 实测平均（只数，范围）· 更新时间; rows with no observation carry 尚无数据 as text. **每只狗的实际耗时** — 狗 (link to its pet file) · 品种 · 到店次数 · 平均实际耗时 · 适用时长 + basis · 性格备注. Rows changed by the last run or the last accepted proposal carry a `ChangeMarker`. Below, `Section` 谁在读这份记忆: the reader modules as links with what each reads, and one sentence that memory is shared across the workspace — **there is no sharing control** (D-28). Read-only. States: empty → 这个模块还没有记住任何东西 (stubs; `s1`'s per-dog table says 暂无记录); loading; error → 无法载入记忆 + 重试; long → 40 rows scroll inside the table, tabs wrap.

### Components

| Component | Source | Variants | States | Accessibility contract |
| --- | --- | --- | --- | --- |
| `WorkflowCanvas` | `dependency` (`@xyflow/react`) | `mode: view · diff` | ready · loading · error | § Accessibility, canvas contract |
| `WorkflowNode` | `new` (`Card`, `Badge`) | `kind` (seven); `diff: added · changed · none` | default · focus · selected | Name = kind, label, mode if an action, diff state if any; description names what it connects to |
| `WorkflowHandle` | `dependency` part | — | — | Decorative; not focusable |

## Additions to the design system

| Addition | Closest existing | Why it does not serve | Uses (≥2) |
| --- | --- | --- | --- |
| `WorkflowCanvas`, `WorkflowNode`, `WorkflowHandle` | Nothing in the kit (known gap, D-16) | shadcn/ui has no node canvas | The editor of all 12 modules and sub-modules; view and diff |

Screen-level compositions that stay local (built from registered components, one screen type each): the onboarding header, the connector list (two screens, both in C4), the appointment sheet, the pet file, the node inspector, 步骤列表, the version-history sheet.

## Responsive and adaptive behaviour

Shell modes per cell: part 1 § Responsive (1024 × root 24 px and every 200% cell are **compact**). Blocks follow their container (part 2).

| Screen | Compact shell | Medium / expanded | Risky cells |
| --- | --- | --- | --- |
| Onboarding | Header wraps to two rows; step actions stack, primary first in DOM order; the composer stays at the block end | Single column, `width: prose`, centred | 320 × root 24 px en: 确认并生成 / "Confirm and generate" wraps, never clips |
| Module pages | One column; `block.schedule` one resource or one day with a `Select`; tables scroll inside | Half blocks pair where the block area reaches 42rem; more resources by container | `profession.appointments` at 320 × root 24 px; slot actions stay ≥ 44 px |
| Pet file, topic home, settings | One column, `width: prose` | Same; summary items wrap in a `Grid` | 300-character notes; en labels; 12 capped actions |
| Topics | One card per row | Two to four by `Grid min` | Long titles |
| Workflow editor | 步骤列表 default; the canvas is reachable, pans inside its box, block size bound in `rem` with a `dvh` cap; inspector `bottom` | Canvas default, fit to view; inspector `end` | 768 × 200%: the canvas must not trap scrolling; nodes at root 24 px must not overlap |
| Memory view | Table scrolls inside; tabs wrap | Same, wider | Seven columns at 320 × root 24 px |
| Sheets (appointment, inspector, history) | `bottom`, content scrolls, close stays visible | `end` | 200%: actions wrap under the fields |

Every label is checked at its longer language; nothing truncates on these screens. Motion: the kit's and the canvas's fit-to-view, instant under reduced motion.

## Accessibility

- **Canvas keyboard contract** (checked against `@xyflow/react` 13.0.3's own keyboard support at install; where the library differs, our wrapper supplies the behaviour): the canvas is a named region (工作流画布); Tab moves through nodes **in flow order**, then to the zoom buttons and out — no trap; a focused node is panned into view and shows the focus indicator (`border.width.focus`); Enter or Space opens its inspector and moves focus into it; Escape closes and returns focus to the node; edges are not focusable — each node's description names what it connects to (接到：设置预约时长、建议排班调整).
- **步骤列表** is the equivalent for screen-reader users and small screens: an ordered list in flow order, each item a button with the node's name opening the same inspector; branches are nested lists. The hint announces it.
- **Diff** is conveyed three ways: `ChangeMarker` text, border style, and the 变更摘要 list, first in reading order.
- **Tables** (memory, pet file, 预计 vs 实际): header cells, caption, row header = the dog or breed.
- **Timing actions:** 开始 / 完成 name the dog (开始：豆豆的美容); the recorded duration is announced politely.
- **Onboarding:** the step indicator is text plus `Progress`; moving between steps moves focus to the step's `h1`.
- **Contrast pairs introduced:** none. **Departures from the kit's accessibility behaviour:** none.

## Decisions and rejected alternatives

- **Memory as a view of the frame, not a sheet** (IA says "panel"): a modal sheet would cover the chat bar exactly where she asks "why 3 小时 20 分?". Notify at `G-1`.
- **Read-only memory, no node creation, no version restore** — the story needs none. Reopen: the owner asks at `G-1`.
- **步骤列表 beside the canvas** rather than the canvas alone: at 320 px and for a screen reader a canvas alone loses content (hard rule 11). Rejected: hiding the editor on small screens.
- **Layout from measured sizes**; rejected: coordinates in fixtures — they overlap at 200% and are raw lengths.
- **适用时长 and 实测平均 as separate columns** (part 2), so stage 2 (observed) and stage 3 (applied after approval) are both true on screen.
- **The pet file is a child route of `profession.clients`, not an IA node** (`IA-MAP.md`: "one file per named dog" inside the module); the IA map is unchanged, the flow walk covers it through B-06, and the owner is told at `G-1` (so are the `/dev/*` routes). Reopen: the owner wants `profession.clients.<pet>` as a node.

## Owner gates

- **`G-SPEC`** — waived once (D-41). This part adds one Always-ask item, covered by the waiver and listed at `G-1`: the three canvas components. No primitive, no departure from kit accessibility, no licence or credential (account connection is simulated and says so).
- **`G-1`** (Review, not waived) — after the final independent review. The owner is shown: `npm run dev` at `/` after 重新开始; the matrix run copied to `/Users/axue/Documents/personal_agent/.orchestration/evidence/g1/` (index page, screenshots, `report.json`); both review verdicts and how each finding closed; **what the owner did not see at `G-SPEC`** — part 1's Notify list and every Additions row of the three parts; the cells no session could check (VoiceOver, real touch). **What to look at:** (1) the sidebar with 最近对话 inside it; (2) the in-place panel against a dedicated chat; (3) the canvas beside 步骤列表, and the stage-4 diff; (4) the two memory tables at stages 2 and 3; (5) all-grey low-fi — is the structure legible without colour.

## Acceptance criteria

`flow <name>` = a Playwright flow under `e2e/flows/`, run by `npm run matrix -- --flows <name>`; `matrix <route>` = part 1's 44 cells with zero failures, plus `--preview` 空 · 加载中 · 出错 at 320 and 1440 light zh-CN and `--preview` 超长内容 on the stress cells; *four states* = each one renders as tabled under 状态预览, asserted in a test.

- [ ] **B-01** Every page node of `IA-MAP.md` § Nodes is reachable by navigation alone from `/` (no typed URL), in every scene where it exists — `flow ia-walk`, asserting one `h1` and zero `axe` violations per node
- [ ] **B-02** `notifications`, `messages`, `calendar` render from their `page(state, preview)` in every scene; four states, with the partial and expired errors in words — tests + `matrix` on the three
- [ ] **B-03** `todo`, `mail`, `files`: frame, `block.empty`, run state 尚未运行 — test + `matrix /m/todo`
- [ ] **B-04** `topics` and `topics.<topic>`: cards, summary, records in a read-only `ChatMessageList`, 继续对话 navigates to `/chat/<id>`; four states — tests + `matrix /topics`, `/topics/duration-rule`
- [ ] **B-05** `profession.appointments`: schedule by groomer with each estimate's basis in words; the sheet's 开始 → 完成 calls `recordActualDuration`, and the page shows the new run's marker; four states — tests + `matrix`
- [ ] **B-06** `profession.clients` and the pet file: per-dog facts, every visit's 预计 / 实际, 适用时长 with its basis; 大福's file carries 不配合; four states — tests + `matrix` on the list and on 大福's file
- [ ] **B-07** `profession.inventory`, `profession.shifts`: blocks as tabled; shifts' 净空出时间 equals the sum of the week's duration changes; four states — tests + `matrix` on both
- [ ] **B-08** `…sub.duration` and `…sub.confirmations` homes render in every scene from `s1` / `e1`, breadcrumb under 预约, four states — tests + `matrix` on both
- [ ] **B-09** Component evidence for `WorkflowCanvas`, `WorkflowNode`, `WorkflowHandle`; all seven kinds render with the kind as text; Tab order = flow order; Enter opens the inspector, Escape returns focus to the node; zoom buttons reachable; no trap; `?node=` selects and reveals — `flow canvas-keyboard` at 1440 and 320 + tests
- [ ] **B-10** Inspector: saving a trigger time, a condition threshold and an action mode each create a version with a reason; invalid input shows its error; a version added to the store from outside re-renders the editor; with `setCeiling` below an action's mode the node shows the effective mode + 受上限限制 and the picker disables the options above — tests
- [ ] **B-11** Editor layout: at root 24 px and at 200% no two nodes overlap (bounding boxes measured) and no node text is clipped; 步骤列表 is the default in the compact shell and lists the same nodes in the same order; four states — `matrix /m/profession.appointments.sub.duration/workflow` + a measured-overlap assertion
- [ ] **B-12** Diff and history: a version diff marks exactly the added and changed nodes and edges and lists them in 变更摘要; 批准 on a pending proposal makes its version current; 历史 lists every version with author and reason; an old version opens read-only — tests + screenshots at 1440 light and 320 dark en
- [ ] **B-13** Memory view: tabs, 依据, 适用 and 实测 columns, markers, the reader list with links; no sharing control; the chat bar is operable beside it; four states — tests + `matrix /m/profession.appointments.sub.duration/memory`
- [ ] **B-14** Onboarding: with `pa.onboarded` unset `/` opens step 1; the scripted interview ends in the four proposed modules with one line each; rename, remove (undo) and add work; a connection is simulated and labelled; 完成 lands on `/m/notifications`; a reload does not show onboarding again; each step's four states — `flow onboarding` + tests + `matrix` on the three steps
- [ ] **B-15** Re-entry from `settings.profession` opens step 1; 取消 returns; finishing step 2 applies the set and returns; a module added there renders the stub pattern; `LocaleSelect` in the onboarding header switches language in place — tests
- [ ] **B-16** `settings` and `settings.accounts`: live status lines; status as text; 断开 names the affected modules and, afterwards, the header of an affected module's frame shows the failure with a link back (asserted on the frame header only); four states of both — tests + `matrix` on both
- [ ] **B-17** `settings.ai-modes`: choosing a ceiling calls `setCeiling`, the row lists the actions it now caps and `effectiveMode` of 设置预约时长 becomes 协助 under 修改预约 = 协助; 未设置 restores it; a failed save restores the choice with its error; four states — tests + `matrix /settings/ai-modes`
- [ ] **B-18** `settings.profession`: rename, add, remove (confirmed) show in the sidebar; at `s4` accepting the promotion makes 服务时长 a top-level profession module and its old URL redirects; four states — tests + `matrix /settings/profession`
- [ ] **B-19** After merging C1–C4: `verify`, `npm test` green; `npm run matrix -- --all --cells smoke` zero failures — commands
- [ ] **B-20** *Stage 0* (`s0`, `/m/profession.appointments`): 可乐（阿拉斯加）is booked for 2 h, basis 默认. The scripted sentence answers **in place**: a rule table 长毛大型 4 h · 短毛小型 2 h · 其他 3 h, the note that each dog is recorded by name, and a proposal to make it persistent — `flow hero-0`; screenshots 1440 light zh-CN, 320 dark en root 24 px
- [ ] **B-21** *Stage 1*: accepting creates `profession.appointments.sub.duration` 服务时长 in the sidebar under 预约 and lands on its canvas: triggers 预约新建或修改 and 每周一复盘 → source 顾客与宠物档案 → step 估算时长 → 设置预约时长 (自主) → 建议排班调整 to 排班 (协助) → 记录实际耗时 → condition 偏差超过 30 分钟 → 提议修改规则 (待确认) → a memory node with 品种大致时长 (seeded) and 每只狗的实际耗时 (暂无记录); the memory view lists 排班 as a reader; `profession.appointments` now books 可乐 for 4 h 按品种表 — `flow hero-1`; screenshots 1440 light zh-CN (canvas), 320 dark en (步骤列表), 768 light en
- [ ] **B-22** *Stage 2* (`s2`): the sub-module home shows 预计 vs 实际 per appointment with markers; per dog 平均实际耗时 豆豆 3 h 20 · 大福 4 h 10 · 雪球 2 h 10 · Max 3 h 05; breed rows 金毛 实测 约 3 h 45（5 只，3 h 20 – 4 h 10）with 适用 still 4 h（你的经验）, 比熊 实测 约 2 h 10, 边牧 约 3 h 05; unseen breeds say 尚无数据; bookings are still on the breed rows; the frame's 运行记录 lists the two weeks' runs — `flow hero-2`; screenshots 1024 light zh-CN of the home and of both memory tabs
- [ ] **B-23** *Stage 3* (`s3`): `notifications` holds one deferred proposal in two parts (金毛的大致时长改为 3 小时 45 分？ · 豆豆 3 小时 20 分，大福 4 小时 10 分？). After accepting both: both memory tables show the changed 适用 values with markers; the workflow is still version 1 and the canvas unchanged; `profession.appointments` books 豆豆 at 3 h 20 and 大福 at 4 h 10 (按它自己的记录) and 布丁 at 3 h 45 (按品种表); their pet files show the applied duration; `profession.shifts` shows the net freed time and an assisted proposal to open a slot — `flow hero-3`; screenshots 1440 light zh-CN of notifications before and after, 768 dark zh-CN of shifts
- [ ] **B-24** *Stage 4* (`s4`): a deferred proposal to add the condition 第一次来的狗 +30 分钟 opens the canvas in diff mode with the new node and its edges marked and listed; 批准 makes version 2 current; 历史 shows versions 1 and 2 with reasons; 运行记录 names the version per run; a first-visit dog's appointment explains +30 分钟（第一次来）and links to the node — `flow hero-4`; screenshots 1440 light zh-CN and 320 dark en root 24 px of the diff, 1024 light en of the history
- [ ] **B-25** *Stage 5* (`s5`): `topics` lists 服务时长规则; its home has a summary telling the seed rule, the stage-3 memory change and the stage-4 workflow change, the original conversation as a record, and a link to the sub-module — `flow hero-5`; screenshots 1440 light zh-CN, 320 light en
- [ ] **B-26** *Secondary flow* (`e1`): 明天有哪些预约？帮我给顾客发确认。 answers in place with tomorrow's list; turning `PersistenceSwitch` on creates `…sub.confirmations` with trigger 每天 19:00, 发确认 (自主), 无回复则提醒我 (待确认). (`e2`): its home is rewritten with markers and two no-reply items sit in `notifications` — `flow secondary`; screenshots 1024 light zh-CN of the canvas and of notifications
- [ ] **B-27** The six stages and two evenings are walkable end to end by keyboard alone, at 1440 and at 320 — `flow hero-keyboard` (no pointer events) + the session's recorded pass
- [ ] **B-28** In the editor the scripted prompt 把每周复盘改到周一早上 9 点 answers in place with a proposal; accepting shows the new version and its reason; in `s0` the 店庆 prompt opens a dedicated chat that then appears in `chat.recent` and in Topics — `flow editor-by-chat`, `flow thread`
- [ ] **B-29** `npm run matrix -- --all` — every screen × the scenes where it differs × 44 cells, the three previews at 320 and 1440, 超长内容 on the stress cells: zero failures — command + `report.json`
- [ ] **B-30** `npm run matrix -- --all --keyboard --reduced-motion --forced-colors --text-spacing` at 320 and 1440: every focusable reached with visible focus and no trap; no running animation; selected, pressed, current and focus states distinguishable in the forced-colours screenshots; no clipped text under text spacing — command + reviewed screenshots
- [ ] **B-31** The `G-1` evidence packet exists as § Owner gates lists it; `verify` and `npm test` green on the task branch; `COMPONENTS.md` index counts, `GOVERNANCE.md` § Budget "Now" column and every pitfall learned are written — commands + `check:docs`

## Work packages

Waves, integration legs and frozen files: part 1 § Work packages. C1–C4 are wave 6, in parallel after I5; then C6, C5, C7 one at a time on the task branch.

| # | Package | Owns (files) | Criteria | Est. tokens | Depends on | Planned handoff point |
| --- | --- | --- | --- | --- | --- | --- |
| C1 | Base-module pages, stubs, topics | `src/modules/{notifications,messages,calendar,todo,mail,files}/**`, `src/screens/topics/**`, namespaces `base-modules`, `topics` | B-02, B-03, B-04 | 190K | I5 | After the three full modules and stubs, before topics |
| C2 | Profession-module pages, pet file, sub-module homes | `src/modules/profession.*/**`, `src/screens/profession/**`, namespace `profession` | B-05 – B-08 | 200K | I5 | After appointments (with timing) and clients (with pet file), before inventory, shifts and the two homes |
| C3 | Workflow editor: canvas, nodes, 步骤列表, inspector, deep link | `src/components/workflow/**`, `src/screens/workflow/**` (except `diff/`, `history/`), `e2e/flows/canvas-keyboard.spec.ts`, `components/workflow.md`, namespace `workflow` | B-09, B-10, B-11 | 190K | I5 | After canvas, nodes and layout, before the inspector and 步骤列表 |
| C4 | Onboarding and settings | `src/screens/onboarding/**`, `src/screens/settings/**`, `e2e/flows/onboarding.spec.ts`, namespaces `onboarding`, `settings` | B-14 – B-18 | 195K | I5 | After onboarding, before settings |
| I6 | Merge wave 6 | Whatever the merge needs | B-19 | 50K | C1 – C4 | — |
| C6 | Diff, history, memory view | `src/screens/workflow/{diff,history}/**`, `src/screens/memory/**`, the `mode: diff` part of `src/components/workflow/**` (C3 is finished), namespace `workflow-history` | B-12, B-13 | 150K | I6 | After diff and history, before the memory view |
| C5 | Flow walk-through | `e2e/flows/**` except the three files owned elsewhere (S12's `panel-open`, C3's `canvas-keyboard`, C4's `onboarding`); fixes anywhere under `src/` | B-01, B-20 – B-28 | 180K | C6 | After `ia-walk` and stages 0–3, before stages 4–5, secondary and keyboard |
| C7 | Full matrix run, passes, evidence packet, close-out docs | Fixes anywhere under `src/`; the evidence folder; `COMPONENTS.md` index, `GOVERNANCE.md` § Budget, `UI-PITFALLS.md` | B-29, B-30, B-31 | 170K | C5 | After the `--all` run is green, before the passes and the packet |

A fix by C5 or C7 lands in the component, not in the screen (playbook step 6); a fix needed in a frozen file goes through the lead. If the matrix surfaces more than C7's second leg can fix, it hands off with the failing cells listed and the lead cuts a fix package.

## Review plan

The final independent review runs after C7 over the whole task (`REVIEW.md` row 1); the lead splits it by screen family if it will not fit 250K. Probe hardest: the canvas by keyboard and through the accessibility tree — order, names, focus return, no trap — and 步骤列表 as a true equivalent; node overlap at root 24 px; every wrapped control on real screens at 320 × root 24 px and 768 × 200%, both locales (D-06); dark mode on full screens with 超长内容; that stage 3 leaves the workflow at version 1 and stage 4 creates version 2; that every estimate on screen states its basis; the four states of every screen through 状态预览, including `settings`, `settings.ai-modes` and the chat surfaces; en text length on the frame header, onboarding actions and the memory table. The reviewer re-runs `npm run matrix -- --all`, runs Lighthouse on `notifications`, `profession.appointments` and the editor (D-35), and lists VoiceOver and real-touch passes as **not checked** unless it could drive them.
