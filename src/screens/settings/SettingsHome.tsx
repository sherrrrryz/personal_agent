import { ChevronRightIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { Link } from 'react-router'

import { Item, ItemContent, ItemDescription, ItemGroup, ItemTitle } from '@/components/data-display'
import { Skeleton } from '@/components/feedback'
import { Page, Section, Stack } from '@/components/layout'
import { LocaleSelect, ThemeToggle } from '@/components/navigation'
import { useT } from '@/i18n'
import { useResource, type ResourceAnswer } from '@/runtime'
import { settingsPaths } from '@/screens/onboarding/paths'

/**
 * One status line of the home: the words for the data once it is read, a
 * skeleton while it loads, and 暂时读不到状态 when it cannot be read — the
 * link it sits in works in every state.
 */
function StatusLine<Data>({ answer, children }: { answer: ResourceAnswer<Data>; children: (data: Data) => ReactNode }) {
  const t = useT('settings')
  // A shape, not a paragraph: the kit's skeleton is a block and cannot sit inside the description.
  if (answer.state === 'loading') return <Skeleton data-status-line="loading" className="h-4 w-32" />
  return (
    <ItemDescription data-status-line={answer.state}>
      {answer.state === 'error' ? t('home.status.error') : children(answer.data)}
    </ItemDescription>
  )
}

/**
 * `settings` — three links, each with a live status line (accounts connected,
 * kinds of task with a ceiling, profession modules), and 显示: the theme and
 * the language.
 */
export function SettingsHome() {
  const t = useT('settings')
  const accounts = useResource({ kind: 'accounts' })
  const modes = useResource({ kind: 'mode-settings' })
  const modules = useResource({ kind: 'modules' })

  const row = (to: string, title: string, status: ReactNode) => (
    <Item variant="outline" render={<Link to={to} />}>
      <ItemContent>
        <ItemTitle>{title}</ItemTitle>
        {status}
      </ItemContent>
      <ChevronRightIcon aria-hidden="true" className="size-4 shrink-0" />
    </Item>
  )

  return (
    <Page title={t('home.title')} width="prose">
      <ItemGroup aria-label={t('home.pages')}>
        {row(
          settingsPaths.accounts,
          t('home.accounts'),
          <StatusLine answer={accounts}>
            {(data) => {
              const count = data.filter((account) => account.status === 'connected').length
              return count === 0 ? t('home.accounts.none') : t('home.accounts.status', { count })
            }}
          </StatusLine>,
        )}
        {row(
          settingsPaths.aiModes,
          t('home.modes'),
          <StatusLine answer={modes}>
            {(data) => {
              const count = data.filter((setting) => setting.ceiling !== null).length
              return count === 0 ? t('home.modes.none') : t('home.modes.status', { count })
            }}
          </StatusLine>,
        )}
        {row(
          settingsPaths.profession,
          t('home.profession'),
          <StatusLine answer={modules}>
            {(data) => t('home.profession.status', { count: data.filter((module) => module.kind === 'profession').length })}
          </StatusLine>,
        )}
      </ItemGroup>
      <Section title={t('home.display')}>
        <Stack gap="md" align="start">
          <ThemeToggle />
          <div className="w-64 max-w-full">
            <LocaleSelect />
          </div>
        </Stack>
      </Section>
    </Page>
  )
}
