import { Button } from '@/components/actions'
import { Inline, Stack } from '@/components/layout'
import { useT } from '@/i18n'

import { Sonner } from './Sonner'
import { toast } from './toast'

// The demo has a toaster of its own (`id`), so it shows its toasts once even
// when the page around it mounts the app's toaster too.
const toasterId = 'sonner-demo'

export default function SonnerDemo() {
  const t = useT('feedback')
  return (
    <Stack gap="md">
      <p className="text-muted-foreground">{t('sonner.demo.intro')}</p>
      <Inline>
        <Button
          variant="secondary"
          onClick={() => toast(t('sonner.demo.saved'), { kind: 'success', description: t('sonner.demo.savedBody'), toasterId })}
        >
          {t('sonner.demo.show')}
        </Button>
        <Button
          variant="secondary"
          onClick={() =>
            toast(t('sonner.demo.removed'), {
              toasterId,
              action: { label: t('sonner.demo.undo'), onClick: () => toast(t('sonner.demo.undone'), { toasterId }) },
            })
          }
        >
          {t('sonner.demo.showUndo')}
        </Button>
        <Button
          variant="secondary"
          onClick={() => toast(t('sonner.demo.failed'), { kind: 'error', description: t('sonner.demo.failedBody'), toasterId })}
        >
          {t('sonner.demo.showError')}
        </Button>
        <Button
          variant="secondary"
          onClick={() =>
            toast(t('sonner.demo.sticky'), {
              kind: 'warning',
              description: t('sonner.demo.stickyBody'),
              persistent: true,
              id: 'sonner-demo-sticky',
              toasterId,
              action: { label: t('sonner.demo.undo'), onClick: () => {} },
            })
          }
        >
          {t('sonner.demo.keep')}
        </Button>
      </Inline>
      <Sonner id={toasterId} />
    </Stack>
  )
}
