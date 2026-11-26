# Components — containers and overlays

> Status: evergreen — the registry rows and the accessibility contract of
> the surfaces that hold content, in the page or over it. Contract every component meets, conventions and the
> index of families: `../COMPONENTS.md`.

<!--
HOW TO BUILD THIS FILE
- Skeleton written by package S1b of task 1; the rows are written by package
  S4 (`docs/specs/lofi-prototype-system.md`, criteria A-14), in the same change
  that adds each component. One writer: nobody else edits this file.
- Admitted by the spec for this family: `Dialog`, `AlertDialog`, `Sheet`, `Collapsible`, `Tooltip`, `Card`, `Separator`.
- A row here and the code must agree — `src/test/registry-parity.test.ts`
  fails otherwise (`../COMPONENTS.md` § Conventions, "One component, one row").
-->

Code: `src/components/containers/`.

## Registry

One row per component. The Component cell is the component's name in
backticks and nothing else. Source: `kit` · `wrapped` · `new` · `dependency`;
Status: `lofi` · `styled` · `deprecated → <replacement>` (`../COMPONENTS.md`
§ Registry).

| Component | Source | Variants | Status | Notes |
| --- | --- | --- | --- | --- |
| `Dialog` | `wrapped` | `trigger`; `open`, `defaultOpen`, `onOpenChange`; slots `title`, `description`, `footer`, children | `lofi` | A task that interrupts the page. Never taller than the window: what does not fit scrolls inside, the actions wrap beneath. No scrim and no shadow in the placeholder theme — it separates from the page by its border. The close control is our `Button`, named in the user's language |
| `AlertDialog` | `wrapped` | `trigger`; `open`, `defaultOpen`, `onOpenChange`; `title`, `description`, `confirmLabel`, `confirmVariant: primary · danger` (default `primary`), `onConfirm`, `cancelLabel` | `lofi` | A question that must be answered: two buttons, cancel first. Both close it; only the confirming one calls `onConfirm`. A press outside does not close it. `cancelLabel` is "Cancel" in the user's language unless set |
| `Sheet` | `wrapped` | `side: end · bottom` (default `end`); `trigger`; `open`, `defaultOpen`, `onOpenChange`; slots `title`, `description`, `footer`, children | `lofi` | A panel beside the page for detail and history. `end` is the kit's right edge (no RTL, D-17); the caller passes `bottom` in the compact size class. Scrolls inside, separates by its border, our close `Button` |
| `Collapsible` | `kit` | `open`, `defaultOpen`, `onOpenChange`; sub-parts `CollapsibleTrigger`, `CollapsibleContent` | `lofi` | Re-exported unchanged. The trigger is always our `Button`, passed as `render` |
| `Tooltip` | `kit` | `side`, `align` on `TooltipContent`; sub-parts `TooltipTrigger`, `TooltipContent`, `TooltipProvider` | `lofi` | Re-exported unchanged. A hint on a control that already has a name — never the only label. The trigger is always our `Button`, passed as `render` |
| `Card` | `kit` | `size: default · sm`; sub-parts `CardHeader`, `CardTitle`, `CardDescription`, `CardAction`, `CardContent`, `CardFooter` | `lofi` | Re-exported unchanged. A surface that groups content; not interactive itself |
| `Separator` | `kit` | `orientation: horizontal · vertical` | `lofi` | Re-exported unchanged. A hairline between things that belong apart |

## Accessibility contract

One row per component of the registry above; the reviewer tests against it
(`../ACCESSIBILITY.md` § Per-component contract). Min target is 44 × 44 CSS px
through `size.target.min` for anything interactive.

| Component | Role | Name comes from | Keyboard | Focus | Min target | Announces |
| --- | --- | --- | --- | --- | --- | --- |
| `Dialog` | `dialog`, modal; the page behind is inert | Its `title`; described by its `description` | Tab and Shift+Tab stay inside and wrap; Escape closes | Moves in on opening (the first control — the close button), is contained, returns to the trigger on closing | Close button and every action 44 × 44 CSS px | The trigger's `aria-haspopup="dialog"` and `aria-expanded` |
| `AlertDialog` | `alertdialog`, modal | Its `title`; described by its `description` | As `Dialog`; Escape cancels | Starts on the cancelling button; contained; returns to the trigger | Both buttons 44 × 44 CSS px | As `Dialog` |
| `Sheet` | `dialog`, modal | Its `title`; described by its `description` | As `Dialog` | As `Dialog` | Close button and every action 44 × 44 CSS px | As `Dialog` |
| `Collapsible` | Our `button` and the region it controls | The button's text | Enter or Space shows and hides | Stays on the button | The button 44 × 44 CSS px | `aria-expanded`, `aria-controls` |
| `Tooltip` | `tooltip` popup on our `button` | The button names itself; the tooltip is not its name | Shows on keyboard focus and on hover; Escape hides it | Stays on the button | The button 44 × 44 CSS px | — (a hint; nothing essential is only here) |
| `Card` | None (a `div`) | — | Not interactive | — | — | — |
| `Separator` | `separator` | — | Not focusable | — | — | `aria-orientation` |

## Pitfalls

### An element passed as `render` must pass on what it is handed

**Rule:** a component of ours used as the `render` element of a kit part spreads the props it receives onto the control it draws.

The kit's `Close`, `Trigger` and friends hand their press handler, ref and
ARIA state to the element in `render`. Our `Button` forwards them; a small
component around it that takes no props drops them silently — the button
draws and does nothing (`overlay-parts.tsx`, `CloseButton`).

### Focus containment looks broken in a jsdom test

**Rule:** after each Tab in an overlay test, wait for focus to settle before asserting where it is.

Base UI contains focus with guard elements that hand focus back a moment
after they receive it. Read at once, `document.activeElement` is the guard,
outside the dialog (`containers.test.tsx`, `expectFocusContained`).

### An overlay taller than the window

**Rule:** every overlay surface carries `max-h-full overflow-y-auto` (`overlay-control.ts`).

The kit's dialog is centred and has no block limit: at 200% zoom a long one
runs off both ends of the window with no way to reach its actions.
