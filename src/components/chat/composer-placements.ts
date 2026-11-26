// Where a `ChatComposer` stands — in its own file so the component file exports components only.
export const chatComposerPlacements = ['bar', 'thread', 'onboarding'] as const
export type ChatComposerPlacement = (typeof chatComposerPlacements)[number]
