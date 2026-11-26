/** The four states of a data surface (`DataState`). A resource that is `long`, stale or partial is `ready` here. */
export const dataStates = ['ready', 'loading', 'empty', 'error'] as const
export type DataStateValue = (typeof dataStates)[number]
