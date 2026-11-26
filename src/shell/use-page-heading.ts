import { useEffect, useRef, useState, type RefObject } from 'react'
import { useLocation } from 'react-router'

import { useT } from '@/i18n'

/**
 * One `h1` per screen: after a route change focus moves to it, and the
 * document title follows its text (spec part 2 § Accessibility). Returns the
 * heading's text — the breadcrumb's open page — and the ref `main` takes.
 *
 * The first screen of a visit keeps the browser's own focus. A screen whose
 * `h1` arrives late gets focus on `main` meanwhile, and on the heading once it
 * is there — unless the user has moved on by then.
 */
export function usePageHeading(): { main: RefObject<HTMLElement | null>; heading: string } {
  const main = useRef<HTMLElement>(null)
  const { pathname } = useLocation()
  const t = useT('common')
  const [heading, setHeading] = useState('')
  const shown = useRef(pathname)

  useEffect(() => {
    const root = main.current
    if (!root) return
    let owed = shown.current !== pathname
    shown.current = pathname
    // A new screen starts at its top (jsdom has no `scrollTo`).
    if (owed && typeof root.scrollTo === 'function') root.scrollTo(0, 0)

    const read = () => {
      const h1 = root.querySelector('h1')
      setHeading(h1?.textContent?.trim() ?? '')
      if (!owed) return
      if (h1) {
        owed = false
        h1.setAttribute('tabindex', '-1')
        h1.focus()
      } else if (document.activeElement !== root) {
        root.focus()
      }
    }
    read()
    const observer = new MutationObserver(() => {
      // The user has moved on since the route changed: the heading no longer claims focus.
      if (owed && document.activeElement !== root && document.activeElement !== document.body) owed = false
      read()
    })
    observer.observe(root, { childList: true, subtree: true, characterData: true })
    return () => observer.disconnect()
  }, [pathname])

  const app = t('app.name')
  useEffect(() => {
    document.title = heading ? `${heading} · ${app}` : app
  }, [heading, app])

  return { main, heading }
}
