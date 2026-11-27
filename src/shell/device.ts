import { useLocation, useNavigate } from 'react-router'

import { sceneNames } from '@/fixtures'
import { useLocale, useT } from '@/i18n'
import { sceneIds, useRuntime, useRuntimeState, type PreviewId, type SceneId } from '@/runtime'

import { routeAfterJump } from './crumbs'

export const previewKey = {
  normal: 'preview.normal',
  empty: 'preview.empty',
  loading: 'preview.loading',
  error: 'preview.error',
  long: 'preview.long',
} as const satisfies Record<PreviewId, string>

/**
 * What the prototype controls do (spec part 2 § Shell, the 时间推进 device
 * and 状态预览). Each tells `announce` what happened, in words, for the
 * shell's live region.
 *
 * The runtime reads `?scene=` and `?preview=` once, when the page loads, and
 * the address wins over storage. So a control that changes one of them takes
 * it out of the address: after a jump a reload opens the scene she jumped to,
 * and a preview she set or ended by hand is gone after a reload.
 */
export function useDevice(announce: (message: string) => void) {
  const t = useT('shell')
  const { locale } = useLocale()
  const runtime = useRuntime()
  const scene = useRuntimeState((state) => state.scene)
  const preview = useRuntimeState((state) => state.preview)
  const navigate = useNavigate()
  const location = useLocation()

  function clearAddress(names: string[]) {
    const search = new URLSearchParams(location.search)
    if (!names.some((name) => search.has(name))) return
    for (const name of names) search.delete(name)
    void navigate({ pathname: location.pathname, search: search.toString(), hash: location.hash }, { replace: true })
  }

  const index = sceneIds.indexOf(scene)

  function jump(to: SceneId) {
    runtime.actions.jumpToScene(to)
    const elsewhere = routeAfterJump(location.pathname, runtime.getState())
    // In place of the open entry (D-53): a scene jump is not a step she can go back along.
    if (elsewhere) void navigate(elsewhere, { replace: true })
    else clearAddress(['scene', 'preview'])
    announce(t('device.jumped', { scene: sceneNames[to][locale] }))
  }

  return {
    scene,
    preview,
    jump,
    /** The scene before this one in story order; `null` on the first. */
    previous: index > 0 ? sceneIds[index - 1] : null,
    /** The scene after this one; `null` on the last. */
    next: index < sceneIds.length - 1 ? sceneIds[index + 1] : null,
    setPreview(next: PreviewId) {
      runtime.actions.setPreview(next)
      clearAddress(['preview'])
      announce(next === 'normal' ? t('device.restored') : t('device.previewing', { state: t(previewKey[next]) }))
    },
    /** 重新开始（回到首次使用）: the first scene, onboarding not done, back at the start page. */
    restart() {
      runtime.restart()
      void navigate('/')
      announce(t('device.restarted'))
    },
  }
}

export type Device = ReturnType<typeof useDevice>
