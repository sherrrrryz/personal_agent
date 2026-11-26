import type { Messages } from '../types'

// Namespace `blocks` — what the block renderer and the blocks `block.text`,
// `block.empty` and `block.proposal` say by themselves (package S9), and the
// text of their demos. The content of a block is never here: a page builder
// passes it in, already in the reader's language.
const messages = {
  'renderer.changes': { one: 'This run: {count} update', other: 'This run: {count} updates' },
  'renderer.empty.title': 'This page has nothing yet',
  'renderer.empty.body': 'What the workflow puts out appears here after it runs.',
  'renderer.error.title': 'This page could not be loaded',
  'renderer.error.reason': 'The output of the workflow did not arrive. Nothing was changed; you can try again.',
  'renderer.unknown.title': 'This block cannot be shown',
  'renderer.unknown.body': 'The workflow put out a block type that is not registered:',

  'pin.short': 'Pin',
  'pin.label': 'Pin “{title}”',
  'pin.announce.on': 'Pinned “{title}”. It keeps this position when the layout changes.',
  'pin.announce.off': 'Unpinned “{title}”. It moves with the layout again.',

  'text.links': 'Related links',
  'text.empty.title': 'No note yet',
  'text.error.title': 'This note could not be written',
  'text.error.reason': 'Writing this text failed. The rest of the page is not affected.',

  'empty.error.title': 'This part could not be loaded',
  'empty.error.reason': 'It did not arrive. Nothing was changed.',

  'proposal.from': 'From',
  'proposal.parts': 'Parts of the proposal',
  'proposal.accept': 'Accept',
  'proposal.reject': 'Reject',
  'proposal.state.accepted': 'Accepted',
  'proposal.state.rejected': 'Rejected',
  'proposal.state.pending': 'Waiting for your decision',
  'proposal.remaining': {
    one: '{count} part is waiting for your decision.',
    other: '{count} parts are waiting for your decision.',
  },
  'proposal.done': 'All decided: {accepted} accepted, {rejected} rejected.',
  'proposal.empty.title': 'No proposal is waiting for you',
  'proposal.error.title': 'This proposal could not be loaded',
  'proposal.error.reason': 'Its content did not arrive. Nothing was changed.',

  'demo.pick': 'State shown',
  'demo.state.ready': 'Ready',
  'demo.state.loading': 'Loading',
  'demo.state.empty': 'Empty',
  'demo.state.error': 'Error',
  'demo.state.long': 'Long content',
  'demo.marks': 'Mark what the last run changed',
  'demo.reset': 'Start over',
  'demo.readOnly': 'With no action handler: read only',

  'demo.renderer.page': 'A page of every registered block',
  'demo.renderer.run': 'Simulate a run',
  'demo.renderer.reorder': 'Re-order the workflow’s output',
  'demo.renderer.order': 'Order emitted by the workflow: {order}',
  'demo.renderer.narrow': 'In a narrow container: half blocks stack',
  'demo.renderer.wide': 'In a wide container: half blocks pair',
  'demo.renderer.unknown': 'A block type nobody registered',
  'demo.renderer.unknownTitle': 'Monthly chart',
  'demo.renderer.noteNarrow': 'Note (narrow)',
  'demo.renderer.linksNarrow': 'Next step (narrow)',
  'demo.renderer.noteWide': 'Note (wide)',
  'demo.renderer.linksWide': 'Next step (wide)',
  'demo.renderer.pairBody': 'Golden retrievers took 3 h 45 min on average this week.',
  'demo.renderer.pairNext': 'Monday’s review will say whether the breed table should change.',

  'demo.text.title': 'About this week’s durations',
  'demo.text.body':
    'The five golden retrievers groomed this week took 3 h 45 min on average — shorter than the 4 h in your breed table.\n\nDafu was restless and took 4 h 10 min; Doudou was the quickest at 3 h 20 min. Monday’s review will say whether the table should change.',
  'demo.text.link1': 'Open the breed duration table',
  'demo.text.link2': 'Open Doudou’s file',
  'demo.text.longBody':
    'The five golden retrievers groomed this week took 3 h 45 min on average — shorter than the 4 h in your breed table. The shortest was 3 h 20 min and the longest 4 h 10 min.\n\nDafu was restless again and needed two breaks, which is why his appointment ran 10 minutes over the table. Doudou, Maiya, Naicha and Lucky all finished early; for these four the table leaves between 15 and 40 minutes unused on every visit.\n\nXueqiu, the bichon, took 2 h 10 min against 2 h in the table, and Max, the border collie, 3 h 05 min against 3 h. One visit each is not enough to change anything, so both rows stay as they are.\n\nCorgis and French bulldogs still have no finished appointment, so their rows keep your own estimate. The first finished visit fills the observed column; the applied duration changes only after you accept a proposal.\n\nNothing has been changed yet. On Monday at 9:00 the weekly review compares the observed averages with the table and, where the difference holds over several visits, proposes a new applied duration for you to accept or reject, row by row.',
  'demo.text.longLink3': 'Open the list of this week’s finished appointments with the estimated and the actual duration of each',
  'demo.text.longLink4': 'Open the workflow of the weekly review',
  'demo.text.longLink5': 'Open the memory table the durations are learned into',

  'demo.empty.title': 'To-dos',
  'demo.empty.heading': 'Nothing to do today',
  'demo.empty.body': 'To-dos of the shop appear here: the ones you write down and the ones other modules pass on.',
  'demo.empty.action': 'See today’s bookings',
  'demo.empty.longHeading': 'Nothing to do today, and nothing was carried over from yesterday or from the weekend either',
  'demo.empty.longBody':
    'To-dos of the shop appear here: the ones you write down yourself, the ones the booking module passes on when a customer has not confirmed, the ones the stock module raises when shampoo runs low, and the ones the weekly review leaves for you. When none of them has anything for you, this page stays empty.',
  'demo.empty.longAction': 'See today’s bookings and the ones still waiting for a time',

  'demo.proposal.title': 'Suggested change to Saturday’s shifts',
  'demo.proposal.source': 'Shifts',
  'demo.proposal.summary': 'Two golden retrievers are booked back to back on Saturday. By the breed table each needs 4 h, more than Chen can do alone.',
  'demo.proposal.part1': 'Move Doudou’s booking from 10:00 to 9:00',
  'demo.proposal.part2': 'Ask Ajie to work 2 h longer on Saturday',
  'demo.proposal.part3': 'Message Dafu’s owner to confirm the new time',
  'demo.proposal.longPart4':
    'Keep the hour between 13:00 and 14:00 free for both groomers, so that an appointment that runs over — Dafu’s usually does — does not push every later booking of the day',
  'demo.proposal.longPart5': 'Move Xueqiu’s bath from Saturday 15:00 to Sunday 10:00, where Chen has a free slot of 2 h 30 min',
  'demo.proposal.longPart6': 'Tell Xueqiu’s owner about the move and ask for a confirmation by Friday evening',
  'demo.proposal.longPart7': 'Add 30 minutes to Buding’s first visit, as for every first visit',
  'demo.proposal.longPart8': 'Order two bottles of the long-coat shampoo before Saturday; one bottle is left',
} satisfies Messages

export default messages

declare module '@/i18n/types' {
  interface MessageNamespaces {
    blocks: typeof messages
  }
}
