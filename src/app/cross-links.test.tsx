import { cleanup, render, screen, waitFor, within } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { beforeEach, describe, expect, it } from 'vitest'

import { threadPath, topicPath, workflowPath } from '@/chat/paths'
import { installFlowDom } from '@/components/workflow/test-support'
import { moduleId, nodeId } from '@/fixtures/keys'
import { LOCALE_STORAGE_KEY } from '@/i18n'
import { accountsPath } from '@/module'
import { createRuntime, RuntimeContext } from '@/runtime'
import { modulePath } from '@/shell'

import { Providers } from './Providers'
import { buildRoutes } from './router'

// The links one package's screen makes to another package's route, opened on
// the whole route table (I6): the appointment sheet's and `settings.ai-modes`'
// links to the workflow editor, the failure fixes' and stubs' link to
// `settings.accounts`, the recent rows' and records' links to a thread and to
// a topic's home, and the memory view (the frame's 资料 link, 服务时长's page
// and the editor's memory node).

beforeEach(() => installFlowDom({ width: 200, height: 100 }))

async function open(path: string, scene: string) {
  window.localStorage.setItem(LOCALE_STORAGE_KEY, 'zh-CN')
  const runtime = createRuntime({ delay: 0, storage: null, search: `?scene=${scene}` })
  const router = createMemoryRouter(buildRoutes(), { initialEntries: [path] })
  render(
    <Providers>
      <RuntimeContext value={runtime}>
        <RouterProvider router={router} />
      </RuntimeContext>
    </Providers>,
  )
  const main = await screen.findByRole('main')
  await within(main).findByRole('heading', { level: 1 })
  return { runtime, router }
}

describe('links from one package to another', () => {
  it('each opens a screen, not the not-found screen', async () => {
    const state = createRuntime({ delay: 0, storage: null, search: '?scene=s2' }).getState()
    const conversation = state.conversations.find((each) => each.topicId)
    if (!conversation?.topicId) throw new Error('s2 has no conversation in a topic')

    const targets: [path: string, scene: string][] = [
      // The appointment sheet → the node that estimates the duration (`?node=` is the editor's own parameter).
      [`${workflowPath(moduleId.duration)}?node=${nodeId.estimate}`, 's2'],
      // The sheet's other target, and the action links of `settings.ai-modes`.
      [workflowPath(moduleId.appointments), 's2'],
      [workflowPath(moduleId.confirmations), 'e2'],
      [workflowPath(moduleId.notifications), 'e1'],
      // The frame's failure fixes and the empty pages' 去连接.
      [accountsPath, 'e2'],
      // 最近对话 and a topic's records.
      [threadPath(conversation.id), 's2'],
      [topicPath(conversation.topicId), 's2'],
      [modulePath(moduleId.duration), 's2'],
      // The frame's 资料 link of every module.
      [`${modulePath(moduleId.duration)}/memory`, 's2'],
      [`${modulePath(moduleId.todo)}/memory`, 's2'],
    ]

    for (const [path, scene] of targets) {
      const { router } = await open(path, scene)
      expect(document.querySelector('[data-route-not-found]'), `${path} in ${scene}`).toBeNull()
      expect(`${router.state.location.pathname}${router.state.location.search}`, path).toBe(path)
      if (path.includes(`node=${nodeId.estimate}`)) {
        // The deep link names a node the editor has: it is the selected one.
        await waitFor(() =>
          expect(document.querySelector(`.react-flow__node[data-id="${nodeId.estimate}"]`), path).toHaveAttribute('aria-current', 'true'),
        )
      }
      cleanup()
    }

    // The check can fail: a link to a route nobody registers still ends at not-found.
    await open('/m/no-such-module/workflow', 's2')
    expect(document.querySelector('[data-route-not-found]')).not.toBeNull()
  })
})
