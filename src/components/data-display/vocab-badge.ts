// What the two vocabulary badges add to the kit's `Badge`. The kit keeps a
// badge on one line at a fixed height and hides what does not fit; these two
// stand beside titles in narrow places (a canvas node, a table cell, a
// 320 px row), so here the height follows the text and the text wraps.
export const vocabBadgeClass = 'h-auto max-w-full shrink text-start whitespace-normal wrap-anywhere [&>svg]:shrink-0'
