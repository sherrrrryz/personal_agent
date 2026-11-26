import { Link } from 'react-router'

import { Button } from '@/components/actions'
import { Inline, Page, Section, Stack } from '@/components/layout'
import { moduleId } from '@/fixtures'
import { useT } from '@/i18n'
import { typed, useActions } from '@/runtime'

const linkClass = 'inline-flex min-h-target min-w-target items-center underline underline-offset-4'
const fillers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]

/**
 * `/dev/shell` — the shell on its own, outside the IA map: what its parts do,
 * buttons that change the modules through the runtime (the sidebar follows at
 * once), a second page to move to, and enough text to make `main` scroll over
 * the bottom row's stand-in.
 */
export function ShellDemo() {
  const t = useT('shell')
  const actions = useActions()
  return (
    <Page title={t('demo.title')} description={t('demo.description')} width="prose">
      <Section title={t('demo.parts.title')}>
        <Stack gap="sm">
          <p>{t('demo.parts.sidebar')}</p>
          <p>{t('demo.parts.device')}</p>
          <p>{t('demo.parts.bar')}</p>
        </Stack>
      </Section>
      <Section title={t('demo.modules.title')}>
        <Stack gap="sm">
          <p>{t('demo.modules.note')}</p>
          <Inline gap="sm">
            <Button
              variant="secondary"
              onClick={() => actions.renameModule({ moduleId: moduleId.appointments, name: t('demo.modules.renamed') })}
            >
              {t('demo.modules.rename')}
            </Button>
            <Button variant="secondary" onClick={() => actions.addModule({ name: t('demo.modules.added') })}>
              {t('demo.modules.add')}
            </Button>
            <Button variant="secondary" onClick={() => actions.removeModule(moduleId.shifts)}>
              {t('demo.modules.remove')}
            </Button>
            <Button
              variant="secondary"
              onClick={() =>
                actions.createSubModule({ parentId: moduleId.appointments, name: typed(t('demo.modules.subName')) })
              }
            >
              {t('demo.modules.sub')}
            </Button>
          </Inline>
        </Stack>
      </Section>
      <Section title={t('demo.route.title')}>
        <Stack gap="sm">
          <p>{t('demo.route.note')}</p>
          <p>
            <Link to="/dev/shell/second" className={linkClass}>
              {t('demo.route.next')}
            </Link>
          </p>
        </Stack>
      </Section>
      <Section title={t('demo.filler.title')}>
        <Stack gap="sm">
          {fillers.map((count) => (
            <p key={count}>{t('demo.filler.text', { count })}</p>
          ))}
        </Stack>
      </Section>
    </Page>
  )
}

/** `/dev/shell/second` — somewhere to go from the demo, to see focus land on the new heading. */
export function ShellDemoSecond() {
  const t = useT('shell')
  return (
    <Page title={t('demo.second.title')} description={t('demo.second.description')} width="prose">
      <p>
        <Link to="/dev/shell" className={linkClass}>
          {t('demo.route.back')}
        </Link>
      </p>
    </Page>
  )
}
