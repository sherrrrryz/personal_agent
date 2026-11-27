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

> **D-43 (2026-11-26) — read this first.** Every component of this family is drawn as stock
> shadcn/ui draws it. Where a registry note, a contract row or a pitfall below describes an
> appearance of ours on a kit control — the 44 px target minimum (`min-h-target`), height `auto`,
> a border instead of a shadow or scrim, a bar or fill marking a state, an always-on underline, a
> restated focus ring, the grey theme — it is **superseded**: that restyle is removed. What still
> differs from stock is listed, completely, in § Deviations from stock. Props, names, roles,
> states and keyboard behaviour are unchanged.

## Deviations from stock

The complete list for this family (D-43; `../COMPONENTS.md` § Conventions).

| Component | What is added | Why |
| --- | --- | --- |
| `Dialog` (`size: wide`, D-52) | `sm:max-w-4xl xl:max-w-6xl max-h-11/12` on the surface; `overlayScroll` alone, not `surface-frosted`, so the kit's opaque `bg-popover` and its ring stay, with no blur and no shadow of ours | **Visible, by the owner's decision D-52**: 功能设置 is a large centred window; it keeps a share of the window free above and below, and its background is solid (owner, 2026-11-27: "把居中大窗口背景变为白色实色"). The kit's scrim behind it is unchanged |
| `Dialog`, `AlertDialog`, `Sheet` | `max-h-full overflow-y-auto` on the surface | Invisible at the default size. At 200% zoom or root 24 px the kit's overlay grows past the window and its end cannot be reached |
| `Dialog` (`size: default`), `AlertDialog`, `Sheet` | `surface-frosted` on the surface (the same constant, `overlaySurface`): a translucent background, a backdrop blur and the small shadow instead of the kit's `bg-popover` and shadow; the kit's ring and scrim stay | **Visible, by the owner's decision D-47**: surfaces that float over the page are frosted. The look is `../TOKENS.md` § Frosted surface |

**Removed with D-43:** the border that stood in for the scrim and shadow (both are drawn again); our
close `Button` first in a header row — `Dialog` and `Sheet` use **the kit's own close button**, in the
kit's place (top end corner, last in the tab order), named from the messages through `closeLabel`; the
header and footer paddings of ours; the 44 px minimum on triggers.

## Registry

One row per component. The Component cell is the component's name in
backticks and nothing else. Source: `kit` · `wrapped` · `new` · `dependency`;
Status: `lofi` · `styled` · `deprecated → <replacement>` (`../COMPONENTS.md`
§ Registry).

| Component | Source | Variants | Status | Notes |
| --- | --- | --- | --- | --- |
| `Dialog` | `wrapped` | `trigger`; `open`, `defaultOpen`, `onOpenChange`; `size: default · wide` (default `default`; D-52); slots `title`, `description`, `footer`, children | `lofi` | A task that interrupts the page. `wide` is a large window in the middle of the screen for a whole working surface (功能设置): `max-w-4xl`, `max-w-6xl` from `xl`, at most eleven twelfths of the window high, scrolling inside, on a solid background (the kit's `bg-popover`; every other overlay is frosted, D-47); `default` is the kit's measure. Never taller than the window: what does not fit scrolls inside, the actions wrap beneath. No scrim and no shadow in the placeholder theme — it separates from the page by its border. The close control is our `Button`, named in the user's language |
| `AlertDialog` | `wrapped` | `trigger`; `open`, `defaultOpen`, `onOpenChange`; `title`, `description`, `confirmLabel`, `confirmVariant: primary · danger` (default `primary`), `onConfirm`, `cancelLabel` | `lofi` | A question that must be answered: two buttons, cancel first. Both close it; only the confirming one calls `onConfirm`. A press outside does not close it. `cancelLabel` is "Cancel" in the user's language unless set |
| `Sheet` | `wrapped` | `side: end · bottom` (default `end`); `trigger`; `open`, `defaultOpen`, `onOpenChange`; slots `title`, `description`, `footer`, children | `lofi` | A panel beside the page for detail and history. `end` is the kit's right edge (no RTL, D-17); the caller passes `bottom` in the compact size class. Scrolls inside, separates by its border, our close `Button` |
| `Collapsible` | `kit` | `open`, `defaultOpen`, `onOpenChange`; sub-parts `CollapsibleTrigger`, `CollapsibleContent` | `lofi` | Re-exported unchanged. The trigger is always our `Button`, passed as `render` |
| `Tooltip` | `kit` | `side`, `align` on `TooltipContent`; sub-parts `TooltipTrigger`, `TooltipContent`, `TooltipProvider` | `lofi` | Re-exported unchanged. A hint on a control that already has a name — never the only label. The trigger is always our `Button`, passed as `render` |
| `Card` | `kit` | `size: default · sm`; sub-parts `CardHeader`, `CardTitle`, `CardDescription`, `CardAction`, `CardContent`, `CardFooter` | `lofi` | Re-exported unchanged. A surface that groups content; not interactive itself |
| `Separator` | `kit` | `orientation: horizontal · vertical` | `lofi` | Re-exported unchanged. A hairline between things that belong apart |

## Accessibility contract

One row per component of the registry above; the reviewer tests against it
(`../ACCESSIBILITY.md` § Per-component contract). Min target is 44 × 44 CSS px
through `size.target.min` for anything interactive. **Withdrawn by D-43:** there is no
target-size and no contrast requirement; the "Min target" column binds nothing.

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
