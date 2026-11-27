# Components — chat

> Status: evergreen — the registry rows and the accessibility contract of
> the reusable parts of every chat surface. Contract every component meets, conventions and the
> index of families: `../COMPONENTS.md`.

<!--
HOW TO BUILD THIS FILE
- Skeleton written by package S1b of task 1; the rows are written by package
  S8 (`docs/specs/lofi-prototype-shell.md`, criteria R-09), in the same change
  that adds each component. One writer: nobody else edits this file.
- Admitted by the spec for this family: `ChatComposer`, `ChatMessageList`, `PersistenceSwitch`.
- A row here and the code must agree — `src/test/registry-parity.test.ts`
  fails otherwise (`../COMPONENTS.md` § Conventions, "One component, one row").
-->

Code: `src/components/chat/`.

> **D-43 (2026-11-26).** The kit controls inside these components are drawn as stock shadcn/ui draws
> them: no 44 px minimum, no border added to the kit's `Empty`, `Card` or `Badge`. Where a note below says
> otherwise it is superseded. Target size is not a requirement (withdrawn by D-43): our own links carry no `*-target` class.

> **D-45 (2026-11-27).** The conversation and the composer are built from shadcn/ui's own Chat
> (<https://ui.shadcn.com/docs/ai-elements/base/chat>): the kit files `message-scroller.tsx`, `message.tsx`,
> `bubble.tsx` and `input-group.tsx`, composed as that page composes them. The Vercel AI SDK and the page's
> `createChat` helper are not used — the runtime stays the prototype's own (`src/runtime/`).

## Registry

One row per component. The Component cell is the component's name in
backticks and nothing else. Source: `kit` · `wrapped` · `new` · `dependency`;
Status: `lofi` · `styled` · `deprecated → <replacement>` (`../COMPONENTS.md`
§ Registry).

| Component | Source | Variants | Status | Notes |
| --- | --- | --- | --- | --- |
| `ChatComposer` | `new` | `placement: bar · thread · onboarding`; `label`, `placeholder`; `value` + `onValueChange` (held by the surface) or `defaultValue` (held by the composer); `sending`, `disabled`; `ref` (the text control) | `lofi` | Where a message to the AI is written and sent — one component for the chat bar, a dedicated chat and the onboarding interview (D-30). Composed as the kit's Chat composes its field (D-45): `Field` around an `InputGroup` that holds the `Textarea` and, under it, the add-on row (`block-end`) ending with the send `Button` — an icon button in every placement. The text control grows with what is typed up to about six lines, then scrolls inside. `onSend(text)` gets the trimmed text and is never called with nothing, while `sending` or while `disabled`. Holding the text itself it empties on send; held by the surface it keeps the text until the surface empties it (a failed send loses nothing). `bar` and `thread`: one line to start; in `bar` the key hint is kept for assistive technology only. `onboarding`: taller. § Pitfalls |
| `ChatMessageList` | `new` | `readOnly?`; `state: ready · loading · empty · error` (default from the messages); slots `renderAttachment`, `empty`; `onRetry`, `onReload`; `label`, `userName`, `aiName`; `errorTitle`, `error`; `follow` | `lofi` | A conversation in order, built from the kit's Chat parts (D-45). Composes `DataState` around `MessageScrollerProvider` → `MessageScroller` → `MessageScrollerViewport` → `MessageScrollerContent`; each turn is a `MessageScrollerItem` (`messageId`; `scrollAnchor` on her turns while `follow`) holding a `Message` — hers `align="end"` with a `Bubble` `variant="muted"`, the AI's at the start with a `Bubble` `variant="ghost"` (unframed) — with the author's name and the time in a `MessageHeader`; `MessageScrollerButton` jumps to the latest message. A message is `{ id, author: user · ai, text, at?, status?: done · streaming · failed, attachments? }` — the runtime's `Message` with its text resolved to the locale. Attachments are drawn by `renderAttachment(attachment, message)` under the text, across the whole message; the list imports no block and, without the slot, shows none. `streaming` shows the part that has arrived and 正在回答; `failed` shows 回答失败 and, with `onRetry`, a retry button. `loading` and `error` are for the conversation itself being fetched (`onReload`). **It fills its parent:** in a flex column of limited height it takes the room that is left and scrolls inside (the in-place panel, the dedicated chat); anywhere else it is as tall as its messages and the page scrolls — there the surface passes `follow={false}` (a topic's records are `readOnly`, which turns it off). `follow`: a new turn of hers goes to the top of the viewport and the answer arrives under it. A live list opens at its newest message, a `readOnly` one at its start. § Pitfalls |
| `PersistenceSwitch` | `new` | `persistent`; `defaultName`, `parents`, `defaultParent`; `moduleName`; `disabled`; `onCreate`, `onArchive` | `lofi` | One-off or persistent (D-08). Composes `Switch`, `Field`, `Input`, `Select`, `Button`, `AlertDialog`. Three states: one-off · confirming · persistent. Turning it on opens a confirmation in place — name and parent module, both prefilled — and calls `onCreate({ name, parentId })` only on 创建; turning it off asks in an `AlertDialog` and calls `onArchive` only on 归档. The surface holds `persistent`: the switch never flips by itself |

## Accessibility contract

One row per component of the registry above; the reviewer tests against it
(`../ACCESSIBILITY.md` § Per-component contract). Min target is 44 × 44 CSS px
through `size.target.min` for anything interactive. **Withdrawn by D-43:** there is no
target-size and no contrast requirement; the "Min target" column binds nothing.

| Component | Role | Name comes from | Keyboard | Focus | Min target | Announces |
| --- | --- | --- | --- | --- | --- | --- |
| `ChatComposer` | A `form` holding a `textbox` (multi-line) and a `button` | The textbox: its visible label (`label`, or the placement's own: 问 AI · 回复 · 你的回答). The button: 发送 — the `aria-label` of the icon button | Enter sends; Shift+Enter starts a new line; Enter that confirms an input-method candidate does not send. Tab moves from the text to the send button, which stays in the tab order while there is nothing to send (`aria-disabled`) and leaves it only when the composer is `disabled` | The group shows the kit's ring while the text has focus; the button its own. After a send focus is on the text | — (withdrawn by D-43) | The key hint as the textbox's description (visible in `thread` and `onboarding`, visually hidden in `bar`). `sending`: the button is `aria-busy`. Replies are announced by the list, not by the composer |
| `ChatMessageList` | A `region` (the kit's viewport) holding a `log`; each message a plain group of the log, in order — no `list`. Around it `DataState`'s `status` region. The jump-to-latest control is a `button` | The region and the log: `label`, default 对话记录 (the kit's English "Messages" is never used). Each message starts with its author's name as text (你 · AI, or `userName` · `aiName`) — who said it is never only the side the bubble stands on; the time is a `time` element. The jump button: 回到最新消息 | The viewport is in the tab order (`tabIndex=0`) and scrolls with the arrow, Page and Home / End keys. The retry button of a failed answer: Tab, Enter or Space. Whatever an attachment holds is reached in order. The jump button is in the tab order only while there is something below to jump to (the kit makes it `inert` otherwise) | Pressing retry moves focus to that message's status line (the button is about to leave); it shows the ring. The viewport shows the browser's focus outline | — (withdrawn by D-43) | Politely (`role="log"`, `aria-live="polite"`, the kit's `aria-relevant="additions"`): a new message; 正在回答 when an answer starts; the answer once, whole, when it ends — the part that has arrived is `aria-live="off"` while it grows; 回答失败 in words with an icon. `readOnly`: nothing (`aria-live="off"`). Never `aria-busy` while streaming. Loading, empty and load error: through `DataState` |
| `PersistenceSwitch` | `switch`; while confirming a `group` (创建子模块) holding a `textbox`, a `combobox` and two `button`s; before archiving an `alertdialog` | The switch: 设为长期 / Keep as a module, described by what turning it on creates (or, once persistent, what turning it off does). The fields: their visible labels 名称, 所属模块 | Space or Enter turns the switch. Confirming: Tab goes on into the name, the parent, 创建, 取消; Enter in the name creates. The alert dialog: focus starts on 取消, Escape cancels | Turning it on leaves focus on the switch; the confirmation follows it in the tab order. 创建 and 取消 return focus to the switch. Closing the alert dialog returns focus to the switch | The whole switch row; buttons and fields 44 CSS px | The switch's state (on while confirming and while persistent). A missing name: an error text beside the field, wired as its description. The result of creating or archiving is the surface's to announce |

## Surfaces built from these

Not components of the registry — product surfaces in `src/chat/` and
`src/screens/chat/` (spec part 2 § Chat), listed so the next reader finds
them:

| Surface | Where | What to know |
| --- | --- | --- |
| Chat bar and in-place panel | `src/chat/ChatBar.tsx` | The shell's bottom row, a region 与 AI 对话 after `main`. The panel is a `Collapsible` without a trigger, a named, focusable group (`data-chat-panel`); it belongs to the screen it was opened on and closes on a scene jump. Its limit is measured (`UI-PITFALLS.md` § 2). It is a flex column: heading, the conversation — which scrolls inside (the kit's scroller; the hand-built placing of S12 is gone, D-45) — and the last row; the panel itself scrolls only when heading and last row alone no longer fit |
| One-off ↔ persistent | `src/chat/ConversationPersistence.tsx`, `attachments.tsx` | `PersistenceSwitch` wired to `createSubModule` / `archiveSubModule`; proposals in a message through `BlockRenderer` |
| `chat.recent` | `src/chat/RecentGroup.tsx` | Sidebar group, closed by default, state in `localStorage` key `pa.recent` (`open` / `closed`); reads the `conversations` resource, so 状态预览 shows its states |
| `chat.thread` | `src/screens/chat/ThreadPage.tsx`, route `/chat/<id>` | Header from the state, messages from the `conversation` resource; its composer is the shell's bottom row. `Page` with `height: fill`: the conversation scrolls inside what the header leaves of `main` |
| Shell slots | `src/chat/slots.tsx` | `chatBar`, `sidebarRecent`, `chatSlots`. The shell finds `src/chat/shell-slots.tsx` by glob: it re-exports `chatBar` and `sidebarRecent` and so registers them for every screen inside the shell (`/m/*`, `/topics`, `/chat`, `/settings`, `/dev/shell`, `/dev/chat`). A test of the shell itself leaves the registration out with `vi.mock('@/chat/shell-slots', () => ({}))` |

## Pitfalls

### The whole composer looks switched off when there is nothing to send

**Rule:** never give the send button the `disabled` attribute for "nothing to send"; `ChatComposer` marks it `aria-disabled` and fades the button itself.

The kit's `InputGroup` fades the entire group as soon as anything inside it is `:disabled` (`has-disabled:opacity-50`), so a really disabled send button made every empty composer look unavailable. The button is disabled with `focusableWhenDisabled` instead — Base UI then sets `aria-disabled` and keeps it in the tab order — and the form fades that one button, except while it is busy. Only `disabled` on the composer itself uses the real attribute, and there the kit's fade is what is wanted.

### A streaming answer must not be `aria-busy`, nor read out piece by piece

**Rule:** a message that is still arriving carries the status text 正在回答 and keeps its partial text in `aria-live="off"`; the finished text is a new element.

`aria-busy="true"` on a streaming message would be the textbook mark, but the matrix harness waits eight seconds for every busy region, in every cell, and a demo that shows the streaming state would hold all 44 (`feedback.md`, `DataState`). And a live region that receives the answer in pieces reads every piece. So the partial paragraph is taken out of the announcements while it grows, and when the status becomes `done` React replaces it — a different `key` — with a paragraph inside the polite `log`, which is then announced once, whole.

### The list scrolled the page when it appeared

**Rule:** `ChatMessageList` never scrolls anything but its own viewport; a surface where the page scrolls brings its own end into view (the onboarding step does).

Until D-45 the list followed with `scrollIntoView`, which moves every scroller around it, and so it had to hold still on first render. The kit's scroller moves only its viewport: a live list in a box of limited height opens at its newest message, a `readOnly` one at its start, and a list with no limit does not move at all.

### The conversation grew by itself, without end

**Rule:** give the list a flex column of limited height to fill, or pass `follow={false}`.

The kit places a new turn of hers at the top of the viewport and adds room under it to be able to. With no limit on the list's height that room makes the viewport taller, is measured again and grows — in the onboarding interview by about 4000 px a second. `follow` is therefore what marks her turns as `scrollAnchor`; `readOnly` turns it off, and the two surfaces where the page scrolls (the onboarding interview, the gallery demo) pass `follow={false}`. A parent that limits the height must be a flex column all the way down (`flex min-h-0 flex-1 flex-col`): the scroller's own `height: 100%` resolves to nothing under a `max-height`, and the flex chain is what shrinks it. `UI-PITFALLS.md` § 5.

### An Enter that only confirmed a candidate sent the message

**Rule:** key handling on a text control checks `isComposing` (and key code 229) before treating Enter as "send".

With a Chinese, Japanese or Korean input method, Enter confirms the candidate being composed. A handler that looks at `event.key === 'Enter'` alone sends a half-written sentence. `ChatComposer` ignores Enter while composing; anything else that binds Enter on a text control must do the same.

### The answer arrived out of sight in the in-place panel — or cut at its beginning

**Rule:** the list follows by anchoring her turn (`scrollAnchor`), not by following the end (`autoScroll` stays off).

The hand-built placing of S12 (the panel set its own `scrollTop`) is replaced by the kit's: her new turn goes to the top of the viewport, a little of the turn before it still showing, and the answer arrives under it — read from its first line whatever the panel's size. The kit's `autoScroll` was tried and does the opposite for a long answer: it keeps the end in view, so the hero answer on 预约 ended with its table and proposal on screen and its first sentence scrolled away. When more has arrived than fits, the kit's jump button (回到最新消息) appears. Observed with Chromium, task 1, K1; the flow `panel-open` asserts that the answer begins inside the panel.

### Escape in a popup opened from the panel closed the panel as well

**Rule:** a key handler on a surface checks that the event's target is inside the surface's own DOM before acting (`onKeyDown` of the bar's region in `src/chat/ChatBar.tsx`).

React events bubble through portals along the component tree, not the DOM: an
Escape pressed in a `Select` popup or an `AlertDialog` that the panel opened
reaches the panel's handler although the popup is drawn at the end of `body`.
Without the check one Escape closes the popup and the conversation behind it.

