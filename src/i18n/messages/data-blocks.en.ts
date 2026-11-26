import type { Messages } from '../types'

// Namespace `data-blocks` — what the four data blocks (package S10:
// `block.summary`, `block.list`, `block.table`, `block.schedule`) say by
// themselves, and the text of their demos. A block's own content arrives in
// its props, already in the reader's language; shared words stay in `common`.
const messages = {
  // The name of an action button: the action, then the item it acts on.
  'action.of': '{action}: {item}',

  'summary.empty': 'No figures yet',
  'list.empty': 'Nothing in this list yet',
  'table.empty': 'No rows yet',
  'schedule.empty': 'Nothing scheduled in this period',

  'schedule.range.span': '{start} – {end}',
  'schedule.region': 'Schedule, {range}',
  'schedule.resource.label': 'Showing',
  'schedule.slot.time': '{start} – {end}',
  'schedule.none': 'Nothing scheduled',

  'demo.pick': 'State of the block',
  'demo.state.ready': 'Ready',
  'demo.state.loading': 'Loading',
  'demo.state.empty': 'Empty',
  'demo.state.error': 'Error',
  'demo.long': 'Long content',
  'demo.narrow': 'In a narrow container: one resource, chosen from the list',
  'demo.medium': 'In a medium container: two resources side by side',
  'demo.dogs': 'Doudou|Momo|Biscuit|Lucky|Coco|Nuomi|Tuantuan|Wangcai',
  'demo.groomers': 'Zhou Lan|Chen|Ajie',
  'demo.breeds': 'Golden retriever|Poodle|Corgi|Samoyed|Shiba inu|Bichon frise|Schnauzer|Border collie',
  'demo.sizes': 'Large|Small|Medium',
  'demo.longName': 'Doudou the Third of Willow Lane, who answers only to “Doudou, treat” and to nothing else at all',
  'demo.longNote':
    'Nervous around the dryer: start on the lowest setting, keep one hand on the shoulder and stop when the tail drops. ',

  'summary.demo.title': 'Today',
  'summary.demo.bookings.label': 'Bookings today',
  'summary.demo.bookings.value': '6',
  'summary.demo.bookings.delta': '2 more than yesterday',
  'summary.demo.unplaced.label': 'Waiting for a slot',
  'summary.demo.unplaced.value': '2',
  'summary.demo.hours.label': 'Estimated work',
  'summary.demo.hours.delta': 'Zhou Lan carries the most',
  'summary.demo.gap.label': 'Next free slot',
  'summary.demo.gap.value': '3:30 PM',
  'summary.demo.long.label': 'Figure {n}: the average difference between the estimated and the measured time',
  'summary.demo.long.value': '{n} bookings',
  'summary.demo.long.delta': 'Up by {n} since the review on Monday evening',

  'list.demo.title': 'Messages to send',
  'list.demo.confirmed.title': 'Doudou’s owner replied',
  'list.demo.confirmed.meta': 'Thursday’s booking at 2:00 PM is confirmed.',
  'list.demo.confirmed.badge': 'Confirmed',
  'list.demo.remind.title': 'Remind Momo’s owner to book again',
  'list.demo.remind.meta': 'The last visit was six weeks ago; the draft is ready.',
  'list.demo.remind.badge': 'Deferred',
  'list.demo.remind.send': 'Send',
  'list.demo.remind.skip': 'Skip',
  'list.demo.record.title': 'Biscuit’s grooming time is now 2 hr',
  'list.demo.record.meta': 'Changed from the breed’s rule to Biscuit’s own record after two visits.',
  'list.demo.record.badge': 'Autonomous',
  'list.demo.record.second': 'From the record',
  'list.demo.record.undo': 'Undo',
  'list.demo.long.title': 'Reminder {n} for {dog}',
  'list.demo.long.meta': 'Due again in {n} days.',
  'list.demo.long.badge': 'Reminder',
  'list.demo.long.open': 'Open',

  'table.demo.title': 'Grooming time by breed',
  'table.demo.caption': 'Grooming time by breed, rule against measurement',
  'table.demo.long.caption': 'Grooming time by dog, all 40 records',
  'table.demo.alone.caption': 'Grooming time by breed, the block on its own',
  'table.demo.col.breed': 'Breed',
  'table.demo.col.size': 'Size',
  'table.demo.col.rule': 'Rule',
  'table.demo.col.measured': 'Measured average',
  'table.demo.col.diff': 'Difference',
  'table.demo.col.visits': 'Visits',
  'table.demo.col.basis': 'Basis',
  'table.demo.basis.rule': 'The breed’s rule',
  'table.demo.basis.record': 'The dog’s own record',
  'table.demo.basis.note': 'From {n} timed visits',
  'table.demo.diff.over': '{duration} over',
  'table.demo.diff.under': '{duration} under',
  'table.demo.diff.none': 'On the rule',

  'schedule.demo.title': 'Bookings by groomer',
  'schedule.demo.service.full': 'full groom',
  'schedule.demo.service.bath': 'bath',
  'schedule.demo.slot.title': '{dog}, {service}',
  'schedule.demo.slot.meta': '{breed}, estimated {duration}',
  'schedule.demo.badge.first': 'First visit',
  'schedule.demo.badge.deferred': 'Deferred',
  'schedule.demo.start': 'Start',
  'schedule.demo.move': 'Move',
} satisfies Messages

export default messages

declare module '@/i18n/types' {
  interface MessageNamespaces {
    'data-blocks': typeof messages
  }
}
