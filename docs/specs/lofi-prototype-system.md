# Design spec: low-fi prototype — system (scaffold, theme, components, shell, chat, module frame, fake runtime)

> Status: draft
> Task type: 1 low-fi
> Author: spec session `t1-spec` · Date: 2026-11-26
> Spec review: pending · Approved by: —

Part 1 of 2. Part 2 — every IA screen, the workflow editor, the memory panel, the flow walk-through and the matrix run — is [lofi-prototype-screens.md](lofi-prototype-screens.md). Criteria are `A-nn` here, `B-nn` there; packages `S1…S10` here, `C1…C5` there.

## Goal

When this is done the owner can open the running prototype and find the whole machine the screens run on: a neutral grey app shell in light and dark, zh-CN and en, with module navigation, the bottom chat bar answering in place or opening a dedicated chat, one module frame that renders any module from registered blocks, and a fake workflow runtime whose 时间推进 control moves the pet-grooming story between its scenes. Every base component is taken from shadcn/ui, registered, tested and usable at 320 px and at 200% text.

## Inputs

- Brief, IA, base values: `docs/design/FOUNDATIONS.md` (§ Product brief, § UI kit, § Base values, § Verification matrix); `docs/design/IA-MAP.md` (§ Nodes, § Prototype flows, § Prototype devices); playbook `docs/design/tasks/1-lofi-prototype.md`
- Decisions: D-03, D-05, D-06 (kit, base values, kit-code exemption) · D-08, D-20, D-23, D-39 (chat) · D-10, D-12, D-13, D-16, D-22, D-28 (module, blocks, frame, canvas, modes, one workspace) · D-17, D-19, D-24, D-25 (locales, theme toggle, CJK stack) · D-26, D-27, D-37 (story) · D-32–D-35 (tooling, matrix) · D-04 (no Figma), D-31 (no vision doc), D-40 (orchestration)
- Platform and kit: web, React 19 + TypeScript, Vite 8; shadcn/ui CLI 4.23.1, style `base-nova`, Base UI primitives, lucide icons; Tailwind v4

## Scope

### In scope

- Tooling and scaffold; the token source with the placeholder theme; light/dark; zh-CN/en; test setup
- Layout primitives; every base component of the inventory below, registered with its accessibility contract
- App shell (`root`), `chat.bar`, `chat.thread`, `chat.recent`; theme and locale switches; the 时间推进 device
- Module frame, block registry (7 blocks), page-description model, what-changed markers, pinning
- Fake workflow runtime: data model, scenes, scripted chat, story fixtures in both locales

### Out of scope

- Module, topic, onboarding and settings screens, the workflow editor and memory panel, the flow walk-through, the full matrix run → part 2
- Real values: brand colour, Geist wiring, elevation, final radius → task 2; component styling → task 3
- Real backends, accounts, AI calls, persistence beyond `localStorage`; Figma (D-04); RTL (D-17); a high-contrast mode (D-18)
- Building workflows from scratch on the canvas (the editor is read-and-adjust, D-10)

## Design

### Tooling (exact versions, pinned without a range in `package.json`; registry checked 2026-11-26)

| Purpose | Package @ version | Notes |
| --- | --- | --- |
| Build | `vite` 8.3.8 (installed), `@vitejs/plugin-react` 6.3.0 | D-32 |
| Styling | `tailwindcss` 4.3.5, `@tailwindcss/vite` 4.3.5, `tw-animate-css` 1.4.0 | D-03 |
| Kit | `shadcn` CLI 4.23.1 (`init` style `base-nova`, base colour `neutral`), `@base-ui/react` 1.9.0, `lucide-react` 1.81.0, `class-variance-authority` 0.7.1, `clsx` 2.1.1, `tailwind-merge` 3.7.1, `sonner` 2.0.8, `@fontsource-variable/geist` 5.3.0 | Versions the CLI resolves win if they differ; S1 records the installed ones in `FOUNDATIONS.md` § UI kit. Geist is installed but **not imported** in task 1 (placeholder = system stack) |
| Canvas | `@xyflow/react` 13.0.3 | D-16; the only non-kit UI dependency; stylesheet imported from `node_modules` |
| Tokens | `style-dictionary` 5.8.0 | D-33; `npm run tokens:build` |
| Routing | `react-router` 8.5.3 (library mode, `createBrowserRouter`) | Not a UI kit; Notify at `G-SPEC` |
| Tests | `vitest` 5.1.2, `jsdom` 31.0.1, `@testing-library/react` 16.3.3, `@testing-library/user-event` 14.6.13, `@testing-library/jest-dom` 8.0.0, `vitest-axe` 0.1.0 + `axe-core` 4.14.1 | `npm test` = `vitest run`; `verify` gains `npm test`. If `vitest-axe` 0.1.0 fails under Vitest 5, S1 calls `axe-core` through a local matcher and records a Notify (D-35 names axe-core as the engine) |

| Matrix | `@playwright/test` 1.65.1 (Chromium only), `@axe-core/playwright` 4.14.1 | `npm run matrix` — open question Q2. Dev-only; drives the real browser through the verification matrix, writes screenshots and a measured report to `.orchestration/evidence/` (untracked) |

No i18n library and no state library: two locales and one in-memory store do not need them (§ Decisions).

### Code layout and conventions (S1 writes these into `COMPONENTS.md` § Conventions)

`src/components/ui/` kit files (never edited, D-06) · `src/components/<family>/` registered components, tests colocated · `src/shell/` · `src/chat/` · `src/module/` (frame) · `src/blocks/<name>/` · `src/runtime/` · `src/fixtures/` · `src/modules/<ia-id>/` (one module's workflow and page builder) · `src/screens/<area>/` · `src/i18n/` · `src/tokens/generated/`. Sub-parts are named `ParentPart`. Icons: `lucide-react` only.

**Glob registries keep parallel packages off shared files:** `src/i18n/messages/<namespace>.<locale>.ts`, `src/screens/<area>/routes.tsx`, `src/blocks/<name>/index.ts`, `src/modules/<ia-id>/module.ts` and each component's `*.demo.tsx` (shown on the gallery route `/dev/components`) are collected with `import.meta.glob`; no package edits a central index. The registry is split by family from the start (it will pass 40 rows): `docs/design/components/<family>.md` (`layout`, `actions`, `inputs`, `navigation`, `containers`, `feedback`, `data-display`, `chat`, `module`, `data-blocks`, `workflow` — one writer each), each carrying the registry columns **and** the accessibility-contract columns; `COMPONENTS.md` keeps the contract and an index, `ACCESSIBILITY.md` § Per-component contract points to the family files.

### Placeholder theme and tokens

- **Source:** `tokens/*.json` (DTCG): `color.json` — one primitive neutral ramp (the twelve lightness steps of `FOUNDATIONS.md` § Base values, chroma 0) and the semantic tier = **shadcn's role names**, each with a light and a dark value aliasing the ramp; **every role is grey, including `destructive` and `chart-1…5`** — danger is carried by icon and text (hard rule 13). `font.json` — `font.family.sans` = system-ui, then PingFang SC, Microsoft YaHei, Noto Sans CJK SC (D-25). `dimension.json` — `radius` (placeholder: the `sm` step of the shipped radius scale) and its derived steps; `size.target.min`, aliasing the primitive spacing step 11 (0.25rem × 11, on the shipped scale). Nothing else is invented.
- **Build:** Style Dictionary → `src/tokens/generated/tokens.css`: `:root` (light) and `.dark` blocks, aliases kept as `var()`, header "generated — do not edit". CSS names are shadcn's (`color.muted-foreground` → `--muted-foreground`); S1 records the name transform in `TOKENS.md` § One source and fills § Placeholder theme.
- **`src/index.css`** holds only: `@import` of Tailwind, `tw-animate-css`, the kit's stylesheet and `tokens.css`; `@custom-variant dark`; the `@theme inline` mapping (`var()` references only); `--color-*: initial` so **no stock palette utility exists** (`bg-red-500` cannot be written); shadow utilities reset so nothing casts a decorative shadow (overlays separate by `border`). The theme block that `shadcn init` writes is moved into `tokens/` and deleted from `src/index.css`.
- **Default scales:** Tailwind's shipped spacing, type, blur, motion and breakpoint scales are used as shipped through stock utilities (D-05); task 2 lifts them into the source. Breakpoints: compact `< 48rem`, medium `48–64rem`, expanded `≥ 64rem` (Tailwind `md`, `lg`); S1 fills `RESPONSIVE.md` § Breakpoints.
- **Modes (D-19):** `ThemeProvider` reads `localStorage` `pa.theme` (`system` default · `light` · `dark`), follows `prefers-color-scheme` while `system`; an inline script in `index.html` sets `.dark` and `color-scheme` before first paint.
- **Locale (D-24) — decided here:** `LocaleProvider` picks from `navigator.languages` (any `zh*` → zh-CN, otherwise en), sets `<html lang>`, and is overridden by `localStorage` `pa.locale`. **The user switches with `LocaleSelect`** (a labelled select, options in their own language: 中文 · English), present in three places: the shell's preferences menu, the `settings` home § 显示, and the onboarding header (settings are unreachable before the shell). Switching re-renders in place, no reload. Fixture content is `{ 'zh-CN', en }` pairs; dates, times and durations go through `Intl` (`3 小时 20 分` / `3 h 20 min`).

### Layout primitives (the only places page padding, gaps and breakpoints are decided)

`Page` (landmark `main` content, page padding, `width: prose | wide | full`, one `h1` slot) · `Stack` (vertical `gap`) · `Inline` (wrapping horizontal cluster, `gap`, `align`, `justify`) · `Grid` (`min` item width → intrinsic `auto-fit` columns, container-query based) · `Section` (heading level + optional actions + body). `gap` values are the names of the spacing scale; no primitive takes a raw number.

### Components

Kit rows are used as shipped from `src/components/ui/`; their keyboard and focus behaviour is Base UI's and must survive (`ACCESSIBILITY.md` § Behaviour patterns). **Wrappers exist only where our code must bind a token or narrow props.** Every row gets a test (render, each variant and state, keyboard, `axe`), a registry row and a contract row.

| Component | Source | Variants | States | Accessibility contract |
| --- | --- | --- | --- | --- |
| `Page`, `Stack`, `Inline`, `Grid`, `Section` | `new` | above | — | `Page` → `main`; `Section` → `section` named by its heading; no role otherwise |
| `Button` | `wrapped` (`button`) | `variant: primary · secondary · ghost · danger · link`; `size: sm · md · icon` | default · hover · focus-visible · pressed · disabled · loading | Native `button`; icon-only requires `aria-label` (type-enforced); `min-block-size`/`min-inline-size` = `size.target.min`, height `auto` (overrides the kit's fixed height); loading sets `aria-busy`, keeps the label |
| `Field` + `Input`, `Textarea`, `Select`, `Switch`, `RadioGroup`, `Label`, `InputGroup` | `kit` | kit's | default · focus · disabled · invalid · read-only | Every control inside `Field` (visible label = name, description, error text next to the field); min target via a `Field` class binding `size.target.min` |
| `Toggle`, `ToggleGroup` | `kit` | kit's | pressed / unpressed · disabled | `aria-pressed`; group = one tab stop, arrows move |
| `BehaviourModePicker` | `new` (`RadioGroup`) | `ceiling?` (options above it disabled, with the reason as text) | per option | Radio group named by its legend; each option = icon + name + one-line meaning |
| `Sidebar`, `Breadcrumb`, `Tabs`, `DropdownMenu` | `kit` | kit's | selected · disabled | `nav` landmarks named; current item `aria-current="page"`; tabs one tab stop |
| `Dialog`, `AlertDialog`, `Sheet`, `Tooltip`, `Collapsible` | `kit` | `Sheet side: end · bottom` | open / closed | Focus in, trapped, returned; Escape closes; tooltip never the only label |
| `Card`, `Separator`, `Table`, `Item`, `Avatar`, `Progress` | `kit` | kit's | — | `Table` with header cells and a caption, inside its own sideways scroller (focusable, named); `Avatar` decorative beside a name |
| `Badge`, `Alert`, `Sonner` (toast), `Skeleton`, `Spinner`, `Empty` | `kit` | kit's | — | Toasts polite, never the only place an error appears; `Skeleton`/`Spinner` inside a region with `aria-busy` |
| `DataState` | `new` | `state: ready · loading · empty · error`; slots `empty`, `error` | all four | Loading: `aria-busy` + status text; error: `Alert` with reason and a retry `Button`; state changes announced politely |
| `BehaviourModeBadge` | `new` (`Badge`) | `mode: autonomous · assisted · deferred` | — | Icon + text (自主 · 协助 · 待确认 / Autonomous · Assisted · Deferred); never colour alone |
| `ChangeMarker` | `new` (`Badge`) | `kind: new · updated · removed` | — | Icon + text (新 · 已更新 · 已移除); included in the parent's accessible name |
| `ThemeToggle`, `LocaleSelect` | `new` (`ToggleGroup`, `Select`) | — | — | Named group / labelled select; `LocaleSelect` options carry `lang` |
| `ChatComposer` | `new` (`InputGroup` + `Textarea` + `Button`) | `placement: bar · thread · onboarding` | empty · typing · sending · disabled | Labelled textarea; Enter sends, Shift+Enter new line; send button named; grows to 6 lines then scrolls |
| `ChatMessageList` | `new` (`Item`, `Avatar`) | — | empty · streaming · error | `role="log"`, polite; each message names its author; may embed a block or a `ProposalCard` |
| `PersistenceSwitch` | `new` (`Switch`) | — | one-off · persistent · confirming | Switch named 设为长期 / Keep as a module; description states what turning it on creates |
| `ModuleFrame` | `new` | `view: page · workflow` (compact header) | run state: idle-ok · running · failed · never-run | `h1` = module name; run state is text in a status region; 待你确认 *n* and 运行记录 are buttons opening `Sheet`s; 工作流 and 记忆 are links |
| `BlockRenderer` + blocks `block.summary`, `block.list`, `block.table`, `block.schedule`, `block.proposal` (`ProposalCard`), `block.text`, `block.empty` | `new` | per block, below | each block: ready · loading · empty · error · long | Each block is a `Section` named by its title, with a pin `Toggle` named 固定「title」 |
| `WorkflowCanvas` | `dependency` (`@xyflow/react`) | `mode: view · diff` | — | Contract and build in part 2 (package C3) |
| `WorkflowNode`, `WorkflowHandle` | `new` (`Card`, `Badge`) / `dependency` part | `kind: trigger · source · step · condition · action · output · memory`; `diff: added · changed · none` | default · focus · selected | Part 2 |

**Kit components deliberately not used** (S1 records in `COMPONENTS.md`): `Calendar` / date picker (pulls a second dependency; `block.schedule` covers the need), `Command`, `Carousel`, `Chart`, `Resizable`, `Drawer`.

### Shell (`root`) and chat

- **Structure:** a grid — kit `Sidebar` (inline-start), then a column of header / scrolling `main` / chat bar. The chat bar is a grid row, never an overlay, so it cannot cover content or the focused element. Expanded: sidebar open with labels. Medium: icon rail (kit `collapsible="icon"`). Compact: sidebar is the kit's off-canvas sheet, opened from the header's menu button.
- **Sidebar content, in order:** 基础 group — 通知 (with the count of items awaiting her), 消息, 日程, 待办, 邮件, 文件, 话题; group heading from `profession` (我的店 · 宠物美容) — 预约, 顾客与宠物, 商品与库存, 排班, each with its sub-modules nested one level; **最近对话 (`chat.recent`)** — a `Collapsible` group, **collapsed by default** (D-39), persisted, listing the ten latest conversations (title, topic, relative time, a 长期 badge); footer — 设置 and the preferences menu (`ThemeToggle`, `LocaleSelect`). In the icon rail 最近对话 is one icon button that expands the sidebar with the group open.
- **Header:** sidebar trigger, breadcrumb, and the 时间推进 device.
- **`chat.bar`:** `ChatComposer` plus, while the input is empty, up to three **suggestion buttons** carrying the current scene's scripted prompts. Sending opens the **in-place panel**: a `Collapsible` region above the composer (heading 关于：<current screen>, `ChatMessageList`, then one row: `PersistenceSwitch`, 在专门对话中打开, 关闭). It is non-modal — the screen behind stays usable — and takes at most half of the shell's block size, scrolling inside. Escape or 关闭 collapses it, returns focus to the composer and toasts 已归档到话题「…」 with a link (D-23). The scripted reply decides the surface: `in-place`, or `thread` → navigates to `chat.thread`. Unscripted input gets one honest canned reply (原型只演示脚本中的对话) in place.
- **One-off ↔ persistent (D-08):** turning `PersistenceSwitch` on shows an inline confirmation in the list — name (prefilled), parent module (prefilled from the screen's context), 创建 — then creates `<module>.sub.<name>`, adds it to the sidebar and navigates to its workflow. The AI may raise the same confirmation itself as a `ProposalCard` (接受 / 暂不). Turning it off asks in an `AlertDialog` and archives the sub-module (its conversations stay in Topics, D-20).
- **`chat.thread`** (`/chat/<id>`): `Page` with the topic title, a link to the module it concerns, `PersistenceSwitch`, `ChatMessageList`; **the bottom bar is this thread's composer** (no in-place panel on this screen).
- **Routes:** `/onboarding/<step>` · `/m/<ia-id>` · `/m/<ia-id>/workflow` · `/m/<ia-id>/memory` · `/topics`, `/topics/<id>` · `/chat/<id>` · `/settings`, `/settings/<page>`; `/` redirects to `/onboarding/profession` until onboarding is done, then to `/m/notifications`; unknown paths show a not-found `Empty`.

### Module frame and block model (D-12)

- **Frame:** header = module name (`h1`); run-state line (上次运行 time · result; 下次运行; 正在运行 with `Spinner`; a failure `Alert` with the reason and a way to fix it); 待你确认 *n* (deferred proposals of this module, in a `Sheet` of `ProposalCard`s); 运行记录 (`Sheet`: one row per run — time, trigger, result, number of changes, workflow version); 立即运行 (the manual trigger); links 工作流 and 记忆. Body = `BlockRenderer` over the latest run's page description inside `DataState`.
- **Page description:** `{ blocks: [{ key, block, title, span: full | half, props }] }`, emitted by the module's `page(state)` builder — the stand-in for its output nodes. `BlockRenderer` refuses an unregistered `block` id (dev error + an error `Alert`). Order is the workflow's; `span: half` blocks pair up at expanded width and stack below it.
- **What changed:** each run stores a change set (per block `key` and per item id: `new · updated · removed`) computed against the previous run; the frame shows a `ChangeMarker` on the block title and on each changed item, and a summary line (本次运行：3 处更新). Markers clear on the next run.
- **Pinning:** a pinned block (its `key` stored per module) keeps its place at the top, in pin order, when a workflow edit re-orders the layout; its content still updates.
- **Initial block registry:**

| Block id | Shows | Props (shape) | Emitted by (≥ 2) |
| --- | --- | --- | --- |
| `block.summary` | A wrapping row of key figures | `items: [{ label, value, delta? }]` | appointments, inventory, shifts, duration, notifications |
| `block.list` | Items with title, meta, badges, actions | `items: [{ id, title, meta, badges, actions?, href? }]` | notifications, messages, confirmations, clients, inventory |
| `block.table` | Columns × rows, sideways scroll inside | `columns`, `rows`, `caption` | duration (预计 vs 实际), inventory, clients (visits), shifts |
| `block.schedule` | Time slots by resource for a day or a week | `range`, `resources`, `slots: [{ id, start, end, title, meta, actions? }]` | appointments (by groomer), calendar, shifts |
| `block.proposal` | An AI proposal in parts, each 接受 / 拒绝 | `mode`, `parts: [{ id, text, state }]`, `source` | notifications, shifts, the frame's 待你确认, chat |
| `block.text` | A short AI-written note with links | `body`, `links?` | duration (why this estimate), confirmations, notifications |
| `block.empty` | Empty state with one next step | `title`, `body`, `action?` | todo, mail, files |

### Fake workflow runtime (`src/runtime/`, `src/fixtures/`)

- **Store:** one in-memory store read through `useSyncExternalStore`; state = `scene(id)` snapshot + the user's actions since the jump. `localStorage` keeps `pa.scene`, `pa.onboarded`, `pa.theme`, `pa.locale`, pins and the sidebar state. Time is the scene's `storyTime`, never the wall clock, so screenshots are reproducible. Every read goes through an async facade with a fixed simulated delay so loading states are real.
- **Model:** `Module { id (IA id), kind: base | profession | sub, parentId?, name, icon, stub?, workflowId, memoryTableIds }` · `Workflow { id, moduleId, current, versions: [{ n, at, author: ai | user, reason, nodes, edges }] }` · `WfNode { id, kind (7 kinds), label, params, trigger?: schedule | event | manual | module, mode?, emits? (block key), table? }` · `Run { id, moduleId, at, trigger, version, result: ok | failed | running, reason?, changes, page }` · `MemoryTable { id, ownerModuleId, name, columns, rows, readers: moduleId[] }` · `Proposal { id, moduleId, mode, parts, state }` · `Conversation { id, topicId, moduleId?, surface: in-place | thread, persistence, subModuleId?, messages }` · `Topic { id, title, summary, conversationIds, moduleIds }` · `Account`, `ModeSetting { taskKind, ceiling }`.
- **Split of a module:** `src/fixtures/` holds every story fact — modules, workflows with their versions, memory tables, runs' inputs, proposals, conversations, topics, per scene. `src/modules/<ia-id>/module.ts` (part 2) holds only the output side: `page(state)` and the handlers of the module's own block actions. **Runtime actions** (the only way a screen changes state): `sendMessage`, `createSubModule`, `archiveSubModule`, `promoteSubModule`, `resolveProposalPart`, `approveWorkflowChange`, `saveNodeParams`, `runModule`, `recordActualDuration`, `setCeiling`, `connectAccount`, `disconnectAccount`, `confirmModuleSet`, `togglePin`, `jumpToScene`.
- **Scenes — the 时间推进 device:** a labelled menu button in the header (原型控制 · 时间推进：<scene>) with radio items in two groups, plus 上一幕 / 下一幕 and 重新开始（回到首次使用）. 热身: `e1` 第一晚 · `e2` 第二晚. 主线: `s0` 今天 · `s1` 变成工作流 · `s2` 第 1–2 周 · `s3` 第 3 周 · `s4` 第 2 个月 · `s5` 回看. Jumping replaces the snapshot, keeps the current route when the module exists in that scene (else goes to 通知), and announces the scene in a live region. A scene's key action is live and lands on the same state as the next snapshot (accepting the proposal in `s0` yields `s1`; `s3` and `s4` each have a *pending* and a *resolved* half). The same menu carries **状态预览** (正常 · 空 · 加载中 · 出错 · 超长内容), which forces every `DataState` and the frame's run state on the current screen — the review aid for the four required states (open question Q1).
- **Fixtures (zh-CN with en pairs; the story's numbers are the data):** manager 周岚; groomers 小陈, 阿杰. Seed rule 长毛大型 4 h · 短毛小型 2 h · 其他 3 h. Dogs: 金毛 豆豆 3 h 20, 大福 4 h 10 (不配合), 麦芽 3 h 40, 奶茶 3 h 50, Lucky 3 h 45 (mean 3 h 45, range 3 h 20 – 4 h 10); 比熊 雪球 2 h 10; 边牧 Max 3 h 05; 阿拉斯加 可乐 (booked at the default 2 h in `s0`); 柯基 and 法斗 rows stay 尚无数据. From `s0` on the hero snapshots already contain the warm-up's `confirmations` sub-module. A *long content* variant has names and notes 40% longer and 30-row tables.

## Additions to the design system

| Addition | Closest existing | Why it does not serve | Uses (≥2) |
| --- | --- | --- | --- |
| Token `size.target.min` (2.75rem) | Tailwind spacing step 11 (same value) | A spacing step chosen by value is not a purpose (hard rule 5); the 44 px target floor must change in one place | `Button`, `Field` controls, sidebar items, tabs, toggles |
| Token `font.family.sans` with the CJK stack | shadcn `--font-sans` (Geist) | Geist has no CJK glyphs (D-25, already approved) | Every text in both locales |
| `Page`, `Stack`, `Inline`, `Grid`, `Section` | Kit `Card`, raw flex utilities | The kit has no layout primitives; without them every screen decides padding and breakpoints itself (playbook step 3) | Every screen |
| `Button` wrapper | Kit `button` | Fixed heights `h-6…h-9` clip at 200% and are under 44 px; icon-only can ship unnamed | Everywhere |
| `DataState` | `Skeleton`, `Empty`, `Alert` composed by hand | Four states on every data surface, hand-composed, drift apart and lose the announcements | Every block, lists, panels |
| `BehaviourModeBadge`, `BehaviourModePicker` | `Badge`, `RadioGroup` | The three modes need one icon + wording everywhere or colour becomes the carrier | Canvas action nodes, proposals, notifications, `settings.ai-modes`, node inspector |
| `ChangeMarker` | `Badge` | Same reason: one wording and icon for 新 / 已更新 | Frame block titles, block items, canvas diff, memory rows |
| `ThemeToggle`, `LocaleSelect` | `ToggleGroup`, `Select` | Bound to the providers; three placements each must stay identical | Shell menu, `settings`, onboarding |
| `ChatComposer`, `ChatMessageList`, `PersistenceSwitch` | `Textarea`, `Item`, `Switch` | The kit has no chat parts; three surfaces must behave as one (D-30 requires the same components) | `chat.bar`, `chat.thread`, `onboarding.profession`, topic home |
| `ModuleFrame`, `BlockRenderer` | `Card` + page code | D-12 requires one frame for every module | 12 modules and sub-modules |
| The 7 blocks | `Card`, `Table`, `Item` | D-12: a workflow may emit only registered blocks; each meets the two-workflow threshold (table above) | Listed per block |
| `WorkflowCanvas`, `WorkflowNode`, `WorkflowHandle` | Nothing in the kit (known gap, D-16) | No node canvas in shadcn/ui | Every module's and sub-module's editor |

Works in both modes and at every text size: shown by criteria A-06, A-08, A-09, A-23, A-24. The shell, the chat bar and the 时间推进 control are single-use compositions (`src/shell/`, `src/chat/`), not registry items.

## Responsive and adaptive behaviour

| Surface | 320 | 768 | 1024 | 1440 | Risky cells |
| --- | --- | --- | --- | --- | --- |
| Shell | Sidebar off-canvas; header = menu button + truncating breadcrumb (full path in the sheet) + device as an icon button with a name | Icon rail | Sidebar open, labels wrap | Same; `Page width` caps line length | 320 × root 24 px: header must wrap to two rows, not clip |
| Chat bar | Composer full width; suggestions wrap onto rows; the in-place panel's action row wraps | Same | Same | Same | 320 × root 24 px and 768 × 200%: panel + composer must leave `main` reachable (panel ≤ half, collapsible) |
| Module frame | Header stacks: name, run state, then actions wrapping; blocks single column | Same | `span: half` blocks pair | Same | Long zh/en run-state text; en labels ~40% longer |
| Blocks | `block.table` and `block.schedule` scroll sideways **inside** the block; `block.schedule` shows one resource at a time with a resource `Select` | Two resources | All resources | All | `block.schedule` at 320 × root 24 px |
| Sheets / dialogs | Full width, `side: bottom` | `side: end` | Same | Same | Sheet content at 200% scrolls inside, close button stays visible |

Components use container queries; only the shell and `Page` use viewport breakpoints. Truncation is allowed in exactly two text slots — breadcrumb and sidebar label in the icon rail — both with the full text reachable. Motion (collapsible, sheet, toast) is the kit's, inside `prefers-reduced-motion: no-preference`.

## Accessibility

- **Landmarks and order:** skip link → `nav` (模块导航) → `header` → `main` → chat bar (`region` 与 AI 对话). One `h1` per screen. Focus order = reading order; route changes move focus to the `h1` and set the document title.
- **In-place panel:** a disclosure, not a dialog — the composer's send expands it and focus stays in the composer; new messages are announced by the `log`; Escape collapses it. This is the kit's `Collapsible` behaviour, not a departure.
- **Status without colour:** run result, behaviour mode, change markers, deferred counts and the pending/resolved state of a proposal are always icon + text.
- **Targets:** every interactive element ≥ 44 × 44 CSS px through `size.target.min` (measured, A-08). **Focus:** the kit's ring; the placeholder `ring` value is chosen so the ring measures ≥ 3:1 on `background`, `card` and `sidebar` in both modes, ≥ 2 px thick.
- **Contrast pairs introduced** (S1 fills `TOKENS.md` § Contrast pairs with measured values, both modes): `foreground`/`background`, `card-foreground`/`card`, `popover-foreground`/`popover`, `primary-foreground`/`primary`, `secondary-foreground`/`secondary`, `muted-foreground`/`background` and `/muted`, `accent-foreground`/`accent`, `sidebar-foreground`/`sidebar`, `sidebar-accent-foreground`/`sidebar-accent` (4.5); `border`, `input`, `ring` on `background` (3).
- **Departures from kit accessibility behaviour:** none. `forced-colors`: selected and pressed states keep a border or icon, not background alone.
- **Screen reader:** VoiceOver pass per component by the result reviewer; a session that cannot drive it inspects the accessibility tree and reports "not checked".

## Decisions and rejected alternatives

- **Two specs, fifteen packages** rather than the lead's ten: the sizing guide puts the base components at ~500K and the frame + blocks + runtime at ~550K, each over one 250K package. Reopen: measured costs after wave 3 (`DECISIONS.md` § Measured costs).
- **One sidebar holding module navigation and `chat.recent`** (a collapsed group) rather than a second panel: one navigation landmark, one compact pattern. Reopen: the owner wants the recent list visible beside the navigation at `G-1`.
- **All-grey roles, including `destructive`** — forces meaning into icon and text now; task 2 restores the hue.
- **No i18n or state library; `react-router` for routing.** Reopen: a third locale, ICU plurals beyond `Intl.PluralRules`, or server data.
- **Wrappers only where needed** (`Button`); other kit controls are used as shipped and checked at 200% (D-06). Rejected: wrapping all 32 — a second copy of the kit to maintain.
- **Scenes are snapshots plus live key actions**, not a simulated clock — reproducible screenshots; nothing else is simulated (`IA-MAP.md` § Prototype devices).
- **Matrix cells, as combined here (D-34 names the axes):** 100% at 320 · 768 · 1024 · 1440; **200% zoom** at 768 · 1024 · 1440 (run as 384 · 512 · 720 CSS px viewports); **root 24 px** at all four widths; each × light/dark × zh-CN/en = 44 cells per screen. 320 at 200% zoom is not a cell: it is below the WCAG 1.4.10 floor, and 320 × root 24 px is the harder text case. Reduced motion, keyboard and the accessibility scan run once per screen at 1440 light zh-CN.
- **Q2 (for `G-SPEC`, proposed answer: yes):** add Playwright as a dev dependency so the matrix is a command (`npm run matrix [-- <route>]`): per cell it asserts no sideways page scroll, no clipped text (an element whose content overflows a hidden-overflow box), every target ≥ 44 × 44 CSS px, zero `axe` violations, and saves the screenshot. If refused, each package runs a seven-cell covering set by hand in the browser pane (320 · 768 · 1024 · 1440 light zh-CN 100%; 320 dark en root 24 px; 1440 dark en 200%; 1024 light en) and the reviewer re-runs it.
- **Q1 (for `G-SPEC`, proposed answer: yes):** may the 时间推进 menu also carry 状态预览 to force empty / loading / error / long content? Without it the four states cannot be reviewed on real screens. It is labelled 原型控制 and is not a product feature.

## Owner gates

- **`G-SPEC`** — approve both specs. From `HITL.md` § Always ask, approved here: every `new` row and both tokens in § Additions; the primitive additions are **none** (the placeholder ramp is the base values' own lightness steps); departures from kit accessibility: **none**; hard-rule exceptions: **none** beyond D-06. Notify: `react-router`; Geist installed but not wired; all-grey `destructive`; registry split by family; how the matrix cells combine. Open questions with a proposed answer: Q1 (状态预览), Q2 (Playwright).
- **`G-1`** — after the independent result review of both specs' packages: the running prototype plus the evidence packet built in part 2 (package C5).

## Acceptance criteria

- [ ] **A-01** `npm run verify` and `npm test` exit 0 on the task branch; `package.json` has no version range for the packages in § Tooling — command + `grep '"[\^~]' package.json` on those lines
- [ ] **A-02** `npm run tokens:build` regenerates `src/tokens/generated/tokens.css` byte-identically (`git diff --exit-code`); `src/index.css` contains no colour, length or duration literal and no `:root` value block — `check:design-values` + `grep -c oklch src/index.css` = 0
- [ ] **A-03** Every semantic role has a light and a dark value and all are chroma 0 — a token test over `tokens/color.json`; `bg-red-500` in a scratch file produces no CSS rule — build output grep
- [ ] **A-04** Theme: with no stored choice the app follows `prefers-color-scheme`; `setTheme` overrides and survives reload; `color-scheme` is set; no flash — provider tests + screenshots of the gallery route at 1440 light and dark + a reload with dark stored showing no light frame
- [ ] **A-05** Locale: `navigator.languages = ['zh-TW']` → zh-CN, `['fr']` → en; `setLocale` switches without reload and sets `<html lang>` — unit tests; no hard-coded UI string in `src/` outside `src/i18n/` and `src/fixtures/` — a test scanning for CJK characters and for missing keys between the two locales of every namespace
- [ ] **A-06** Layout primitives render at 320 px and at root 24 px with no sideways scroll and no fixed block size — component tests + screenshot of the primitives' demo route at 320 × root 24 px
- [ ] **A-28** `npm run matrix -- /dev/components` runs the 44 cells, writes screenshots and `report.json`, exits 0; it exits non-zero on a seeded fixture page with a sideways scroll, a clipped label and a 24 px target — command, both runs
- [ ] **A-07** Actions and inputs (`Button`, `Field` and its controls, `Toggle`, `ToggleGroup`, `BehaviourModePicker`): each has a test file (render, variants, states, keyboard path, `axe` no violations), a demo, a registry row and a contract row in its family file — `npm test` + row count = inventory count
- [ ] **A-08** `Button` (every variant and size) and every `Field` control measure ≥ 44 × 44 CSS px and grow with text — measured in the browser at 100% and at root 24 px, values recorded in the completion note
- [ ] **A-26** Navigation, containers and overlays (`Sidebar`, `Breadcrumb`, `Tabs`, `DropdownMenu`, `ThemeToggle`, `LocaleSelect`, `Dialog`, `AlertDialog`, `Sheet`, `Tooltip`, `Collapsible`, `Card`, `Separator`): same evidence as A-07; overlays also prove focus-in, trap, return and Escape — `npm test`
- [ ] **A-27** Feedback and data display (`Badge`, `Alert`, `Sonner`, `Skeleton`, `Spinner`, `Empty`, `Progress`, `DataState`, `BehaviourModeBadge`, `ChangeMarker`, `Table`, `Item`, `Avatar`): same evidence as A-07; `DataState` proves its four states and announcements — `npm test`
- [ ] **A-09** Every kit control in the inventory shows no clipped or overflowing text at 200% zoom and at root 24 px, in zh-CN and en, light and dark — screenshots of the component gallery route (`/dev/components`) at 1440 × 200% and 320 × root 24 px, both themes
- [ ] **A-10** Focus ring measures ≥ 3:1 on `background`, `card`, `sidebar`, both modes, and ≥ 2 px; every pair in § Accessibility is in `TOKENS.md` § Contrast pairs with its measured ratio at or above the requirement — measured values
- [ ] **A-11** Runtime: for each of the eight scenes `scene(id)` is deterministic and passes invariant tests — breed mean = mean of its dogs' records (金毛 = 3 h 45 at `s3`), a dog with ≥ 2 visits is booked on its own record, `s3` changes memory rows and not the workflow version, `s4` resolved has version 2 with one added condition node, `e2` has two no-reply proposals in `notifications` — `npm test`
- [ ] **A-12** Every fixture string exists in both locales; the long-content variant exists for every block — test
- [ ] **A-13** Shell at 320, 768, 1024, 1440: off-canvas / icon rail / open sidebar as specified, no sideways scroll, chat bar never covers content or the focused element — `npm run matrix -- /dev/shell` (the shell around placeholder content) zero failures + screenshots at the four widths, light zh-CN, and 320 × root 24 px dark en
- [ ] **A-14** Sidebar lists the seven base modules, the profession heading with its four modules and nested sub-modules, 设置; 最近对话 is collapsed on first load, expands, and stays expanded after reload — test + screenshot at 1440
- [ ] **A-15** The whole shell is operable by keyboard: skip link, sidebar, header, device menu, `main`, chat bar, in order, no trap; route change moves focus to the `h1` — keyboard-path test + recorded tab order
- [ ] **A-16** 时间推进: each scene is reachable from the menu, by 上一幕 / 下一幕 and by keyboard; the jump is announced; the scene survives reload; 状态预览 forces each of the four states — test + screenshot of the open menu at 320 and 1440
- [ ] **A-17** Chat bar: a scripted `in-place` prompt opens the panel above the bar with the screen's context in its heading; the screen behind stays operable; Escape collapses, focus returns to the composer, the toast names the topic; a scripted `thread` prompt navigates to `chat.thread`; unscripted input gets the canned reply — tests + screenshots at 320 and 1440 of the open panel
- [ ] **A-18** `PersistenceSwitch` on → confirmation → sub-module exists in the store, appears in the sidebar under its parent, route = its workflow; the AI-raised `ProposalCard` does the same; switching off archives it after the `AlertDialog` — test
- [ ] **A-19** `chat.thread`: the bottom bar is the thread's composer; the header shows topic, module link and `PersistenceSwitch`; `chat.recent` items open the thread or the topic record — test + screenshot at 768
- [ ] **A-20** `ModuleFrame` shows each run state (never-run, ok, running, failed with reason) as text + icon; 待你确认 and 运行记录 open sheets with focus handled; 立即运行 shows 正在运行 then a new run — tests + screenshots of the four run states at 1024 light and 320 dark
- [ ] **A-21** `BlockRenderer` renders a page description of all seven blocks, refuses an unknown block id, pairs `span: half` at ≥ 64rem and stacks below — test + screenshots at 320 and 1440
- [ ] **A-22** After a run that changes two items, exactly those items and their block carry a `ChangeMarker` and the summary line counts them; the next run clears them; a pinned block stays first after a layout change and its pin state is announced — test
- [ ] **A-23** `block.text`, `block.empty`, `block.proposal` each render ready, loading, empty, error and long content, in both locales and themes, without sideways page scroll at 320 × root 24 px — tests + gallery screenshots
- [ ] **A-24** `block.summary`, `block.list`, `block.table`, `block.schedule`: same as A-23; `block.table` and `block.schedule` scroll inside themselves and their scroller is keyboard-focusable and named; `block.schedule` at 320 shows one resource with a labelled `Select` — tests + gallery screenshots
- [ ] **A-25** `COMPONENTS.md` (conventions, index, kit-not-used table), the eleven family-file skeletons, `TOKENS.md` § One source / § Placeholder theme, `RESPONSIVE.md` § Breakpoints, `ACCESSIBILITY.md` § Per-component contract pointer, `FOUNDATIONS.md` § UI kit versions and § Commands, `docs/README.md` rows exist — `check:docs` green + reviewer read. (Family-file rows are filled by the package that builds the component.)

## Work packages

Waves: **1** S1 → **2** S2 → **3** S3 · S4 · S5 · S6 in parallel → **4** S7 · S9 · S10 in parallel → **5** S8 with part 2's C1 · C2 · C3 → C4 → C5. Parallel packages work in their own worktrees; the lead names the merge order (suggested: the table's order) and the next wave starts from the merged task branch. **`package.json`, the lockfile, `tokens/`, `src/index.css`, `index.html`, `vite.config.ts` and `design-values.config.json` are written by S1 only** (S1 installs every dependency and every kit file of the inventory and writes every `package.json` script: `test`, `tokens:build`, `matrix`); a later package that needs a change there stops and tells the lead, who serialises it.

| # | Package | Owns (files) | Criteria | Est. tokens | Depends on | Planned handoff point |
| --- | --- | --- | --- | --- | --- | --- |
| S1 | Scaffold, tooling, kit files, placeholder theme, test setup, doc skeletons | The seven root files named above, `components.json`, `tokens/`, `src/tokens/generated/`, `src/components/ui/**`, `src/hooks/**`, `src/lib/utils.ts`, `src/test/**`, `vitest.config.ts`, `docs/design/components/*.md` (skeletons), `COMPONENTS.md`, `TOKENS.md`, `RESPONSIVE.md`, `ACCESSIBILITY.md`, `FOUNDATIONS.md`, `docs/README.md` rows | A-01, A-02, A-03, A-10, A-25 | 190K | — | After `tokens:build` and `verify` are green, before the contrast measurements and doc skeletons |
| S2 | Providers, i18n core, layout primitives, router host, gallery route, matrix script | `src/main.tsx`, `src/App.tsx`, `src/app/**`, `src/i18n/**` (core + `common` namespace), `src/theme/**`, `src/components/layout/**`, `src/screens/dev/**`, `playwright.config.ts`, `e2e/matrix/**`, `docs/design/components/layout.md` | A-04, A-05, A-06, A-28 | 195K | S1 | After providers, i18n and primitives, before the matrix script |
| S3 | Base components A — actions, inputs | `src/components/actions/**`, `src/components/inputs/**`, family files `actions.md`, `inputs.md`, namespace `inputs` | A-07, A-08 | 150K | S2 | After `Button` and `Field` controls, before toggles and `BehaviourModePicker` |
| S4 | Base components B1 — navigation, containers and overlays | `src/components/navigation/**`, `src/components/containers/**`, `navigation.md`, `containers.md`, namespace `navigation` | A-26 | 170K | S2 | After navigation, before overlays |
| S5 | Base components B2 — feedback, data display | `src/components/feedback/**`, `src/components/data-display/**`, `feedback.md`, `data-display.md`, namespace `feedback` | A-27 | 165K | S2 | After feedback, before data display |
| S6 | Fake runtime, data model, scenes, scripted chat, fixtures | `src/runtime/**`, `src/fixtures/**` | A-11, A-12 | 200K | S2 | After the model, store and `e1`–`s1`, before `s2`–`s5` |
| S7 | App shell and 时间推进 device | `src/shell/**`, `src/screens/root/**`, namespace `shell`; the layout line in `src/app/RootLayout.tsx` (S2 is finished) | A-13, A-14, A-15, A-16 | 170K | S3, S4, S5, S6 | After the shell layout and sidebar, before the device and keyboard pass |
| S8 | Chat — composer, messages, bar + in-place panel, persistence, thread, recent | `src/chat/**`, `src/screens/chat/**`, `chat.md`, namespace `chat`; the chat-bar slot line in `src/shell/AppShell.tsx` (after S7 merged) | A-17, A-18, A-19 | 210K | S7 | After composer, list and in-place panel, before persistence and thread |
| S9 | Module frame, the generic `/m/<ia-id>` route, `BlockRenderer`, markers, pinning, `block.text` · `block.empty` · `block.proposal` | `src/module/**`, `src/screens/module/**`, `src/blocks/{text,empty,proposal}/**`, `module.md`, namespace `module` | A-20, A-21, A-22, A-23 | 220K | S3, S4, S5, S6 | After the frame and renderer, before the three blocks |
| S10 | Data blocks — `block.summary` · `block.list` · `block.table` · `block.schedule`; the kit-control pass at 200% | `src/blocks/{summary,list,table,schedule}/**`, `data-blocks.md`, namespace `blocks`; fixes from A-09 in `src/components/{actions,inputs,navigation,containers,feedback,data-display}/**` (their packages are finished; S9 does not write there) | A-09, A-24 | 200K | S3, S4, S5, S6 | After summary, list, table; `block.schedule` and the A-09 pass are the second leg |

## Review plan

One independent result review after wave 4 (system) and one after C5 (whole task, part 2). The system review probes hardest: every kit control at 200% and root 24 px in both locales (D-06) — especially `Select`, `Tabs`, `Badge`, sidebar items and `Sheet` headers; the focus ring's measured contrast in dark; the shell at 320 × root 24 px; dark mode on the shell with a full module page, not on components alone; the in-place panel by keyboard and by screen reader; `tokens.css` rebuilt byte-identical; that no package wrote a file outside its row.
