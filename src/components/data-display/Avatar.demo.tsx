import { DemoGroup } from '@/components/actions/demo-parts'
import { Inline, Stack } from '@/components/layout'
import { Avatar, AvatarFallback, AvatarGroup, AvatarGroupCount } from '@/components/ui/avatar'
import { useT } from '@/i18n'

const sizes = ['sm', 'default', 'lg'] as const

// An avatar never stands alone: the name is beside it as text, and the
// avatar itself is hidden from assistive technology.
export default function AvatarDemo() {
  const t = useT('feedback')
  const people = [
    { name: t('avatar.demo.name1'), initial: t('avatar.demo.initial1') },
    { name: t('avatar.demo.name2'), initial: t('avatar.demo.initial2') },
    { name: t('avatar.demo.name3'), initial: t('avatar.demo.initial3') },
  ]
  return (
    <Stack gap="lg">
      <DemoGroup caption={t('demo.sizes')}>
        <Inline gap="md">
          {sizes.map((size) => (
            <Inline key={size}>
              <Avatar size={size} aria-hidden="true">
                <AvatarFallback>{people[0].initial}</AvatarFallback>
              </Avatar>
              <span>{people[0].name}</span>
            </Inline>
          ))}
        </Inline>
      </DemoGroup>
      <DemoGroup caption={t('demo.inUse')}>
        <Inline gap="md">
          <AvatarGroup aria-hidden="true">
            {people.map((person) => (
              <Avatar key={person.name}>
                <AvatarFallback>{person.initial}</AvatarFallback>
              </Avatar>
            ))}
            <AvatarGroupCount>+2</AvatarGroupCount>
          </AvatarGroup>
          <span>{t('avatar.demo.group')}</span>
        </Inline>
      </DemoGroup>
    </Stack>
  )
}
