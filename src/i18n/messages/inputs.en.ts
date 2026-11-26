import type { Messages } from '../types'

// Namespace `inputs` — the action and input components (package S3): the one
// text a component of these families says by itself, and the sample text of
// their demos on `/dev/components`. Shared words stay in `common`.
const messages = {
  // BehaviourModePicker: why the options above the ceiling cannot be chosen.
  'modePicker.limit': 'Your settings allow {mode} at most here, so a mode that does more on its own cannot be chosen.',

  // Demo captions.
  'demo.variants': 'Variants',
  'demo.sizes': 'Sizes',
  'demo.states': 'States',
  'demo.wrapping': 'Long text',
  'demo.surfaces': 'On each surface',

  // Button demo.
  'button.demo.primary': 'Save changes',
  'button.demo.secondary': 'Preview',
  'button.demo.ghost': 'Skip',
  'button.demo.danger': 'Delete appointment',
  'button.demo.link': 'See every appointment',
  'button.demo.small': 'Add note',
  'button.demo.add': 'Add',
  'button.demo.withIcon': 'New appointment',
  'button.demo.disabled': 'Not available',
  'button.demo.startLoading': 'Show the busy state',
  'button.demo.stopLoading': 'End the busy state',
  'button.demo.long': 'A label long enough to wrap onto several lines when the button runs out of room',
} satisfies Messages

export default messages

declare module '@/i18n/types' {
  interface MessageNamespaces {
    inputs: typeof messages
  }
}
