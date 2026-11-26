import { Fragment, type ReactElement } from 'react'

import { Button } from '@/components/actions'
import { focusRing } from '@/components/actions/focus-ring'
import {
  Breadcrumb as KitBreadcrumb,
  BreadcrumbEllipsis,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { useT } from '@/i18n'

import { DropdownMenu, DropdownMenuItem } from './DropdownMenu'

export type Crumb = {
  label: string
  /** The link to this level — a router link. Not needed for the last crumb, the page that is open. */
  render?: ReactElement
}

export type BreadcrumbProps = {
  /** From the top level down; the last one is the page that is open. */
  items: ReadonlyArray<Crumb>
  /** "You are here" in the user's language unless set; a page with two breadcrumbs names them apart. */
  'aria-label'?: string
}

// A crumb is a target like any other link outside running text, and is told
// from the text around it by its underline, not by colour.
const linkClass = `inline-flex min-h-target min-w-target items-center rounded-sm underline underline-offset-4 wrap-anywhere ${focusRing}`
const pageClass = 'inline-flex min-h-target min-w-target items-center font-medium wrap-anywhere'

/**
 * Where the page sits. With room, the whole path, wrapping. Without, one
 * button that opens the path as a menu, and the page's name on one line, cut
 * short — the single truncating slot of the system: the full path, the
 * page's full name included, is one press away.
 */
export function Breadcrumb({ items, 'aria-label': label }: BreadcrumbProps) {
  const t = useT('navigation')
  const page = items.at(-1)
  if (!page) return null
  const ancestors = items.slice(0, -1)
  const folds = ancestors.length > 0

  return (
    <KitBreadcrumb aria-label={label ?? t('breadcrumb.label')} className="@container w-full min-w-0 flex-1">
      <BreadcrumbList className={folds ? 'hidden @md:flex' : undefined}>
        {ancestors.map((crumb, index) => (
          <Fragment key={index}>
            <BreadcrumbItem>
              <BreadcrumbLink render={crumb.render} className={linkClass}>
                {crumb.label}
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
          </Fragment>
        ))}
        <BreadcrumbItem>
          <BreadcrumbPage className={pageClass}>{page.label}</BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>

      {folds && (
        <BreadcrumbList className="flex-nowrap @md:hidden">
          <BreadcrumbItem>
            <DropdownMenu
              trigger={
                <Button variant="ghost" size="icon" aria-label={t('breadcrumb.path')}>
                  <BreadcrumbEllipsis label={t('breadcrumb.path')} />
                </Button>
              }
            >
              {ancestors.map((crumb, index) => (
                <DropdownMenuItem key={index} render={crumb.render}>
                  {crumb.label}
                </DropdownMenuItem>
              ))}
              <DropdownMenuItem current>{page.label}</DropdownMenuItem>
            </DropdownMenu>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          {/* The one place text is cut on purpose (spec § Responsive); the menu beside it holds it in full. */}
          <BreadcrumbItem className="min-w-0" data-matrix-allow="clip">
            <BreadcrumbPage className="flex min-h-target max-w-full min-w-target items-center font-medium">
              <span className="min-w-0 truncate">{page.label}</span>
            </BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      )}
    </KitBreadcrumb>
  )
}
