import { Bot, CircleMinus, CirclePlus, Handshake, Hourglass, RefreshCw } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

import type { MessageKey } from '@/i18n'

// The two shared vocabularies (spec § Placeholder theme and tokens, "Shared
// vocabularies"). Every surface that shows a behaviour mode or a change kind
// — the picker, the badge, the marker, the canvas, a proposal — takes its
// icon and its wording from here, so surfaces built in parallel cannot
// diverge and colour is never the carrier (hard rule 13). The texts are keys
// of the `common` namespace: `useT('common')(behaviourMode.autonomous.nameKey)`.

type CommonKey = MessageKey<'common'>

/** The three behaviour modes (D-22), from most to least autonomy. */
export const behaviourModes = ['autonomous', 'assisted', 'deferred'] as const
export type BehaviourMode = (typeof behaviourModes)[number]

export type BehaviourModeEntry = {
  mode: BehaviourMode
  icon: LucideIcon
  /** The mode's name: 自主 · 协助 · 待确认 / Autonomous · Assisted · Deferred. */
  nameKey: CommonKey
  /** One line saying what the AI does in this mode. */
  meaningKey: CommonKey
  /**
   * How much the AI does on its own: a mode with a higher level is "above" a
   * lower one. Only for comparing — never shown.
   */
  autonomy: number
}

export const behaviourMode: Record<BehaviourMode, BehaviourModeEntry> = {
  autonomous: {
    mode: 'autonomous',
    icon: Bot,
    nameKey: 'mode.autonomous.name',
    meaningKey: 'mode.autonomous.meaning',
    autonomy: 2,
  },
  assisted: {
    mode: 'assisted',
    icon: Handshake,
    nameKey: 'mode.assisted.name',
    meaningKey: 'mode.assisted.meaning',
    autonomy: 1,
  },
  deferred: {
    mode: 'deferred',
    icon: Hourglass,
    nameKey: 'mode.deferred.name',
    meaningKey: 'mode.deferred.meaning',
    autonomy: 0,
  },
}

/** True when `mode` lets the AI do more on its own than `ceiling` allows (D-22). */
export function isAboveCeiling(mode: BehaviourMode, ceiling: BehaviourMode): boolean {
  return behaviourMode[mode].autonomy > behaviourMode[ceiling].autonomy
}

/** The mode that applies under a ceiling: the lower of the two (D-22). */
export function capMode(mode: BehaviourMode, ceiling: BehaviourMode): BehaviourMode {
  return isAboveCeiling(mode, ceiling) ? ceiling : mode
}

/** What changed about an item since the user last looked. */
export const changeKinds = ['new', 'updated', 'removed'] as const
export type ChangeKind = (typeof changeKinds)[number]

export type ChangeKindEntry = {
  kind: ChangeKind
  icon: LucideIcon
  /** 新 · 已更新 · 已移除 / New · Updated · Removed. */
  labelKey: CommonKey
}

export const changeKind: Record<ChangeKind, ChangeKindEntry> = {
  new: { kind: 'new', icon: CirclePlus, labelKey: 'change.new' },
  updated: { kind: 'updated', icon: RefreshCw, labelKey: 'change.updated' },
  removed: { kind: 'removed', icon: CircleMinus, labelKey: 'change.removed' },
}
