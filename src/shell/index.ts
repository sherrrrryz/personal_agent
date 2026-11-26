// The app shell (spec part 2 § Shell): single-use compositions, not registry
// components. `Shell` is the layout line of `src/app/RootLayout.tsx`.
export { modulePath } from './crumbs'
export { moduleIconComponents } from './module-icons'
export { chromeOf } from './route'
export type { ShellChrome, ShellHandle } from './route'
export { Shell } from './Shell'
export type { ShellSlots } from './slots'
