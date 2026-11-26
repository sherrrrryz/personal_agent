# Components — feedback and status

> Status: evergreen — the registry rows and the accessibility contract of
> the components that tell the user what state something is in. Contract every component meets, conventions and the
> index of families: `../COMPONENTS.md`.

<!--
HOW TO BUILD THIS FILE
- Skeleton written by package S1b of task 1; the rows are written by package
  S5 (`docs/specs/lofi-prototype-system.md`, criteria A-15), in the same change
  that adds each component. One writer: nobody else edits this file.
- Admitted by the spec for this family: the feedback components among `Badge`, `Alert`, `Sonner`, `Skeleton`, `Spinner`, `Empty`, `Progress`, `DataState` (S5 places each in this file or in `data-display.md`).
- A row here and the code must agree — `src/test/registry-parity.test.ts`
  fails otherwise (`../COMPONENTS.md` § Conventions, "One component, one row").
-->

Code: `src/components/feedback/`.

## Registry

One row per component. The Component cell is the component's name in
backticks and nothing else. Source: `kit` · `wrapped` · `new` · `dependency`;
Status: `lofi` · `styled` · `deprecated → <replacement>` (`../COMPONENTS.md`
§ Registry).

| Component | Source | Variants | Status | Notes |
| --- | --- | --- | --- | --- |
| `Badge` | `kit` | `variant: default · secondary · outline · destructive · ghost · link` | `lofi` | A short status word, never a control. The kit keeps it on one line at a fixed height, so the text is a word or two — a sentence goes into an `Alert`. In the grey theme `destructive` differs by wording and icon only. Behaviour modes and change kinds have their own badges (`data-display.md`) |
| `Alert` | `kit` | `variant: default · destructive`; sub-parts `AlertTitle`, `AlertDescription`, `AlertAction` | `lofi` | A message in place, with an icon as first child. `role="alert"` (assertive) by default: pass `role={undefined}` for one that is on the page from the start. `AlertAction` is positioned over the corner and does not wrap — put a `Button` in the description instead |
| `Sonner` | `wrapped` | `position: top-center · top-right · bottom-center · bottom-right` (default `bottom-right`); `id` | `lofi` | The toaster, mounted once near the end of the root; `toast(message, { kind: plain · success · warning · error, description, action, persistent, id, toasterId })` raises one, `toast.dismiss(id?)` removes. The library's own styling is switched off: a toast is written in our tokens, its action and close control take `Button`'s look and target minimum, toasts are listed in full, every toast has a close control. § Pitfalls |
| `Skeleton` | `kit` | — (shape by `className`) | `lofi` | A placeholder shape with no text. Stands inside `DataState`'s `loading` slot, which hides it from assistive technology; on its own, inside an `aria-hidden` holder in a region with `aria-busy` |
| `Spinner` | `kit` | — | `lofi` | No built-in name (kit patch): either `aria-label` from the messages, or `role={undefined} aria-hidden="true"` beside status text |
| `Empty` | `kit` | sub-parts `EmptyHeader`, `EmptyMedia` (`variant: default · icon`), `EmptyTitle`, `EmptyDescription`, `EmptyContent` | `lofi` | What an empty collection shows: a title, one line on what will appear, optionally one action. Goes into `DataState`'s `empty` slot. A workflow that emits an empty page uses `block.empty` instead |
| `Progress` | `kit` | sub-parts `ProgressLabel`, `ProgressValue`; `value`, `max`, `locale` | `lofi` | Always with a `ProgressLabel` (its name) and, when it has a value, a `ProgressValue` (its text equivalent). `value={null}` is indeterminate |
| `DataState` | `new` | `state: ready · loading · empty · error`; slots `loading`, `empty`, `error`; `loadingLabel`, `errorTitle`, `onRetry` | `lofi` | The four states of every data surface (`lofi-prototype-system.md` § Additions). Children show while `ready`. Every slot has a built-in text, so a state is never blank. A resource that is `long`, stale or partial is `ready` here |

## Accessibility contract

One row per component of the registry above; the reviewer tests against it
(`../ACCESSIBILITY.md` § Per-component contract). Min target is 44 × 44 CSS px
through `size.target.min` for anything interactive.

| Component | Role | Name comes from | Keyboard | Focus | Min target | Announces |
| --- | --- | --- | --- | --- | --- | --- |
| `Badge` | None (`span`) | Its text; an icon in it is `aria-hidden` | Not focusable | — | — | Nothing by itself: it is part of what contains it |
| `Alert` | `alert` | — (its title and description are its content) | Not focusable; a control inside it is a `Button` | — | — (the `Button` inside: 44 × 44 CSS px) | Assertively when it appears. Present from the start: no role, read in order |
| `Sonner` | `section` (a region) holding a list; each toast a `listitem` | The region: `sonner.region` plus the key chord the library appends; the close control: `sonner.close`; the action: its label | Tab reaches a toast, then its close control, then its action, and goes on past it. Alt+T moves focus to the toasts. Enter or Space on a button, or Escape, returns focus to where it was | The kit's ring on the toast and on its buttons | Close and action 44 × 44 CSS px | Politely (`aria-live="polite"`). Never the only place an error appears: the screen shows it too |
| `Skeleton` | None | — | Not focusable | — | — | Nothing: hidden from assistive technology; the status text beside it speaks |
| `Spinner` | `status` when named; none when `aria-hidden` | `aria-label` from the caller | Not focusable | — | — | Its name, when it has one |
| `Empty` | None | — (title and description are text) | A control inside it is a `Button` | — | — (the `Button` inside: 44 × 44 CSS px) | Through `DataState` when it is in its slot |
| `Progress` | `progressbar` | `ProgressLabel` | Not focusable | — | — | `aria-valuenow`, `aria-valuemax` and `aria-valuetext`; the same value as visible text in `ProgressValue` |
| `DataState` | A `status` region that is always present; the data in a sibling that is `aria-busy` while loading | — | The retry `Button`: Tab, Enter or Space | Pressing retry moves focus to the status region (the button is about to leave); the region shows the ring | Retry 44 × 44 CSS px | Politely, without moving focus: the loading text, the empty title and description, the error title and reason, and "Loaded." after a change. The error `Alert` drops its assertive role so nothing is said twice |

## Pitfalls

### A toast keeps the library's look, or its buttons are 24 px high

**Rule:** style a toast only through `toast-class.ts`; never pass `classNames` or `style` to a single `toast(…)` and never turn `unstyled` off.

`sonner` injects its stylesheet outside any cascade layer, so it beats every
Tailwind utility unless the utility is marked important. With `unstyled` the
library's look — pixel font sizes that ignore the user's text size, a 20 px
close control, a 24 px action, literal colours, a shadow — is not applied at
all, and the classes of `toast-class.ts` are the only source. The one
important utility there (`focus-visible:ring-3!`) is for the focus ring, which
the library sets on the toast regardless of `unstyled`.

### Tab cannot get past an open toast

**Rule:** mount `Sonner`, not the kit's `Toaster`; put it after the content it reports on, at the end of the root.

The library sends focus back to the element it came from whenever focus
leaves the list of toasts — so while a toast is open, Tab from its last
button returns to where the user was, and the matrix reports
`keyboard-trap`. `Sonner` stops the library's bookkeeping and returns focus
only when a button in a toast is pressed or on Escape (`Sonner.test.tsx`).

### Every matrix cell of a screen takes eight more seconds

**Rule:** nothing on a page stays `aria-busy="true"` unless the run is about that state; run a forced loading state with `--cells smoke`.

The harness waits up to 8 s for the page to stop being busy. A demo or a
fixture that never leaves `loading` costs that in each of the 44 cells. The
`DataState` demo therefore opens `ready` and takes `?preview=loading`,
`empty` or `error` (the harness's `--preview`) to open in another state, and
the `Skeleton` demo shows its shapes outside any busy region.

### An empty live region is hidden, and its first text is not announced

**Rule:** a status region stays rendered — never `hidden`, never `display: none`, never mounted together with its text.

Assistive technology announces a change inside a live region it already
knows. `DataState` therefore keeps one `role="status"` element for its whole
life and only changes what is in it; `DataState.test.tsx` checks that the
element is the same across every change of state.
