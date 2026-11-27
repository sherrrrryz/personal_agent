import { createContext, use, useState } from 'react'
import { useLocation, useNavigationType, type NavigationType } from 'react-router'

/** One entry of the window's history as the app saw it: its key, its path, and whether it was a screen inside the shell. */
export type HistoryEntry = { key: string; pathname: string; app: boolean }

/** The entries seen since the app loaded, in order, and which one is open. */
export type InAppHistory = { entries: HistoryEntry[]; index: number }

/**
 * Follows one move of the router into the copy of the history (D-53). A push
 * drops what lay ahead and adds the entry; a replace swaps the open entry; a
 * pop moves to the entry with that key — or, when the key was never seen (the
 * browser's back past a reload), starts again from it. Seeing the open entry
 * again changes nothing, so a render that runs twice is harmless.
 */
export function step(history: InAppHistory | null, type: `${NavigationType}`, entry: HistoryEntry): InAppHistory {
  if (!history) return { entries: [entry], index: 0 }
  const { entries, index } = history
  const open = entries[index]
  if (open?.key === entry.key) {
    return open.app === entry.app ? history : { entries: entries.with(index, entry), index }
  }
  if (type === 'PUSH') return { entries: [...entries.slice(0, index + 1), entry], index: index + 1 }
  if (type === 'REPLACE') return { entries: entries.with(index, entry), index }
  const found = entries.findIndex(({ key }) => key === entry.key)
  return found === -1 ? { entries: [entry], index: 0 } : { entries, index: found }
}

/**
 * The entry before the open one, as far as the app saw it (D-53, 从哪来回哪去).
 * The browser cannot say where its previous entry leads, so the shell keeps
 * its own copy of the history from the moment the app loaded: a direct
 * address or a reload starts it afresh. `app` says whether that entry was a
 * screen inside the shell (onboarding and `/dev/*` are not). Must be called
 * where it never unmounts — the shell itself — so no move is missed.
 */
export function usePreviousEntry(app: boolean): HistoryEntry | null {
  const location = useLocation()
  const type = useNavigationType()
  const [history, setHistory] = useState<InAppHistory | null>(null)
  const next = step(history, type, { key: location.key, pathname: location.pathname, app })
  // Adjusting state while rendering, as React documents: the header reads the new value in the same pass.
  if (next !== history) setHistory(next)
  return next.entries[next.index - 1] ?? null
}

/** The path of the screen of the app she came from to the open one; `null` when there is none. */
export const CameFromContext = createContext<string | null>(null)

/**
 * Where she came from (D-53): the path of the screen inside the app that the
 * entry before the open one shows, or `null` — a direct address, a reload,
 * outside the shell. A screen that closes something she opened (a sheet with
 * an address) goes back when this is where it closes to, so that closing does
 * not become a step she can go back along.
 */
export function useCameFrom(): string | null {
  return use(CameFromContext)
}
