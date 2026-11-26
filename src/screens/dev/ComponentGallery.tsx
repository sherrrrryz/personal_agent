import { Link, useSearchParams } from 'react-router'

import { Inline, Page, Section, Stack } from '@/components/layout'
import { useT } from '@/i18n'

import { demos as allDemos, type Demo } from './demos'
import { families, isFamily, type Family } from './families'

const linkClass =
  'inline-flex items-center justify-center rounded-md border px-3 text-center underline-offset-4 hover:underline aria-[current=page]:border-foreground aria-[current=page]:font-semibold aria-[current=page]:underline'

/**
 * `/dev/components` — every registered component by its demo, grouped by
 * family; `?family=<family>` shows one family. Outside the IA map: a tool for
 * building and for the matrix harness, not a screen of the product.
 */
export function ComponentGallery({ demos = allDemos }: { demos?: Demo[] }) {
  const t = useT('dev')
  const [search] = useSearchParams()
  const requested = search.get('family')
  const selected: Family | null = isFamily(requested) ? requested : null
  const shown = selected ? [selected] : families.filter((family) => demos.some((demo) => demo.family === family))

  return (
    <Page title={t('gallery.title')} description={t('gallery.intro')}>
      <nav aria-label={t('gallery.families')}>
        <Inline as="ul">
          <li>
            <Link to="/dev/components" className={linkClass} aria-current={selected ? undefined : 'page'}>
              {t('gallery.all')}
            </Link>
          </li>
          {families.map((family) => (
            <li key={family}>
              <Link
                to={`/dev/components?family=${family}`}
                className={linkClass}
                aria-current={family === selected ? 'page' : undefined}
              >
                {t(`family.${family}`)}
              </Link>
            </li>
          ))}
        </Inline>
      </nav>

      <Stack gap="2xl">
        {shown.map((family) => {
          const familyDemos = demos.filter((demo) => demo.family === family)
          return (
            <Section key={family} title={t(`family.${family}`)} gap="lg">
              <p className="text-muted-foreground">
                {familyDemos.length > 0 ? t('gallery.count', { count: familyDemos.length }) : t('gallery.empty')}
              </p>
              {familyDemos.map(({ name, Component }) => (
                <Section key={name} level={3} title={<code>{name}</code>}>
                  <Component />
                </Section>
              ))}
            </Section>
          )
        })}
      </Stack>
    </Page>
  )
}
