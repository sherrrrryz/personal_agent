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

## Registry

One row per component. The Component cell is the component's name in
backticks and nothing else. Source: `kit` · `wrapped` · `new` · `dependency`;
Status: `lofi` · `styled` · `deprecated → <replacement>` (`../COMPONENTS.md`
§ Registry).

| Component | Source | Variants | Status | Notes |
| --- | --- | --- | --- | --- |
| `ChatComposer` | `new` | `placement: bar · thread · onboarding`; `label`, `placeholder`; `value` + `onValueChange` (held by the surface) or `defaultValue` (held by the composer); `sending`, `disabled`; `ref` (the text control) | `lofi` | Where a message to the AI is written and sent — one component for the chat bar, a dedicated chat and the onboarding interview (D-30). Composes `Field`, `InputGroup`, `Textarea`, `Button`. The text control grows with what is typed up to about six lines, then scrolls inside. `onSend(text)` gets the trimmed text and is never called with nothing, while `sending` or while `disabled`. Holding the text itself it empties on send; held by the surface it keeps the text until the surface empties it (a failed send loses nothing). `bar` and `thread`: one line to start, an icon send button beside the text; in `bar` the key hint is kept for assistive technology only. `onboarding`: taller, a worded send button under the text. § Pitfalls |
| `ChatMessageList` | `new` | `readOnly?`; `state: ready · loading · empty · error` (default from the messages); slots `renderAttachment`, `empty`; `onRetry`, `onReload`; `label`, `userName`, `aiName`; `errorTitle`, `error`; `follow` | `lofi` | A conversation in order. Composes `DataState`, `Item` in an `ItemGroup`, `Avatar`. A message is `{ id, author: user · ai, text, at?, status?: done · streaming · failed, attachments? }` — the runtime's `Message` with its text resolved to the locale. Attachments are drawn by `renderAttachment(attachment, message)` under the whole message; the list imports no block and, without the slot, shows none. `streaming` shows the part that has arrived and 正在回答; `failed` shows 回答失败 and, with `onRetry`, a retry button. `loading` and `error` are for the conversation itself being fetched (`onReload`). It does not scroll: the surface around it does; `follow` keeps the newest message in view after the list has appeared, unless she has scrolled away. § Pitfalls |
| `PersistenceSwitch` | `new` | `persistent`; `defaultName`, `parents`, `defaultParent`; `moduleName`; `disabled`; `onCreate`, `onArchive` | `lofi` | One-off or persistent (D-08). Composes `Switch`, `Field`, `Input`, `Select`, `Button`, `AlertDialog`. Three states: one-off · confirming · persistent. Turning it on opens a confirmation in place — name and parent module, both prefilled — and calls `onCreate({ name, parentId })` only on 创建; turning it off asks in an `AlertDialog` and calls `onArchive` only on 归档. The surface holds `persistent`: the switch never flips by itself |

## Accessibility contract

One row per component of the registry above; the reviewer tests against it
(`../ACCESSIBILITY.md` § Per-component contract). Min target is 44 × 44 CSS px
through `size.target.min` for anything interactive. **Withdrawn by D-43:** there is no
target-size and no contrast requirement; the "Min target" column binds nothing.

| Component | Role | Name comes from | Keyboard | Focus | Min target | Announces |
| --- | --- | --- | --- | --- | --- | --- |
| `ChatComposer` | A `form` holding a `textbox` (multi-line) and a `button` | The textbox: its visible label (`label`, or the placement's own: 问 AI · 回复 · 你的回答). The button: 发送 — its text in `onboarding`, its `aria-label` on the icon button | Enter sends; Shift+Enter starts a new line; Enter that confirms an input-method candidate does not send. Tab moves from the text to the send button, which stays in the tab order while there is nothing to send (`aria-disabled`) and leaves it only when the composer is `disabled` | The group shows the kit's ring while the text has focus; the button its own. After a send focus is on the text | Send button 44 × 44 CSS px; the text control at least 44 CSS px high | The key hint as the textbox's description (visible in `thread` and `onboarding`, visually hidden in `bar`). `sending`: the button is `aria-busy`. Replies are announced by the list, not by the composer |
| `ChatMessageList` | `log` holding a `list`; each message a `listitem`. Around it `DataState`'s `status` region | The log: `label`, default 对话记录. Each message starts with its author's name as text (你 · AI, or `userName` · `aiName`); the avatar is `aria-hidden`; the time is a `time` element | Not focusable itself. The retry button of a failed answer: Tab, Enter or Space. Whatever an attachment holds is reached in order | Pressing retry moves focus to that message's status line (the button is about to leave); it shows the ring | Retry 44 × 44 CSS px | Politely (`aria-live="polite"`): a new message; 正在回答 when an answer starts; the answer once, whole, when it ends — the part that has arrived is `aria-live="off"` while it grows; 回答失败 in words with an icon. `readOnly`: nothing (`aria-live="off"`). Never `aria-busy` while streaming. Loading, empty and load error: through `DataState` |
| `PersistenceSwitch` | `switch`; while confirming a `group` (创建子模块) holding a `textbox`, a `combobox` and two `button`s; before archiving an `alertdialog` | The switch: 设为长期 / Keep as a module, described by what turning it on creates (or, once persistent, what turning it off does). The fields: their visible labels 名称, 所属模块 | Space or Enter turns the switch. Confirming: Tab goes on into the name, the parent, 创建, 取消; Enter in the name creates. The alert dialog: focus starts on 取消, Escape cancels | Turning it on leaves focus on the switch; the confirmation follows it in the tab order. 创建 and 取消 return focus to the switch. Closing the alert dialog returns focus to the switch | The whole switch row; buttons and fields 44 CSS px | The switch's state (on while confirming and while persistent). A missing name: an error text beside the field, wired as its description. The result of creating or archiving is the surface's to announce |

## Surfaces built from these

Not components of the registry — product surfaces in `src/chat/` and
`src/screens/chat/` (spec part 2 § Chat), listed so the next reader finds
them:

| Surface | Where | What to know |
| --- | --- | --- |
| Chat bar and in-place panel | `src/chat/ChatBar.tsx` | The shell's bottom row, a region 与 AI 对话 after `main`. The panel is a `Collapsible` without a trigger, a named, focusable scroller (`data-chat-panel`); it belongs to the screen it was opened on. Its limit is measured (`UI-PITFALLS.md` § 2). It turns the list's `follow` off and scrolls itself |
| One-off ↔ persistent | `src/chat/ConversationPersistence.tsx`, `attachments.tsx` | `PersistenceSwitch` wired to `createSubModule` / `archiveSubModule`; proposals in a message through `BlockRenderer` |
| `chat.recent` | `src/chat/RecentGroup.tsx` | Sidebar group, closed by default, state in `localStorage` key `pa.recent` (`open` / `closed`); reads the `conversations` resource, so 状态预览 shows its states |
| `chat.thread` | `src/screens/chat/ThreadPage.tsx`, route `/chat/<id>` | Header from the state, messages from the `conversation` resource; its composer is the shell's bottom row |
| Shell slots | `src/chat/slots.tsx` | `chatBar`, `sidebarRecent`, `chatSlots`. The shell finds `src/chat/shell-slots.tsx` by glob; that one-line file is added by the integration leg together with the shell's own tests, which still expect the stand-ins |

## Pitfalls

### The whole composer looks switched off when there is nothing to send

**Rule:** never give the send button the `disabled` attribute for "nothing to send"; `ChatComposer` marks it `aria-disabled` and fades the button itself.

The kit's `InputGroup` fades the entire group as soon as anything inside it is `:disabled` (`has-disabled:opacity-50`), so a really disabled send button made every empty composer look unavailable. The button is disabled with `focusableWhenDisabled` instead — Base UI then sets `aria-disabled` and keeps it in the tab order — and the form fades that one button, except while it is busy. Only `disabled` on the composer itself uses the real attribute, and there the kit's fade is what is wanted.

### A streaming answer must not be `aria-busy`, nor read out piece by piece

**Rule:** a message that is still arriving carries the status text 正在回答 and keeps its partial text in `aria-live="off"`; the finished text is a new element.

`aria-busy="true"` on a streaming message would be the textbook mark, but the matrix harness waits eight seconds for every busy region, in every cell, and a demo that shows the streaming state would hold all 44 (`feedback.md`, `DataState`). And a live region that receives the answer in pieces reads every piece. So the partial paragraph is taken out of the announcements while it grows, and when the status becomes `done` React replaces it — a different `key` — with a paragraph inside the polite `log`, which is then announced once, whole.

### The list scrolled the page when it appeared

**Rule:** `ChatMessageList` never scrolls on first render; a surface that wants a thread opened at its newest message scrolls its own scroller once.

`follow` brings the end of the list into view only on a change after the list has appeared — a new message, a growing answer, a changed status — and only while the end was already on screen, or when the new message is hers. Scrolling on mount would move the gallery, a topic record and any page that merely shows a conversation. The list has no scroller of its own: in the in-place panel the panel scrolls, in a thread `main` does. A scroller around it needs `tabIndex={0}`, a role and a name (`ChatMessageList.demo.tsx` shows one), or a keyboard user cannot scroll it.

### An Enter that only confirmed a candidate sent the message

**Rule:** key handling on a text control checks `isComposing` (and key code 229) before treating Enter as "send".

With a Chinese, Japanese or Korean input method, Enter confirms the candidate being composed. A handler that looks at `event.key === 'Enter'` alone sends a half-written sentence. `ChatComposer` ignores Enter while composing; anything else that binds Enter on a text control must do the same.

### The answer arrived out of sight in the in-place panel

**Rule:** a surface that shows a conversation in a scroller of limited height turns `follow` off and places the scroller itself (`InPlacePanel` in `src/chat/ChatBar.tsx`).

`follow` calls `scrollIntoView`, which moves every scroller around the list —
the shell's column too — and it trusts an `IntersectionObserver` whose answer
comes a frame after the layout that changed. In a panel a few lines tall
(320 px wide, or large text) her own message filled it, the end of the list
left the panel before the first piece of the answer was drawn, and the list
stopped following: the answer was there and nobody saw it. At 1440 the same
code followed to the end and cut the answer's beginning instead. The panel
now sets its own `scrollTop` when a message is added and while the answer
grows: the newest exchange from its start — her question, or the answer's
first line when the question alone would take half the panel — and it stops
the moment she scrolls. Observed with Chromium, task 1, S12.

### Escape in a popup opened from the panel closed the panel as well

**Rule:** a key handler on a surface checks that the event's target is inside the surface's own DOM before acting (`onKeyDown` of the bar's region in `src/chat/ChatBar.tsx`).

React events bubble through portals along the component tree, not the DOM: an
Escape pressed in a `Select` popup or an `AlertDialog` that the panel opened
reaches the panel's handler although the popup is drawn at the end of `body`.
Without the check one Escape closes the popup and the conversation behind it.

