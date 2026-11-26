import { useState } from 'react'

import { Button } from '@/components/actions'
import { Page, Section, Stack } from '@/components/layout'
import { useT } from '@/i18n'

const fillers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]

/**
 * `/dev/chat` — the chat bar and the recent list inside the shell, outside
 * the IA map: a screen to ask about, a button that proves the screen behind
 * an open panel stays in use, and enough text to make `main` scroll above
 * the bar.
 */
export function ChatDemo() {
  const t = useT('chat')
  const [count, setCount] = useState(0)
  return (
    <Page title={t('demo.title')} description={t('demo.description')} width="prose">
      <Section title={t('demo.behind.title')}>
        <Stack gap="sm">
          <p>{t('demo.behind.note')}</p>
          <div>
            <Button variant="secondary" onClick={() => setCount((current) => current + 1)}>
              {t('demo.behind.action')}
            </Button>
          </div>
          <p role="status">{t('demo.behind.count', { count })}</p>
        </Stack>
      </Section>
      <Section title={t('demo.filler.title')}>
        <Stack gap="sm">
          {fillers.map((n) => (
            <p key={n}>{t('demo.filler.text', { n })}</p>
          ))}
        </Stack>
      </Section>
    </Page>
  )
}
