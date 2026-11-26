import { BlockAnchor } from '@/block-renderer/block-link'
import type { BlockComponentProps } from '@/blocks/types'
import { ChangeMarker } from '@/components/data-display'
import { DataState, Empty, EmptyHeader, EmptyTitle, Skeleton } from '@/components/feedback'
import { useT } from '@/i18n'

import { textBlockItems } from './items'

/**
 * `block.text` — a short note the AI wrote, with links. Running text at a
 * reading measure (`width: prose`): paragraphs are split on blank lines and
 * wrap; the links follow as a list.
 */
export function TextBlock({ props, changes, state }: BlockComponentProps<'block.text'>) {
  const t = useT('blocks')
  const paragraphs = props.body
    .split(/\n\s*\n/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean)
  const links = props.links ?? []
  const shown = state === 'ready' && paragraphs.length === 0 && links.length === 0 ? 'empty' : state

  return (
    <DataState
      state={shown}
      loading={
        <div className="flex max-w-prose flex-col gap-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/5" />
        </div>
      }
      empty={
        <Empty>
          <EmptyHeader>
            <EmptyTitle>{t('text.empty.title')}</EmptyTitle>
          </EmptyHeader>
        </Empty>
      }
      errorTitle={t('text.error.title')}
      error={t('text.error.reason')}
    >
      <div data-slot="block-text" className="flex max-w-prose min-w-0 flex-col gap-3">
        {changes[textBlockItems.body] && (
          <p>
            <ChangeMarker kind={changes[textBlockItems.body]} />
          </p>
        )}
        {paragraphs.map((paragraph, index) => (
          <p key={index} className="wrap-break-word whitespace-pre-line">
            {paragraph}
          </p>
        ))}
        {links.length > 0 && (
          <ul aria-label={t('text.links')} className="flex flex-col gap-1">
            {links.map((link) => (
              <li key={link.href} className="flex flex-wrap items-center gap-x-2">
                <BlockAnchor href={link.href}>{link.label}</BlockAnchor>
                {changes[link.href] && <ChangeMarker kind={changes[link.href]} />}
              </li>
            ))}
          </ul>
        )}
      </div>
    </DataState>
  )
}
