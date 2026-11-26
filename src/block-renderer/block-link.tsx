import type { ReactNode } from 'react'
import { Link } from 'react-router'

// How a block draws a link a page builder gave it (`BlockLink`, a `source`,
// an item's `href`): a path of the app goes through the router, anything
// else is a plain anchor. Imported by file from the blocks — never through
// `./index`, which loads the registry and with it every block.

/** A text link inside a block: underlined (never told apart by colour alone), a full target, wraps. */
export const blockLinkClass =
  'inline-flex max-w-full items-center rounded-sm text-start underline underline-offset-4 wrap-anywhere'

export function BlockAnchor({ href, className = blockLinkClass, children }: { href: string; className?: string; children: ReactNode }) {
  return href.startsWith('/') ? (
    <Link to={href} className={className}>
      {children}
    </Link>
  ) : (
    <a href={href} className={className}>
      {children}
    </a>
  )
}
