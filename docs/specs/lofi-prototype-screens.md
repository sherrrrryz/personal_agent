# Design spec: low-fi prototype — screens (modules, topics, workflow editor, memory, onboarding, settings, flows)

> Status: draft
> Task type: 1 low-fi
> Author: spec session `t1-spec` · Date: 2026-11-26
> Spec review: pending · Approved by: —

Part 2 of 2. It builds only from the inventory, shell, chat, module frame, blocks, runtime and scenes of [lofi-prototype-system.md](lofi-prototype-system.md) ("part 1"; its criteria are `A-nn`, its packages `S1…S10`). Criteria here are `B-nn`, packages `C1…C5`. Nothing here adds a token or a kit file.

## Goal

When this is done the owner can walk the pet-grooming manager's whole story in the running prototype: three onboarding steps, then every node of the IA map — the seven base modules, her four profession modules, two sub-modules born from conversations, topics, settings — and see the AI learn her grooming times across six stages: an in-place answer becoming a workflow on a node canvas, two memory tables filling, a deferred memory change, a workflow change shown as a diff and saved as version 2, and the archive in Topics. Every screen holds at 320 px, at 200% text, in dark and in both languages.

## Inputs

- IA and flows: `docs/design/IA-MAP.md` § Nodes, § Prototype flows, § Prototype devices, § Topics, sub-modules and chats; `docs/design/FOUNDATIONS.md` § Product brief (Prototype scope), § Verification matrix
- Decisions: D-07, D-08, D-20, D-23 (topics, persistence, in-place) · D-10, D-12, D-13, D-16, D-22, D-28 (workflow, blocks, frame, canvas, ceiling, shared memory) · D-26, D-27 (story) · D-29, D-30, D-36, D-38 (profession modules, onboarding, re-entry, promotion) · D-34, D-35, D-37 (matrix, tools, stubs)
- Platform and kit: as part 1; components, blocks and runtime actions only from part 1

## Scope

### In scope

- A screen for every page node of `IA-MAP.md` § Nodes (table below); `todo`, `mail`, `files` as stubs (D-37); `profession` is a navigation heading, not a page
- The workflow editor (`<module>.workflow`) and memory panel (`<module>.memory`) for every module and sub-module
- Onboarding (three steps, shown once, re-enterable) and settings (home + three pages)
- The onboarding flow, the hero flow (stages 0–5) and the secondary flow as end-to-end acceptance; the matrix run and the `G-1` evidence packet

### Out of scope

- Anything the story never touches: real triage in `todo` / `mail` / `files`; the restock flow (dropped, D-27); creating nodes or edges on the canvas; restoring an old workflow version; editing memory rows directly (memory changes through proposals and runs)
- Search, filters and sorting beyond what a block provides; notifications outside the app; multi-user anything

## Design

### Screens and flows

Defaults for the States column — **loading:** `DataState` skeleton shaped like the content, with status text; **error:** the reason in words, what still works, 重试; only what is specific to a screen is written below. All four states of every screen are reachable through 状态预览 (part 1, Q1). "Frame" = `ModuleFrame` with its run-state header; block ids are part 1's.

| IA node | Screen | Components used | States required |
| --- | --- | --- | --- |
| `onboarding.profession` | Step 1 of 3. Onboarding header (product name, 第 1 步，共 3 步 + `Progress`, `LocaleSelect`, `ThemeToggle`), then the interview: the AI asks four things in turn — what she does, how the work is organised, what recurs, what she tracks per dog and which tools she uses; her scripted answers are the suggestion buttons; the AI closes with a summary and 继续 | `Page`, `ChatMessageList`, `ChatComposer` (`placement: onboarding`), `Button`, `Progress` | Empty: the AI's first question is already there (never blank). Error: reply failed → retry in the list. Long: a 40-message interview scrolls inside `main`, composer stays visible |
| `onboarding.modules` | Step 2. The proposed set as a list: 预约 · 顾客与宠物 · 商品与库存 · 排班, each with one line on what its workflow will do; per row 重命名 (`Dialog`), 移除 (undo in a toast); 添加模块 (`Dialog`: name + what it should do); primary 确认并生成; 上一步 | `Page`, `Item`, `Button`, `Dialog`, `Field`, `Input`, `Textarea`, `Sonner` | Empty (all removed): text + 添加模块; 确认 disabled with the reason as text. Long: 12 modules, long names wrap |
| `onboarding.accounts` | Step 3. Connectors the confirmed modules draw on — 日历, 微信, 收款 first, then 更多 (Google, Slack, Figma, GitHub) — each naming the modules it feeds; 连接 opens a `Dialog` stating 原型：模拟授权; 稍后再连 allowed; primary 完成 → `/m/notifications` | `Page`, `Item`, `Badge`, `Button`, `Dialog`, `Collapsible` | Empty: n/a (fixed list). Error: 授权失败 on the row + 重试. Long: en connector descriptions wrap |
| `root` · `chat.bar` · `chat.thread` · `chat.recent` | Part 1 § Shell and chat | — | Part 1 (A-13…A-19) |
| `notifications` | Frame. `block.summary` (待你确认 · 今天新增) · one `block.proposal` per deferred item from any module, naming its source module with a link · `block.list` of important items, each with a source-module badge. First screen after onboarding | Frame, blocks | Empty: `block.empty` 现在没有需要你处理的事. Error: one source module failed → the rest still shows, the failure names the module. Long: 30 items; a five-part proposal |
| `messages` | Frame. `block.summary` (未读) · `block.list` of customer messages grouped by the module they were triaged into (预约 · 顾客与宠物 · 商品与库存), each with channel badge and a link to that module | Frame, blocks | Empty: 还没有消息；连接微信后会出现在这里 + link to `settings.accounts`. Error: 微信授权已过期 + 重新连接. Long: 200-character message wraps, never truncates |
| `calendar` | Frame. `block.schedule` (week; day at compact) of her own events plus the grooming bookings written by `profession.appointments`, marked with a source badge and a link · `block.list` 今天 | Frame, blocks | Empty: an empty week still shows the grid + 今天没有安排. Long: six overlapping bookings in one slot stack, none hidden |
| `todo` · `mail` · `files` | Stub (D-37): Frame with run state 尚未运行, `block.empty` saying what the module will do once connected + link to `settings.accounts`; placeholder workflow (手动触发 → 来源：未连接 → 输出) and an empty memory panel | Frame, `block.empty` | Empty is the screen. Loading, error: the frame's. Long: n/a |
| `topics` | Not a module (no frame). `Page` with `h1` 话题; a `Grid` of topic cards: AI-given title, first line of the summary, number of conversations, last activity, a badge when a sub-module grew from it | `Page`, `Grid`, `Card`, `Badge`, `DataState` | Empty: 你和 AI 的每次对话都会自动归到这里. Long: 40 topics; long titles wrap |
| `topics.<topic>` | `Page`: breadcrumb, `h1` = topic title; `Section` AI 摘要 (text, 根据 *n* 条对话整理, time); 相关模块 links to sub-modules; `Section` 对话记录 — each conversation a `Collapsible` (date, surface badge 就地回答 / 专门对话) opening a read-only `ChatMessageList`, with 继续对话 → `chat.thread` | `Page`, `Section`, `Collapsible`, `ChatMessageList`, `Badge`, `Button` | Empty: a topic always has ≥ 1 conversation; summary pending → 摘要生成中. Error: summary failed, records still listed. Long: 20 conversations, 60-message record |
| `profession.appointments` | Frame. `block.summary` (今天 · 待确认 · 空档) · `block.schedule` by groomer (周岚 · 小陈 · 阿杰): each slot = dog, breed, service, 预计 duration and **its basis in words** (按品种表 / 按它自己的记录 / 默认) with actions 开始 · 完成 · `block.list` 待安排. A slot opens the appointment `Sheet`: dog (link to its file), the estimate and why with a link to the deciding workflow node, 开始 → 已开始 10:00, 完成 → a `Field` 实际耗时 (prefilled, editable) → `recordActualDuration` | Frame, blocks, `Sheet`, `Field`, `Input`, `Button` | Empty: 今天没有预约 + next booked day. Error: booking platform unreachable; last good schedule stays, marked 上次同步. Long: 14 bookings a day; long dog and owner names |
| `profession.clients` | Frame. `block.summary` · `block.list` of dogs (name, breed, owner, 适用时长 + basis, 下次到店). **Pet file** (`/m/profession.clients/pets/<id>`, a child view under the frame's compact header): `block.summary` (品种 · 毛长 · 体型 · 主人 · 适用时长 + basis · 下次到店), `block.text` 性格备注, `block.table` 每次到店 (日期 · 预计 · 实际 · 差值 · 美容师) — composed from existing blocks, no new block | Frame, blocks, `Breadcrumb` | Empty: 还没有顾客档案. Pet file with no visits: table empty state 还没有到店记录，先按品种表估时. Long: 30 visits; 300-character note |
| `profession.inventory` | Frame. `block.summary` (低于安全库存 · 本周销售) · `block.table` (商品 · 库存 · 安全库存 · 状态 as text) · `block.list` 补货建议 (static; restock flow dropped) | Frame, blocks | Empty: 还没有商品. Long: 30 rows scroll inside the table |
| `profession.shifts` | Frame. `block.summary` (本周工时 · 预约负载 · 净空出时间) · `block.schedule` (week × staff) · `block.proposal` (assisted) when durations change · `block.list` 换班申请 | Frame, blocks | Empty: 本周还没有排班. Long: en weekday + name labels |
| `<module>.sub.<name>` — `…appointments.sub.duration` 服务时长 | Frame (breadcrumb 预约 › 服务时长). `block.summary` (已学习 *n* 只狗 · 平均偏差) · `block.table` 预计 vs 实际 per finished appointment with `ChangeMarker`s · `block.text` the rule in words and why | Frame, blocks | Empty (`s1`): 暂无记录——完成第一单后这里会更新. Long: 30 rows |
| `<module>.sub.<name>` — `…appointments.sub.confirmations` 预约确认 | Frame. `block.summary` (已发 · 已回复 · 无回复) · `block.list` one row per customer with status text · `block.text` | Frame, blocks | Empty (`e1`): 今晚 19:00 第一次运行. Long: 20 customers |
| `<module>.workflow` | § Workflow editor | § Workflow editor | § Workflow editor |
| `<module>.memory` | § Memory panel | § Memory panel | § Memory panel |
| `settings` | `Page`: three `Item` links with a status line each (3 个已连接 · 2 类任务已设置 · 4 个模块) and `Section` 显示 with `ThemeToggle` and `LocaleSelect` | `Page`, `Section`, `Item`, `ThemeToggle`, `LocaleSelect` | Static |
| `settings.accounts` | Same connector list as `onboarding.accounts` (one screen-level composition, both owned by C4): status as text (已连接 · 未连接 · 授权过期), the modules each feeds, 连接 / 断开 (`AlertDialog` naming the modules that will stop) | `Page`, `Item`, `Badge`, `Button`, `Dialog`, `AlertDialog` | Empty: n/a. Error: 授权过期 row + 重新连接. Long: en |
| `settings.ai-modes` | One row per kind of task — 给顾客发消息 · 修改预约 · 调整排班 · 修改规则和工作流 · 下单补货 · 整理归档 — each a `BehaviourModePicker` whose fourth option is 未设置（由 AI 决定，默认协助）; a lead paragraph says the setting is a **ceiling** (D-22); each row lists the workflow actions it currently caps, with links | `Page`, `Section`, `BehaviourModePicker`, `Field` | Static; saved state confirmed by a toast and by the row's own text |
| `settings.profession` | The module set as in `onboarding.modules` (重命名 · 移除 with `AlertDialog` · 添加 · 重新生成 with `AlertDialog`); 重新进行职业访谈 → `/onboarding/profession` in re-entry mode (取消 returns here, D-36); `Section` 升级建议: from `s4`, a `ProposalCard` to promote 服务时长 to a top-level module (D-38) | `Page`, `Section`, `Item`, `Button`, `Dialog`, `AlertDialog`, `ProposalCard` | Empty 升级建议: 暂无建议. Long: 12 modules |

One primary action per screen: the step's 继续 / 确认 / 完成 in onboarding; the first unresolved proposal in `notifications`; 开始 or 完成 of the next appointment; 保存 in a node's inspector; 批准 on a pending diff.

### Workflow editor (`/m/<ia-id>/workflow`)

- **Layout:** Frame with `view: workflow` (compact header: module name, link back to the page, 版本 *n*（当前）, 历史), a `ToggleGroup` 画布 / 步骤列表, a visible one-line hint (用 Tab 在步骤间移动，回车查看和调整), then the view. Both views exist at every width; **步骤列表 is the default below 48rem**, the canvas at and above.
- **Canvas:** `WorkflowCanvas` on `@xyflow/react`: pan and zoom only. Nodes are **not draggable, connectable or deletable** (read-and-adjust, D-10), so no drag needs an alternative. Positions come from a rank layout (flow order, inline-start → inline-end) computed from **measured node sizes** and a gap read from the spacing scale — never typed coordinates — so nodes cannot overlap at 200% text. Our overrides of the library's variables live in one CSS file and are `var()` references to tokens; its colour mode follows `.dark`. Edges are not animated.
- **Node kinds** (`WorkflowNode` = `Card` + kind icon + kind name as text + label + what it holds):

| Kind | Shows | Adjustable in the inspector |
| --- | --- | --- |
| trigger | Type as text (定时 · 账号事件 · 手动 · 来自模块) and its rule (每周一 09:00) | Time and weekday (schedule); nothing else |
| source | What it reads: an account, a module's output or a memory table, with a link | — (read-only, says why) |
| step | A one-line description; its branches as text (来过两次以上：用这只狗的记录；否则：用品种表) | Named parameters only, when the step has any |
| condition | The threshold in words (偏差超过 30 分钟) | The threshold (`Input type="number"` + unit) |
| action | What it does, the target module, a `BehaviourModeBadge`; when the user's ceiling is lower, the effective mode + 受上限限制 | Mode via `BehaviourModePicker` (options above the ceiling disabled with the reason) |
| output | The block it emits (title + block id) and 在页面中查看 | — |
| memory | Its tables by name, 被 *n* 个模块读取, link to the memory panel | — |

- **Inspector:** selecting a node opens a `Sheet` (`side: end`; `bottom` below 48rem) with the node's fields; 保存 calls `saveNodeParams`, creates a new version (author 你, reason generated in words: 你把复盘时间改为周一 09:00) and toasts it; 取消 and Escape discard. Invalid input: error text next to the field.
- **By talking (D-10):** in the editor the chat bar offers one scripted prompt (把每周复盘改到周一早上 9 点); the in-place reply is a `ProposalCard` with the change; accepting it produces the same new version.
- **Diff (`mode: diff`):** shown for a pending proposal and for 与上一版对比. Added and changed nodes and edges carry a `ChangeMarker` (新增 / 已更新) and a distinct border **style**, not colour alone; above the view a 变更摘要 list states each change in words (新增条件「第一次来的狗 +30 分钟」；连接：估算时长 → 新条件 → 设置预约时长). A pending proposal adds a `ProposalCard` with 批准 / 拒绝; 批准 calls `approveWorkflowChange` and the proposed version becomes current.
- **History:** 历史 opens a `Sheet` listing versions (number, date, author AI / 你, reason) with 查看 and 与当前对比; an old version opens read-only with a banner saying so. The frame's 运行记录 names the version each run used.
- **Why this estimate:** `/workflow?node=<id>` opens with that node selected and scrolled into view — the target of the appointment sheet's "why" link.
- **States:** empty → n/a (a stub's placeholder workflow has three nodes); loading → skeleton of the view; error → 无法载入工作流 + 重试, the header still works; long → a 25-node workflow: canvas pans, 步骤列表 scrolls.

### Memory panel (`/m/<ia-id>/memory`)

A route-addressable `Sheet` over the module page (`side: end`, wide; full-height `bottom` below 48rem), title 「<module>」的记忆. `Tabs`, one per table. For `…sub.duration`: **品种大致时长** — 品种 · 类型 · 适用时长 · 依据 (你的经验 / 5 只的平均) · 实测平均（只数，范围）· 更新时间; rows still on the seed carry 尚无数据 as text. **每只狗的实际耗时** — 狗 (link to its pet file) · 品种 · 到店次数 · 平均实际耗时 · 适用时长 + basis · 性格备注. Rows changed by the last run or the last accepted proposal carry a `ChangeMarker`. Below the tables, `Section` 谁在读这份记忆: the reader modules as links with what each reads, and one sentence that memory is shared across the workspace — **there is no sharing control** (D-28). Read-only. States: empty → 这个模块还没有记住任何东西 (stubs; `s1`'s per-dog table says 暂无记录); loading; error; long → 40 rows scroll inside the table, tabs wrap.

## Additions to the design system

None beyond part 1 § Additions. `WorkflowCanvas`, `WorkflowNode` and `WorkflowHandle` are admitted there and built here (C3). Screen-level compositions that stay local (one screen type each, built from registered components — not registry items): the onboarding header, the connector list (two screens, both in C4), the appointment sheet, the pet file view, the node inspector, 步骤列表, the version-history sheet.

## Responsive and adaptive behaviour

| Screen | 320 (and root 24 px) | 768 | 1024 / 1440 | Risky cells |
| --- | --- | --- | --- | --- |
| Onboarding | Header wraps to two rows; step actions stack, primary first in DOM order; interview composer stays at the block end | Single column, `width: prose` | Same, centred | 320 × root 24 px en: 确认并生成 / "Confirm and generate" wraps, never clips |
| Module pages | One column; `block.schedule` one resource (or one day) with a `Select`; tables scroll inside | Two resources; `span: half` still stacked | Paired half-blocks; all resources | `profession.appointments` at 320 × root 24 px; slot actions 开始 / 完成 stay ≥ 44 px |
| Pet file, topic home, settings | One column, `width: prose` | Same | Same; summary items wrap in a `Grid` | 300-character notes; en labels |
| Topics | One card per row | Two | Three, four (`Grid min`) | Long titles |
| Workflow editor | 步骤列表 default; canvas reachable, pans inside its box, block size bound in `rem` with a `dvh` cap; inspector `bottom` sheet | Canvas default, fit-to-view | Canvas + `end` sheet | 768 × 200% (384 px): canvas must not trap scrolling; nodes at root 24 px must not overlap |
| Memory panel | Full-height sheet; table scrolls inside; tabs wrap | `end` sheet | Same, wide | Seven-column table at 320 × root 24 px |
| Sheets (appointment, history, approvals) | `bottom`, content scrolls, close stays visible | `end` | `end` | 200%: actions wrap under the fields |

Both locales: every label is checked at its longer language; nothing is truncated on these screens. Motion: only the kit's (sheet, collapsible, toast) and the canvas's fit-to-view, which is instant under reduced motion.

## Accessibility

- **Canvas keyboard contract** (verified against `@xyflow/react` 13.0.3's own keyboard support at install; where the library differs, our wrapper supplies the behaviour): the canvas is a named region (工作流画布); Tab moves through nodes **in flow order**, then to the zoom controls (放大 · 缩小 · 适应画面, named buttons) and out — no trap; a focused node is panned into view and shows the focus ring; Enter or Space opens its inspector and moves focus into it; Escape closes and returns focus to the node; edges are not focusable — each node's description names what it connects to (接到：设置预约时长、建议排班调整). Accessible name of a node: kind, label, mode if an action, diff state if any (动作：设置预约时长，自主，新增).
- **步骤列表** is the non-visual equivalent: an ordered list in flow order, each item a button with the same name, opening the same inspector; branches are nested lists. It is the documented alternative for screen-reader users, announced in the hint.
- **Diff** is conveyed three ways: `ChangeMarker` text, border style, and the 变更摘要 list (first in reading order).
- **Tables** (memory, pet file, 预计 vs 实际): header cells, caption, row header = the dog or breed; the sideways scroller is focusable and named.
- **Timing actions:** 开始 / 完成 are buttons naming the dog (开始：豆豆的美容); the recorded duration is announced politely.
- **Proposals:** each part is a group named by its text with 接受 / 拒绝; the resolved state is text (已接受) and focus moves to the next unresolved part, or to the card's heading when none is left.
- **Onboarding:** the step indicator is text (第 2 步，共 3 步) plus `Progress`; moving between steps moves focus to the step's `h1`.
- **Contrast pairs introduced:** none (part 1's roles only). **Departures from kit accessibility behaviour:** none.

## Decisions and rejected alternatives

- **Read-only memory, no node creation, no version restore** — the story needs none of them and each is a screen of its own. Reopen: the owner asks at `G-1`.
- **步骤列表 beside the canvas** rather than the canvas alone: a node canvas at 320 px and for a screen reader loses content otherwise (hard rule 11, "nothing lost"). Rejected: hiding the editor on small screens.
- **Layout from measured sizes**, rejected: fixed coordinates in fixtures — they overlap at 200% and put raw lengths in code.
- **Memory as a sheet over the page** (IA: "panel"), the editor as a page (IA: "node canvas"). Reopen: memory grows beyond two tables.
- **The breed table shows 适用时长 and 实测平均 as separate columns**, so that stage 2 (observed) and stage 3 (applied after approval) are both true on screen.
- **Pet file as a child view of `profession.clients`**, not an IA node (`IA-MAP.md`: "one file per named dog" inside the module). No change to the IA map.

## Owner gates

- **`G-SPEC`** — approved together with part 1. From `HITL.md` § Always ask this part adds nothing: no new component beyond part 1's list, no primitive, no departure from kit accessibility, no licence or credential (account connection is simulated and says so).
- **`G-1`** (Review) — after the independent result review. The owner is shown: `npm run dev` at `/` after 重新开始; the matrix screenshots and `report.json` in `.orchestration/evidence/g1/` with an index page; the review verdict and how each finding closed; the Notify list; the cells no session could check (VoiceOver, real touch). **What to look at:** (1) the sidebar with 最近对话 inside it; (2) the in-place panel against a dedicated chat; (3) the canvas next to 步骤列表, and the stage-4 diff; (4) the two memory tables at stages 2 and 3; (5) all-grey low-fi — is the structure legible without colour.

## Acceptance criteria

`flow` = the Playwright flow test named, run by `npm run matrix -- --flows`; `matrix <route>` = `npm run matrix -- <route>` with zero failures over part 1's 44 cells. If part 1's Q2 is refused: flows become Vitest + Testing Library tests of the same steps, and `matrix` becomes the seven-cell covering set by hand.

- [ ] **B-01** Every page node of `IA-MAP.md` § Nodes is reachable by navigation alone from `/` (no typed URL), in every scene where it exists — flow `ia-walk`, which asserts one `h1` and zero `axe` violations per node
- [ ] **B-02** `notifications`, `messages`, `calendar` render from their `page(state)` in every scene; each shows its four states under 状态预览 — tests + `matrix /m/notifications`, `/m/messages`, `/m/calendar`
- [ ] **B-03** `todo`, `mail`, `files` show the frame, `block.empty`, a three-node placeholder workflow and an empty memory panel — test + `matrix /m/todo`
- [ ] **B-04** `topics` and `topics.<topic>`: cards, summary, records, 继续对话 opens the thread; four states — tests + `matrix /topics`, `/topics/duration-rule`
- [ ] **B-05** `profession.appointments`: schedule by groomer with each estimate's basis in words; the sheet's 开始 → 完成 records an actual duration, the `duration` sub-module runs and its table gains a row with a `ChangeMarker` — test + `matrix /m/profession.appointments`
- [ ] **B-06** `profession.clients` and the pet file: per-dog facts, every visit's 预计 / 实际, 适用时长 with its basis; 大福's file carries the 不配合 note — test + `matrix` on the list and on 大福's file
- [ ] **B-07** `profession.inventory`, `profession.shifts`: blocks as specified, four states — tests + `matrix` on both
- [ ] **B-08** Sub-module homes `…sub.duration` and `…sub.confirmations` render in every scene from `s1` / `e1`, breadcrumb under 预约, four states — tests + `matrix` on both
- [ ] **B-09** Editor: all seven node kinds render with kind as text; Tab order = flow order; Enter opens the inspector, Escape returns focus to the node; zoom controls reachable; no trap — flow `canvas-keyboard` + recorded tab order at 1440
- [ ] **B-10** Editor: saving a trigger time, a condition threshold and an action mode each create a new version with a reason; invalid input shows its error; the scripted chat prompt produces the same version — test
- [ ] **B-11** Editor at root 24 px and at 200%: no two nodes overlap (bounding boxes measured), no clipped node text; 步骤列表 is the default below 48rem and lists the same nodes in the same order — `matrix /m/profession.appointments.sub.duration/workflow` + a measured-overlap assertion
- [ ] **B-12** Diff and history: a version diff marks exactly the added and changed nodes and edges and lists them in 变更摘要; 历史 lists every version with author and reason; an old version opens read-only — test + screenshot at 1440 light and 320 dark en
- [ ] **B-13** Memory panel: tables, 依据, `ChangeMarker`s, the reader list with links; no sharing control exists; four states — test + `matrix /m/profession.appointments.sub.duration/memory`
- [ ] **B-14** Onboarding flow: with `pa.onboarded` unset `/` opens step 1; the scripted interview ends in the four proposed modules with one line each; rename, remove (undo), add work; a connection is simulated and labelled; 完成 lands on `/m/notifications`; a reload does not show onboarding again — flow `onboarding` + `matrix` on the three steps
- [ ] **B-15** Re-entry: `settings.profession` → 重新进行职业访谈 opens step 1, 取消 returns; `LocaleSelect` in the onboarding header switches language in place — test
- [ ] **B-16** `settings`, `settings.accounts`: status as text; 断开 names the affected modules and the affected module's frame then shows the failure with a link back — test + `matrix` on both
- [ ] **B-17** `settings.ai-modes`: setting 修改预约 to 协助 makes the action 设置预约时长 show 协助 · 受上限限制 on the canvas and disables 自主 in its picker; 未设置 restores it — test + `matrix /settings/ai-modes`
- [ ] **B-18** `settings.profession`: rename, add, remove (confirmed) change the sidebar; at `s4` accepting the promotion moves 服务时长 to a top-level profession module and old URLs redirect — test + `matrix /settings/profession`
- [ ] **B-19** *Stage 0* (`s0`, `/m/profession.appointments`): 可乐（阿拉斯加）is booked for 2 h, basis 默认. The scripted sentence answers **in place**: a rule table 长毛大型 4 h · 短毛小型 2 h · 其他 3 h, the note that each dog is recorded by name, and a `ProposalCard` offering to make it persistent — flow `hero-0`; screenshots 1440 light zh-CN, 320 dark en root 24 px
- [ ] **B-20** *Stage 1*: accepting creates `profession.appointments.sub.duration` 服务时长 in the sidebar under 预约 and lands on its canvas: triggers 预约新建或修改 and 每周一复盘 → source 顾客与宠物档案 → step 估算时长 → 设置预约时长 (自主) → 建议排班调整 to 排班 (协助) → 记录实际耗时 → condition 偏差超过 30 分钟 → 提议修改规则 (待确认) → memory node with 品种大致时长 (seeded) and 每只狗的实际耗时 (暂无记录); the memory panel lists 排班 as a reader — flow `hero-1`; screenshots 1440 light zh-CN (canvas), 320 dark en (步骤列表), 768 light en
- [ ] **B-21** *Stage 2* (`s2`): the sub-module home shows 预计 vs 实际 per appointment with markers; per dog 豆豆 3 h 20 · 大福 4 h 10 · 雪球 2 h 10 · Max 3 h 05; breed rows 金毛 实测 约 3 h 45（5 只，3 h 20 – 4 h 10）with 适用 still 4 h（你的经验）, 比熊 约 2 h 10, 边牧 约 3 h 05; unseen breeds say 尚无数据; the frame's 运行记录 lists the runs of the two weeks — flow `hero-2`; screenshots 1024 light zh-CN of the home and of both memory tabs
- [ ] **B-22** *Stage 3* (`s3`): `notifications` holds one deferred proposal in two parts (金毛的大致时长改为 3 小时 45 分？ · 豆豆 3 小时 20 分，大福 4 小时 10 分？). After accepting both: both memory tables show the changed rows with markers; the workflow is still version 1 and the canvas is unchanged; `profession.appointments` books 豆豆 at 3 h 20 and 大福 at 4 h 10 (按它自己的记录) and the new 金毛 at 3 h 45 (按品种表); their pet files show the applied duration; `profession.shifts` shows the net freed time (= the sum of the week's changes) and an assisted proposal to open a slot — flow `hero-3`; screenshots 1440 light zh-CN of notifications before and after, 768 dark zh-CN of shifts
- [ ] **B-23** *Stage 4* (`s4`): a deferred proposal to add the condition 第一次来的狗 +30 分钟 opens the canvas in diff mode with the new node and its edges marked and listed; 批准 makes version 2 current; 历史 shows versions 1 and 2 with reasons; the frame's 运行记录 names the version per run; a first-visit dog's appointment explains +30 分钟（第一次来）and links to the node — flow `hero-4`; screenshots 1440 light zh-CN and 320 dark en root 24 px of the diff, 1024 light en of the history
- [ ] **B-24** *Stage 5* (`s5`): `topics` lists 服务时长规则; its home has a summary telling the seed rule, the stage-3 memory change and the stage-4 workflow change, the original conversation as a record, and a link to the sub-module — flow `hero-5`; screenshot 1440 light zh-CN, 320 light en
- [ ] **B-25** *Secondary flow* (`e1`): 明天有哪些预约？帮我给顾客发确认。 answers in place with tomorrow's list; turning `PersistenceSwitch` on creates `…sub.confirmations` with trigger 每天 19:00, 发确认 (自主), 无回复则提醒我 (待确认). (`e2`): its home is rewritten with markers and two no-reply items sit in `notifications` — flow `secondary`; screenshots 1024 light zh-CN of the canvas and of notifications
- [ ] **B-26** The six stages and two evenings are walkable end to end by keyboard alone — flow `hero-keyboard` (no pointer events) + the session's recorded pass
- [ ] **B-27** `npm run matrix` over the route list of every screen × the scenes where it differs: zero failures; reduced-motion pass shows no running animation after opening a sheet, the in-place panel and a toast — command + `report.json`
- [ ] **B-28** Evidence packet for `G-1` exists (index page, screenshots, report, Notify list, not-checked list); `npm run verify` and `npm test` green on the merged task branch; `COMPONENTS.md` index counts, `GOVERNANCE.md` § Budget "Now" column and any pitfall learned are written — commands + `check:docs`

## Work packages

Runs after part 1's wave 4. C1 · C2 · C3 run in parallel with each other and with S8; C4 after S8 (it needs the chat components); C5 last, alone, as the only writer.

| # | Package | Owns (files) | Criteria | Est. tokens | Depends on | Planned handoff point |
| --- | --- | --- | --- | --- | --- | --- |
| C1 | Base-module screens, stubs, topics | `src/modules/{notifications,messages,calendar,todo,mail,files}/**`, `src/screens/topics/**`, namespaces `base-modules`, `topics` | B-02, B-03, B-04 | 190K | S7, S9, S10 | After the three full modules and stubs, before topics |
| C2 | Profession-module screens and sub-module homes | `src/modules/profession.*/**`, `src/screens/profession/**`, namespace `profession` | B-05, B-06, B-07, B-08 | 200K | S7, S9, S10 | After appointments (with timing) and clients (with pet file), before inventory, shifts and the two homes |
| C3 | Workflow editor and memory panel | `src/components/workflow/**`, `src/screens/workflow/**`, `src/screens/memory/**`, `e2e/flows/canvas-keyboard.spec.ts`, `docs/design/components/workflow.md`, namespace `workflow` | B-09, B-10, B-11, B-12, B-13 | 215K | S7, S9 | After canvas, nodes, inspector and 步骤列表, before diff, history and the memory panel |
| C4 | Onboarding and settings | `src/screens/onboarding/**`, `src/screens/settings/**`, `e2e/flows/onboarding.spec.ts`, namespaces `onboarding`, `settings` | B-14, B-15, B-16, B-17, B-18 | 185K | S8, C3 (B-17 reads the canvas) | After onboarding, before settings |
| C5 | Integration, flow walk-through, matrix run, evidence | `e2e/flows/**` (except C3's and C4's files); fixes anywhere under `src/` (every other package is finished); `.orchestration/evidence/g1/`; `COMPONENTS.md` index, `GOVERNANCE.md` § Budget, `UI-PITFALLS.md` | B-01, B-19–B-28 | 220K | All | After the flow tests pass, before the full matrix run and the packet |

A fix C5 makes lands in the component, not in the screen (playbook step 6). If the matrix run surfaces more than C5's second leg can fix, C5 hands off with the failing cells listed and the lead cuts a fix package.

## Review plan

Part 1's packages are reviewed after its wave 4 (part 1 § Review plan). The whole task is then reviewed after C5 (`REVIEW.md` row 1) by a session that wrote none of it; the lead splits that review by screen family if it will not fit 250K. Probe hardest: the canvas by keyboard and through the accessibility tree — order, names, focus return, no trap — and 步骤列表 as a true equivalent; node overlap at root 24 px; every kit control on real screens at 200% and root 24 px, both locales (D-06); dark mode on full screens with long content, not on components; that stage 3 really leaves the workflow at version 1 and stage 4 really creates version 2; that every estimate on screen states its basis; the four states on every screen through 状态预览; en text length on the frame header, onboarding actions and the memory table. The reviewer re-runs `npm run matrix` rather than trusting the packet, and lists VoiceOver and real-touch passes as **not checked** unless it could drive them.
