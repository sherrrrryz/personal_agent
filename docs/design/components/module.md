# Components — module frame

> Status: evergreen — the registry rows and the accessibility contract of
> the frame every module page, workflow view and memory view sits in. Contract every component meets, conventions and the
> index of families: `../COMPONENTS.md`.

<!--
HOW TO BUILD THIS FILE
- Skeleton written by package S1b of task 1; the rows are written by package
  S11 (`docs/specs/lofi-prototype-shell.md`, criteria R-14), in the same change
  that adds each component. One writer: nobody else edits this file.
- Admitted by the spec for this family: `ModuleFrame`.
- A row here and the code must agree — `src/test/registry-parity.test.ts`
  fails otherwise (`../COMPONENTS.md` § Conventions, "One component, one row").
-->

Code: `src/module/`.

## Registry

One row per component. The Component cell is the component's name in
backticks and nothing else. Source: `kit` · `wrapped` · `new` · `dependency`;
Status: `lofi` · `styled` · `deprecated → <replacement>` (`../COMPONENTS.md`
§ Registry).

| Component | Source | Variants | Status | Notes |
| --- | --- | --- | --- | --- |
| `ModuleFrame` | `new` | `view: page · workflow · memory · child`; `module` (the runtime's `Module`); `title` (every view but `page`); `width: prose · wide · full` (default `wide`); `basePath` (demo only); run state `never-run · ok · running · failed` (read from the runtime, never a prop) | `lofi` | **D-50:** no visible title or first row — the shell header's breadcrumb names the screen; the `h1` stays, visually hidden, for assistive technology, the breadcrumb and the window title. The controls stand in the header's slot (`useShellHeaderSlot`; at the top of the frame outside the shell): **功能设置** and, on `page`, **刷新**. **D-52:** 功能设置 is a `Dialog` of `size: wide` in the middle of the screen — on top the run state (上次更新 · 下次更新, a failure and its fix) beside 待你确认（n）, 更新记录 (each its own `Sheet`, opened over it) and 刷新; then **流程**, the workflow editor itself; then **资料**, the memory tables and their readers. Each part is a `Section` (`h3`) with a link 整页打开 to its own view (`aria-current` on that view). The two parts come from `src/screens/{workflow,memory}/settings-panel.tsx` through `ModuleSettingsPanelsContext` (`src/module/settings-panels.ts`, provided in `RootLayout`); outside the app only the headings and links show. Following a link inside closes it. On `page` the run state stays as a quiet `status` region (out of sight, still announced); a failure is shown on the page. What follows describes the frame before D-50 where it differs. What every screen of a module sits in (D-12; `lofi-prototype-shell.md` § Module frame). It stands where `Page` stands — directly in `main` — and brings the page padding and the measure itself, because the first row differs from `Page`'s. First row, the same in all four views: the module's icon and name, and the `nav` of three links 页面 · 工作流 · 记忆. `page`: the name is the `h1`; second row = the run state (上次运行 · 下次运行, a failure `Alert` with the reason in words and a way to fix it), 待你确认（n） and 运行记录 (each a `Sheet`: `bottom` in the compact size class, else `end`) and 立即运行. 待你确认 counts the module's own deferred proposals — on 通知 every module's, as its page gathers them all. Other views: the name is text and the `h1` is `title`. No breadcrumb: the shell header's is the only one. Composes `Sheet`, `Alert`, `Table`, `Button`, `BlockRenderer` (`block.proposal` in 待你确认) |

## Accessibility contract

One row per component of the registry above; the reviewer tests against it
(`../ACCESSIBILITY.md` § Per-component contract). Min target is 44 × 44 CSS px
through `size.target.min` for anything interactive. **Withdrawn by D-43:** there is no
target-size and no contrast requirement; the "Min target" column binds nothing.

| Component | Role | Name comes from | Keyboard | Focus | Min target | Announces |
| --- | --- | --- | --- | --- | --- | --- |
| `ModuleFrame` | (D-50: the `h1` is `sr-only`; D-52: no views `nav` — 功能设置 is a `dialog` named 功能设置 holding the run state, the sheets' buttons, 刷新, and the `h3` parts 流程 and 资料 with their 整页打开 links; Tab: 功能设置, 刷新 in the header, then the page) `h1` = the module's name (`page`) or the view's title; the three view links in a `navigation` landmark; the run state a `status` region; each sheet a modal `dialog` | The `nav`: 模块视图. The sheets: their titles 待你确认 · 运行记录. The 待你确认 button contains its visible text and the count; the history table's scroller is named by its caption | Tab: the three links, then (`page`) the failure's fix, 待你确认, 运行记录, 立即运行, then the page. Enter follows a link or presses a button; in a sheet Tab stays inside and Escape closes it | The open view's link has `aria-current="page"` and is told apart by weight, border and underline. A sheet takes focus on opening and returns it to its button. 立即运行 keeps focus while the run is under way (`aria-busy`) | Links and buttons 44 × 44 CSS px | Politely, in the status region and without moving focus: the run state as icon + words (尚未运行 · 上次运行：… · 成功 / 失败 · 正在运行…) and, on failure, the reason and the fix. In 待你确认 each decision through the proposal block's own status |

## Building a module's screens on the frame

- **The page view is the route's.** `/m/<ia-id>` (`src/screens/module/`) resolves
  the module in the current scene, finds its definition and renders
  `ModuleFrame view="page"` around `BlockRenderer`. A module contributes only
  `src/modules/<ia-id>/module.ts`, default-exporting a `ModuleDefinition`
  (`{ id, page(view, preview, { locale }), onAction? }` — `src/runtime/module-definition.ts`).
  It is found by glob (`src/module/definitions.ts`); by id, then by alias, so a
  promoted sub-module keeps its page.
- **No `module.ts` → the stub pattern:** the frame, the run state the runtime
  has (尚未运行 for a module she just added) and one `block.empty` whose next
  step is the module's workflow.
- **Child routes** — `workflow`, `memory`, a module's own sub-pages — come from
  every `src/screens/<area>/module-routes.tsx`, which exports
  `moduleRoutes: ModuleChildRoute[]` (`{ path, match?, element }`, the path
  relative to `/m/<ia-id>`). The element renders its own frame:
  `const { module } = useRouteModule()` then
  `<ModuleFrame module={module} view="workflow" title={…}>`. `match(module)`
  limits a route to some modules (`pets/:petId` to 客户); two areas may
  register one path for different modules, and the first match renders.
  Elsewhere the address is the not-found screen.
- **Failure words** are the frame's (`failureWords`, namespace `module`): a
  screen that shows the same typed reason may reuse them. An account failure
  links to `accountsPath` (`/settings/accounts`).
- **Demo:** `/dev/frame` (in the shell) — a made-up module with a page of all
  seven blocks, two changes waiting for its next run and two proposals; 状态预览
  and `?preview=` reach it. `ModuleFrame` cannot be nested in the gallery (it
  owns the `h1` and the page padding, like `Page`), so its gallery entry links there.

## Pitfalls

- **A second breadcrumb.** The shell header already draws the `Breadcrumb`;
  one more in the frame is a second landmark of the same name (axe
  `landmark-unique`). The frame's first row starts with the module's name.
- **Reading the module through `useResource` in the route.** Under 状态预览 a
  forced `loading` or `error` would then take the frame away with the page.
  The route resolves the module from the raw state; only the page's content
  and the run state follow the preview.
- **A proposal that vanishes when its last part is decided.** The sheet keeps
  every proposal it has shown until it closes; otherwise the card — and focus
  with it — disappears under her last press.
- **`onAction` passed to the renderer for a module that handles none.** The
  blocks then draw live buttons that do nothing. The page view passes it only
  when the definition has `onAction`; without it the blocks show their actions
  as not available.
- **`role="alert"` inside a status region.** The kit's `Alert` is assertive;
  inside the run state's `status` region the failure would be said twice. The
  frame clears the role there (`DataState` does the same).
