import { ChevronsUpDownIcon } from 'lucide-react'
import { useState } from 'react'

import { Button } from '@/components/actions'
import { AlertDialog, Collapsible, CollapsibleContent, CollapsibleTrigger, Dialog } from '@/components/containers'
import { Item, ItemActions, ItemContent, ItemDescription, ItemGroup, ItemTitle } from '@/components/data-display'
import { Badge, DataState, Empty, EmptyDescription, EmptyHeader, EmptyTitle, Skeleton, toast } from '@/components/feedback'
import { Stack } from '@/components/layout'
import { useLocale, useT } from '@/i18n'
import {
  dependentModules,
  latestRun,
  useActions,
  useResource,
  useRuntime,
  useRuntimeState,
  type Account,
  type AccountStatus,
} from '@/runtime'

type Variant = 'onboarding' | 'settings'

/** 连接 / 重新连接: the simulated authorisation, said to be one (spec part 3: 原型：模拟授权). */
function ConnectDialog({ account, onClose, onConnect }: { account: Account; onClose: () => void; onConnect: () => void }) {
  const t = useT('onboarding')
  const { locale } = useLocale()
  const name = account.name[locale]
  return (
    <Dialog
      open
      onOpenChange={(open) => !open && onClose()}
      title={t('connectors.connect.title', { name })}
      description={t('connectors.connect.body', { name })}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            {t('action.cancel')}
          </Button>
          <Button
            onClick={() => {
              onConnect()
              onClose()
            }}
          >
            {t('connectors.connect.confirm')}
          </Button>
        </>
      }
    />
  )
}

/**
 * The connector list — one composition for `onboarding.accounts` and
 * `settings.accounts` (spec part 3 § Screens): the shop's own tools first,
 * the rest under 更多; per account its status in words, the modules it feeds,
 * and 连接 (a simulated authorisation). In settings a connected account can be
 * disconnected, after an `AlertDialog` that names the modules that will stop.
 *
 * Disconnecting runs the modules the account feeds, so their frames show the
 * failure at once; connecting runs again the ones that had failed.
 *
 * Under 出错 the list cannot be read: it says so, and shows the last state
 * it has with the connected accounts marked 授权过期 — the one place that
 * status appears.
 */
export function ConnectorList({ variant }: { variant: Variant }) {
  const [attempt, setAttempt] = useState(0)
  return <Connectors key={attempt} variant={variant} onRetry={() => setAttempt((count) => count + 1)} />
}

function Connectors({ variant, onRetry }: { variant: Variant; onRetry: () => void }) {
  const t = useT('onboarding')
  const { locale } = useLocale()
  const actions = useActions()
  const runtime = useRuntime()
  const state = useRuntimeState()
  const answer = useResource({ kind: 'accounts' })
  const [connecting, setConnecting] = useState<Account | null>(null)
  // Accounts she reconnected while the list was failing: no longer marked.
  const [renewed, setRenewed] = useState<string[]>([])

  const failed = answer.state === 'error'
  const accounts = failed ? state.accounts : answer.state === 'ready' || answer.state === 'long' ? answer.data : []
  const statusOf = (account: Account): AccountStatus =>
    failed && account.status === 'connected' && !renewed.includes(account.id) ? 'expired' : account.status

  function connect(account: Account) {
    actions.connectAccount(account.id)
    setRenewed((ids) => [...ids, account.id])
    const now = runtime.getState()
    for (const module of dependentModules(now, account.id)) {
      if (latestRun(now, module.id)?.result === 'failed') void actions.runModule(module.id)
    }
    toast(t('connectors.connected', { name: account.name[locale] }), { kind: 'success' })
  }

  function disconnect(account: Account) {
    actions.disconnectAccount(account.id)
    for (const module of dependentModules(runtime.getState(), account.id)) void actions.runModule(module.id)
    toast(t('connectors.disconnected', { name: account.name[locale] }))
  }

  const row = (account: Account) => {
    const name = account.name[locale]
    const status = statusOf(account)
    const feeds = dependentModules(state, account.id)
    const stops = feeds.map((module) => module.name[locale]).join(t('connectors.separator'))
    return (
      // On the onboarding gradient each row is a card (D-54); in settings it stays the kit's outline row.
      <Item key={account.id} variant={variant === 'onboarding' ? 'card' : 'outline'} data-account={account.id} data-status={status}>
        <ItemContent>
          <ItemTitle>
            {name}
            <Badge variant={status === 'connected' ? 'secondary' : status === 'expired' ? 'destructive' : 'outline'}>
              {status === 'expired' ? t(`connectors.status.expired.${variant}`) : t(`connectors.status.${status}`)}
            </Badge>
          </ItemTitle>
          {feeds.length === 0 ? (
            <ItemDescription>{t('connectors.feeds.none')}</ItemDescription>
          ) : (
            <ul aria-label={t('connectors.feeds')} className="flex min-w-0 flex-wrap items-center gap-1">
              <li className="text-sm text-muted-foreground">{t('connectors.feeds')}</li>
              {feeds.map((module) => (
                <li key={module.id}>
                  <Badge variant="outline">{module.name[locale]}</Badge>
                </li>
              ))}
            </ul>
          )}
        </ItemContent>
        <ItemActions>
          {status === 'disconnected' && (
            <Button variant="secondary" size="sm" aria-label={t('connectors.connect.name', { name })} onClick={() => setConnecting(account)}>
              {t('connectors.connect')}
            </Button>
          )}
          {status === 'expired' && (
            <Button variant="secondary" size="sm" aria-label={t(`connectors.reconnect.name.${variant}`, { name })} onClick={() => setConnecting(account)}>
              {t(`connectors.reconnect.${variant}`)}
            </Button>
          )}
          {status === 'connected' && variant === 'settings' && (
            <AlertDialog
              trigger={
                <Button variant="secondary" size="sm" aria-label={t('connectors.disconnect.name', { name })}>
                  {t('connectors.disconnect')}
                </Button>
              }
              title={t('connectors.disconnect.title', { name })}
              description={
                feeds.length > 0 ? t('connectors.disconnect.body', { modules: stops }) : t('connectors.disconnect.body.none')
              }
              confirmLabel={t('connectors.disconnect')}
              confirmVariant="danger"
              onConfirm={() => disconnect(account)}
            />
          )}
        </ItemActions>
      </Item>
    )
  }

  const primary = accounts.filter((account) => account.group === 'primary')
  const more = accounts.filter((account) => account.group === 'more')
  const list = accounts.length > 0 && (
    <Stack gap="md">
      {primary.length > 0 && <ItemGroup aria-label={t('connectors.primary')}>{primary.map(row)}</ItemGroup>}
      {more.length > 0 && (
        <Collapsible className="flex flex-col items-start gap-2">
          <CollapsibleTrigger
            render={
              <Button variant="secondary">
                <ChevronsUpDownIcon aria-hidden="true" />
                {t('connectors.more', { count: more.length })}
              </Button>
            }
          />
          <CollapsibleContent className="w-full">
            <ItemGroup aria-label={t('connectors.more', { count: more.length })}>{more.map(row)}</ItemGroup>
          </CollapsibleContent>
        </Collapsible>
      )}
    </Stack>
  )

  return (
    <Stack gap="md">
      <DataState
        state={answer.state === 'long' ? 'ready' : answer.state}
        loadingLabel={t('connectors.loading')}
        loading={
          <Stack gap="sm">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </Stack>
        }
        empty={
          <Empty>
            <EmptyHeader>
              <EmptyTitle>{t(`connectors.empty.${variant}.title`)}</EmptyTitle>
              <EmptyDescription>{t(`connectors.empty.${variant}.body`)}</EmptyDescription>
            </EmptyHeader>
          </Empty>
        }
        errorTitle={t('connectors.error.title')}
        error={t('connectors.error.body')}
        onRetry={onRetry}
      >
        {list}
      </DataState>
      {failed && list}
      {connecting && <ConnectDialog account={connecting} onClose={() => setConnecting(null)} onConnect={() => connect(connecting)} />}
    </Stack>
  )
}
