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
  // Field and control demos.
  'field.demo.name': 'Pet name',
  'field.demo.nameHelp': 'As the owner says it; shown on every appointment.',
  'field.demo.phone': 'Owner phone number',
  'field.demo.phoneError': 'Enter the number with its area code, for example 021 5555 0142.',
  'field.demo.disabled': 'Client number (set by the shop)',
  'field.demo.readOnly': 'Booked by',
  'field.demo.readOnlyValue': 'Front desk',
  'field.demo.notes': 'Notes for the groomer',
  'field.demo.notesHelp': 'Allergies, temperament, anything to watch for.',
  'field.demo.notesValue': 'Nervous around dryers. Use the quiet room and take breaks.',
  'field.demo.long': 'A field label long enough to wrap onto a second line at narrow widths and large text',
  'field.demo.placeholder': 'For example: Mochi',
  'select.demo.label': 'Service',
  'select.demo.placeholder': 'Choose a service',
  'select.demo.bath': 'Bath and brush',
  'select.demo.full': 'Full groom with a haircut, nail trim and ear cleaning',
  'select.demo.nails': 'Nail trim',
  'select.demo.unavailable': 'Teeth cleaning (not offered this month)',
  'select.demo.error': 'Choose a service before saving.',
  'switch.demo.label': 'Remind the owner the day before',
  'switch.demo.help': 'Sends one message at nine in the morning.',
  'switch.demo.disabled': 'Confirm bookings automatically',
  'switch.demo.readOnly': 'Shop is open on public holidays',
  'radio.demo.legend': 'Coat length',
  'radio.demo.help': 'Decides how long the appointment takes.',
  'radio.demo.short': 'Short',
  'radio.demo.shortHelp': 'About forty minutes.',
  'radio.demo.long': 'Long or double coat',
  'radio.demo.longHelp': 'About ninety minutes, with drying.',
  'radio.demo.unknown': 'Not sure yet',
  'radio.demo.error': 'Choose a coat length.',
  'group.demo.search': 'Search clients and pets',
  'group.demo.clear': 'Clear the search',
  'group.demo.price': 'Price',
  'group.demo.currency': 'yuan',
  'group.demo.message': 'Message to the owner',
  'group.demo.send': 'Send',
  // BehaviourModePicker demo.
  'modePicker.demo.free': 'Sending a message to a customer',
  'modePicker.demo.freeHelp': 'The most the assistant may do on its own for this kind of task.',
  'modePicker.demo.unset': 'Not set',
  'modePicker.demo.unsetHelp': 'The assistant decides, and prepares the work for your approval unless it is sure.',
  'modePicker.demo.capped': 'Moving the appointment when the groomer runs late',
  'modePicker.demo.cappedHelp': 'This step changes an appointment.',
  'modePicker.demo.lowest': 'Ordering more shampoo when stock runs low',
  'modePicker.demo.error': 'The choice could not be saved, so the earlier one is shown. Choose again.',
  'modePicker.demo.disabled': 'Archiving finished appointments (set by the shop)',
  // Toggle and ToggleGroup demos.
  'toggle.demo.pin': 'Pin to the top',
  'toggle.demo.mute': 'Mute reminders',
  'toggle.demo.star': 'Favourite',
  'toggleGroup.demo.view': 'Calendar view',
  'toggleGroup.demo.day': 'Day',
  'toggleGroup.demo.week': 'Week',
  'toggleGroup.demo.month': 'Month',
  'toggleGroup.demo.days': 'Opening days',
  'toggleGroup.demo.weekdays': 'Weekdays',
  'toggleGroup.demo.saturday': 'Saturday',
  'toggleGroup.demo.sunday': 'Sunday and public holidays',
} satisfies Messages

export default messages

declare module '@/i18n/types' {
  interface MessageNamespaces {
    inputs: typeof messages
  }
}
