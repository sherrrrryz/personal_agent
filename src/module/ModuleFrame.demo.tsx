import { Link } from 'react-router'

import { Stack } from '@/components/layout'
import { useT } from '@/i18n'

import { linkClass } from './ModuleFrame/link-class'

// `ModuleFrame` draws the page's one `h1` and the page padding, so — like
// `Page` — it cannot be nested inside the gallery page. Its states are shown
// in place, on `/dev/frame`. A link that sets `?preview=` reloads the
// document: the runtime reads the address once, when it is created.
const places = [
  { key: 'ok', to: '/dev/frame?scene=s2' },
  { key: 'never', to: '/dev/frame?scene=s2&preview=empty' },
  { key: 'running', to: '/dev/frame?scene=s2&preview=loading' },
  { key: 'failed', to: '/dev/frame?scene=s2&preview=error' },
  { key: 'long', to: '/dev/frame?scene=s2&preview=long' },
  { key: 'workflow', to: '/dev/frame/workflow?scene=s2' },
  { key: 'memory', to: '/dev/frame/memory?scene=s2' },
  { key: 'child', to: '/dev/frame/pets/demo?scene=s2' },
] as const

export default function ModuleFrameDemo() {
  const t = useT('module')
  return (
    <Stack gap="sm">
      <p>{t('demo.gallery.note')}</p>
      <ul className="flex flex-col">
        {places.map(({ key, to }) => (
          <li key={key}>
            <Link to={to} reloadDocument className={linkClass}>
              {t(`demo.gallery.${key}`)}
            </Link>
          </li>
        ))}
      </ul>
    </Stack>
  )
}
