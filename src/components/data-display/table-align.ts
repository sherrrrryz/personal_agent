/** How a column's text sits in its cells: `end` for numbers. */
export const tableAligns = ['start', 'end'] as const
export type TableAlign = (typeof tableAligns)[number]
