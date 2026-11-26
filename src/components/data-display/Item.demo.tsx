import { ChevronRight, Dog } from 'lucide-react'

import { Button } from '@/components/actions'
import { DemoGroup } from '@/components/actions/demo-parts'
import { Stack } from '@/components/layout'
import { useT } from '@/i18n'

import { BehaviourModeBadge } from './BehaviourModeBadge'
import { Item, ItemActions, ItemContent, ItemDescription, ItemGroup, ItemMedia, ItemTitle } from './Item'

export default function ItemDemo() {
  const t = useT('feedback')
  const links = [
    { id: 'accounts', title: t('item.demo.title1'), body: t('item.demo.body1') },
    { id: 'modes', title: t('item.demo.title2'), body: t('item.demo.body2') },
    { id: 'profession', title: t('item.demo.title3'), body: t('item.demo.body3') },
  ]
  return (
    <Stack gap="lg">
      <DemoGroup caption={t('item.demo.links')}>
        <ItemGroup>
          {links.map((link) => (
            <Item key={link.id} variant="outline" render={<a href={`#item-demo-${link.id}`} />}>
              <ItemContent>
                <ItemTitle>{link.title}</ItemTitle>
                <ItemDescription>{link.body}</ItemDescription>
              </ItemContent>
              <ItemMedia variant="icon">
                <ChevronRight aria-hidden="true" />
              </ItemMedia>
            </Item>
          ))}
        </ItemGroup>
      </DemoGroup>
      <DemoGroup caption={t('item.demo.static')}>
        <Item variant="muted">
          <ItemMedia variant="icon">
            <Dog aria-hidden="true" />
          </ItemMedia>
          <ItemContent>
            <ItemTitle>
              {t('item.demo.dog')}
              <BehaviourModeBadge mode="deferred" />
            </ItemTitle>
            <ItemDescription>{t('item.demo.dogBody')}</ItemDescription>
          </ItemContent>
          <ItemActions>
            <Button variant="secondary" size="sm">
              {t('item.demo.open')}
            </Button>
          </ItemActions>
        </Item>
      </DemoGroup>
    </Stack>
  )
}
