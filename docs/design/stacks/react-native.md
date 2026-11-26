# Stack rules — React Native (app)

> Status: evergreen — the hard rules and working conventions for building the
> design system in React Native. Framework-neutral rules are in
> `../RESPONSIVE.md`, `../ACCESSIBILITY.md` and `../TOKENS.md`; this document
> says how they are met on iOS and Android.

<!--
HOW TO BUILD THIS DOC
- Keep the hard rules. Fill the <placeholders> with the project's choices in
  task 0, and add conventions as the project settles them.
- Version-sensitive facts (React Native, Expo, kit versions, OS behaviour)
  were checked on 2026-11-20; re-check when adopting.
-->

**Runtime:** `<Expo SDK / bare, React Native version>` · **Styling system:** `<StyleSheet + theme hook / NativeWind / Tamagui / …>` · **UI kit:** see `../FOUNDATIONS.md`

## Hard rules

1. **Every dimension is a number from the token scale.** React Native numbers
   are density-independent; there is no `rem`. What replaces it is the token
   scale plus the system font scale.
2. **`allowFontScaling` stays on.** `maxFontSizeMultiplier` is set only with a
   recorded reason, and never below the largest size the matrix requires.
3. **`minHeight`, never `height`, on anything that contains text.**
4. **Never compute `fontSize × fontScale` by hand** — Android's scale is not
   linear. Let `<Text>` scale; read `useWindowDimensions().fontScale` only to
   adapt padding and layout.
5. **Touch targets ≥ 44×44 pt on iOS and ≥ 48×48 dp on Android** (Android:
   at least 8 dp apart); extend a smaller visual with `hitSlop`.
6. **Insets come from `react-native-safe-area-context`**, applied once at the
   screen level. The built-in `SafeAreaView` is deprecated. Content draws
   edge-to-edge on Android; nothing tappable sits under system gesture areas.
7. **Layout reads `useWindowDimensions`** and branches on window width class
   (compact < 600 · medium 600–839 · expanded ≥ 840 dp) — never on device
   type, never on orientation, never on a module-level `Dimensions.get`.
8. **No layout depends on an orientation lock.**
9. **The colour mode comes from `useColorScheme`** (plus an in-app override
   only if the owner decided to have one) and selects the token mode.
   Components never branch on it. With Expo, set `userInterfaceStyle:
   "automatic"` — without it the app is light-only and nothing reports it.
10. **Every pressable has a role, a name and its state** (`role`, `aria-label`,
    `aria-disabled | selected | checked | expanded`).
11. **`start` / `end` style properties only** — never left/right.
12. **Animations honour the system reduce-motion setting**; never force it off.
13. **No raw colour, size or font value in a style** — only theme references.

## Units

- Numbers only, taken from the generated theme object. Percentages and `flex`
  for fluid sizing.
- Dividers: `StyleSheet.hairlineWidth`. Computed sizes:
  `PixelRatio.roundToNearestPixel`.
- Line height is stored as a ratio in the token source and emitted as
  `fontSize × ratio` per text style.
- If the styling system maps `rem` (NativeWind does), **set the base
  explicitly** — its native default is 14, not 16, so the same class is a
  different size on web and app.

## Tokens in React Native

- Output: `<path>` — a typed theme object per mode, generated from the same
  source as the web output. The build needs a custom transform to emit plain
  numbers; the stock React Native transforms do not.
- Access through one hook (`<useTheme>`); styles are created from the theme,
  not from constants captured at module load.
- Shadows: iOS shadow props and Android `elevation` are both generated from
  the same elevation token.
- Blur intensity is not the design tool's radius; map it per platform once,
  in the token transform, and record the mapping in `../UI-PITFALLS.md`.
- Text styles are platform-aware where the product follows the platform:
  iOS body is 17 pt, Material body is 16 sp. Decide in task 0 whether one
  brand scale or the platform scales are used (D-entry).

## Accessibility in React Native

- Name: `aria-label` / `accessibilityLabel`; it contains the visible text.
  `accessibilityHint` is optional reading — never the only place for
  essential information.
- Role: prefer `role`; it takes precedence over `accessibilityRole`.
- Grouping: `accessible` makes a container one focusable element — use it for
  cards and list rows so they read as one item.
- Status announcements: `aria-live` works on **Android only**; on iOS call
  `AccessibilityInfo.announceForAccessibility`. Do both.
- Modals: `aria-modal` works on **iOS only**; on Android hide the background
  with `importantForAccessibility="no-hide-descendants"`. Do both.
- Gestures: every swipe or drag has an `accessibilityActions` equivalent and
  a visible single-tap alternative.
- Never `aria-hidden` on something focusable.
- Contrast is measured in both appearances.
- Verify with VoiceOver **and** TalkBack — they differ.

## UI kits

Candidates as of 2026-11-20 — verify status when choosing (task 0).

| Kit | Model | Styling engine | Shares tokens with web |
| --- | --- | --- | --- |
| React Native Reusables | Source copied in (shadcn-style, on RN Primitives) | NativeWind / Uniwind | Same variable names; values need a generator |
| gluestack-ui | Source copied in | NativeWind / Uniwind | Same engine on both; verify the token path before relying on it |
| Tamagui | Dependency + compiler | Its own; tokens and themes | Yes — one config for both |
| React Native Paper | Styled dependency | Theme object | Material look; web is secondary |
| Expo UI | Real SwiftUI / Compose controls | Native | Platform look, least themable |

Check before choosing: the styling engine's stable version and which Tailwind
major it tracks; the React Native / Expo version floor; that a licence file
exists. NativeBase is deprecated.

## Platform conventions the low-fi prototype must already respect

| Decision | iOS | Android (Material 3) |
| --- | --- | --- |
| Top-level navigation | Bottom tab bar; adapts to top / sidebar on iPad | Bottom navigation bar, 3–5 labelled destinations; rail from 600 dp |
| Back | Back symbol in the bar | System back gesture — every screen has a defined back destination |
| Sheets | Medium / large detents, swipe to dismiss | Modal bottom sheet; side sheet when wide |
| Primary action | One prominent action, trailing side of the bar | One floating action button |
| In-page switching | Segmented control (about five at most) | Tabs |
| Search | Bottom (tab or toolbar) on iPhone | Search bar at the top |
| Minimum type | 11 pt | — |

- Never two primary navigation components on one screen.
- Tab bars navigate; they never hold actions.
- iPad and large Android windows are freely resizable: every screen must work
  down to compact width.
- Follow the system appearance; an in-app theme switch is an owner decision.

## Verification

Matrix cells for the app are in `../FOUNDATIONS.md`. Minimum: a small phone,
a large phone, a tablet or foldable window (≥ 840 dp), landscape · system
font scale default and largest · both appearances · VoiceOver and TalkBack ·
reduce motion · RTL if required. On both platforms — an iOS-only pass proves
nothing about Android.

## Pitfalls

<Add entries as learned; symptoms also go in `../UI-PITFALLS.md`.>
