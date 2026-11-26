import { useState } from 'react'

import { Button } from '@/components/actions'
import { DemoGroup } from '@/components/actions/demo-parts'
import { Stack } from '@/components/layout'
import { useT } from '@/i18n'

import { ChatComposer } from './ChatComposer'
import { chatComposerPlacements } from './composer-placements'

export default function ChatComposerDemo() {
  const t = useT('chat-components')
  const [sent, setSent] = useState<string[]>([])
  const [sending, setSending] = useState(false)
  const send = (text: string) => setSent((before) => [...before, text])
  return (
    <Stack gap="lg">
      <DemoGroup caption={t('demo.placements')}>
        <Stack gap="lg">
          {chatComposerPlacements.map((placement) => (
            <DemoGroup key={placement} caption={t(`demo.placement.${placement}`)}>
              <ChatComposer placement={placement} onSend={send} />
            </DemoGroup>
          ))}
        </Stack>
        <p role="status" className="text-sm text-muted-foreground">
          {sent.length > 0
            ? t('demo.composer.sent', { count: sent.length, text: sent[sent.length - 1] })
            : t('demo.composer.none')}
        </p>
      </DemoGroup>
      <DemoGroup caption={t('demo.states')}>
        <Stack gap="lg">
          <DemoGroup caption={t('demo.composer.typing')}>
            <ChatComposer placement="thread" defaultValue={t('demo.composer.typingValue')} onSend={send} />
          </DemoGroup>
          <DemoGroup caption={t('demo.composer.sending')}>
            <div className="flex">
              <Button variant="secondary" aria-pressed={sending} onClick={() => setSending((before) => !before)}>
                {t(sending ? 'demo.composer.sendingOff' : 'demo.composer.sendingOn')}
              </Button>
            </div>
            <ChatComposer placement="thread" defaultValue={t('demo.list.user1')} sending={sending} onSend={send} />
          </DemoGroup>
          <DemoGroup caption={t('demo.composer.disabled')}>
            <ChatComposer placement="thread" disabled onSend={send} />
          </DemoGroup>
        </Stack>
      </DemoGroup>
    </Stack>
  )
}
