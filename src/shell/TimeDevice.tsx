import { ChevronLeftIcon, ChevronRightIcon, FlaskConicalIcon, RotateCcwIcon } from 'lucide-react'

import { Button } from '@/components/actions'
import {
  DropdownMenu,
  DropdownMenuItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  useSidebar,
} from '@/components/navigation'
import { sceneGroupNames, sceneNames } from '@/fixtures'
import { useLocale, useT } from '@/i18n'
import { previewIds, sceneGroups } from '@/runtime'

import { previewKey, type Device } from './device'

const groups = ['warmup', 'main'] as const

/**
 * The prototype controls in the header — not a product feature (IA map
 * § Prototype devices). One menu: the scenes of the story in their two
 * groups, 上一幕 / 下一幕, 状态预览 and 重新开始. In the compact shell the
 * button is its icon alone and keeps its whole name.
 */
export function TimeDevice({ device }: { device: Device }) {
  const t = useT('shell')
  const { locale } = useLocale()
  const { mode } = useSidebar()
  const { previous, next } = device
  const label = t('device.label', { scene: sceneNames[device.scene][locale] })

  const trigger =
    mode === 'sheet' ? (
      <Button variant="secondary" size="icon" aria-label={label}>
        <FlaskConicalIcon aria-hidden="true" />
      </Button>
    ) : (
      <Button variant="secondary" size="sm">
        <FlaskConicalIcon aria-hidden="true" />
        {label}
      </Button>
    )

  return (
    <DropdownMenu trigger={trigger} align="end">
      {groups.map((group) => (
        <DropdownMenuRadioGroup key={group} label={sceneGroupNames[group][locale]} value={device.scene} onValueChange={device.jump}>
          {sceneGroups[group].map((id) => (
            <DropdownMenuRadioItem key={id} value={id}>
              {sceneNames[id][locale]}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      ))}
      <DropdownMenuSeparator />
      <DropdownMenuItem
        icon={<ChevronLeftIcon />}
        disabled={previous === null}
        onClick={previous === null ? undefined : () => device.jump(previous)}
      >
        {t('device.prev')}
      </DropdownMenuItem>
      <DropdownMenuItem
        icon={<ChevronRightIcon />}
        disabled={next === null}
        onClick={next === null ? undefined : () => device.jump(next)}
      >
        {t('device.next')}
      </DropdownMenuItem>
      <DropdownMenuSeparator />
      <DropdownMenuRadioGroup label={t('device.preview')} value={device.preview} onValueChange={device.setPreview}>
        {previewIds.map((id) => (
          <DropdownMenuRadioItem key={id} value={id}>
            {t(previewKey[id])}
          </DropdownMenuRadioItem>
        ))}
      </DropdownMenuRadioGroup>
      <DropdownMenuSeparator />
      <DropdownMenuItem icon={<RotateCcwIcon />} onClick={device.restart}>
        {t('device.restart')}
      </DropdownMenuItem>
    </DropdownMenu>
  )
}
